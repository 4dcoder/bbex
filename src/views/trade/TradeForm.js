import React, { PureComponent } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Input, Slider, Button, Tooltip, message } from 'antd';
import classnames from 'classnames';
import Big from 'big.js';

class TradeForm extends PureComponent {
  state = {
    triggerPrice: '',
    price: '',
    volume: '',
    sliderValue: 0,
    totalPrice: '',
    pending: false,
    tradeAmount: 0 //交易额
  };

  request = window.request;

  handleValue = e => {
    const key = e.target.id;
    const value = e.target.value;
    const { type, mainVolume, coinVolume } = this.props;
    const { price, volume } = this.state;
    const assetVolume = type === 'buy' ? mainVolume : coinVolume;
    const otherValue = key === 'price' ? volume : price;

    if (/^\d*\.{0,1}\d{0,8}$/.test(value) && value.length < 16) {
      const curVolume = key === 'volume' ? value : volume;
      if (
        assetVolume &&
        !(type === 'buy' && value * price > assetVolume) &&
        !(type === 'sell' && key === 'volume' && value > assetVolume)
      ) {
        const sliderValue = ((type === 'buy' ? value * otherValue : curVolume) / assetVolume) * 100;
        this.setState({ [key]: value, sliderValue });
      } else {
        if (type === 'buy' && value * price > assetVolume) {
          const curValue = assetVolume / otherValue;
          debugger;
          const sliderValue = (curVolume / assetVolume) * 100;
          this.setState({ [key]: curValue, sliderValue });
        }
        if (type === 'sell' && key === 'volume' && value > assetVolume) {
          const curValue = assetVolume || '';
          const sliderValue = 100;
          this.setState({ [key]: curValue, sliderValue });
        }
      }
    }
  };

  handleHolder = e => {
    e.target.previousSibling.focus();
  };

  handleSlideInput = value => {
    const { type, mainVolume, coinVolume } = this.props;
    const { price } = this.state;
    const assetVolume = type === 'buy' ? mainVolume : coinVolume;

    const volume = (type === 'buy' ? assetVolume / price : assetVolume) * (value / 100);

    this.setState({ volume, sliderValue: value });
  };

  // handleSlideInput = value => {
  //   const { type, mainVolume, coinVolume } = this.props;
  //   value = new Big(value);
  //   const price = new Big(this.state.price);
  //   const assetVolume = new Big(type === 'buy' ? mainVolume : coinVolume);
  //   const volume = assetVolume.div(price) * value.div(100);
  //   this.setState({ volume, sliderValue: value });
  // };

