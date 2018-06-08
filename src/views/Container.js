import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { LocaleProvider } from 'antd';
import { message } from 'antd';
import request from '../utils/request';

import logo from '../logo.svg';

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
    locale: {},
    localization: {}
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
          return response.json();
        }
      })
      .then(json => {
        this.setState({ localization: json });
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
    const { isLogin, language, locale, localization } = this.state;
    const {
      exchange,
      c2c,
      signin,
      signup,
      Market_risk,
      about_us,
      exchange_links,
      coin_apply,
      customer_support,
      service_agreement,
      privacy_statement,
      rate_standard,
      legal_notices,
      other,
      announcement_center,
      common_problem,
      currency_introduction,
      submit_order,
      contact_us,
      contact_email,
      friendship_links
    } = localization;
    return (
      <LocaleProvider locale={locale}>
        <div className="container">
          <header className="header">
            <Link className="logo" to="/">
              <img src={logo} alt="logo" width="60" height="60" />
            </Link>
            <ul className="nav-bar">
              <li>
                <Link to="/trade">{exchange}</Link>
              </li>
              <li>
                <Link to="/c2c">{c2c}</Link>
              </li>
            </ul>
            {!isLogin && (
              <div className="user-status">
                <i className="iconfont icon-yonghu" />
                <Link to="/signin">{signin}</Link>
                /
                <Link to="/signup">{signup}</Link>
              </div>
            )}
            {isLogin && (
              <div className="user-status">
                <div className="select-bar">
                  <i className="iconfont icon-yonghu" />
                  <i className="iconfont icon-jiantou_down" />
                  <span>用户中心</span>
                  <ul className="select-list">
                    <li>
                      <Link to="/user">用户中心</Link>
                    </li>
                    <li onClick={this.logout}>退出</li>
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
                  <img src={logo} alt="logo" width="60" height="60" />
                  <p>{Market_risk}</p>
                </div>
                <div className="footer-main-right">
                  <ul className="footer-nav clear">
                    <li>
                      <span>{about_us}</span>
                      <Link to="javascript:void(0)">{about_us}</Link>
                      <Link to="javascript:void(0)">{exchange_links}</Link>
                      <Link to="javascript:void(0)">{coin_apply}</Link>
                    </li>
                    <li>
                      <span>{customer_support}</span>
                      <Link to="javascript:void(0)">{service_agreement}</Link>
                      <Link to="javascript:void(0)">{privacy_statement}</Link>
                      <Link to="javascript:void(0)">{rate_standard}</Link>
                      <Link to="javascript:void(0)">{legal_notices}</Link>
                    </li>
                    <li>
                      <span>{other}</span>
                      <Link to="javascript:void(0)">{announcement_center}</Link>
                      <Link to="javascript:void(0)">{common_problem}</Link>
                      <Link to="javascript:void(0)">{currency_introduction}</Link>
                      <Link to="javascript:void(0)">{submit_order}</Link>
                    </li>
                  </ul>
                  <ul className="footer-contact">
                    <li>{contact_us}</li>
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
                      {contact_email}：<Link to="mailto: support@bbex.com">support@bbex.com</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="footer-link">
                {friendship_links}：
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
