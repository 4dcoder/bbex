import React, { Component } from 'react';
import { Tabs, Input, Table, Menu, Dropdown, Icon, Tooltip, Button, Select, message } from 'antd';
import NoticeBar from '../../components/noticeBar';
import classnames from 'classnames';
import Scrollbars from 'react-custom-scrollbars';
import { stampToDate } from '../../utils';
import { WS_ADDRESS } from '../../utils/constants';
import TradeBox from './TradeBox';
import Tradeview from '../../tradeview';
import './trade.css';

const Search = Input.Search;
const TabPane = Tabs.TabPane;
const Option = Select.Option;

class Trade extends Component {
  constructor(props) {
    super(props);

    const [coinName, marketName] = sessionStorage.getItem('tradePair').split('_');
    this.coinName = coinName;
    this.marketName = marketName;
  }

  state = {
    market: this.marketName || 'USDT',
    tradeExpair: null,
    searchList: null,
    searchValue: '',
    marketName: this.marketName || 'USDT',
    coinName: '',
    mainVolume: 0,
    coinVolume: 0,
    tradeList: {
      buyOrderVOList: [],
      sellOrderVOList: []
    },
    streamList: null,
    pendingOrderList: [],
    completedOrderList: [],
    coinPrice: 0,
    listType: -1,
    mergeNumber: 8,
    orderStatus: 0,
    coinDetail: '',
    favoriteCoins: sessionStorage.getItem('favoriteCoins')
      ? JSON.parse(sessionStorage.getItem('favoriteCoins'))
      : [],
    tradePrice: ''
  };

  request = window.request;

