import React, { PureComponent } from 'react';
import { message } from 'antd';
import TradeForm from './TradeForm';

class TradeBox extends PureComponent {
  state = {
    mainVolume: 0,
    coinVolume: 0
  };

  request = window.request;

  componentWillReceiveProps(nextProps, nextState) {
    if (
      this.props.mainVolume !== nextProps.mainVolume ||
      this.props.coinVolume !== nextProps.coinVolume
    ) {
      const { mainVolume, coinVolume } = nextProps;
      this.setState({ mainVolume, coinVolume });
    }
  }

  componentWillMount() {
    if (sessionStorage.getItem('account')) {
      const { marketName, coinName } = this.props;
      this.getCoinVolume({
        coinType: 'mainVolume',
        symbol: marketName
      });

      if (coinName) {
        this.getCoinVolume({
          coinType: 'coinVolume',
          symbol: coinName
        });
      }
    }
  }

  componentWillUpdate(nextProps, nextState) {
    const { marketName, coinName } = this.props;
    if (sessionStorage.getItem('account')) {
      if (nextProps.marketName !== marketName) {
        this.getCoinVolume({
          coinType: 'mainVolume',
          symbol: nextProps.marketName
        });
      }
      if (nextProps.coinName !== coinName) {
        this.getCoinVolume({
          coinType: 'coinVolume',
          symbol: nextProps.coinName
        });
      }
    }
  }

  // 根据币种名称获取资产
  getCoinVolume = ({ coinType, symbol }) => {
    this.request(`/coin/volume/symbol/${symbol}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ [coinType]: (json.data && json.data.volume) || 0 });
      } else {
        message.error(json.msg);
      }
    });
  };

  render() {
    const { mainVolume, coinVolume } = this.state;

    const tradeProps = {
      ...this.props,
      mainVolume,
      coinVolume,
    };

    return [
      <TradeForm key="buy" type="buy" {...tradeProps} />,
      <TradeForm key="sell" type="sell" {...tradeProps} />
    ];
  }
}

export default TradeBox;