  // 获取订单号
  getOrderNo = () => {
    const isLogin = sessionStorage.getItem('account');
    if (isLogin) {
      const { localization } = this.props;
      const { price, volume } = this.state;
      if (price <= 0) {
        message.error(localization['请输入价格']);
        return;
      }
      if (volume <= 0) {
        message.error(localization['请输入数量']);
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
    } else {
      this.props.history.push('/signin');
    }
  };

  // 买入卖出
  tradeAction = orderNo => {
    const { type, marketName, coinName, localization } = this.props;

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
          message.success(localization['挂单成功']);
          this.setState({ price: '', volume: '', tradePrice: 0 });
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

    if (
      nextProps.marketName !== this.props.marketName ||
      nextProps.coinName !== this.props.coinName
    ) {
      this.setState({ price: '', volume: '' });
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

    const {
      type,
      tradeType,
      marketName,
      coinName,
      mainVolume,
      coinVolume,
      localization
    } = this.props;

    const { triggerPrice, price, volume, sliderValue, totalPrice, pending } = this.state;

    const isLogin = sessionStorage.getItem('account');

    const typeToText = {
      buy: localization['买入'],
      sell: localization['卖出']
    };

    let totalCount = 0;

    if (isNaN(price * volume)) {
      totalCount = 0;
    } else {
      totalCount = price * volume;
    }

    const assetVolume = type === 'buy' ? mainVolume : coinVolume;

    return (
      <ul className="trade-form">
        {type === 'buy' && (
          <li key="info" className="property-info">
            <span>
              {marketName} {localization['可用']} {Number(mainVolume).toFixed(8)}
              {false && (
                <Link className="recharge-link" to="#">
                  {localization['充币']}
                </Link>
              )}
            </span>
          </li>
        )}
        {type === 'sell' && (
          <li key="info" className="property-info">
            <span>
              {coinName} {localization['可用']} {Number(coinVolume).toFixed(8)}
              {false && (
                <Link className="recharge-link" to="#">
                  {localization['充币']}
                </Link>
              )}
            </span>
          </li>
        )}
        {tradeType === 'stop' && (
          <li>
            <Input
              id="triggerPrice"
              size="large"
              value={triggerPrice}
              onChange={this.handleValue}
              placeholder={localization['触发价']}
            />
            <span
              className={classnames({
                'trade-form-name': true,
                'has-value': triggerPrice
              })}
              onClick={this.handleHolder}
            >
              {localization['触发价']}
            </span>
            <span className="trade-form-marketName">{marketName}</span>
          </li>
        )}
        {tradeType !== 'market' && (
          <li>
            <Input id="price" size="large" value={price} onChange={this.handleValue} />
            <span
              className={classnames({
                'trade-form-name': true,
                'has-value': String(price)
              })}
              onClick={this.handleHolder}
            >{`${typeToText[type]}${localization['价']}`}</span>
            {false && <div className="toCNY">&asymp;￥57555.50</div>}
            <span className="trade-form-coinName">{marketName}</span>
          </li>
        )}
        {(tradeType !== 'market' || (tradeType === 'market' && type === 'sell')) && (
          <li>
            {tradeType === 'market' && (
              <span className="trade-form-tips">
                {localization['以市场上最优价格卖出']}
                <Tooltip
                  placement="top"
                  title={
                    localization[
                      '当使用市场价卖出时，系统会根据您设置的卖出数量在市场上从高到低扫单，直至数量卖完为止'
                    ]
                  }
                >
                  <i className="iconfont icon-zhuyishixiang" />
                </Tooltip>
              </span>
            )}
            <Input id="volume" size="large" value={volume} onChange={this.handleValue} />
            <span
              className={classnames({
                'trade-form-name': true,
                'has-value': String(volume),
                market: tradeType === 'market'
              })}
              onClick={this.handleHolder}
            >
              {`${typeToText[type]}${localization['量']}`}
            </span>
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
        {(tradeType !== 'market' || (tradeType === 'market' && type === 'sell')) && (
          <li>
            <Slider
              marks={marks}
              value={assetVolume ? sliderValue : 0}
              onChange={this.handleSlideInput}
              disabled={
                (type === 'buy' && (Number(price) <= 0 || !mainVolume)) ||
                (type === 'sell' && !coinVolume)
              }
            />
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
                {localization['交易额']}
              </span>
              {tradeType === 'market' && (
                <span className="trade-form-tips">
                  {localization['以市场上最优价格买入']}
                  <Tooltip
                    placement="top"
                    title={
                      localization[
                        '当使用市价买入时，系统会根据您预留的金额在市场上从低到高进行扫单，直至金额用完为止'
                      ]
                    }
                  >
                    <i className="iconfont icon-zhuyishixiang" />
                  </Tooltip>
                </span>
              )}
              <Input
                id="totalPrice"
                size="large"
                value={totalPrice}
                placeholder={`${typeToText[type]} ${localization['量']}`}
                onChange={this.handleValue}
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
        <li>
          {tradeType !== 'market' && (
            <div className="trade-form-total">
              {localization['交易额']} {totalCount.toFixed(8)} {marketName}
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
            disabled={pending}
          >
            {isLogin ? `${typeToText[type]} ${coinName}` : `交易前请先 登录`}
          </Button>
        </li>
      </ul>
    );
  }
}

export default withRouter(TradeForm);
