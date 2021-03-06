import React, { Component } from 'react';
import { withRouter, Link, NavLink } from 'react-router-dom';
import { message } from 'antd';
import request from '../utils/request';
import Verification from '../components/verification';
import GooglePopup from '../components/google-popup';
import ClipboardJS from 'clipboard';
import classnames from 'classnames';

// 设置全局消息
message.config({
  top: 200,
  maxCount: 1,
  duration: 1
});

class Container extends Component {
  constructor(props, context) {
    super(props, context);

    this.request = window.request = (url, options) => {
      return new Promise((resolve, reject) => {
        request(url, options)
          .then(json => {
            if (json.code === -5 || json.code === -8) {
              //登录失效
              sessionStorage.clear();
              props.history.push('/signin');
              const msg = json.code === -5 ? '用户登录失效' : '用户被挤出';
              message.error(msg);
              reject(msg);
            } else if (json.code === -9) {
              const { googleAuth } = JSON.parse(sessionStorage.getItem('account'));
              if (googleAuth) {
                // 如果已经谷歌绑定了，去输入谷歌验证码
                this.setState({
                  popup: (
                    <GooglePopup cancelHandle={this.closePopup} confirmHandle={this.closePopup} />
                  )
                });
              } else {
                // 去绑定谷歌验证
                this.setState({
                  popup: (
                    <Verification
                      closeModal={() => {
                        this.closePopup();
                      }}
                      gotoSetting={() => {
                        this.closePopup();
                        this.props.history.push('/user/security');
                      }}
                    />
                  )
                });
              }
              reject('谷歌验证');
            } else {
              resolve(json);
            }
          })
          .catch(error => {
            console.log(error);
            reject(error);
          });
      });
    };
  }

  state = {
    language: {
      value: 'zh_CN',
      name: '中文'
    },
    logo: '',
    googleCode: '',
    popup: false,
    introduces: [],
    platLinks: [],
    friendship: []
  };

  closePopup = () => {
    this.setState({ popup: false });
  };

