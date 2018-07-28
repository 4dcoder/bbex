import React, { PureComponent } from 'react';
import TradingView from './ChartingLibrary';
import Datafeed from './datafeed';

class TradeviewPage extends PureComponent {
  // tradeView准备
  tradingViewGetReady(symbol) {
    const widgetOptions = {
      symbol,
      tiker: symbol,
      debug: false,
      fullscreen: false,
      interval: '1',
      container_id: 'tv_chart_container',
      datafeed: Datafeed,
      width: '100%',
      height: '450',
      library_path: '/charting_library/',
      locale: 'zh',
      drawings_access: {
        type: 'black',
        tools: [
          {
            name: 'Regression Trend'
          }
        ]
      },
      theme: 'Black',
      // autosize: true,
      timezone: 'Asia/Shanghai',
      toolbar_bg: '#292f3d',
      disabled_features: [
        'header_symbol_search',
        'use_localstorage_for_settings',
        'symbol_search_hot_key',
        'header_chart_type',
        'header_compare',
        'header_undo_redo',
        'header_screenshot',
        'header_saveload',
        'timeframes_toolbar',
        'context_menus',
        'left_toolbar',
        'header_indicators', //图表指标
        // 'header_settings', //设置
        'header_resolutions', //时间下拉框
        // 'header_fullscreen_button' //全屏按钮
        'volume_force_overlay'
      ],
      enabled_features: ['study_templates', 'hide_last_na_study_output'],
      charts_storage_url: 'http://saveload.tradingview.com',
      charts_storage_api_version: '1.1',
      client_id: 'tradingview.com',
      user_id: 'public_user_id',
      overrides: {
        volumePaneSize: 'medium',
        'scalesProperties.lineColor': '#AAA',
        'scalesProperties.textColor': '#AAA',
        'symbolWatermarkProperties.transparency': 90,
        'paneProperties.background': '#292f3d',
        'paneProperties.vertGridProperties.color': '#454545',
        'paneProperties.horzGridProperties.color': '#454545',
        'paneProperties.crossHairProperties.color': '#9194A3',
        'paneProperties.legendProperties.showLegend': false,
        'paneProperties.legendProperties.showStudyArguments': true,
        'paneProperties.legendProperties.showStudyTitles': true,
        'paneProperties.legendProperties.showStudyValues': true,
        'paneProperties.legendProperties.showSeriesTitle': true,
        'paneProperties.legendProperties.showSeriesOHLC': true,
        'mainSeriesProperties.candleStyle.upColor': '#589065',
        'mainSeriesProperties.candleStyle.downColor': '#ae4e54',
        'mainSeriesProperties.candleStyle.drawWick': true,
        'mainSeriesProperties.candleStyle.drawBorder': true,
        'mainSeriesProperties.candleStyle.borderColor': '#4e5b85',
        'mainSeriesProperties.candleStyle.borderUpColor': '#589065',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ae4e54',
        'mainSeriesProperties.candleStyle.wickUpColor': '#589065',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ae4e54',
        'mainSeriesProperties.candleStyle.barColorsOnPrevClose': false,
        'mainSeriesProperties.hollowCandleStyle.upColor': '#589065',
        'mainSeriesProperties.hollowCandleStyle.downColor': '#ae4e54',
        'mainSeriesProperties.hollowCandleStyle.drawWick': true,
        'mainSeriesProperties.hollowCandleStyle.drawBorder': true,
        'mainSeriesProperties.hollowCandleStyle.borderColor': '#4e5b85',
        'mainSeriesProperties.hollowCandleStyle.borderUpColor': '#589065',
        'mainSeriesProperties.hollowCandleStyle.borderDownColor': '#ae4e54',
        'mainSeriesProperties.haStyle.upColor': '#589065',
        'mainSeriesProperties.haStyle.downColor': '#ae4e54',
        'mainSeriesProperties.haStyle.drawBorder': true,
        'mainSeriesProperties.haStyle.borderColor': '#4e5b85',
        'mainSeriesProperties.haStyle.borderUpColor': '#589065',
        'mainSeriesProperties.haStyle.borderDownColor': '#ae4e54',
        'mainSeriesProperties.haStyle.wickColor': '#4e5b85',
        'mainSeriesProperties.haStyle.barColorsOnPrevClose': false,
        'mainSeriesProperties.barStyle.upColor': '#589065',
        'mainSeriesProperties.barStyle.downColor': '#ae4e54',
        'mainSeriesProperties.barStyle.barColorsOnPrevClose': false,
        'mainSeriesProperties.barStyle.dontDrawOpen': false,
        'mainSeriesProperties.lineStyle.color': '#4e5b85',
        'mainSeriesProperties.lineStyle.linewidth': 1,
        'mainSeriesProperties.lineStyle.priceSource': 'close',
        'mainSeriesProperties.areaStyle.color1': 'rgba(122, 152, 247, .1)',
        'mainSeriesProperties.areaStyle.color2': 'rgba(122, 152, 247, .02)',
        'mainSeriesProperties.areaStyle.linecolor': '#4e5b85',
        'mainSeriesProperties.areaStyle.linewidth': 1,
        'mainSeriesProperties.areaStyle.priceSource': 'close',
        'mainSeriesProperties.style': 1
      },
      studies_overrides: {
        'volume.volume.color.0': '#ce5277',
        'volume.volume.color.1': '#a0d75b',
        'volume.volume.transparency': 50,
        'MACD.histogram.color': '#606060',
        'MACD.MACD.color': '#ce5277',
        'MACD.signal.color': '#a0d75b'
      }
    };

    const chartReady = () => {
      window.tvWidget = new TradingView.widget(widgetOptions);

      window.tvWidget.onChartReady(() => {
        let buttonArr = [
          {
            value: '1',
            period: '1m',
            text: '1m'
          },
          {
            value: '5',
            period: '5m',
            text: '5m'
          },
          {
            value: '15',
            period: '15m',
            text: '15m'
          },
          {
            value: '30',
            period: '30m',
            text: '30m'
          },
          {
            value: '60',
            period: '1h',
            text: '1h'
          },
          {
            value: '120',
            period: '2h',
            text: '2h'
          },
          {
            value: '240',
            period: '4h',
            text: '4h'
          },
          {
            value: '480',
            period: '8h',
            text: '8h'
          },
          {
            value: '1D',
            period: '1D',
            text: '日线'
          },
          {
            value: '1W',
            period: '1W',
            text: '周线'
          },
          {
            value: '1M',
            period: '1M',
            text: '月线'
          }
        ];

        const handleClick = (e, value, text) => {
          // 设置tradingview分辨率
          window.tvWidget.chart().setResolution(value);

          // 更新选中状态
          Array.from(e.target.parentNode.parentNode.children).forEach(child => {
            const currentEl = child.firstChild;
            const classVal = currentEl.className;
            child.firstChild.setAttribute('class', classVal.replace('select', ''));
            if (currentEl.innerHTML === text) {
              child.firstChild.setAttribute('class', classVal.concat(' select'));
            }
          });
        };

        buttonArr.forEach((v, i) => {
          const btn = window.tvWidget
            .createButton()
            .addClass(`resolution${v.text === '1m' ? ' select' : ''}`)
            .on('click', function(e) {
              handleClick(e, v.value, v.text);
            });

          btn[0].innerHTML = v.text;
          btn[0].title = v.text;
        });

        window.tvWidget
          .chart()
          .createStudy('Moving Average', false, false, [5], null, { 'Plot.color': '#965FC4' });
        window.tvWidget
          .chart()
          .createStudy('Moving Average', false, false, [10], null, { 'Plot.color': '#84aad5' });
        window.tvWidget
          .chart()
          .createStudy('Moving Average', false, false, [30], null, { 'Plot.color': '#55b263' });
        window.tvWidget
          .chart()
          .createStudy('Moving Average', false, false, [60], null, { 'Plot.color': '#b7248a' });
      });
    };

    TradingView.onready(chartReady());
  }

  toggleScrollTarget = e => {
    const chartMask = document.querySelector('#chartMask');
    chartMask.hidden = e.target === chartMask;
  };

  componentDidMount() {
    this.tradingViewGetReady(this.props.symbol);

    // 切换滚动目标（tradingview 或者是 window）
    document.addEventListener('click', this.toggleScrollTarget, false);
  }

  componentWillUnmount() {
    // 取消切换滚动目标（tradingview 或者是 window）
    document.removeEventListener('click', this.toggleScrollTarget);
  }

  render() {
    return <div id="tv_chart_container" />;
  }
}

export default TradeviewPage;
