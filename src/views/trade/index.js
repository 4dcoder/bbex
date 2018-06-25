import React, { Component } from 'react';
import {
  Tabs,
  Input,
  Table,
  Menu,
  Dropdown,
  Icon,
  Tooltip,
  Button,
  Select,
  message,
  List
} from 'antd';
import classnames from 'classnames';
import Scrollbars from 'react-custom-scrollbars';
import Spinners from 'react-spinners';
import NoticeBar from '../../components/noticeBar';
import { stampToDate } from '../../utils';
import { WS_ADDRESS } from '../../utils/constants';
import TradeBox from './TradeBox';
import Tradeview from '../../tradeview';
import ReconnectingWebSocket from '../../utils/ReconnectingWebSocket';
import './trade.css';

const Search = Input.Search;
const TabPane = Tabs.TabPane;
const Option = Select.Option;

class Trade extends Component {
  constructor(props) {
    super(props);
    let tradePair = sessionStorage.getItem('tradePair');
    //console.log('tradePair', tradePair);
    if (tradePair) {
      const [coinName, marketName] = tradePair.split('_');
      this.coinName = coinName;
      this.marketName = marketName;
    }

    this.state = {
      market: this.marketName || 'USDT',
      tradeExpair: {},
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
      streamList: [],
      pendingOrderList: [],
      completedOrderList: [],
      listType: -1,
      mergeNumber: 8,
      orderStatus: 0,
      coinDetail: '',
      favoriteCoins: sessionStorage.getItem('favoriteCoins')
        ? JSON.parse(sessionStorage.getItem('favoriteCoins'))
        : [],
      tradePrice: '',
      clickTradeType: '',
      historyDetails: [],
      historyExpendKey: ''
    };
  }

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
        // message.error(json.msg);
      }
    });
  };

  // 未完成订单
  findOrderList = ({ marketName, coinName, status }) => {
    if (status === 0) {
      this.setState({ pendingOrderList: null });
    } else {
      this.setState({ completedOrderList: null });
    }

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
          this.setState({ pendingOrderList: json.data || [] });
        } else {
          this.setState({ completedOrderList: json.data || [] });
        }
      } else {
        if (status === 0) {
          this.setState({ pendingOrderList: [] });
        } else {
          this.setState({ completedOrderList: [] });
        }
        //message.error(json.msg);
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
  handleCancelTrade = orderNo => {
    this.request(`/trade/cancelTrade/${orderNo}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const { marketName, coinName, orderStatus } = this.state;
        this.findOrderList({ marketName, coinName, status: orderStatus });
        message.success('撤单成功！');
      } else {
        message.error(json.msg);
      }
    });
  };

  // 点击订单详情
  handleOrderDetail = orderNo => {
    let { historyExpendKey } = this.state;
    if (historyExpendKey != orderNo) {
      this.getOrderDetail(orderNo);
      this.setState({ historyExpendKey: orderNo });
    }
  };
  // 获取订单详情
  getOrderDetail = orderNo => {
    this.request(`/coin/tradeOrderDetail/${orderNo}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ historyDetails: json.data });
      } else {
        //message.error(json.msg);
      }
    });
  };

  openStreamWebsocket = () => {
    //打开websockets
    const streamWS = new ReconnectingWebSocket(`${WS_ADDRESS}/bbex/platsocket`);

    this.interval1 = setInterval(() => {
      if (streamWS.readyState === 1) {
        streamWS.send('ping');
      }
    }, 1000 * 3);

    streamWS.onopen = evt => {
      //console.log('stream Websocket Connection open ...');
      this.timer1 = new Date().getTime();
    };

    streamWS.onmessage = evt => {
      // clearTimeout(this.timer);
      // return;
      if (evt.data === 'pong') {
        //console.log('stream: ', evt.data);
        return;
      }
      let current = new Date().getTime();
      // socket 1s后回消息才会刷新界面
      if (current - this.timer1 > 100) {
        this.timer1 = current;

        const record = JSON.parse(evt.data);
        const { marketName, coinName, tradeList } = this.state;

        if (record && record.matchStreamVO) {
          // 当流水的交易对跟当前交易对相等时
          if (
            record.matchStreamVO &&
            record.matchStreamVO.coinMain === marketName &&
            record.matchStreamVO.coinOther === coinName
          ) {
            let { tradeExpair, streamList, marketName } = this.state;
            const matchVo = record.matchStreamVO;
            tradeExpair[marketName] = tradeExpair[marketName].map(item => {
              if (matchVo.coinOther === item.coinOther) {
                if (item.firstPrice == 0) {
                  item.firstPrice = item.latestPrice;
                }
                item.latestPrice = matchVo.price;
              }
              return item;
            });

            tradeList.buyOrderVOList =
              tradeList.buyOrderVOList &&
              tradeList.buyOrderVOList.filter(item => {
                if (
                  item.coinMain === matchVo.coinMain &&
                  item.coinOther === matchVo.coinOther &&
                  item.price === matchVo.price
                ) {
                  item.volume -= matchVo.volume;
                }
                return item.volume > 0;
              });
            tradeList.sellOrderVOList =
              tradeList.sellOrderVOList &&
              tradeList.sellOrderVOList.filter(item => {
                if (
                  item.coinMain === matchVo.coinMain &&
                  item.coinOther === matchVo.coinOther &&
                  item.price === matchVo.price
                ) {
                  item.volume -= matchVo.volume;
                }
                return item.volume > 0;
              });
            if (streamList && streamList.length > 0) {
              streamList.unshift(record.matchStreamVO);
              let target = streamList.slice(0, 30);
              streamList = target;
            }

            this.setState({ tradeExpair, tradeList, streamList });
          }
        }
      }
    };

    streamWS.onclose = evt => {
      //console.log('stream Websocket Connection closed.');
    };

    streamWS.onerror = evt => {
      //console.log(evt);
    };

    this.setState({ streamWS });
  };

  openBuyAndSellWebsocket = () => {
    //打开websockets
    const buyandsellWS = new ReconnectingWebSocket(`${WS_ADDRESS}/bbex/buysellsocket`);

    if (buyandsellWS.readyState === 1) {
      const { marketName, coinName, mergeNumber } = this.state;
      buyandsellWS.send(`${coinName}_${marketName}_${mergeNumber}`);
    }
    this.interval2 = setInterval(() => {
      if (buyandsellWS.readyState === 1) {
        const { marketName, coinName, mergeNumber } = this.state;
        buyandsellWS.send(`${coinName}_${marketName}_${mergeNumber}`);
      }
    }, 1000);

    buyandsellWS.onopen = evt => {
      //console.log('stream Websocket Connection open ...');
      this.timer2 = new Date().getTime();
    };

    buyandsellWS.onmessage = evt => {
      if (evt.data === 'pong') {
        return;
      }
      let current = new Date().getTime();

      if (current - this.timer2 > 50) {
        this.timer2 = current;

        // console.log('buyandsell reciveDate: ', JSON.parse(evt.data));
        if (evt.data) {
          this.setState({ tradeList: JSON.parse(evt.data) });
        }
      }
    };

    buyandsellWS.onclose = evt => {
      //console.log('buyandsell Websocket Connection closed.');
    };

    buyandsellWS.onerror = evt => {
      //console.log(evt);
    };

    this.setState({ buyandsellWS });
  };

  openUserWebsocket = () => {
    //打开websockets
    const { id } = JSON.parse(sessionStorage.getItem('account'));
    const userWS = new ReconnectingWebSocket(`${WS_ADDRESS}/bbex/socketuser?${id}`);

    this.interval3 = setInterval(() => {
      if (userWS.readyState === 1) {
        const { marketName, coinName } = this.state;
        userWS.send(`${coinName}_${marketName}_${id}`);
      }
    }, 3000);

    userWS.onopen = evt => {
      //console.log('user Websocket Connection open ...');
      this.timer3 = new Date().getTime();
    };

    userWS.onmessage = evt => {
      let current = new Date().getTime();

      if (evt.data === 'pong') {
        //console.log('user: ', evt.data);
        return;
      }

      if (current - this.timer3 > 300) {
        this.timer3 = current;

        const { orderVo, coinMainVolume, coinOtherVolume } = JSON.parse(evt.data);
        //console.log('======user record: ', JSON.parse(evt.data));

        // 当推的数据是挂单，更新用户挂单列表
        if (orderVo) {
          let { pendingOrderList } = this.state;
          let isNewRecord = true;
          pendingOrderList =
            pendingOrderList &&
            pendingOrderList.filter(order => {
              if (order.orderNo === orderVo.orderNo) {
                isNewRecord = false;
                order.status = orderVo.status;
                order.exType = orderVo.exType;
                if (orderVo.status === 1) {
                  order.successVolume = (
                    Number(order.successVolume) + orderVo.successVolume
                  ).toFixed(8);
                } else {
                  order.successVolume = orderVo.successVolume;
                }
              }
              return order.status !== 2;
            });

          if (isNewRecord) {
            orderVo.key = orderVo.orderNo;
            orderVo.price = orderVo.price && orderVo.price.toFixed(8);
            orderVo.volume = orderVo.volume && orderVo.volume.toFixed(8);
            orderVo.successVolume = orderVo.successVolume && orderVo.successVolume.toFixed(8);
            if (pendingOrderList && pendingOrderList.length > 0) {
              pendingOrderList.unshift(orderVo);
              let target = pendingOrderList.slice(0, 50);
              pendingOrderList = target;
            }
          }
          this.setState({ pendingOrderList });
        }

        const { mainVolume, coinVolume } = this.state;
        // 当推的数据有主币而且跟当前不相等，就更新主币资产
        if (coinMainVolume && coinMainVolume.volume && coinMainVolume.volume !== mainVolume) {
          this.setState({ mainVolume: coinMainVolume.volume });
        }

        // 当推的数据有副币而且跟当前不相等，就更新副币资产
        if (coinOtherVolume && coinOtherVolume.volume && coinOtherVolume.volume !== coinVolume) {
          this.setState({ coinVolume: coinOtherVolume.volume });
        }
      }
    };

    userWS.onclose = evt => {
      //console.log('user Websocket Connection closed.');
    };

    userWS.onerror = evt => {
      //console.log(evt);
    };

    this.setState({ userWS });
  };

  // 市场币种列表
  getTradeExpair = () => {
    this.setState({ tradeExpair: null });
    this.request('/index/allTradeExpair', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        if (this.coinName) {
          // 如果有保存在sessionStorage的交易对，就取保存中的
          this.setState({ coinName: this.coinName });
        } else {
          // 如果没有保存的交易对，就取当前市场的第一个币种
          this.setState({
            coinName: json.data[this.state.market][0].coinOther
          });
        }

        const tradeExpair = {};
        Object.keys(json.data).forEach(key => {
          tradeExpair[key] = json.data[key].map(coin => {
            coin.key = `${coin.coinMain}.${coin.coinOther}`;
            coin.latestPrice = coin.latestPrice || 0;
            return coin;
          });
        });
        this.setState({ tradeExpair });
      } else {
        this.setState({ tradeExpair: {} });
        //message.error(json.msg);
      }
    });
  };

  // 获取交易列表
  getTradeList = ({ coinMain, coinOther }) => {
    this.setState({
      tradeList: {
        buyOrderVOList: null,
        sellOrderVOList: null
      }
    });
    this.request('/index/buyAndSellerOrder', {
      method: 'GET',
      body: { coinMain, coinOther }
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({
          tradeList: {
            buyOrderVOList: json.data.buyOrderVOList || [],
            sellOrderVOList: json.data.sellOrderVOList || []
          }
        });
        this.setState({ tradeList: json.data });
      } else {
        this.setState({
          tradeList: {
            buyOrderVOList: [],
            sellOrderVOList: []
          }
        });
        //message.error(json.msg);
      }
    });
  };

  // 获取流水记录
  getStream = ({ coinMain, coinOther }) => {
    this.setState({ streamList: null });
    this.request('/index/findMatchStream', {
      method: 'GET',
      body: { coinMain, coinOther }
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ streamList: json.data || [] });
      } else {
        this.setState({ streamList: [] });
        //message.error(json.msg);
      }
    });
  };

  // 切换市场
  handleSwitchMarket = market => {
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
        tradeExpair[market] &&
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
  handleSelectCoin = coin => {
    this.setState({
      marketName: coin.coinMain,
      coinName: coin.coinOther
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
    // this.requestMerge({
    //   type: listType,
    //   length: value
    // });
  };

  requestMerge = ({ type = '', length }) => {
    this.setState({
      tradeList: {
        buyOrderVOList: null,
        sellOrderVOList: null
      }
    });
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
        this.setState({
          tradeList: {
            buyOrderVOList: json.data.buyOrderVOList ? json.data.buyOrderVOList : [],
            sellOrderVOList: json.data.sellOrderVOList ? json.data.sellOrderVOList : []
          }
        });
      } else {
        this.setState({
          tradeList: {
            buyOrderVOList: [],
            sellOrderVOList: []
          }
        });
        message.error(json.msg);
      }
    });
  };

  // 切换买卖盘列表
  handleSwitchList = index => {
    this.setState({ listType: index - 1 });
    // this.requestMerge({
    //   type: index - 1,
    //   length: this.state.mergeNumber
    // });
  };

  //设置交易价格
  handleTradePrice = (tradePrice, clickTradeType) => {
    this.setState({ tradePrice, clickTradeType });
  };

  componentWillMount() {
    this.getTradeExpair();
    this.getRate();
  }

  componentDidMount() {
    // 打开websocket链接
    this.openStreamWebsocket();
    this.openBuyAndSellWebsocket();

    // 只有登录状态下才打开用户websocket
    if (sessionStorage.getItem('account')) {
      this.openUserWebsocket();
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (
      this.state.marketName !== nextState.marketName ||
      this.state.coinName !== nextState.coinName
    ) {
      const { buyandsellWS, marketName, coinName, mergeNumber } = nextState;
      this.getStream({
        coinMain: marketName,
        coinOther: coinName
      });
      // this.getTradeList({
      //   coinMain: marketName,
      //   coinOther: coinName
      // });

      // 保存交易对,以便刷新能够定位交易对
      sessionStorage.setItem('tradePair', `${coinName}_${marketName}`);
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
    // 停止定时订阅或pingpong机制
    clearInterval(this.interval1);
    clearInterval(this.interval2);
    clearInterval(this.interval3);
    // 关闭websocket的连接
    const { streamWS, buyandsellWS, userWS } = this.state;
    streamWS && streamWS.close();
    buyandsellWS && buyandsellWS.close();
    userWS && userWS.close();
    window.ws && window.ws.close();
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
      listType,
      coinDetail,
      btcLastPrice,
      ethLastPrice,
      tradePrice,
      clickTradeType,
      historyDetails,
      historyExpendKey
    } = this.state;

    let coinPrice = 0; //当前交易对的最新价
    let pairList = []; //当前交易市场的币种列表
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
    pairList.forEach(coin => {
      if (coin.coinMain === marketName && coin.coinOther === coinName && coin.latestPrice) {
        coinPrice = coin.latestPrice;
      }
    });

    let toCNY = 0; //当前最新价的折合人民币
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
        title: `委托数量(${coinName}/${marketName})`,
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
        title: `成交量(${coinName}/${marketName})`,
        dataIndex: 'successVolume',
        key: 'successVolume',
        render: (text, record) => `${text}${record.status === 1 ? '（部分成交）' : ''}`
      },
      {
        title: '状态/操作',
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => {
          if (record.status === 2 || record.status === 3) {
            return (
              <Button type="primary" onClick={this.handleOrderDetail.bind(this, record.orderNo)}>
                详情
              </Button>
            );
          } else if (record.status === 0 || record.status === 1) {
            return (
              <Button type="primary" onClick={this.handleCancelTrade.bind(this, record.orderNo)}>
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
          let change = 0;
          if (coin.firstPrice > 0) {
            change = (coin.latestPrice - coin.firstPrice) / coin.firstPrice;
          }
          if (isNaN(change)) {
            change = 0;
          }
          currentCoin.change = change;
          currentCoin.trend = currentCoin.change > 0 ? 'green' : 'red';
        }
      });
    }

    const tradeProps = {
      marketName,
      coinName,
      mainVolume,
      coinVolume,
      tradePrice,
      clickTradeType
    };

    const { localization } = this.props;

    const loading = (
      <div className="container-loading">
        <Spinners.ClipLoader color={'#d4a668'} size={35} />
      </div>
    );

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
                        onClick={this.handleSwitchMarket.bind(this, marketName)}
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
              <div className="trade-plate-container market" style={{ height: 345 }}>
                {tradeExpair ? (
                  <Scrollbars>
                    <table>
                      <tbody>
                        {(searchList ? searchList : pairList).map(coin => {
                          const latestPrice = coin.latestPrice || 0;
                          const firstPrice = coin.firstPrice || 0;
                          let change = 0;
                          if (firstPrice > 0) {
                            change = (latestPrice - firstPrice) / firstPrice;
                          }
                          if (isNaN(change)) {
                            change = 0;
                          }
                          const trend = change > 0 ? 'green' : 'red';
                          return (
                            <tr
                              key={coin.key}
                              onClick={this.handleSelectCoin.bind(this, coin)}
                              className={classnames({
                                selected:
                                  coin.coinMain === marketName && coin.coinOther === coinName
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
                ) : (
                  loading
                )}
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
              <div className="trade-plate-container stream">
                {streamList ? (
                  <Scrollbars>
                    <table>
                      <tbody>
                        {streamList.map((stream, index) => {
                          if (stream) {
                            const trend = stream.type == 0 ? 'green' : 'red';
                            return (
                              <tr key={stream.date + index} className={`font-color-${trend}`}>
                                <td style={{ paddingLeft: 25 }}>
                                  {stampToDate(Number(stream.date), 'hh:mm:ss')}
                                </td>
                                <td>{stream.price.toFixed(8)}</td>
                                <td>{stream.volume.toFixed(8)}</td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </Scrollbars>
                ) : (
                  loading
                )}
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
                  <TradeBox tradeType="limit" {...tradeProps} />
                </TabPane>
                {false && (
                  <TabPane tab="市价交易" key="2">
                    <TradeBox tradeType="market" {...tradeProps} />
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
                        onClick={this.handleSwitchList.bind(this, index)}
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
                    {
                      <table>
                        <tbody>
                          {tradeList &&
                            tradeList.sellOrderVOList &&
                            tradeList.sellOrderVOList.map((record, index, arr) => {
                              const visibleLength = arr.length < 15 ? arr.length : 15;
                              const startIndex = arr.length - visibleLength;
                              return (
                                index > startIndex - 1 && (
                                  <tr
                                    key={index}
                                    onClick={this.handleTradePrice.bind(this, record.price, 'sell')}
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
                    }
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
                    {
                      <table>
                        <tbody>
                          {tradeList &&
                            tradeList.buyOrderVOList &&
                            tradeList.buyOrderVOList.map((record, index) => {
                              return (
                                index < 15 && (
                                  <tr
                                    key={index}
                                    onClick={this.handleTradePrice.bind(this, record.price, 'buy')}
                                  >
                                    <td className="font-color-green">买入{index + 1}</td>
                                    <td>{record.price.toFixed(8)}</td>
                                    <td>{record.volume.toFixed(8)}</td>
                                    {false && (
                                      <td className="font-color-green">{record.sumTotal}</td>
                                    )}
                                  </tr>
                                )
                              );
                            })}
                        </tbody>
                      </table>
                    }
                  </div>
                </div>
              ) : (
                <div className="trade-plate-list">
                  {
                    <Scrollbars>
                      <table>
                        <tbody>
                          {tradeList &&
                            (tradeList.sellOrderVOList || tradeList.buyOrderVOList) &&
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
                  }
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
                  <Table
                    columns={orderColumns}
                    dataSource={pendingOrderList}
                    loading={!pendingOrderList}
                    pagination={false}
                  />
                </Scrollbars>
              </TabPane>
              <TabPane tab="成交历史" key="1">
                <Scrollbars>
                  <Table
                    className="trade_history"
                    columns={orderColumns}
                    dataSource={completedOrderList}
                    loading={!completedOrderList}
                    pagination={false}
                    expandedRowKeys={[historyExpendKey]}
                    expandedRowRender={record => {
                      return (
                        <div className="expend_content">
                          <List
                            size="small"
                            header={
                              <ul className="expent_title">
                                <li>时间</li>
                                <li>价格</li>
                                <li>数量</li>
                                <li>成交额</li>
                                <li>手续费</li>
                              </ul>
                            }
                            dataSource={historyDetails}
                            renderItem={item => (
                              <List.Item className="list_lis">
                                <ul className="list_item">
                                  <li>{stampToDate(item.createDate * 1)}</li>
                                  <li>{Number(item.price).toFixed(8)}</li>
                                  <li>{Number(item.successVolume).toFixed(8)}</li>
                                  <li>{Number(item.price * item.successVolume).toFixed(8)}</li>
                                  <li>{Number(item.exFee).toFixed(8)}</li>
                                </ul>
                              </List.Item>
                            )}
                          />
                        </div>
                      );
                    }}
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
