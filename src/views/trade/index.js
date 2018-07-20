import React, { PureComponent } from 'react';
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
import NoticeBar from '../../components/notice-bar';
import { stampToDate } from '../../utils';
import { WS_PREFIX } from '../../utils/constants';
import TradeBox from './TradeBox';
import Tradeview from '../../tradeview';
import ReconnectingWebSocket from '../../utils/ReconnectingWebSocket';
import './trade.css';

const Search = Input.Search;
const TabPane = Tabs.TabPane;
const Option = Select.Option;

class Trade extends PureComponent {
  constructor(props) {
    super(props);

    const tradePair = localStorage.getItem('tradePair');
    if (tradePair) {
      const [coinName, marketName] = tradePair.split('_');
      this.coinName = coinName;
      this.marketName = marketName;
    }

    this.state = {
      market: this.marketName || 'USDT',
      tradeExpair: {},
      searchValue: '',
      marketName: this.marketName || 'USDT',
      coinName: '',
      mainVolume: 0,
      coinVolume: 0,
      tradeList: {},
      streamList: [],
      pendingOrderList: [],
      completedOrderList: [],
      listType: -1,
      mergeNumber: 8,
      orderStatus: 0,
      coinDetail: ' ',
      favoriteCoins: localStorage.getItem('favoriteCoins')
        ? JSON.parse(localStorage.getItem('favoriteCoins'))
        : [],
      tradePrice: '',
      clickTradeType: '',
      historyDetails: [],
      historyExpendKey: '',
      btcLastPrice: 0,
      ethLastPrice: 0
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
        // message.error(json.msg);
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
        this.findOrderList({
          marketName,
          coinName,
          status: orderStatus
        });
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

  openMarketsocket = () => {
    //打开市场websocket
    this.marketWS = new ReconnectingWebSocket(`${WS_PREFIX}/plat`);

    this.marketInterval = setInterval(() => {
      if (this.marketWS && this.marketWS.readyState === 1) {
        this.marketWS.send('ping');
      }
    }, 1000 * 10);

    this.marketWS.onmessage = evt => {
      if (evt.data === 'pong') {
        return;
      }

      // 如果有推送就更新
      const { tradeExpair } = this.state;
      const updateExPair = JSON.parse(evt.data);
      if (tradeExpair && Object.keys(tradeExpair).length > 0) {
        Object.keys(updateExPair).forEach(key => {
          updateExPair[key].forEach(coin => {
            const expair = `${coin.coinOther}/${coin.coinMain}`;
            let rise = '0.00%';
            if (coin.firstPrice > 0) {
              rise = ((coin.latestPrice - coin.firstPrice) / coin.firstPrice) * 100;
              rise = rise.toFixed(2) + '%';
            }
            // console.log('rise', rise);
            tradeExpair[key][expair] = {
              ...coin,
              rise: rise,
              latestPrice: (coin.latestPrice || 0).toFixed(8),
              highestPrice: (coin.highestPrice || 0).toFixed(8),
              lowerPrice: (coin.lowerPrice || 0).toFixed(8),
              dayCount: (coin.dayCount || 0).toFixed(8)
            };
          });
        });

        this.setState({ tradeExpair });
      }
    };
  };

  openStreamWebsocket = () => {
    this.streamWS = new ReconnectingWebSocket(`${WS_PREFIX}/flowingWater`);
    this.streamInterval = setInterval(() => {
      if (this.streamWS && this.streamWS.readyState === 1) {
        this.streamWS.send('ping');
      }
    }, 1000 * 10);

    this.streamWS.onopen = evt => {
      const { marketName, coinName } = this.state;
      if (marketName && coinName && this.streamWS && this.streamWS.readyState === 1) {
        this.streamWS.send(`${coinName}_${marketName}`);
      }
    };

    this.streamWS.onmessage = evt => {
      if (evt.data === 'pong') {
        return;
      }

      const { btcLastPrice, ethLastPrice, matchStreamVO } = JSON.parse(evt.data);
      const { marketName, coinName, tradeList } = this.state;

      // 更新btc最新价
      if (btcLastPrice) this.setState({ btcLastPrice });

      // 更新eth最新价
      if (ethLastPrice) this.setState({ ethLastPrice });

      if (matchStreamVO) {
        // 当流水的交易对跟当前交易对相等时
        if (
          matchStreamVO &&
          matchStreamVO.coinMain === marketName &&
          matchStreamVO.coinOther === coinName
        ) {
          const streamVO = matchStreamVO;
          let { tradeExpair, streamList, marketName } = this.state;
          Object.keys(tradeExpair[marketName]).forEach(key => {
            if (streamVO.coinOther === tradeExpair[marketName][key].coinOther) {
              if (tradeExpair[marketName][key].firstPrice == 0) {
                tradeExpair[marketName][key].firstPrice = tradeExpair[marketName][key].latestPrice;
              }
              tradeExpair[marketName][key].latestPrice = (streamVO.price * 1).toFixed(8);
              let rise = '0.00%';
              let current = tradeExpair[marketName][key];
              if (current.firstPrice > 0) {
                rise = ((current.latestPrice - current.firstPrice) / current.firstPrice) * 100;
                rise = rise.toFixed(2) + '%';
              }
              tradeExpair[marketName][key].rise = rise;
            }
          });

          tradeList.buyOrderVOList =
            tradeList.buyOrderVOList &&
            tradeList.buyOrderVOList.filter(item => {
              if (
                item.coinMain === streamVO.coinMain &&
                item.coinOther === streamVO.coinOther &&
                item.price === streamVO.price
              ) {
                item.volume -= streamVO.volume;
              }
              return item.volume > 0;
            });
          tradeList.sellOrderVOList =
            tradeList.sellOrderVOList &&
            tradeList.sellOrderVOList.filter(item => {
              if (
                item.coinMain === streamVO.coinMain &&
                item.coinOther === streamVO.coinOther &&
                item.price === streamVO.price
              ) {
                item.volume -= streamVO.volume;
              }
              return item.volume > 0;
            });
          if (streamList) {
            streamList.unshift(streamVO);
            streamList = streamList.slice(0, 30);
          }

          this.setState({
            tradeExpair,
            tradeList,
            streamList
          });
        }
      }
    };
  };

  openBuyAndSellWebsocket = () => {
    //打开websockets
    this.buyandsellWS = new ReconnectingWebSocket(`${WS_PREFIX}/buyAndSell`);

    if (this.buyandsellWS && this.buyandsellWS.readyState === 1) {
      const { marketName, coinName, mergeNumber } = this.state;
      this.buyandsellWS.send(`${coinName}_${marketName}_${mergeNumber}`);
    }

    this.buyandsellInterval = setInterval(() => {
      const { marketName, coinName, mergeNumber } = this.state;
      if (this.buyandsellWS && this.buyandsellWS.readyState === 1 && coinName && marketName) {
        this.buyandsellWS.send(`${coinName}_${marketName}_${mergeNumber}`);
      }
    }, 1000);

    this.buyandsellWS.onmessage = evt => {
      if (evt.data) {
        this.setState({ tradeList: JSON.parse(evt.data) });
      }
    };
  };

  openUserWebsocket = () => {
    //打开websockets
    const { id } = JSON.parse(sessionStorage.getItem('account'));
    this.userWS = new ReconnectingWebSocket(`${WS_PREFIX}/user?${id}`);

    this.userInterval = setInterval(() => {
      if (this.userWS && this.userWS.readyState === 1) {
        const { marketName, coinName } = this.state;
        this.userWS.send(`${coinName}_${marketName}_${id}`);
      }
    }, 3000);

    this.userWS.onmessage = evt => {
      if (evt.data === 'pong') {
        return;
      }

      const { orderVo, coinMainVolume, coinOtherVolume } = JSON.parse(evt.data);
      //console.log('======user record: ', JSON.parse(evt.data));

      // 当推的数据是挂单，更新用户挂单列表
      if (orderVo) {
        let { pendingOrderList } = this.state;
        let isNewRecord = orderVo.status === 0; // 如果status等于0就是新记录
        pendingOrderList =
          pendingOrderList &&
          pendingOrderList.filter(order => {
            if (order.orderNo === orderVo.orderNo) {
              isNewRecord = false; //如果有相同的orderNo就不是新的记录
              order.status = orderVo.status;
              if (order.status === 1) {
                order.successVolume = (Number(order.successVolume) + orderVo.successVolume).toFixed(
                  8
                );
              } else {
                order.price = orderVo.price;
                order.volume = orderVo.volume;
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
          if (pendingOrderList) {
            pendingOrderList.unshift(orderVo);
            let target = pendingOrderList.slice(0, 50);
            pendingOrderList = target;
          }
        }

        this.setState({ pendingOrderList });
      }

      const { mainVolume, coinVolume } = this.state;
      // 当推的数据有主币而且跟当前不相等，就更新主币资产
      if (coinMainVolume && coinMainVolume.volume !== mainVolume) {
        this.setState({ mainVolume: coinMainVolume.volume });
      }

      // 当推的数据有副币而且跟当前不相等，就更新副币资产
      if (coinOtherVolume && coinOtherVolume.volume !== coinVolume) {
        this.setState({ coinVolume: coinOtherVolume.volume });
      }
    };
  };

  // 市场币种列表
  getTradeExpair = () => {
    this.setState({ tradeExpair: null });
    this.request('/index/allTradeExpair', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        if (this.coinName) {
          // 如果有保存在localStorage的交易对，就取保存中的
          this.setState({ coinName: this.coinName });
        } else {
          // 如果没有保存的交易对，就取当前市场的第一个币种
          if (json.data[this.state.market]) {
            this.setState({
              coinName: json.data[this.state.market][0].coinOther
            });
          } else {
            this.setState({
              market: Object.keys(json.data)[0],
              marketName: Object.keys(json.data)[0],
              coinName: json.data[Object.keys(json.data)[0]][0].coinOther
            });
          }
        }

        const tradeExpair = {};
        Object.keys(json.data).forEach(key => {
          tradeExpair[key] = {};
          json.data[key].forEach(coin => {
            const expair = `${coin.coinOther}/${coin.coinMain}`;
            let rise = '0.00%';
            if (coin.firstPrice > 0) {
              rise = ((coin.latestPrice - coin.firstPrice) / coin.firstPrice) * 100;
              rise = rise.toFixed(2) + '%';
            }
            tradeExpair[key][expair] = {
              ...coin,
              rise: rise,
              latestPrice: (coin.latestPrice || 0).toFixed(8),
              highestPrice: (coin.highestPrice || 0).toFixed(8),
              lowerPrice: (coin.lowerPrice || 0).toFixed(8),
              dayCount: (coin.dayCount || 0).toFixed(8)
            };
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
    this.setState({ market, searchValue: '' });
  };

  // 搜索币
  handleSearch = event => {
    this.setState({ searchValue: event.target.value.trim() });
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
    localStorage.setItem('favoriteCoins', JSON.stringify(favoriteCoins));
  };

  // 选择币种
  handleSelectCoin = coin => {
    this.setState({
      marketName: coin.coinMain,
      coinName: coin.coinOther,
      tradeList: {} // 触发买卖盘loading
    });

    // TradingView切换商品
    var symbol = coin.coinOther + '/' + coin.coinMain;
    if (window.tvWidget) {
      window.tvWidget.chart().setSymbol(symbol);
    }
  };

  // 按小数位数合并列表
  handleMerge = value => {
    this.setState({ mergeNumber: value });
  };

  // 切换买卖盘列表
  handleSwitchList = index => {
    this.setState({ listType: index - 1 });
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
    this.openMarketsocket();
    this.openBuyAndSellWebsocket();
    this.openStreamWebsocket();

    // 只有登录状态下才打开用户websocket
    if (sessionStorage.getItem('account')) {
      this.openUserWebsocket();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.marketName !== prevState.marketName ||
      this.state.coinName !== prevState.coinName
    ) {
      const { marketName, coinName } = this.state;
      const tradePair = `${coinName}_${marketName}`;

      // 获取交易流水列表
      this.getStream({
        coinMain: marketName,
        coinOther: coinName
      });

      // 交易流水websocket 重新发送交易对
      if (this.streamWS && this.streamWS.readyState === 1) {
        this.streamWS.send(tradePair);
      }

      // 保存交易对,以便刷新能够定位交易对
      localStorage.setItem('tradePair', tradePair);
    }

    if (this.state.coinName !== prevState.coinName) {
      const { marketName, coinName, orderStatus } = this.state;

      // 如果已经登录，获取挂单列表
      if (sessionStorage.getItem('account')) {
        this.findOrderList({
          marketName,
          coinName,
          status: orderStatus
        });
      }

      // 如果5秒后this.buyandsellWS没有推送买卖盘的时候去掉loading
      setTimeout(() => {
        if (Object.keys(this.state.tradeList).length === 0) {
          this.setState({ tradeList: { buyOrderVOList: [], sellOrderVOList: [] } });
        }
      }, 1000 * 5);
    }
  }

  componentWillUnmount() {
    // 停止定时订阅或pingpong机制
    clearInterval(this.reOpenFlowWaterInterval);
    clearInterval(this.streamInterval);
    clearInterval(this.buyandsellInterval);
    clearInterval(this.userInterval);
    clearInterval(this.marketInterval);
    clearInterval(window.klineInterval);

    // 关闭websocket的连接
    this.marketWS && this.marketWS.close();
    this.streamWS && this.streamWS.close();
    this.buyandsellWS && this.buyandsellWS.close();
    this.userWS && this.userWS.close();
    window.klineWS && window.klineWS.close();
  }

  render() {
    const {
      market,
      favoriteCoins,
      tradeExpair,
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

    let pairList = [];
    let allTradeMarket = [];
    if (tradeExpair && Object.keys(tradeExpair).length > 0) {
      allTradeMarket = Object.keys(tradeExpair);
      allTradeMarket.push('optional');
      if (market === 'optional') {
        Object.keys(tradeExpair).forEach(market => {
          const coins = Object.keys(tradeExpair[market]).map((key, value) => {
            tradeExpair[market][key].key = key;
            return tradeExpair[market][key];
          });
          pairList = [...pairList, ...coins];
        });
        pairList = pairList.filter(coin => {
          return favoriteCoins.includes(coin.key);
        });
      } else {
        pairList = tradeExpair[market]
          ? Object.keys(tradeExpair[market]).map(key => {
              tradeExpair[market][key].key = key;
              return tradeExpair[market][key];
            })
          : [];
      }
    }

    if (searchValue) {
      pairList = pairList.filter(coin => {
        return coin.coinOther.indexOf(searchValue.toLocaleUpperCase()) !== -1;
      });
    }

    const { localization } = this.props;

    const orderColumns = [
      {
        title: localization['委托时间'],
        dataIndex: 'time',
        key: 'time',
        render: (text, record) => stampToDate(Number(text))
      },
      {
        title: localization['委托单号'],
        dataIndex: 'orderNo',
        key: 'orderNo'
      },
      {
        title: localization['委托类别'],
        dataIndex: 'exType',
        key: 'exType',
        render: (text, record) => {
          if (text === 0) {
            return <span className="font-color-green">{localization['买入']}</span>;
          } else {
            return <span className="font-color-red">{localization['卖出']}</span>;
          }
        }
      },
      {
        title: localization['委托价格'],
        dataIndex: 'price',
        key: 'price'
      },
      {
        title: `${localization['委托数量']}(${coinName}/${marketName})`,
        dataIndex: 'volume',
        key: 'volume'
      },
      {
        title: localization['委托金额'],
        dataIndex: 'amount',
        key: 'amount',
        render: (text, record) => (record.price * record.volume).toFixed(8)
      },
      {
        title: `${localization['成交量']}(${coinName}/${marketName})`,
        dataIndex: 'successVolume',
        key: 'successVolume',
        render: (text, record) => `${text}${record.status === 1 ? localization['部分成交'] : ''}`
      },
      {
        title: localization['状态/操作'],
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => {
          if (record.status === 2 || record.status === 3) {
            return (
              <Button type="primary" onClick={this.handleOrderDetail.bind(this, record.orderNo)}>
                {localization['详情']}
              </Button>
            );
          } else if (record.status === 0 || record.status === 1) {
            return (
              <Button type="primary" onClick={this.handleCancelTrade.bind(this, record.orderNo)}>
                {localization['撤单']}
              </Button>
            );
          } else {
            return '--';
          }
        }
      }
    ];

    let currentCoin = {
      latestPrice: 0,
      toCNY: 0,
      highestPrice: 0,
      lowerPrice: 0,
      dayCount: 0,
      change: 0,
      trend: 'green'
    };

    if (tradeExpair && tradeExpair[marketName] && Object.keys(tradeExpair[marketName]).length > 0) {
      Object.keys(tradeExpair[marketName]).forEach(key => {
        const coin = tradeExpair[marketName][key];
        if (coin.coinOther === coinName) {
          // 更新当前选中交易对数据

          const latestPrice = Number(coin.latestPrice) || 0; //最新价

          let toCNY = 0; //当前最新价的折合人民币
          const usdtToCnyRate = 6.5;
          switch (marketName) {
            case 'BTC':
              toCNY = latestPrice * btcLastPrice * usdtToCnyRate;
              break;
            case 'ETH':
              toCNY = latestPrice * ethLastPrice * usdtToCnyRate;
              break;
            default:
              toCNY = latestPrice * usdtToCnyRate;
          }

          const trend = coin.rise.indexOf('-') === -1 ? 'green' : 'red'; //涨跌

          currentCoin = {
            change: coin.rise,
            trend,
            toCNY,
            latestPrice,
            highestPrice: coin.highestPrice || 0,
            lowerPrice: coin.lowerPrice || 0,
            dayCount: coin.dayCount || 0
          };
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

    // const { localization } = this.props;

    const loading = (
      <div className="container-loading">
        <Spinners.ClipLoader color={'#d4a668'} size={35} />
      </div>
    );

    const emptyHandle = (
      <div className="empty-handle">
        <i className="iconfont icon-zanwushuju" />
        {localization['暂无数据']}
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
              <header className="trade-plate-header" style={{ height: 88 }}>
                <div className="market-tit">
                  {localization['市场']}
                  <div className="trade-plate-header-right" style={{ right: 0 }}>
                    <Search
                      value={searchValue}
                      onChange={this.handleSearch}
                      style={{ width: 100 }}
                    />
                  </div>
                </div>
                <ul className="market-tabs">
                  {allTradeMarket.map(marketName => {
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
                        {marketName === 'optional' ? localization['自选'] : marketName}
                      </li>
                    );
                  })}
                </ul>
              </header>
              <div className="trade-plate-tit cell-3">
                <div className="trade-plate-tit-cell">{localization['币种']}</div>
                <div className="trade-plate-tit-cell sorter">
                  {localization['最新价']}
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
                  {localization['涨跌幅']}
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
                  pairList.length > 0 ? (
                    <Scrollbars>
                      <table>
                        <tbody>
                          {pairList.map(coin => {
                            const trend =
                              coin.rise && coin.rise.indexOf('-') === 0 ? 'red' : 'green';
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
                                  <span className="coin-wrap">
                                    <i
                                      className={`iconfont icon-shoucang${
                                        favoriteCoins.includes(coin.key) ? '-active' : ''
                                      }`}
                                      onClick={this.handleCollect.bind(this, coin)}
                                    />
                                    {coin.coinOther}
                                    {market === 'optional' && `/${coin.coinMain}`}
                                  </span>
                                </td>
                                <td>{coin.latestPrice}</td>
                                <td className={`font-color-${trend}`}>{coin.rise}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Scrollbars>
                  ) : (
                    emptyHandle
                  )
                ) : (
                  loading
                )}
              </div>
            </div>
            <div className="trade-plate">
              <header className="trade-plate-header">
                <span className="trade-plate-header-text">{localization['最新成交']}</span>
              </header>
              <div className="trade-plate-tit cell-3">
                <div className="trade-plate-tit-cell">{localization['成交时间']}</div>
                <div className="trade-plate-tit-cell">{localization['成交价格']}</div>
                <div className="trade-plate-tit-cell">{localization['成交量']}</div>
              </div>
              <div className="trade-plate-container stream">
                {streamList ? (
                  streamList.length > 0 ? (
                    <Scrollbars>
                      <table>
                        <tbody>
                          {streamList.map((stream, index) => {
                            if (stream) {
                              const trend = stream.type == 0 ? 'green' : 'red';
                              return (
                                <tr key={stream.date + index} className={`font-color-${trend}`}>
                                  <td>{stampToDate(Number(stream.date), 'hh:mm:ss')}</td>
                                  <td>{Number(stream.price).toFixed(8)}</td>
                                  <td>{Number(stream.volume).toFixed(8)}</td>
                                </tr>
                              );
                            }
                          })}
                        </tbody>
                      </table>
                    </Scrollbars>
                  ) : (
                    emptyHandle
                  )
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
                    __html: `${Number(currentCoin.latestPrice).toFixed(8)} &asymp; ￥${Number(
                      currentCoin.toCNY
                    ).toFixed(8)}`
                  }}
                />
                <div className="trade-plate-header-right">
                  <Tooltip placement="rightTop" title={coinDetail}>
                    <Button type="normal" onMouseEnter={this.getCoinDetail.bind(this, coinName)}>
                      {localization['币种介绍']}
                    </Button>
                  </Tooltip>
                </div>
              </header>
              <div className="trade-plate-tit Kline">
                <div className="trade-plate-tit-cell">
                  {localization['最高价']}
                  <strong>{currentCoin.highestPrice}</strong>
                </div>
                <div className="trade-plate-tit-cell">
                  {localization['最低价']}
                  <strong>{currentCoin.lowerPrice}</strong>
                </div>
                <div className="trade-plate-tit-cell">
                  {localization['成交量']}
                  <strong>{currentCoin.dayCount}</strong>
                </div>
                <div className="trade-plate-tit-cell">
                  {localization['涨跌幅']}
                  <strong className={`font-color-${currentCoin.trend}`}>
                    {currentCoin.change}
                  </strong>
                </div>
              </div>
              <div className="trade-plate-container">
                {coinName && marketName && <Tradeview symbol={`${coinName}/${marketName}`} />}
              </div>
            </div>
            <div className="trade-plate">
              <Tabs defaultActiveKey="1">
                <TabPane tab={localization['限价交易']} key="1">
                  <TradeBox tradeType="limit" {...tradeProps} {...{ localization }} />
                </TabPane>
                {false && (
                  <TabPane tab={localization['市价交易']} key="2">
                    <TradeBox tradeType="market" {...tradeProps} {...{ localization }} />
                  </TabPane>
                )}
                {false && (
                  <TabPane
                    tab={
                      <span>
                        {localization['止盈止损']}
                        <Tooltip
                          placement="rightTop"
                          title={
                            localization['当市场价达到触发价时，将按计划设定的价格和数量进行下单']
                          }
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
                  {localization['合并']}
                  <Select
                    defaultValue="8"
                    style={{ width: 100 }}
                    dropdownClassName="merge-dropdown"
                    onChange={this.handleMerge}
                  >
                    <Option value="8">8{localization['位小数']}</Option>
                    <Option value="6">6{localization['位小数']}</Option>
                    <Option value="4">4{localization['位小数']}</Option>
                  </Select>
                </div>
              </header>
              {listType === -1 ? (
                <div className="trade-plate-tit list">
                  <div className="trade-plate-tit-cell">{localization['类型']}</div>
                  <div className="trade-plate-tit-cell">
                    {localization['价格']}({marketName})
                  </div>
                  <div className="trade-plate-tit-cell">
                    {localization['数量']}({coinName})
                  </div>
                  {false && (
                    <div className="trade-plate-tit-cell">
                      {localization['交易额']}({marketName})
                    </div>
                  )}
                </div>
              ) : (
                <div className="trade-plate-tit list">
                  <div className="trade-plate-tit-cell">{localization['类型']}</div>
                  <div className="trade-plate-tit-cell">
                    {listType === 0 ? localization['买入'] : localization['卖出']}{' '}
                    {localization['价']}({marketName})
                  </div>
                  <div className="trade-plate-tit-cell">
                    {localization['委单量']}({coinName})
                  </div>
                  {false && (
                    <div className="trade-plate-tit-cell">
                      {localization['交易额']}({marketName})
                    </div>
                  )}
                </div>
              )}
              {listType === -1 ? (
                <div className="trade-plate-list">
                  <div className="trade-plate-list-wrap">
                    {tradeList && tradeList.sellOrderVOList ? (
                      tradeList.sellOrderVOList.length > 0 ? (
                        <table>
                          <tbody>
                            {[...Array(15).fill({}), ...tradeList.sellOrderVOList].map(
                              (record, index, arr) => {
                                const visibleLength = arr.length < 15 ? arr.length : 15;
                                const startIndex = arr.length - visibleLength;
                                const isEmptyRecord = Object.keys(record).length <= 0;
                                return (
                                  index > startIndex - 1 && (
                                    <tr
                                      key={index}
                                      onClick={this.handleTradePrice.bind(
                                        this,
                                        record.price,
                                        'sell'
                                      )}
                                    >
                                      <td className="font-color-red">
                                        {localization['卖出']}
                                        {visibleLength - index + startIndex}
                                      </td>
                                      <td>
                                        {isEmptyRecord ? '----' : Number(record.price).toFixed(8)}
                                      </td>
                                      <td>
                                        {isEmptyRecord ? '----' : Number(record.volume).toFixed(8)}
                                      </td>
                                      {false && (
                                        <td className="font-color-red">
                                          {isEmptyRecord ? '----' : record.sumTotal}
                                        </td>
                                      )}
                                    </tr>
                                  )
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      ) : (
                        emptyHandle
                      )
                    ) : (
                      loading
                    )}
                  </div>
                  <div className="latest-price">
                    <span>
                      <i className="iconfont icon-xinhao font-color-green" />
                      {localization['最新价']}
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
                    {tradeList && tradeList.buyOrderVOList ? (
                      tradeList.buyOrderVOList.length > 0 ? (
                        <table>
                          <tbody>
                            {[...tradeList.buyOrderVOList, ...Array(15).fill({})].map(
                              (record, index) => {
                                const isEmptyRecord = Object.keys(record).length <= 0;
                                return (
                                  index < 15 && (
                                    <tr
                                      key={index}
                                      onClick={this.handleTradePrice.bind(
                                        this,
                                        record.price,
                                        'buy'
                                      )}
                                    >
                                      <td className="font-color-green">
                                        {localization['买入']}
                                        {index + 1}
                                      </td>
                                      <td>
                                        {isEmptyRecord ? '----' : Number(record.price).toFixed(8)}
                                      </td>
                                      <td>
                                        {isEmptyRecord ? '----' : Number(record.volume).toFixed(8)}
                                      </td>
                                      {false && (
                                        <td className="font-color-green">
                                          {isEmptyRecord ? '----' : record.sumTotal}
                                        </td>
                                      )}
                                    </tr>
                                  )
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      ) : (
                        emptyHandle
                      )
                    ) : (
                      loading
                    )}
                  </div>
                </div>
              ) : (
                <div className="trade-plate-list">
                  {tradeList && (tradeList.sellOrderVOList || tradeList.buyOrderVOList) ? (
                    (listType === 1 ? tradeList.sellOrderVOList : tradeList.buyOrderVOList).length >
                    0 ? (
                      <Scrollbars>
                        <table>
                          <tbody>
                            {(listType === 1
                              ? tradeList.sellOrderVOList
                              : tradeList.buyOrderVOList
                            ).map((record, index) => {
                              const colorName = listType === 0 ? 'green' : 'red';
                              const actionName =
                                listType === 0 ? localization['买入'] : localization['卖出'];
                              return (
                                <tr
                                  key={index}
                                  onClick={this.handleTradePrice.bind(this, record.price)}
                                >
                                  <td className={`font-color-${colorName}`}>
                                    {actionName}
                                    {index + 1}
                                  </td>
                                  <td>{Number(record.price).toFixed(8)}</td>
                                  <td>{Number(record.volume).toFixed(8)}</td>
                                  {false && (
                                    <td className={`font-color-${colorName}`}>{record.sumTotal}</td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </Scrollbars>
                    ) : (
                      emptyHandle
                    )
                  ) : (
                    loading
                  )}
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
                  this.findOrderList({
                    marketName,
                    coinName,
                    status
                  });
                }
                this.setState({ orderStatus: status });
              }}
            >
              <TabPane tab={localization['我的挂单']} key="0">
                <Scrollbars>
                  <Table
                    columns={orderColumns}
                    dataSource={pendingOrderList}
                    loading={!pendingOrderList}
                    pagination={false}
                    locale={{
                      emptyText: (
                        <span>
                          <i className="iconfont icon-zanwushuju" />
                          {localization['暂无数据']}
                        </span>
                      )
                    }}
                  />
                </Scrollbars>
              </TabPane>
              <TabPane tab={localization['成交历史']} key="1">
                <Scrollbars>
                  <Table
                    className="trade-history"
                    columns={orderColumns}
                    dataSource={completedOrderList}
                    loading={!completedOrderList}
                    pagination={false}
                    locale={{
                      emptyText: (
                        <span>
                          <i className="iconfont icon-zanwushuju" />
                          {localization['暂无数据']}
                        </span>
                      )
                    }}
                    expandedRowKeys={[historyExpendKey]}
                    expandedRowRender={record => {
                      return (
                        <div className="expend-content">
                          <List
                            size="small"
                            header={
                              <ul className="expent-title">
                                <li>{localization['时间']}</li>
                                <li>{localization['价格']}</li>
                                <li>{localization['数量']}</li>
                                <li>{localization['成交额']}</li>
                                <li>{localization['手续费']}</li>
                              </ul>
                            }
                            dataSource={historyDetails}
                            renderItem={item => (
                              <List.Item className="list-lis">
                                <ul className="list-item">
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
