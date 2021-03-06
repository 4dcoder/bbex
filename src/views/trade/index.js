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
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import Scrollbars from 'react-custom-scrollbars';
import { ClipLoader } from 'react-spinners';
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

    this.state = {
      market: '',
      tradeExpair: {},
      searchValue: '',
      marketName: '',
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
      ethLastPrice: 0,
      cnbBtcLastPrice: 0,
      cnbEthLastPrice: 0,
      sorter: {},
      pendingOrderTotal: 0,
      pendingCurrentPage: 1,
      completedOrderTotal: 0,
      completedCurrentPage: 1,
      showCount: 10
    };
  }

  request = window.request;

  // 获取USDT汇率
  getRate = () => {
    this.request('/index/lastPrice', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const { btcLastPrice, ethLastPrice, cnbBtcLastPrice, cnbEthLastPrice } = json.data;
        this.setState({ btcLastPrice, ethLastPrice, cnbBtcLastPrice, cnbEthLastPrice });
      } else {
        // message.error(json.msg);
      }
    });
  };

  // 订单列表，status = 0 是我的挂单， status = 1 是成交历史
  findOrderList = ({ status, currentPage }) => {
    if (status === 0) {
      this.setState({ pendingOrderList: null });
    } else {
      this.setState({ completedOrderList: null });
    }
    const { showCount, marketName, coinName } = this.state;
    const { id } = JSON.parse(sessionStorage.getItem('account'));
    this.request('/order/findOrderProposeList', {
      body: {
        status,
        userId: id,
        coinMain: marketName,
        coinOther: coinName,
        currentPage,
        showCount
      }
    }).then(json => {
      const orderType = status === 0 ? 'pending' : 'completed';
      if (json.code === 10000000) {
        const orderList = json.data.list.map(order => {
          order.key = order.orderNo;
          order.price = order.price.toFixed(8);
          order.volume = order.volume.toFixed(8);
          order.successVolume = order.successVolume.toFixed(8);
          return order;
        });

        this.setState({
          [`${orderType}OrderList`]: orderList || [],
          [`${orderType}OrderTotal`]: json.data.count,
          [`${orderType}CurrentPage`]: currentPage
        });
      } else {
        this.setState({ [`${orderType}OrderList`]: [] });
      }
    });
  };

  // 获取币种详情
  getCoinDetail = coinName => {
    const coinDetailMap = localStorage.getItem('coinDetailMap')
      ? JSON.parse(localStorage.getItem('coinDetailMap'))
      : {};

    if (coinDetailMap[coinName]) {
      this.setState({ coinDetail: coinDetailMap[coinName] });
    } else {
      this.request(`/coin/detail/${coinName}`, {
        method: 'GET'
      }).then(json => {
        if (json.code === 10000000) {
          this.setState({ coinDetail: json.data });
          coinDetailMap[coinName] = json.data;
          localStorage.setItem('coinDetailMap', JSON.stringify(coinDetailMap));
        }
      });
    }
  };

  // 撤单
  handleCancelTrade = orderNo => {
    const { orderStatus, pendingOrderList, pendingCurrentPage } = this.state;
    const currentPage = pendingOrderList.length === 1 ? pendingCurrentPage - 1 : pendingCurrentPage;
    this.request(`/trade/cancelTrade/${orderNo}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.findOrderList({
          status: orderStatus,
          currentPage: currentPage
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
    if (historyExpendKey !== orderNo) {
      this.getOrderDetail(orderNo);
      this.setState({ historyExpendKey: orderNo });
    } else {
      this.setState({ historyExpendKey: '' });
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

  // 市场websocket
  openMarketsocket = () => {
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
      if (tradeExpair) {
        Object.keys(updateExPair).forEach(key => {
          if (updateExPair[key]) {
            updateExPair[key].forEach(coin => {
              const expair = `${coin.coinOther}/${coin.coinMain}`;
              let rise = '0.00%';
              if (coin.firstPrice > 0) {
                rise = ((coin.latestPrice - coin.firstPrice) / coin.firstPrice) * 100;
                rise = rise.toFixed(2) + '%';
              }
              // console.log('rise', rise);
              if (tradeExpair[key][expair]) {
                tradeExpair[key][expair] = {
                  ...coin,
                  rise: rise,
                  latestPrice: (coin.latestPrice || 0).toFixed(8),
                  highestPrice: (coin.highestPrice || 0).toFixed(8),
                  lowerPrice: (coin.lowerPrice || 0).toFixed(8),
                  dayCount: (coin.dayCount || 0).toFixed(8)
                };
              }
            });
          }
        });

        this.setState({ tradeExpair });
      }
    };
  };

  // 交易流水websocket
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

      const {
        btcLastPrice,
        ethLastPrice,
        cnbBtcLastPrice,
        cnbEthLastPrice,
        matchStreamVO
      } = JSON.parse(evt.data);
      const { marketName, coinName, tradeList } = this.state;

      // 更新BTC兑USDT最新价
      if (btcLastPrice) this.setState({ btcLastPrice });

      // 更新ETH兑USDT最新价
      if (ethLastPrice) this.setState({ ethLastPrice });

      // 更新BTC兑人民币最新价
      if (cnbBtcLastPrice) this.setState({ cnbBtcLastPrice });

      // 更新ETH兑人民币最新价
      if (cnbEthLastPrice) this.setState({ cnbEthLastPrice });

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
              if (Number(tradeExpair[marketName][key].firstPrice) === 0) {
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

  // 买卖盘websocket
  openBuyAndSellWebsocket = () => {
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

    setTimeout(() => {
      if (Object.keys(this.state.tradeList).length === 0) {
        this.setState({ tradeList: { buyOrderVOList: [], sellOrderVOList: [] } });
      }
    }, 1000 * 5);

    this.buyandsellWS.onmessage = evt => {
      if (evt.data) {
        this.setState({ tradeList: JSON.parse(evt.data) });
      }
    };
  };

  // 用户资产socket
  openUserVolumeSocket = () => {
    const { id } = JSON.parse(sessionStorage.getItem('account'));
    this.userVolumeWS = new ReconnectingWebSocket(`${WS_PREFIX}/userVolume?${id}`);

    this.userVolumeInterval = setInterval(() => {
      if (this.userVolumeWS && this.userVolumeWS.readyState === 1) {
        const { marketName, coinName } = this.state;
        this.userVolumeWS.send(`${coinName}_${marketName}_${id}`);
      }
    }, 1000 * 3);

    this.userVolumeWS.onmessage = evt => {
      if (evt.data === 'pong') {
        return;
      }

      const { coinMainVolume, coinOtherVolume } = JSON.parse(evt.data);

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

  // 用户挂单websocket
  openUserOrderWebsocket = () => {
    const { id } = JSON.parse(sessionStorage.getItem('account'));
    this.userOrderWS = new ReconnectingWebSocket(`${WS_PREFIX}/userOrder?${id}`);

    this.userOrderInterval = setInterval(() => {
      if (this.userOrderWS && this.userOrderWS.readyState === 1) {
        this.userOrderWS.send(`ping`);
      }
    }, 1000 * 10);

    this.userOrderWS.onmessage = evt => {
      if (evt.data === 'pong') {
        return;
      }

      const { orderVo } = JSON.parse(evt.data);

      // 当推的数据是挂单，更新用户挂单列表
      if (orderVo) {
        let { pendingOrderList, pendingOrderTotal } = this.state;
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
          }

          this.setState({
            pendingOrderTotal: pendingOrderTotal + 1
          }); //更新我的挂单总数
        }

        this.setState({ pendingOrderList });
      }
    };
  };

  // 市场币种列表
  getTradeExpair = () => {
    this.setState({ tradeExpair: null });
    this.request('/index/allTradeExpair', {
      method: 'GET'
    })
      .then(json => {
        if (json.code === 10000000) {
          const tradeExpair = {};
          const tradePair = localStorage.getItem('tradePair');
          let [coinName, marketName] = tradePair ? tradePair.split('_') : ['', ''];
          if (Object.keys(json.data).length > 0) {
            marketName = Object.keys(json.data).some(key => key === marketName)
              ? marketName
              : Object.keys(json.data)[0]; //如果state市场在返回的数据市场列表中就作为当前市场，否则就是返回的第一个市场作为当前市场
            coinName = json.data[marketName].some(coin => coin.coinOther === coinName)
              ? coinName
              : json.data[marketName][0].coinOther; //如果state币种在返回的数据市场列表中就作为当前币种，否则就是返回的当前市场的第一个币种作为当前币种
            Object.keys(json.data).forEach(key => {
              tradeExpair[key] = {};
              json.data[key].forEach(coin => {
                const expair = `${coin.coinOther}/${coin.coinMain}`;
                tradeExpair[key][expair] = {
                  ...coin,
                  rise: coin.rise || '0.00%',
                  latestPrice: (coin.latestPrice || 0).toFixed(8),
                  highestPrice: (coin.highestPrice || 0).toFixed(8),
                  lowerPrice: (coin.lowerPrice || 0).toFixed(8),
                  dayCount: (coin.dayCount || 0).toFixed(8)
                };
              });
            });
          }

          this.setState({ market: marketName, marketName, coinName, tradeExpair });
        } else {
          this.setState({ tradeExpair: {} });
          message.error(json.msg);
        }
      })
      .catch(error => {
        this.setState({ tradeExpair: {} });
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
    })
      .then(json => {
        if (json.code === 10000000) {
          this.setState({ streamList: json.data || [] });
        } else {
          this.setState({ streamList: [] });
          message.error(json.msg);
        }
      })
      .catch(error => {
        this.setState({ streamList: [] });
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
    let newFavoriteCoins;
    if (favoriteCoins.includes(record.key)) {
      newFavoriteCoins = favoriteCoins.filter(key => key !== record.key);
    } else {
      newFavoriteCoins = [...favoriteCoins, record.key];
    }
    this.setState({ favoriteCoins: newFavoriteCoins });
    localStorage.setItem('favoriteCoins', JSON.stringify(newFavoriteCoins));
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
    if (tradePrice) {
      this.setState({ tradePrice: tradePrice + '_' + Math.random(), clickTradeType });
    }
  };

  // 币种根据key排序
  handleSort = key => {
    const { sorter } = this.state;
    const sortType = sorter[key] ? (sorter[key] === 'up' ? 'down' : 'up') : 'up';
    this.setState({
      sorter: { [key]: sortType }
    });
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
      this.openUserOrderWebsocket();
      this.openUserVolumeSocket();
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
      const { orderStatus, pendingCurrentPage } = this.state;

      // 如果已经登录，获取挂单列表
      if (sessionStorage.getItem('account')) {
        this.findOrderList({
          status: orderStatus,
          currentPage: pendingCurrentPage
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
    clearInterval(this.userOrderInterval);
    clearInterval(this.userVolumeInterval);
    clearInterval(this.marketInterval);
    clearInterval(window.klineInterval);

    // 关闭websocket的连接
    this.marketWS && this.marketWS.close();
    this.streamWS && this.streamWS.close();
    this.buyandsellWS && this.buyandsellWS.close();
    this.userOrderWS && this.userOrderWS.close();
    this.userVolumeWS && this.userVolumeWS.close();
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
      cnbBtcLastPrice,
      cnbEthLastPrice,
      tradePrice,
      clickTradeType,
      historyDetails,
      historyExpendKey,
      sorter,
      pendingOrderTotal,
      pendingCurrentPage,
      completedOrderTotal,
      completedCurrentPage,
      showCount,
      orderStatus
    } = this.state;

    console.log('pendingOrderTotal: ', pendingOrderTotal);
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

    // 根据搜索关键字筛选
    if (searchValue) {
      pairList = pairList.filter(coin => {
        return coin.coinOther.indexOf(searchValue.toLocaleUpperCase()) !== -1;
      });
    }

    // 根据选择的字段和排序方式排序
    if (Object.keys(sorter).length > 0) {
      let sorterKey, sorterType;
      Object.keys(sorter).forEach(key => {
        sorterKey = key;
        sorterType = sorter[key];
      });
      pairList = pairList.sort((a, b) => {
        const aKey = String(a[sorterKey]).replace('%', '') * 1;
        const bKey = String(b[sorterKey]).replace('%', '') * 1;
        if (sorterType === 'up') {
          return aKey - bKey;
        } else {
          return bKey - aKey;
        }
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
        render: (text, record) =>
          `${Number(text).toFixed(8)}(${record.status === 1 ? localization['部分成交'] : ''})`
      },
      {
        title: `${localization['状态']}/${localization['操作']}`,
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

    const tradeProps = {
      marketName,
      coinName,
      mainVolume,
      coinVolume,
      tradePrice,
      clickTradeType,
      pricePrecision: 8,
      volumePrecision: 4
    };

    if (tradeExpair && tradeExpair[marketName] && Object.keys(tradeExpair[marketName]).length > 0) {
      Object.keys(tradeExpair[marketName]).forEach(key => {
        const coin = tradeExpair[marketName][key];
        if (coin.coinOther === coinName) {
          // 更新当前选中交易对数据

          const latestPrice = Number(coin.latestPrice) || 0; //最新价

          let toCNY = 0; //当前最新价的折合人民币
          const usdtToCnyRate = 6.8;

          switch (marketName) {
            case 'BTC':
              toCNY =
                latestPrice * (cnbBtcLastPrice ? cnbBtcLastPrice : btcLastPrice * usdtToCnyRate);
              break;
            case 'ETH':
              toCNY =
                latestPrice * (cnbEthLastPrice ? cnbEthLastPrice : ethLastPrice * usdtToCnyRate);
              break;
            case 'CNB':
              toCNY = latestPrice;
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

          tradeProps.pricePrecision = coin.pricePrecision || 8;
          tradeProps.volumePrecision = coin.volumePrecision || 4;
        }
      });
    }

    const loading = (
      <div className="container-loading">
        <ClipLoader color={'#d4a668'} size={35} />
      </div>
    );

    const emptyHandle = (
      <div className="empty-handle">
        <i className="iconfont icon-zanwushuju" />
        {localization['暂无数据']}
      </div>
    );

    const isLogin = sessionStorage.getItem('account');

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
                        )}{' '}
                        {marketName === 'optional' ? localization['自选'] : marketName}
                      </li>
                    );
                  })}
                </ul>
              </header>
              <div className="trade-plate-tit cell-3">
                <div className="trade-plate-tit-cell">{localization['币种']}</div>
                <div
                  className="trade-plate-tit-cell sorter"
                  onClick={this.handleSort.bind(this, 'latestPrice')}
                >
                  {localization['最新价']}
                  <span
                    className={classnames({
                      'trade-plate-tit-sorter': true,
                      [sorter['latestPrice']]: sorter['latestPrice']
                    })}
                  >
                    <i className="anticon anticon-caret-up" title="↑" />
                    <i className="anticon anticon-caret-down" title="↓" />
                  </span>
                </div>
                <div
                  className="trade-plate-tit-cell sorter"
                  onClick={this.handleSort.bind(this, 'rise')}
                >
                  {localization['涨跌幅']}
                  <span
                    className={classnames({
                      'trade-plate-tit-sorter': true,
                      [sorter['rise']]: sorter['rise']
                    })}
                  >
                    <i className="anticon anticon-caret-up" title="↑" />
                    <i className="anticon anticon-caret-down" title="↓" />
                  </span>
                </div>
              </div>
              <div className="trade-plate-container market" style={{ height: 415 }}>
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
                            const trend = Number(stream.type) === 0 ? 'green' : 'red';
                            return (
                              <tr key={stream.date + index} className={`font-color-${trend}`}>
                                <td>{stampToDate(Number(stream.date), 'hh:mm:ss')}</td>
                                <td>{Number(stream.price).toFixed(8)}</td>
                                <td>{Number(stream.volume).toFixed(8)}</td>
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
                <span className="font-color-primary">
                  {coinName}/{marketName}
                  &nbsp;&nbsp;
                  {false && <Icon type="down" />}
                </span>
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
              <div className="trade-plate-container" style={{ height: 450 }}>
                {coinName && marketName && <Tradeview symbol={`${coinName}/${marketName}`} />}
                <div id="chartMask" className="chart-mask" />
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
                    style={{ width: 105 }}
                    dropdownClassName="merge-dropdown"
                    onChange={this.handleMerge}
                  >
                    <Option value="8">8 {localization['位小数']}</Option>
                    <Option value="6">6 {localization['位小数']}</Option>
                    <Option value="4">4 {localization['位小数']}</Option>
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
                                      className={classnames({ empty: isEmptyRecord })}
                                      onClick={this.handleTradePrice.bind(
                                        this,
                                        record.price,
                                        'sell'
                                      )}
                                    >
                                      <td className="font-color-red">
                                        {localization['卖出']} {visibleLength - index + startIndex}
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
                                      className={classnames({ empty: isEmptyRecord })}
                                      onClick={this.handleTradePrice.bind(
                                        this,
                                        record.price,
                                        'buy'
                                      )}
                                    >
                                      <td className="font-color-green">
                                        {localization['买入']} {index + 1}
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
                              ? tradeList.sellOrderVOList.reverse()
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
                                    {actionName} {index + 1}
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
        <div className="content-inner order-list">
          <div className="trade-plate">
            <Tabs
              defaultActiveKey="0"
              onChange={status => {
                if (sessionStorage.getItem('account')) {
                  const { pendingCurrentPage, completedCurrentPage } = this.state;
                  const currentPage = status === 0 ? pendingCurrentPage : completedCurrentPage;
                  this.findOrderList({
                    status,
                    currentPage
                  });
                }
                this.setState({ orderStatus: status });
              }}
            >
              <TabPane tab={localization['我的挂单']} key="0">
                <Table
                  columns={orderColumns}
                  dataSource={pendingOrderList}
                  loading={!pendingOrderList}
                  locale={{
                    emptyText: isLogin ? (
                      <span>
                        <i className="iconfont icon-zanwushuju" />
                        {localization['暂无数据']}
                      </span>
                    ) : (
                      <span>
                        <Link to="/signin">{localization['登录']}</Link> {localization['进行查看']}
                      </span>
                    )
                  }}
                  pagination={{
                    defaultCurrent: 1,
                    total: pendingOrderTotal,
                    current: pendingCurrentPage,
                    pageSize: showCount,
                    onChange: page => {
                      this.findOrderList({
                        status: orderStatus,
                        currentPage: page
                      });
                    }
                  }}
                />
              </TabPane>
              <TabPane tab={localization['成交历史']} key="1">
                <Table
                  className="trade-history"
                  columns={orderColumns}
                  dataSource={completedOrderList}
                  loading={!completedOrderList}
                  locale={{
                    emptyText: isLogin ? (
                      <span>
                        <i className="iconfont icon-zanwushuju" />
                        {localization['暂无数据']}
                      </span>
                    ) : (
                      <span>
                        <Link to="/signin">{localization['登录']}</Link> {localization['进行查看']}
                      </span>
                    )
                  }}
                  pagination={{
                    defaultCurrent: 1,
                    total: completedOrderTotal,
                    current: completedCurrentPage,
                    pageSize: showCount,
                    onChange: page => {
                      this.findOrderList({
                        status: orderStatus,
                        currentPage: page
                      });
                    }
                  }}
                  expandedRowKeys={[historyExpendKey]}
                  expandedRowRender={record => {
                    return (
                      <div className="expend-content">
                        <List
                          size="small"
                          header={
                            <ul className="expent-title">
                              <li>{localization['成交时间']}</li>
                              <li>{localization['成交价格']}</li>
                              <li>{localization['成交数量']}</li>
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
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
}

export default Trade;
