import React, { Component } from 'react';
import datafeeds from '../datafeed/datafeed.js';
import tradeviewPageUtil from './TradeviewPageUtil';
import { WS_PREFIX } from '../utils/constants';
import { onready, widget } from './ChartingLlibrary';
import ReconnectingWebSocket from '../utils/ReconnectingWebSocket';

class TradeviewPage extends Component {
    websocketUrl = `${WS_PREFIX}/kline`;

    componentDidMount() {
        this.websocketStart();

        window.ws.onopen = evt => {
            console.log('Kline Connection open ...');
        };

        window.ws.onclose = evt => {
            console.log('Kline Connection closed.');
        };
    }

    componentWillUpdate(nextProps, nextState) {
        if (!this.props.coin && nextProps.coin) {
            //当coin第一次有值的时候，就初始化tradingview
            const { market, coin } = nextProps;
            this.tradingViewGetReady({ market, coin });
        }
    }

    // 开启websocket
    websocketStart() {
        window.ws = new ReconnectingWebSocket(this.websocketUrl);
        setInterval(() => {
            if (window.ws.readyState === 1) {
                window.ws.send('ping');
            }
        }, 1000 * 3);
    }

    // tradeView准备
    tradingViewGetReady({ market, coin }) {
        let params = {
            resolution: '1',
            Datafeeds: datafeeds(`${coin}/${market}`),
            serverUrl: this.websocketUrl,
            pushInterval: 1000,
            language: 'zh_CN',
            symbol: `${coin}/${market}`
        };

        onready(
            (() => {
                window.widget = window.tvWidget = new widget(
                    tradeviewPageUtil.datafeedConfig(params)
                );

                window.widget.onChartReady(() => {
                    tradeviewPageUtil.chartReady(window.widget);
                });
            })()
        );
    }

    componentWillMount() {
        if (window.ws) {
            window.ws.close();
        }
    }

    render() {
        return <div id="tv_chart_container" />;
    }
}

export default TradeviewPage;
