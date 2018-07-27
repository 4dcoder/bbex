import React, { Component } from 'react';
import { Tabs, Input, Table, message } from 'antd';
import { Carousel } from 'react-responsive-carousel';
import classnames from 'classnames';
import NoticeBar from '../../components/notice-bar';
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
    searchValue: '',
    favoriteCoins: localStorage.getItem('favoriteCoins')
      ? JSON.parse(localStorage.getItem('favoriteCoins'))
      : []
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
    clearInterval(this.homeInterval);
    this.homeWS && this.homeWS.close();
  }

  // 主页homeSocket
  openHomeSocket = () => {
    this.homeWS = new ReconnectingWebSocket(`${WS_PREFIX}/home`);

    this.homeInterval = setInterval(() => {
      if (this.homeWS.readyState === 1) {
        this.homeWS.send('ping');
      }
    }, 1000 * 10);

    this.homeWS.onmessage = evt => {
      if (evt.data === 'pong') {
        return;
      }

      const { tradeExpair } = this.state;
      const updateExPair = JSON.parse(evt.data);
      Object.keys(updateExPair).forEach(key => {
        updateExPair[key].forEach(coin => {
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
    };
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
    this.setState({ tradeExpair: null });
    this.request('/index/allTradeExpair', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const tradeExpair = {};
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
    localStorage.setItem('favoriteCoins', JSON.stringify(favoriteCoins));
  };

  handleSort = (pagination, filters, sorter) => {
    console.log('Various parameters', pagination, filters, sorter);
    this.setState({
      sortedInfo: sorter
    });
  };

  handleGoToTrade = record => {
    localStorage.setItem('tradePair', `${record.coinOther}_${record.coinMain}`);
    this.props.history.push('/trade');
  };

  // 搜索币
  handleSearch = event => {
    this.setState({ searchValue: event.target.value });
  };

  render() {
    const { localization } = this.props;
    let { banners, market, sortedInfo, tradeExpair, searchValue, favoriteCoins } = this.state;
    sortedInfo = sortedInfo || {};

    let pairList = [];
    let allTradeMarket = [];
    if (tradeExpair && Object.keys(tradeExpair).length > 0) {
      allTradeMarket = Object.keys(tradeExpair);
      allTradeMarket.unshift('optional');
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
              'name-wrap': true
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
        title: `${localization['最新价']}${market !== 'optional' ? `(${market})` : ''}`,
        dataIndex: 'latestPrice',
        key: 'latestPrice',
        sorter: (a, b) => a.latestPrice - b.latestPrice,
        sortOrder: sortedInfo.columnKey === 'latestPrice' && sortedInfo.order
      },
      {
        title: localization['涨跌幅'],
        dataIndex: 'rise',
        key: 'rise',
        sorter: (a, b) =>
          Number(a.rise.substring(0, a.rise.length - 1)) -
          Number(b.rise.substring(0, b.rise.length - 1)),
        sortOrder: sortedInfo.columnKey === 'rise' && sortedInfo.order,
        render: text => (
          <span className={`font-color-${text.indexOf('-') !== -1 ? 'red' : 'green'}`}>{text}</span>
        )
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
        title: `${localization['成交量']}`,
        dataIndex: 'dayCount',
        key: 'dayCount',
        sorter: (a, b) => a.dayCount - b.dayCount,
        sortOrder: sortedInfo.columnKey === 'dayCount' && sortedInfo.order
      }
    ];

    return (
      <div className="content home">
        <Carousel autoPlay infiniteLoop showArrows={false} showStatus={false} showThumbs={false}>
          {banners.length > 0 &&
            banners.map(banner => {
              const props = {
                target: banner.link && '_blank'
              };
              return (
                <a key={banner.id} href={banner.link || `/link/${banner.id}`} {...props}>
                  <img key={banner.id} src={banner.image} />
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
                      dataSource={pairList}
                      onChange={this.handleSort}
                      onRow={record => ({
                        onClick: this.handleGoToTrade.bind(this, record)
                      })}
                      locale={{
                        emptyText: (
                          <span>
                            <i className="iconfont icon-zanwushuju" />
                            {localization['暂无数据']}
                          </span>
                        )
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
                <a href="https://po.im/#/home" target="_blank" rel="noopener noreferrer">
                  <img src={partner1} alt="" />
                </a>
              </li>
              <li>
                <a href="https://www.magicw.net/" target="_blank" rel="noopener noreferrer">
                  <img src={partner2} alt="" />
                </a>
              </li>
              <li>
                <a href="http://www.nodecap.com/" target="_blank" rel="noopener noreferrer">
                  <img src={partner3} alt="" />
                </a>
              </li>
              <li>
                <a href="https://www.chainnews.com/" target="_blank" rel="noopener noreferrer">
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
