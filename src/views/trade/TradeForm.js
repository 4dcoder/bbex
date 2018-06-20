import React, { Component } from 'react';
import { Input, InputNumber, Slider, Button, Tooltip, message } from 'antd';
import classnames from 'classnames';

class TradeForm extends Component {
  state = {
    triggerPrice: '',
    price: '',
    volume: '',
    totalPrice: '',
    pending: false,
    tradeAmount: 0 //交易额
  };

  request = window.request;

  handleValue = (value, key) => {
    if (value > 0) {
      this.setState({ [key]: value });
    } else {
      this.setState({ [key]: '' });
    }
  };

  handleSlideInput = value => {
    const { type, mainVolume, coinVolume } = this.props;
    const { price } = this.state;
    const assetVolume = type === 'buy' ? mainVolume : coinVolume;
    const volume = (assetVolume / price) * (value / 100);
    this.setState({ volume: volume.toFixed(8)});
  };

  // 获取订单号
  getOrderNo = () => {
    const { price, volume } = this.state;
    if (price <= 0) {
      message.error('请输入价格！');
      return;
    }
    if (volume <= 0) {
      message.error('请输入数量！');
      return;
    }

    this.setState({ pending: true });
    this.request('/trade/getOrderNo')
      .then(json => {
        if (json.code === 10000000) {
          this.tradeAction(json.data.orderNo);
        } else {
          message.error(json.msg);
        }
      })
      .catch(error => {
        this.setState({ pending: false });
      });
  };

  // 买入卖出
  tradeAction = orderNo => {
    const { type, marketName, coinName } = this.props;

    const { price, volume } = this.state;

    const userId = JSON.parse(sessionStorage.getItem('account')).id;

    const mapTypeToAction = {
      buy: 'buyIn',
      sell: 'sellOut'
    };

    this.request(`/trade/${mapTypeToAction[type]}`, {
      body: {
        orderNo,
        userId,
        volume,
        price,
        coinMain: marketName,
        coinOther: coinName
      }
    })
      .then(json => {
        if (json.code === 10000000) {
          message.success(`挂单成功！`);
          this.setState({ price: '', volume: '' });
        } else {
          message.error(json.msg);
        }
        this.setState({ pending: false });
      })
      .catch(error => {
        this.setState({ pending: false });
      });
  };

  componentWillUpdate(nextProps) {
    if (nextProps.tradePrice !== this.props.tradePrice) {
      this.setState({ price: nextProps.tradePrice });
    }
  }

  render() {
    const marks = {
      0: '',
      25: '',
      50: '',
      75: '',
      100: ''
    };

    const { type, tradeType, marketName, coinName, mainVolume, coinVolume } = this.props;

    const { triggerPrice, price, volume, totalPrice, pending, tradeAmount } = this.state;

    const isLogin = sessionStorage.getItem('account');

    const typeToText = {
      buy: '买入',
      sell: '卖出'
    };

    return (
      <ul className="trade-form">
        {tradeType === 'stop' && (
          <li>
            <span className="trade-form-name">触发价</span>
            <InputNumber
              min={0.00000001}
              step={0.00000001}
              id="triggerPrice"
              value={triggerPrice}
              onChange={value => {
                this.handleValue(value, 'triggerPrice');
              }}
            />
            <span className="trade-form-marketName">{marketName}</span>
          </li>
        )}
        {tradeType !== 'market' && (
          <li>
            <span className="trade-form-name">价格</span>
            <InputNumber
              id="price"
              value={price}
              min={0.00000001}
              step={0.00000001}
              placeholder={`${typeToText[type]}价`}
              onChange={value => {
                this.handleValue(value, 'price');
              }}
            />
            {false && <div className="toCNY">&asymp;￥57555.50</div>}
            <span className="trade-form-coinName">{marketName}</span>
          </li>
        )}
        {(tradeType !== 'market' || (tradeType === 'market' && type === 'sell')) && (
          <li>
            <span
              className={classnames({
                'trade-form-name': true,
                market: tradeType === 'market'
              })}
            >
              数量
            </span>
            {tradeType === 'market' && (
              <span className="trade-form-tips">
                以市场上最优价格卖出
                <Tooltip
                  placement="top"
                  title={`当使用市场价卖出时，系统会根据您设置的卖出数量在市场上从高到低扫单，直至数量卖完为止`}
                >
                  <i className="iconfont icon-zhuyishixiang" />
                </Tooltip>
              </span>
            )}
            <InputNumber
              id="volume"
              value={volume}
              min={0.00000001}
              step={0.00000001}
              placeholder={`${typeToText[type]}量`}
              onChange={value => {
                this.handleValue(value, 'volume');
              }}
            />
            <Slider
              marks={marks}
              defaultValue={0}
              onChange={this.handleSlideInput}
              disabled={
                !price || ((type === 'buy' && !mainVolume) || (type === 'sell' && !coinVolume))
              }
            />
            <span
              className={classnames({
                'trade-form-coinName': true,
                market: tradeType === 'market'
              })}
            >
              {coinName}
            </span>
          </li>
        )}
        {tradeType === 'market' &&
          type === 'buy' && (
            <li>
              <span
                className={classnames({
                  'trade-form-name': true,
                  market: tradeType === 'market'
                })}
              >
                交易额
              </span>
              {tradeType === 'market' && (
                <span className="trade-form-tips">
                  以市场上最优价格买入
                  <Tooltip
                    placement="top"
                    title={`当使用市价买入时，系统会根据您预留的金额在市场上从低到高进行扫单，直至金额用完为止`}
                  >
                    <i className="iconfont icon-zhuyishixiang" />
                  </Tooltip>
                </span>
              )}
              <Input
                id="totalPrice"
                value={totalPrice}
                placeholder={`${typeToText[type]}量`}
                onChange={value => {
                  this.handleValue(value, 'totalPrice');
                }}
              />
              <Slider marks={marks} defaultValue={0} />
              <span
                className={classnames({
                  'trade-form-coinName': true,
                  market: tradeType === 'market'
                })}
              >
                {coinName}
              </span>
            </li>
          )}
        <li>
          {tradeType !== 'market' && (
            <div className="trade-form-total">
              交易额 {(isNaN(price * volume) ? 0 : price * volume).toFixed(8)} {marketName}
            </div>
          )}
          {tradeType === 'market' &&
            type === 'buy' && (
              <div className="trade-form-txt">
                <span>0.00000000 {marketName}</span>
                <span>0.00000000 {marketName}</span>
              </div>
            )}
          {tradeType === 'market' &&
            type === 'sell' && (
              <div className="trade-form-txt">
                <span>0.00000000 {coinName}</span>
                <span>0.00000000 {coinName}</span>
              </div>
            )}
          <Button
            type={isLogin && !pending ? type : 'ghost'}
            size="large"
            onClick={this.getOrderNo}
            disabled={!isLogin || pending}
          >
            {typeToText[type]}
            {coinName}
          </Button>
        </li>
      </ul>
    );
  }
}

export default TradeForm;