  // 获取link列表
  getIntroduce = () => {
    this.request('/cms/introduce/list', {
      body: {
        language: 'zh_CN'
      },
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ introduces: json.data.list });
      } else {
        message.warn(json.msg);
      }
    });
  };

  // 联系我们接口
  getPlatLinks = () => {
    this.request('/index/platLinks', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ platLinks: json.data });
      }
    });
  };

  switchLanguage(language) {
    this.getLanguage(language);
    window.zE && window.zE.setLocale && window.zE.setLocale(language.value);
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
        this.props.onGetLocalization(json);
      });
  }

  // 退出
  logout = () => {
    sessionStorage.removeItem('account');
    request('/user/logout').then(json => {
      if (json.code === 10000000) {
        this.props.history.push('/signin');
      } else {
        message.error(json.msg);
      }
    });
  };

  // 获取logo
  getLogo = () => {
    if (process.env.NODE_ENV === 'production') {
      //线上加载相应平台logo
      request('/cms/logo', {
        method: 'GET'
      }).then(json => {
        if (json.code === 10000000) {
          this.setState({ logo: json.data });
        } else {
          message.destroy();
          message.error(json.msg);
        }
      });
    } else {
      //本地开发载入react logo
      import('../logo.svg').then(logo => {
        this.setState({ logo });
      });
    }
  };

  //获取友情链接
  getFriendship = () => {
    request('/cms/link/list', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ friendship: json.data });
      } else {
        message.destroy();
        message.error(json.msg);
      }
    });
  };

  componentWillMount() {
    this.getLanguage(this.state.language);
    this.getLogo();
    this.getIntroduce();
    this.getPlatLinks();
    this.getFriendship();

    // 如果有移动端viewport mate就删除
    const viewport = document.getElementById('viewport');
    if (viewport) {
      document.head.removeChild(viewport);
    }

    // copy 插件设置
    const clipboard = new ClipboardJS('.copy-btn');
    clipboard.on('success', function(e) {
      message.success('复制成功！');
    });
    clipboard.on('error', function(e) {
      message.success('您的浏览器版本较低，请升级浏览器或者使用chrome和firefox等浏览器重试！');
    });
  }

  render() {
    const { localization } = this.props;
    const { language, logo, popup, introduces, platLinks, friendship } = this.state;

    const account = sessionStorage.getItem('account')
      ? JSON.parse(sessionStorage.getItem('account'))
      : null;

    let mailLink = '',
      mailItem = [];
    if (platLinks && platLinks.length > 0) {
      mailItem = platLinks.filter(item => {
        return item.typeId === 'link_mail';
      });
      if (mailItem.length > 0) {
        mailLink = mailItem[0].linkUrl;
      }
    }

    const { pathname } = this.props.history.location;
    const copywriting =
      pathname.indexOf('/link/') > -1 ||
      pathname.indexOf('/agreement') > -1 ||
      pathname.indexOf('/help/') > -1 ||
      pathname.indexOf('/notice/') > -1;

    return (
      <div
        className={classnames({
          container: true,
          copywriting: copywriting
        })}
      >
        <header className="header">
          <Link className="logo" to="/">
            <img src={logo} alt="logo" width="108" height="68" />
          </Link>
          <ul className="nav-bar">
            <li>
              <NavLink to="/trade" activeClassName="active">
                {localization['交易中心']}
              </NavLink>
            </li>
            <li>
              <NavLink to="/c2c" activeClassName="active">
                {localization['C2C 交易']}
              </NavLink>
            </li>
            <li>
              <NavLink to="/notice" activeClassName="active">
                {localization['公告中心']}
              </NavLink>
            </li>
            <li>
              <NavLink to="/help" activeClassName="active">
                {localization['帮助中心']}
              </NavLink>
            </li>
          </ul>
          {!account && (
            <div className="user-status">
              <i className="iconfont icon-yonghu" />
              <Link to="/signin">{localization['登录']}</Link>/
              <Link to="/signup">{localization['注册']}</Link>
            </div>
          )}
          {account && (
            <div className="user-status">
              <div className="select-bar">
                <i className="iconfont icon-yonghu" />
                <i className="iconfont icon-jiantou_down" />
                <span>{account.mail ? account.mail : account.mobile}</span>
                <ul className="select-list">
                  <li>
                    <Link to="/user">{localization['用户中心']}</Link>
                  </li>
                  <li onClick={this.logout}>{localization['退出']}</li>
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
                <p>{localization['市场有风险 投资需谨慎']}</p>
              </div>
              <div className="footer-main-right">
                <div className="footer-nav clear">
                  {introduces &&
                    introduces.map((item, index) => {
                      if (item.link) {
                        return (
                          <a key={index} href={item.link} target="_blank">
                            {item.title}
                          </a>
                        );
                      } else {
                        return (
                          <Link
                            key={index}
                            to={{
                              pathname: `/link/${item.id}`
                            }}
                            target="_blank"
                            data-id={item.id}
                          >
                            {item.title}
                          </Link>
                        );
                      }
                    })}
                </div>
                <ul className="footer-contact">
                  <li>{localization['联系我们']}</li>
                  <li>
                    {platLinks &&
                      platLinks.map((item, index) => {
                        if (item.typeId === 'link_weixin') {
                          return (
                            <span key={index} className="wexin-content">
                              <i className="iconfont icon-weixin" />
                              <img src={item.linkImage} alt="微信公众号" />
                            </span>
                          );
                        } else if (item.typeId === 'link_qq') {
                          return (
                            <a
                              href={`tencent://message/?Site=baidu.com&uin=${
                                item.linkUrl
                              }&Menu=yes`}
                              key={index}
                            >
                              <i className={`iconfont icon-${item.typeId.split('_')[1]}`} />
                            </a>
                          );
                        } else if (item.typeId === 'link_mail') {
                          return '';
                        } else {
                          return (
                            <a href={`${item.linkUrl}`} key={index} target="_blank">
                              <i className={`iconfont icon-${item.typeId.split('_')[1]}`} />
                            </a>
                          );
                        }
                      })}
                  </li>
                  <li>
                    {localization['联系邮箱']}：<a href={`mailto:${mailLink}`}>{mailLink}</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="footer-link">
              {localization['友情链接']}：
              {friendship &&
                friendship.map((item, index) => {
                  return (
                    <a key={index} href={item.href} target="_blank">
                      {item.title}
                    </a>
                  );
                })}
            </div>
            <div className="footer-copyright">Copyright 2018 All Rights Reserved.</div>
          </div>
        </footer>
        {popup}
      </div>
    );
  }
}

export default withRouter(Container);
