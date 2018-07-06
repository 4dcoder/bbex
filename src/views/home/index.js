import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, Input, Table, message } from 'antd';
import { Carousel } from 'react-responsive-carousel';
import classnames from 'classnames';
import NoticeBar from '../../components/noticeBar';
import ReconnectingWebSocket from '../../utils/ReconnectingWebSocket';
import { WS_PREFIX } from '../../utils/constants';

import './carousel.css';
import './home.css';

import partner1 from '../../assets/images/partner/bixin.png';
import partner2 from '../../assets/images/partner/bi.png';
import partner3 from '../../assets/images/partner/nodecape.png';
import partner5 from '../../assets/images/partner/lianwen.png';

const TabPane = Tabs.TabPane;
const Search = Input.Search;

class Home extends Component {
  state = {
    banners: [],
    market: 'USDT',
    sortedInfo: null,
    tradeExpair: null,
    searchList: null,
    searchValue: '',
    favoriteCoins: sessionStorage.getItem('favoriteCoins')
      ? JSON.parse(sessionStorage.getItem('favoriteCoins'))
      : [],
    homeWS: null
  };

  request = window.request;

  componentWillMount() {
    this.getBanner();
    this.getTradeExpair();
  }

  componentDidMount() {
    this.openHomeSocket();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    const { homeWS } = this.state;
    homeWS && homeWS.close();
  }

  // 主页homeSocket
  openHomeSocket = () => {
    const homeWS = new ReconnectingWebSocket(`${WS_PREFIX}/home`);

    this.interval = setInterval(() => {
      if (homeWS.readyState === 1) {
        homeWS.send('ping');
      }
    }, 1000 * 5);

    homeWS.onopen = evt => {
      this.timer1 = new Date().getTime();
    };

    homeWS.onmessage = evt => {
      if (evt.data === 'pong') {
        return;
      }
      let current = new Date().getTime();

      if (current - this.timer1 > 1000) {
        this.timer1 = current;

        const markPair = JSON.parse(evt.data);
        const socketMarket = Object.keys(markPair)[0];

        markPair[socketMarket] = markPair[socketMarket].map(coin => {
          coin.key = `${coin.coinMain}.${coin.coinOther}`;
          coin.latestPrice = (coin.latestPrice || 0).toFixed(8);
          coin.highestPrice = (coin.highestPrice || 0).toFixed(8);
          coin.lowerPrice = (coin.lowerPrice || 0).toFixed(8);
          coin.dayCount = (coin.dayCount || 0).toFixed(8);
          return coin;
        });

        let { tradeExpair, searchList, searchValue } = this.state;

        if (searchValue) {
          searchList = markPair[socketMarket].filter(expair => {
            return expair.coinOther.indexOf(searchValue.toUpperCase()) > -1;
          });
          this.setState({ searchList });
        }
        tradeExpair[socketMarket] = markPair[socketMarket];

        this.setState({ tradeExpair });
      }
    };

    homeWS.onclose = evt => {
      // console.log('stream Websocket Connection closed.');
    };

    homeWS.onerror = evt => {
      // console.log(evt);
    };

    this.setState({ homeWS });
  };

  //获取banner图
  getBanner = () => {
    this.request('/cms/banner/list', {
      method: 'GET',
      body: {
        language: 'zh_CN'
      }
    }).then(json => {
      if (json.code === 10000000) {
        // /userfiles/1/_thumbs/images/cms/advert/2018/06/banner01.jpg
        let result = json.data.map(item => {
          let { image } = item;
          item.image = image.replace(/\/_thumbs/, '');
          return item;
        });
        this.setState({ banners: result });
      } else {
        message.error(json.msg);
      }
    });
  };