  // 获取USDT汇率
  getRate = () => {
    this.request('/index/lastPrice', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const { btcLastPrice, ethLastPrice } = json.data;
        this.setState({ btcLastPrice, ethLastPrice });
      } else {
        message.error(json.msg);
      }
    });
  };

  // 未完成订单
  findOrderList = ({ marketName, coinName, status }) => {
    const { id } = JSON.parse(sessionStorage.getItem('account'));
    this.request('/order/findOrderProposeList', {
      body: {
        status,
        userId: id,
        coinMain: marketName,
        coinOther: coinName
      }
    }).then(json => {
      if (json.code === 10000000) {
        json.data = json.data.map(order => {
          order.key = order.orderNo;
          order.price = order.price.toFixed(8);
          order.volume = order.volume.toFixed(8);
          order.successVolume = order.successVolume.toFixed(8);
          return order;
        });
        if (status === 0) {
          this.setState({ pendingOrderList: json.data });
        } else {
          this.setState({ completedOrderList: json.data });
        }
      } else {
        message.error(json.msg);
      }
    });
  };

  // 获取币种详情
  getCoinDetail = coinName => {
    this.request(`/coin/detail/${coinName}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ coinDetail: json.data });
      } else {
        message.error(json.msg);
      }
    });
  };

  // 撤单
  cancelTrade = orderNo => {
    this.request(`/trade/cancelTrade/${orderNo}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        message.success('撤单成功！');
      } else {
        message.error(json.msg);
      }
    });
  };

  // 订单详情
  getOrderDetail = orderNo => {
    this.request(`/coin/tradeOrderDetail/${orderNo}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        console.log(json.data);
      } else {
        message.error(json.msg);
      }
    });
  };

  openStreamWebsocket = () => {
    //打开websockets
    const streamWS = new window.ReconnectingWebSocket(`${WS_ADDRESS}/bbex/platsocket`);

    setInterval(() => {
      if (streamWS.readyState === 1) {
        streamWS.send('ping');
      }
    }, 1000 * 3);

    streamWS.onopen = evt => {
      console.log('stream Websocket Connection open ...');
    };

    streamWS.onmessage = evt => {
      if (evt.data === 'pong') {
        console.log('stream: ', evt.data);
        return;
      }
      const record = JSON.parse(evt.data);
      console.log('======stream record: ', record);

      const { marketName, coinName } = this.state;

      // 当流水的交易对跟当前交易对相等时
      if (
        record.matchStreamVO &&
        record.matchStreamVO.coinMain === marketName &&
        record.matchStreamVO.coinOther === coinName
      ) {
        const { tradeExpair, tradeList, streamList, marketName } = this.state;

        const matchVo = record.matchStreamVO;
        tradeExpair[marketName] = tradeExpair[marketName].map(item => {
          if (matchVo.coinOther === item.coinOther) {
            item.latestPrice = matchVo.price;
          }
          return item;
        });

        tradeList.buyOrderVOList = tradeList.buyOrderVOList.filter(item => {
          if (
            item.coinMain === matchVo.coinMain &&
            item.coinOther === matchVo.coinOther &&
            item.price === matchVo.price
          ) {
            item.volume -= matchVo.volume;
          }
          return item.volume > 0;
        });
        tradeList.sellOrderVOList = tradeList.sellOrderVOList.filter(item => {
          if (
            item.coinMain === matchVo.coinMain &&
            item.coinOther === matchVo.coinOther &&
            item.price === matchVo.price
          ) {
            item.volume -= matchVo.volume;
          }
          return item.volume > 0;
        });
        streamList.unshift(record.matchStreamVO);

        this.setState({ tradeExpair, tradeList, streamList });
      }
    };

    streamWS.onclose = evt => {
      console.log('stream Websocket Connection closed.');
    };

    streamWS.onerror = evt => {
      console.log(evt);
    };

    this.setState({ streamWS });
  };

  openBuyAndSellWebsocket = () => {
    //打开websockets
    const buyandsellWS = new window.ReconnectingWebSocket(`${WS_ADDRESS}/bbex/buysellsocket`);

    setInterval(() => {
      if (buyandsellWS.readyState === 1) {
        const { marketName, coinName } = this.state;
        buyandsellWS.send(`${coinName}_${marketName}`);
      }
    }, 1000);

    buyandsellWS.onmessage = evt => {
      if (evt.data === 'pong') {
        console.log('buyandsell: ', evt.data);
        return;
      }
      const tradeList = JSON.parse(evt.data);
      const { marketName, coinName } = this.state;

      console.log('buyandsell reciveDate: ', tradeList);

      //不用计算和判断，后端推送过来的买卖盘直接覆盖当前买卖盘
      this.setState({ tradeList });
    };

    buyandsellWS.onclose = evt => {
      console.log('buyandsell Websocket Connection closed.');
    };

    buyandsellWS.onerror = evt => {
      console.log(evt);
    };

    this.setState({ buyandsellWS });
  };

  openUserWebsocket = () => {
    //打开websockets
    const { id } = JSON.parse(sessionStorage.getItem('account'));
    const userWS = new window.ReconnectingWebSocket(`${WS_ADDRESS}/bbex/socketuser?${id}`);

    setInterval(() => {
      if (userWS.readyState === 1) {
        userWS.send('ping');
      }
    }, 1000 * 3);

    userWS.onopen = evt => {
      console.log('user Websocket Connection open ...');
    };

    userWS.onmessage = evt => {
      if (evt.data === 'pong') {
        console.log('user: ', evt.data);
        return;
      }
      const { orderVo, coinMainVolume, coinOtherVolume } = JSON.parse(evt.data);
      console.log('======user record: ', JSON.parse(evt.data));

      const { pendingOrderList } = this.state;

      let isNewRecord = true;
      const pendingList = pendingOrderList.filter(order => {
        if (order.orderNo === orderVo.orderNo) {
          isNewRecord = false;
          order.status = orderVo.status;
          order.exType = order.exType;
        }
        return order.status !== 2;
      });

      if (isNewRecord) {
        orderVo.key = orderVo.orderNo;
        orderVo.price = orderVo.price && orderVo.price.toFixed(8);
        orderVo.volume = orderVo.volume && orderVo.volume.toFixed(8);
        orderVo.successVolume = orderVo.successVolume && orderVo.successVolume.toFixed(8);
        pendingList.unshift(orderVo);
      }

      const { mainVolume, coinVolume } = this.state;

      this.setState({
        pendingOrderList: pendingList,
        mainVolume: coinMainVolume ? coinMainVolume.volume : mainVolume,
        coinVolume: coinOtherVolume ? coinOtherVolume.volume : coinVolume
      });
    };

    userWS.onclose = evt => {
      console.log('user Websocket Connection closed.');
    };

    userWS.onerror = evt => {
      console.log(evt);
    };

    this.setState({ userWS });
  };

  // 市场币种列表
  getTradeExpair = () => {
    this.request('/index/allTradeExpair', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const tradeExpair = {};
        Object.keys(json.data).forEach(key => {
          if (key === this.state.market && !this.coinName) {
            this.setState({
              coinName: json.data[key][0].coinOther,
              coinPrice: json.data[key][0].latestPrice || 0
            });
          }
          tradeExpair[key] = json.data[key].map(coin => {
            coin.key = `${coin.coinMain}.${coin.coinOther}`;
            coin.latestPrice = coin.latestPrice || 0;
            return coin;
          });
        });

        this.setState({ tradeExpair });
      } else {
        message.error(json.msg);
      }
    });
  };

  // 获取交易列表
  getTradeList = ({ coinMain, coinOther }) => {
    this.request('/index/buyAndSellerOrder', {
      method: 'GET',
      body: { coinMain, coinOther }
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ tradeList: json.data });
      } else {
        message.error(json.msg);
      }
    });
  };

  // 获取流水记录
  getStream = ({ coinMain, coinOther }) => {
    this.request('/index/findMatchStream', {
      method: 'GET',
      body: { coinMain, coinOther }
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ streamList: json.data });
      } else {
        message.error(json.msg);
      }
    });
  };

  // 切换市场
  switchMarket = market => {
    this.setState({ market, searchValue: '', searchList: null });
  };

  // 搜索币
  handleSearch = event => {
    const { tradeExpair, market, favoriteCoins } = this.state;
    const searchValue = event.target.value.trim();

    let searchList = null;

    if (searchValue) {
      searchList = [];
      if (market === 'optional') {
        Object.values(tradeExpair).forEach(tradeList => {
          tradeList.forEach(expair => {
            if (
              expair.coinOther.indexOf(searchValue.toUpperCase()) > -1 &&
              favoriteCoins.includes(expair.key)
            ) {
              searchList.push(expair);
            }
          });
        });
      } else {
        tradeExpair[market].forEach(expair => {
          if (expair.coinOther.indexOf(searchValue.toUpperCase()) > -1) {
            searchList.push(expair);
          }
        });
      }
    }

    this.setState({ searchList, searchValue });
  };

  //收藏币种
  handleCollect = (record, event) => {
    event.stopPropagation();
    const { favoriteCoins } = this.state;
    if (favoriteCoins.includes(record.key)) {
      const coinIndex = favoriteCoins.findIndex(n => n === record.key);
      favoriteCoins.splice(coinIndex, 1);
    } else {
      favoriteCoins.push(record.key);
    }
    this.setState({ favoriteCoins });
    sessionStorage.setItem('favoriteCoins', JSON.stringify(favoriteCoins));
  };

  // 选择币种
  selectCoin = coin => {
    this.setState({
      marketName: coin.coinMain,
      coinName: coin.coinOther,
      coinPrice: coin.latestPrice || 0
    });

    // TradingView切换商品
    var symbol = coin.coinOther + '/' + coin.coinMain;
    if (window.tvWidget) {
      window.tvWidget.chart().setSymbol(symbol);
    }
  };

  // 按小数位数合并列表
  handleMerge = value => {
    const { listType } = this.state;
    this.setState({ mergeNumber: value });
    this.requestMerge({
      type: listType,
      length: value
    });
  };

  requestMerge = ({ type, length }) => {
    const { marketName, coinName } = this.state;
    this.request('/index/merge', {
      method: 'GET',
      body: {
        coinMain: marketName,
        coinOther: coinName,
        type,
        length
      }
    }).then(json => {
      if (json.code === 10000000) {
        const { tradeList } = this.state;
        if (json.data.buyOrderVOList) tradeList.buyOrderVOList = json.data.buyOrderVOList;
        if (json.data.sellOrderVOList) tradeList.sellOrderVOList = json.data.sellOrderVOList;
        this.setState({ tradeList });
      } else {
        message.error(json.msg);
      }
    });
  };

  // 切换列表
  switchList = index => {
    this.setState({ listType: index - 1 });
    this.requestMerge({
      type: index - 1,
      length: this.state.mergeNumber
    });
  };

  //设置交易价格
  handleTradePrice = tradePrice => {
    console.log(tradePrice);
    this.setState({ tradePrice });
  };

  componentWillMount() {
    this.getTradeExpair();
    this.getRate();
  }

  componentDidMount() {
    //websocket 链接
    this.openStreamWebsocket();
    this.openBuyAndSellWebsocket();
    if (sessionStorage.getItem('account')) {
      this.openUserWebsocket();
    }

    //如果是首页跳转指定的币种
    if (this.coinName) {
      this.setState({ coinName: this.coinName });
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (
      this.state.marketName !== nextState.marketName ||
      this.state.coinName !== nextState.coinName
    ) {
      const { buyandsellWS, marketName, coinName } = nextState;
      this.getStream({
        coinMain: marketName,
        coinOther: coinName
      });
      this.getTradeList({
        coinMain: marketName,
        coinOther: coinName
      });

      const tradePair = `${coinName}_${marketName}`;
      // 给 buyandsell websocket 发消息 切换交易对
      if (buyandsellWS.readyState === 1) {
        buyandsellWS.send(tradePair);
      }

      // 保存交易对,以便刷新能够定位交易对
      sessionStorage.setItem('tradePair', tradePair);
    }

    if (this.state.coinName !== nextState.coinName) {
      const { marketName, coinName, orderStatus } = nextState;

      this.getCoinDetail(coinName);

      if (sessionStorage.getItem('account')) {
        this.findOrderList({ marketName, coinName, status: orderStatus });
      }
    }
  }

  componentWillUnmount() {
    if (JSON.parse(sessionStorage.getItem('account'))) {
      const { streamWS, buyandsellWS, userWS } = this.state;
      streamWS && streamWS.close();
      buyandsellWS && buyandsellWS.close();
      userWS && userWS.close();
    }
  }

  render() {
    const {
      market,
      favoriteCoins,
      tradeExpair,
      searchList,
      searchValue,
      marketName,
      coinName,
      mainVolume,
      coinVolume,
      tradeList,
      streamList,
      pendingOrderList,
      completedOrderList,
      coinPrice,
      listType,
      coinDetail,
      btcLastPrice,
      ethLastPrice,
      tradePrice
    } = this.state;

    let toCNY = 0;
    const usdToCnyRate = 6.5;
    switch (marketName) {
      case 'BTC':
        toCNY = coinPrice * btcLastPrice * usdToCnyRate;
        break;
      case 'ETH':
        toCNY = coinPrice * ethLastPrice * usdToCnyRate;
        break;
      default:
        toCNY = coinPrice * usdToCnyRate;
    }

    let pairList = [];
    if (tradeExpair) {
      if (market === 'optional') {
        Object.values(tradeExpair).forEach(coins => {
          coins = coins.filter(coin => favoriteCoins.includes(coin.key));
          pairList = [...pairList, ...coins];
        });
      } else {
        pairList = tradeExpair[market] || [];
      }
    }

    const orderColumns = [
      {
        title: '委托时间',
        dataIndex: 'time',
        key: 'time',
        render: (text, record) => stampToDate(Number(text))
      },
      {
        title: '委托类别',
        dataIndex: 'exType',
        key: 'exType',
        render: (text, record) => {
          if (text === 0) {
            return <span className="font-color-green">买入</span>;
          } else {
            return <span className="font-color-red">卖出</span>;
          }
        }
      },
      {
        title: '委托价格',
        dataIndex: 'price',
        key: 'price'
      },
      {
        title: '委托数量',
        dataIndex: 'volume',
        key: 'volume'
      },
      {
        title: '委托金额',
        dataIndex: 'amount',
        key: 'amount',
        render: (text, record) => (record.price * record.volume).toFixed(8)
      },
      {
        title: '成交量',
        dataIndex: 'successVolume',
        key: 'successVolume'
      },
      {
        title: '状态/操作',
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => {
          if (record.status === 2 || record.status === 3) {
            return (
              <Button type="primary" onClick={this.getOrderDetail.bind(this, record.orderNo)}>
                详情
              </Button>
            );
          } else if (record.status === 0 || record.status === 1) {
            return (
              <Button type="primary" onClick={this.cancelTrade.bind(this, record.orderNo)}>
                撤单
              </Button>
            );
          } else {
            return '--';
          }
        }
      }
    ];

    let currentCoin = {
      highestPrice: 0,
      lowerPrice: 0,
      dayCount: 0,
      change: 0,
      trend: 'green'
    };
    if (tradeExpair && tradeExpair[marketName] && tradeExpair[marketName].length > 0) {
      tradeExpair[marketName].forEach(coin => {
        if (coin.coinOther === coinName) {
          currentCoin = {
            highestPrice: coin.highestPrice || 0,
            lowerPrice: coin.lowerPrice || 0,
            dayCount: coin.dayCount || 0
          };
          currentCoin.change = (coin.latestPrice - coin.firstPrice) / coin.firstPrice || 0;
          currentCoin.trend = currentCoin.change > 0 ? 'green' : 'red';
        }
      });
    }

    const { localization } = this.props;
    return (
      <div className="content trade">
        <div className="content-inner">
          <NoticeBar {...{ localization }} />
        </div>
        <div className="content-inner trade-area clear">
          <div className="trade-left">
            <div className="trade-plate">
              <header className="trade-plate-header">
                <div className="market-tit">
                  市场
                  <div className="trade-plate-header-right" style={{ right: 0 }}>
                    <Search
                      value={searchValue}
                      onChange={this.handleSearch}
                      style={{ width: 100 }}
                    />
                  </div>
                </div>
                <ul className="market-tabs">
                  {['USDT', 'ETH', 'BTC', 'optional'].map(marketName => {
                    return (
                      <li
                        key={marketName}
                        className={marketName === market ? 'active' : ''}
                        onClick={this.switchMarket.bind(this, marketName)}
                      >
                        {marketName === 'optional' && (
                          <i
                            className={`iconfont icon-shoucang${
                              marketName === market ? '-active' : ''
                            }`}
                          />
                        )}
                        {marketName === 'optional' ? '自选' : marketName}
                      </li>
                    );
                  })}
                </ul>
                {/* <Dropdown
                  overlay={
                    <Menu onClick={this.switchMarket}>
                      {['optional', 'USDT', 'ETH', 'BTC'].map(market => {
                        return (
                          <Menu.Item key={market}>
                            {market === 'optional' ? '自选' : `${market}市场`}
                          </Menu.Item>
                        );
                      })}
                    </Menu>
                  }
                  getPopupContainer={() => document.querySelector('.content.trade')}
                >
                  <a className="ant-dropdown-link" href="javascript:;">
                    {market === 'optional' ? '自选' : `${market}市场`}&nbsp;&nbsp;<Icon type="down" />
                  </a>
                </Dropdown>
                <div className="trade-plate-header-right">
                  <Search value={searchValue} onChange={this.handleSearch} style={{ width: 80 }} />
                </div> */}
              </header>
              <div className="trade-plate-tit cell-3">
                <div className="trade-plate-tit-cell">币种</div>
                <div className="trade-plate-tit-cell sorter">
                  最新价
                  <div className="ant-table-column-sorter">
                    <span className="ant-table-column-sorter-up on" title="↑">
                      <i className="anticon anticon-caret-up" />
                    </span>
                    <span className="ant-table-column-sorter-down off" title="↓">
                      <i className="anticon anticon-caret-down" />
                    </span>
                  </div>
                </div>
                <div className="trade-plate-tit-cell sorter">
                  涨跌幅
                  <div className="ant-table-column-sorter">
                    <span className="ant-table-column-sorter-up off" title="↑">
                      <i className="anticon anticon-caret-up" />
                    </span>
                    <span className="ant-table-column-sorter-down off" title="↓">
                      <i className="anticon anticon-caret-down" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="trade-plate-container market" style={{height: 345}}>
                <Scrollbars>
                  <table>
                    <tbody>
                      {(searchList ? searchList : pairList).map(coin => {
                        const latestPrice = coin.latestPrice || 0;
                        const firstPrice = coin.firstPrice || 0;
                        const change = (latestPrice - firstPrice) / firstPrice || 0;
                        const trend = change > 0 ? 'green' : 'red';
                        return (
                          <tr
                            key={coin.key}
                            onClick={this.selectCoin.bind(this, coin)}
                            className={classnames({
                              selected: coin.coinMain === marketName && coin.coinOther === coinName
                            })}
                          >
                            <td>
                              <i
                                className={`iconfont icon-shoucang${
                                  favoriteCoins.includes(coin.key) ? '-active' : ''
                                }`}
                                onClick={this.handleCollect.bind(this, coin)}
                              />
                              {coin.coinOther}
                            </td>
                            <td>{coin.latestPrice.toFixed(8)}</td>
                            <td className={`font-color-${trend}`}>{change.toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Scrollbars>
              </div>
            </div>
            <div className="trade-plate">
              <header className="trade-plate-header">
                <span className="trade-plate-header-text">最新成交</span>
              </header>
              <div className="trade-plate-tit cell-3">
                <div className="trade-plate-tit-cell" style={{ paddingLeft: 25 }}>
                  成交时间
                </div>
                <div className="trade-plate-tit-cell">成交价格</div>
                <div className="trade-plate-tit-cell">成交量</div>
              </div>
              <div className="trade-plate-container">
                <Scrollbars>
                  <table>
                    <tbody>
                      {streamList &&
                        streamList.map((stream, index) => {
                          const trend = stream.type === 0 ? 'green' : 'red';
                          return (
                            <tr key={stream.date + index} className={`font-color-${trend}`}>
                              <td style={{ paddingLeft: 25 }}>
                                {stampToDate(Number(stream.date), 'hh:mm:ss')}
                              </td>
                              <td>{stream.price.toFixed(8)}</td>
                              <td>{stream.volume.toFixed(8)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </Scrollbars>
              </div>
            </div>
          </div>
          <div className="trade-center">
            <div className="trade-plate">
              <header className="trade-plate-header">
                {false && (
                  <Dropdown
                    overlay={
                      <Menu onClick={this.jumpMarket}>
                        {[
                          {
                            marketName: 'BTC',
                            pairPrice: '0.00000877',
                            pairCNY: '￥0.54'
                          },
                          {
                            marketName: 'USDT',
                            pairPrice: '0.514',
                            pairCNY: '￥0.54'
                          },
                          {
                            marketName: 'ETH',
                            pairPrice: '0.00010951',
                            pairCNY: '￥0.54'
                          }
                        ].map(market => {
                          return (
                            <Menu.Item key={market.marketName}>
                              {coinName}/{market.marketName} {market.pairPrice}/{market.pairCNY}
                            </Menu.Item>
                          );
                        })}
                      </Menu>
                    }
                    getPopupContainer={() => document.querySelector('.content.trade')}
                  >
                    placeholder
                  </Dropdown>
                )}
                <a className="ant-dropdown-link" href="javascript:;">
                  {coinName}/{marketName}&nbsp;&nbsp;{false && <Icon type="down" />}
                </a>
                <span
                  className="trade-plate-header-price"
                  dangerouslySetInnerHTML={{
                    __html: `${coinPrice.toFixed(8)} &asymp; ￥${toCNY.toFixed(8)}`
                  }}
                />
                <div className="trade-plate-header-right">
                  <Tooltip placement="rightTop" title={coinDetail}>
                    <Button type="introduction">币种介绍</Button>
                  </Tooltip>
                </div>
              </header>
              <div className="trade-plate-tit Kline">
                <div className="trade-plate-tit-cell">
                  最高<strong>{currentCoin.highestPrice.toFixed(8)}</strong>
                </div>
                <div className="trade-plate-tit-cell">
                  最低<strong>{currentCoin.lowerPrice.toFixed(8)}</strong>
                </div>
                <div className="trade-plate-tit-cell">
                  成交量<strong>{currentCoin.dayCount.toFixed(8)}</strong>
                </div>
                <div className="trade-plate-tit-cell">
                  涨跌幅
                  <strong className={`font-color-${currentCoin.trend}`}>
                    {currentCoin.change.toFixed(2)}%
                  </strong>
                </div>
              </div>
              <div className="trade-plate-container">
                <Tradeview market={marketName} coin={coinName} />
              </div>
            </div>
            <div className="trade-plate">
              <Tabs defaultActiveKey="1">
                <TabPane tab="限价交易" key="1">
                  <TradeBox
                    marketName={marketName}
                    coinName={coinName}
                    mainVolume={mainVolume}
                    coinVolume={coinVolume}
                    tradePrice={tradePrice}
                    tradeType="limit"
                  />
                </TabPane>
                {false && (
                  <TabPane tab="市价交易" key="2">
                    <TradeBox
                      marketName={marketName}
                      coinName={coinName}
                      mainVolume={mainVolume}
                      coinVolume={coinVolume}
                      tradePrice={tradePrice}
                      tradeType="market"
                    />
                  </TabPane>
                )}
                {false && (
                  <TabPane
                    tab={
                      <span>
                        止盈止损
                        <Tooltip
                          placement="rightTop"
                          title={`当市场价达到触发价时，将按计划设定的价格和数量进行下单`}
                        >
                          <i className="iconfont icon-web-icon-" />
                        </Tooltip>
                      </span>
                    }
                    key="3"
                  >
                    <TradeBox marketName={marketName} coinName={coinName} tradeType="stop" />
                  </TabPane>
                )}
              </Tabs>
            </div>
          </div>
          <div className="trade-right">
            <div className="trade-plate">
              <header className="trade-plate-header">
                <div className="trade-plate-tab">
                  {['icon-maimaipan', 'icon-maipan1', 'icon-maipan'].map((iconName, index) => {
                    const mapToTitle = {
                      'icon-maimaipan': 'buy and sell',
                      'icon-maipan1': 'buy',
                      'icon-maipan': 'sell'
                    };
                    return (
                      <i
                        key={iconName}
                        className={classnames({
                          iconfont: true,
                          [iconName]: true,
                          active: listType === index - 1
                        })}
                        title={mapToTitle[iconName]}
                        onClick={this.switchList.bind(this, index)}
                      />
                    );
                  })}
                </div>
                <div className="trade-plate-header-right">
                  合并
                  <Select
                    defaultValue="8"
                    style={{ width: 100 }}
                    dropdownClassName="merge-dropdown"
                    onChange={this.handleMerge}
                  >
                    <Option value="8">8位小数</Option>
                    <Option value="6">6位小数</Option>
                    <Option value="4">4位小数</Option>
                  </Select>
                </div>
              </header>
              {listType === -1 ? (
                <div className="trade-plate-tit list">
                  <div className="trade-plate-tit-cell">类型</div>
                  <div className="trade-plate-tit-cell">价格({marketName})</div>
                  <div className="trade-plate-tit-cell">数量({coinName})</div>
                  {false && <div className="trade-plate-tit-cell">交易额({marketName})</div>}
                </div>
              ) : (
                <div className="trade-plate-tit list">
                  <div className="trade-plate-tit-cell">{listType === 0 ? '买入' : '卖出'}</div>
                  <div className="trade-plate-tit-cell">{listType === 0 ? '买入' : '卖出'}价</div>
                  <div className="trade-plate-tit-cell">委单量</div>
                  {false && <div className="trade-plate-tit-cell">交易额({marketName})</div>}
                </div>
              )}
              {listType === -1 ? (
                <div className="trade-plate-list">
                  <div className="trade-plate-list-wrap">
                    <table>
                      <tbody>
                        {tradeList &&
                          tradeList.sellOrderVOList.map((record, index, arr) => {
                            const visibleLength = arr.length < 15 ? arr.length : 15;
                            const startIndex = arr.length - visibleLength;
                            return (
                              index > startIndex - 1 && (
                                <tr
                                  key={index}
                                  onClick={this.handleTradePrice.bind(this, record.price)}
                                >
                                  <td className="font-color-red">
                                    卖出{visibleLength - index + startIndex}
                                  </td>
                                  <td>{record.price.toFixed(8)}</td>
                                  <td>{record.volume.toFixed(8)}</td>
                                  {false && <td className="font-color-red">{record.sumTotal}</td>}
                                </tr>
                              )
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                  <div className="latest-price">
                    <span>
                      <i className="iconfont icon-xinhao font-color-green" />最新价
                    </span>
                    <span
                      className={
                        streamList &&
                        streamList.length > 0 &&
                        streamList[0].price <
                          (streamList[1] ? streamList[1].price : streamList[0].price)
                          ? 'font-color-red'
                          : 'font-color-green'
                      }
                    >
                      {(streamList && streamList.length > 0 && streamList[0].price
                        ? streamList[0].price
                        : 0
                      ).toFixed(8)}
                      <i
                        className={classnames({
                          iconfont: true,
                          'icon-xiajiang':
                            streamList &&
                            streamList.length > 0 &&
                            streamList[0].price <
                              (streamList[1] ? streamList[1].price : streamList[0].price),
                          'icon-shangsheng':
                            streamList &&
                            streamList.length > 0 &&
                            streamList[0].price >=
                              (streamList[1] ? streamList[1].price : streamList[0].price)
                        })}
                      />
                    </span>
                  </div>
                  <div className="trade-plate-list-wrap">
                    <table>
                      <tbody>
                        {tradeList &&
                          tradeList.buyOrderVOList.map((record, index) => {
                            return (
                              index < 15 && (
                                <tr
                                  key={index}
                                  onClick={this.handleTradePrice.bind(this, record.price)}
                                >
                                  <td className="font-color-green">买入{index + 1}</td>
                                  <td>{record.price.toFixed(8)}</td>
                                  <td>{record.volume.toFixed(8)}</td>
                                  {false && <td className="font-color-green">{record.sumTotal}</td>}
                                </tr>
                              )
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="trade-plate-list">
                  <Scrollbars>
                    <table>
                      <tbody>
                        {tradeList &&
                          (listType === 1
                            ? tradeList.sellOrderVOList
                            : tradeList.buyOrderVOList
                          ).map((record, index) => {
                            const colorName = listType === 0 ? 'green' : 'red';
                            const actionName = listType === 0 ? '买入' : '卖出';
                            return (
                              <tr
                                key={index}
                                onClick={this.handleTradePrice.bind(this, record.price)}
                              >
                                <td className={`font-color-${colorName}`}>
                                  {actionName}
                                  {index + 1}
                                </td>
                                <td>{record.price.toFixed(8)}</td>
                                <td>{record.volume.toFixed(8)}</td>
                                {false && (
                                  <td className={`font-color-${colorName}`}>{record.sumTotal}</td>
                                )}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </Scrollbars>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="content-inner">
          <div className="trade-plate">
            <Tabs
              defaultActiveKey="0"
              onChange={status => {
                if (sessionStorage.getItem('account')) {
                  this.findOrderList({ marketName, coinName, status });
                }
                this.setState({ orderStatus: status });
              }}
            >
              <TabPane tab="我的挂单" key="0">
                <Scrollbars>
                  <Table columns={orderColumns} dataSource={pendingOrderList} pagination={false} />
                </Scrollbars>
              </TabPane>
              <TabPane tab="成交历史" key="1">
                <Scrollbars>
                  <Table
                    columns={orderColumns}
                    onExpand={this.handleExpand}
                    dataSource={completedOrderList}
                    pagination={false}
                    expandedRowRender={record =>
                      record.orderDetail && (
                        <ul className="order-detail">
                          <li>
                            <span>数量</span>
                            <span>成交额</span>
                            <span>手续费</span>
                          </li>
                          <li>
                            <span>3.12345674</span>
                            <span>234.89056432</span>
                            <span>5.40957673</span>
                          </li>
                          <li>
                            <span>3.12345674</span>
                            <span>234.89056432</span>
                            <span>5.40957673</span>
                          </li>
                          <li>
                            <span>3.12345674</span>
                            <span>234.89056432</span>
                            <span>5.40957673</span>
                          </li>
                        </ul>
                      )
                    }
                  />
                </Scrollbars>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
}

export default Trade;
