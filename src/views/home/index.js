import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, Input, Table, message } from 'antd';
import { Carousel } from 'react-responsive-carousel';
import classnames from 'classnames';
import NoticeBar from '../../components/noticeBar';

import './carousel.css';
import './home.css';

import partner1 from '../../assets/images/partner/bixin.png';
import partner2 from '../../assets/images/partner/bi.png';
import partner3 from '../../assets/images/partner/nodecape.png';
import partner4 from '../../assets/images/partner/lians.png';
import partner5 from '../../assets/images/partner/lianwen.png';
import partner6 from '../../assets/images/partner/Jlab.png';
import { Object } from 'core-js';

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
      : []
  };

  request = window.request;

  componentWillMount() {
    this.getBanner();
    this.getTradeExpair();
  }

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

  jumpToTrade = record => {
    sessionStorage.setItem('tradePair', `${record.coinOther}_${record.coinMain}`);
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
          coins = coins.filter(coin =>
            favoriteCoins.includes(coin.key)
          );
          pairList = [...pairList, ...coins];
        });
      } else {
        pairList = tradeExpair[market] || [];
      }
    }

    const columns = [
      {
        title: localization['coin'],
        dataIndex: 'coinOther',
        key: 'coinOther',
        sorter: (a, b) => a.coin.length - b.coin.length,
        sortOrder: sortedInfo.columnKey === 'coin' && sortedInfo.order,
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
            {text}
          </span>
        )
      },
      {
        title: `${localization['latest_price']}${market !== 'optional' ? `(${market})` : ''}`,
        dataIndex: 'latestPrice',
        key: 'latestPrice',
        sorter: (a, b) => a.price - b.price,
        sortOrder: sortedInfo.columnKey === 'price' && sortedInfo.order
      },
      {
        title: localization['change'],
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
        title: localization['high'],
        dataIndex: 'highestPrice',
        key: 'highestPrice'
      },
      {
        title: localization['low'],
        dataIndex: 'lowerPrice',
        key: 'lowerPrice'
      },
      {
        title: `${localization['volume']}${market !== 'optional' ? `(${market})` : ''}`,
        dataIndex: 'dayCount',
        key: 'dayCount',
        sorter: (a, b) => a.total - b.total,
        sortOrder: sortedInfo.columnKey === 'total' && sortedInfo.order
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
                <Link key={banner.id} to={banner.link || banner.id} {...props}>
                  <img key={banner.id} src={banner.image} alt="" />
                </Link>
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
                  placeholder={localization['enter_keywords']}
                  onChange={this.handleSearch}
                  style={{ width: 200 }}
                />
              }
              activeKey={market}
              onChange={this.handleSwitchMarkets}
            >
              {['optional', 'USDT', 'ETH', 'BTC'].map(curMarket => (
                <TabPane
                  tab={
                    curMarket === 'optional' ? (
                      <span>
                        <i
                          className={`iconfont icon-shoucang${
                            market === 'optional' ? '-active' : ''
                          }`}
                        />
                        {localization['favorites']}
                      </span>
                    ) : (
                      `${curMarket} ${localization['markets']}`
                    )
                  }
                  key={curMarket}
                >
                  <Table
                    columns={columns}
                    dataSource={searchList ? searchList : pairList}
                    onChange={this.handleChange}
                    onRow={record => ({
                      onClick: this.jumpToTrade.bind(this, record)
                    })}
                    pagination={false}
                  />
                </TabPane>
              ))}
            </Tabs>
          </div>
        </div>
        <div className="partner">
          <div className="partner-inner">
            <h2>-{localization['partner']}-</h2>
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
                <a href="http://chainup.com/" target="_blank" rel="noopener noreferrer">
                  <img src={partner4} alt="" />
                </a>
              </li>
              <li>
                <a href="https://www.chainnews.com/" target="_blank" rel="noopener noreferrer">
                  <img src={partner5} alt="" />
                </a>
              </li>
              <li>
                <a href="javascript:;" target="_blank" rel="noopener noreferrer">
                  <img src={partner6} alt="" />
                </a>
              </li>
              <li />
              <li />
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