  // 市场币种列表
  getTradeExpair = () => {
    this.setState({ tradeExpair: {} });
    this.request('/index/allTradeExpair', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const tradeExpair = {};
        Object.keys(json.data).forEach(key => {
          tradeExpair[key] = json.data[key].map(coin => {
            coin.key = `${coin.coinMain}.${coin.coinOther}`;
            coin.latestPrice = (coin.latestPrice || 0).toFixed(8);
            coin.highestPrice = (coin.highestPrice || 0).toFixed(8);
            coin.lowerPrice = (coin.lowerPrice || 0).toFixed(8);
            coin.dayCount = (coin.dayCount || 0).toFixed(8);
            return coin;
          });
        });
        this.setState({ tradeExpair });
      } else {
        message.error(json.msg);
      }
    });
  };

  handleSwitchMarkets = market => {
    this.setState({ market, searchList: null, searchValue: '' });
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

  handleChange = (pagination, filters, sorter) => {
    console.log('Various parameters', pagination, filters, sorter);
    this.setState({
      sortedInfo: sorter
    });
  };

  handleGoToTrade = record => {
    sessionStorage.setItem(
      'tradePair',
      `${record.coinOther}_${record.coinMain}`
    );
    this.props.history.push('/trade');
  };

  // 搜索币
  handleSearch = event => {
    const { tradeExpair, market, favoriteCoins } = this.state;
    const searchValue = event.target.value;

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

  render() {
    const { localization } = this.props;
    let {
      banners,
      market,
      sortedInfo,
      tradeExpair,
      searchList,
      searchValue,
      favoriteCoins
    } = this.state;
    sortedInfo = sortedInfo || {};

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

    let allTradeMarket = [];
    if (tradeExpair) {
      allTradeMarket = Object.keys(tradeExpair);
      allTradeMarket.unshift('optional');
    }

    const columns = [
      {
        title: localization['币种'],
        dataIndex: 'coinOther',
        key: 'coinOther',
        sorter: (a, b) => a.coinOther.charCodeAt() - b.coinOther.charCodeAt(),
        sortOrder: sortedInfo.columnKey === 'coinOther' && sortedInfo.order,
        render: (text, record) => (
          <span
            className={classnames({
              'name-wrap': true,
              attention: true
            })}
          >
            <i
              className={`iconfont icon-shoucang${
                favoriteCoins.includes(record.key) ? '-active' : ''
              }`}
              onClick={this.handleCollect.bind(this, record)}
            />
            {text}/{record.coinMain}
          </span>
        )
      },
      {
        title: `${localization['最新价']}${
          market !== 'optional' ? `(${market})` : ''
        }`,
        dataIndex: 'latestPrice',
        key: 'latestPrice',
        sorter: (a, b) => a.price - b.price,
        sortOrder: sortedInfo.columnKey === 'price' && sortedInfo.order
      },
      {
        title: localization['涨跌幅'],
        dataIndex: 'change',
        key: 'change',
        sorter: (a, b) => a.change - b.change,
        sortOrder: sortedInfo.columnKey === 'change' && sortedInfo.order,
        render: (text, record) => {
          const { latestPrice, firstPrice } = record;
          const change = (latestPrice - firstPrice) / firstPrice || 0;
          return `${change.toFixed(2)}%`;
        }
      },
      {
        title: localization['最高价'],
        dataIndex: 'highestPrice',
        key: 'highestPrice'
      },
      {
        title: localization['最低价'],
        dataIndex: 'lowerPrice',
        key: 'lowerPrice'
      },
      {
        title: `${localization['成交额']}${
          market !== 'optional' ? `(${market})` : ''
        }`,
        dataIndex: 'dayCount',
        key: 'dayCount',
        sorter: (a, b) => a.total - b.total,
        sortOrder: sortedInfo.columnKey === 'total' && sortedInfo.order
      }
    ];

    return (
      <div className="content home">
        <Carousel
          autoPlay
          infiniteLoop
          showArrows={false}
          showStatus={false}
          showThumbs={false}
        >
          {banners.length > 0 &&
            banners.map(banner => {
              const props = {
                target: banner.link && '_blank'
              };
              return (
                <a key={banner.id} href={banner.link || banner.id} {...props}>
                  <img key={banner.id} src={banner.image} alt="" />
                </a>
              );
            })}
        </Carousel>
        <div className="content-inner">
          <NoticeBar {...{ localization }} />
        </div>
        <div className="content-inner">
          <div className="coins-market">
            <Tabs
              tabBarExtraContent={
                <Search
                  value={searchValue}
                  placeholder={localization['输入关键字']}
                  onChange={this.handleSearch}
                  style={{ width: 200 }}
                />
              }
              activeKey={market}
              onChange={this.handleSwitchMarkets}
            >
              {allTradeMarket &&
                allTradeMarket.map(curMarket => (
                  <TabPane
                    tab={
                      curMarket === 'optional' ? (
                        <span>
                          <i
                            className={`iconfont icon-shoucang${
                              market === 'optional' ? '-active' : ''
                            }`}
                          />
                          {localization['自选']}
                        </span>
                      ) : (
                        `${curMarket} ${localization['市场']}`
                      )
                    }
                    key={curMarket}
                  >
                    <Table
                      columns={columns}
                      dataSource={searchList ? searchList : pairList}
                      onChange={this.handleChange}
                      onRow={record => ({
                        onClick: this.handleGoToTrade.bind(this, record)
                      })}
                      locale={{
                        emptyText: localization['暂无数据']
                      }}
                      pagination={false}
                    />
                  </TabPane>
                ))}
            </Tabs>
          </div>
        </div>
        <div className="partner">
          <div className="partner-inner">
            <h2>-{localization['合作伙伴']}-</h2>
            <ul className="content-inner">
              <li>
                <a
                  href="https://po.im/#/home"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={partner1} alt="" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.magicw.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={partner2} alt="" />
                </a>
              </li>
              <li>
                <a
                  href="http://www.nodecap.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={partner3} alt="" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.chainnews.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={partner5} alt="" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
