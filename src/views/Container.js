import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { LocaleProvider } from 'antd';
import { message } from 'antd';
import request from '../utils/request';

import logo from '../Artboard 4.png';

class Container extends Component {
  constructor(props, context) {
    super(props, context);
    window.request = (url, options) => {
      return new Promise((resolve, reject) => {
        props.request(url, options).then(json => {
          if (json.code === -5) {
            //登录失效
            this.setState({ isLogin: false });
            sessionStorage.clear();
            props.history.push('/signin');
          } else {
            resolve(json);
          }
        });
      });
    };
  }

  state = {
    isLogin: false,
    language: {
      value: 'zh_CN',
      name: '中文'
    },
    locale: {}
  };

  componentWillMount() {
    this.getLanguage(this.state.language);
  }

  switchLanguage(language) {
    this.getLanguage(language);
    this.setState({ language });
  }

  getLanguage(language) {
    fetch(`/language/${language.value}.json`, {
      method: 'GET'
    })
      .then(response => {
        if (response.status === 200) {
          return response;
        }
      })
      .then(json => {
        this.props.onGetLocalization(json);
      });

    //获取antd语言包
    (async () => {
      const locale = await import(`antd/lib/locale-provider/${language.value}`);
      this.setState({ locale });
    })();
  }

  componentDidMount() {
    const isLogin = !!sessionStorage.getItem('account');
    this.setState({ isLogin }); //判断登录状态
  }

  componentWillUpdate() {
    const isLogin = !!sessionStorage.getItem('account');
    if (isLogin !== this.state.isLogin) {
      this.setState({ isLogin }); //切换登录状态
    }
  }

  logout = () => {
    request('/user/logout').then(json => {
      if (json.code === 10000000) {
        sessionStorage.removeItem('account');
        this.props.history.push('/signin');
      } else {
        message.error(json.msg);
      }
    });
  };

  render() {
    const { localization } = this.props;
    const { isLogin, language, locale } = this.state;
    return (
      <LocaleProvider locale={locale}>
        <div className="container">
          <header className="header">
            <Link className="logo" to="/">
              <img src={logo} alt="logo" width="108" height="68" />
            </Link>
            <ul className="nav-bar">
              <li>
                <Link to="/trade">{localization['exchange']}</Link>
              </li>
              <li>
                <Link to="/c2c">{localization['c2c']}</Link>
              </li>
            </ul>
            {!isLogin && (
              <div className="user-status">
                <i className="iconfont icon-yonghu" />
                <Link to="/signin">{localization['signin']}</Link>
                /
                <Link to="/signup">{localization['signup']}</Link>
              </div>
            )}
            {isLogin && (
              <div className="user-status">
                <div className="select-bar">
                  <i className="iconfont icon-yonghu" />
                  <i className="iconfont icon-jiantou_down" />
                  <span>{localization['user_center']}</span>
                  <ul className="select-list">
                    <li>
                      <Link to="/user">{localization['user_center']}</Link>
                    </li>
                    <li onClick={this.logout}>{localization['signout']}</li>
                  </ul>
                </div>
              </div>
            )}
            <div className="select-bar language">
              <i className="iconfont icon-diqiu" />
              <i className="iconfont icon-jiantou_down" />
              <span>{language.name}</span>
              <ul className="select-list">
                {[{ name: '中文', value: 'zh_CN' }, { name: 'English', value: 'en_US' }].map(
                  language => {
                    return (
                      <li key={language.value} onClick={this.switchLanguage.bind(this, language)}>
                        {language.name}
                      </li>
                    );
                  }
                )}
              </ul>
            </div>
          </header>

          {this.props.children}

          <footer className="footer">
            <div className="footer-container">
              <div className="footer-main clear">
                <div className="footer-logo">
                  <img src={logo} alt="logo" width="108" height="68" />
                  <p>{localization['Market_risk']}</p>
                </div>
                <div className="footer-main-right">
                  <ul className="footer-nav clear">
                    <li>
                      <span>{localization['about_us']}</span>
                      <Link to="javascript:void(0)">{localization['about_us']}</Link>
                      <Link to="javascript:void(0)">{localization['exchange_links']}</Link>
                      <Link to="javascript:void(0)">{localization['coin_apply']}</Link>
                    </li>
                    <li>
                      <span>{localization['customer_support']}</span>
                      <Link to="javascript:void(0)">{localization['service_agreement']}</Link>
                      <Link to="javascript:void(0)">{localization['privacy_statement']}</Link>
                      <Link to="javascript:void(0)">{localization['rate_standard']}</Link>
                      <Link to="javascript:void(0)">{localization['legal_notices']}</Link>
                    </li>
                    <li>
                      <span>{localization['other']}</span>
                      <Link to="javascript:void(0)">{localization['announcement_center']}</Link>
                      <Link to="javascript:void(0)">{localization['common_problem']}</Link>
                      <Link to="javascript:void(0)">{localization['currency_introduction']}</Link>
                      <Link to="javascript:void(0)">{localization['submit_order']}</Link>
                    </li>
                  </ul>
                  <ul className="footer-contact">
                    <li>{localization['contact_us']}</li>
                    <li>
                      <Link to="javascript:void(0)" target="_blank" rel="noopener noreferrer">
                        <i className="iconfont icon-weixin" />
                      </Link>
                      <Link to="javascript:void(0)" target="_blank" rel="noopener noreferrer">
                        <i className="iconfont icon-weibo" />
                      </Link>
                      <Link to="javascript:void(0)" target="_blank" rel="noopener noreferrer">
                        <i className="iconfont icon-qq" />
                      </Link>
                    </li>
                    <li>
                      {localization['contact_email']}：<Link to="mailto: support@bbex.com">support@bbex.com</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="footer-link">
                {localization['friendship_links']}：
                <Link to="https://www.coinmarketcap.com" target="_blank" rel="noopener noreferrer">
                  coinmarketcap
                </Link>
                <Link to="https://www.bitcointalk.org" target="_blank" rel="noopener noreferrer">
                  BitcoinTalk
                </Link>
                <Link to="https://www.coindesk.com" target="_blank" rel="noopener noreferrer">
                  coindesk
                </Link>
                <Link to="https://www.btc123.com" target="_blank" rel="noopener noreferrer">
                  btc123
                </Link>
                <Link
                  to="https://tradeblock.com/ethereum"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  tradeblock
                </Link>
                <Link to="https://www.bitcoin.org" target="_blank" rel="noopener noreferrer">
                  bitcoin.org
                </Link>
                <Link to="https://pool.btc.com" target="_blank" rel="noopener noreferrer">
                  BTC.com矿池
                </Link>
              </div>
              <div className="footer-copyright">Copyright 2018 All Rights Reserved.</div>
            </div>
          </footer>
        </div>
      </LocaleProvider>
    );
  }
}

export default withRouter(Container);
