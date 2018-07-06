import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, message } from 'antd';
import GraphicPopup from '../../components/graphic-popup';
import { getQueryString } from '../../utils';
import { JSEncrypt } from '../../utils/jsencrypt.js';
import { PUBLI_KEY } from '../../utils/constants';

class SignUp extends Component {
  state = {
    registerType: 2,
    mail: '',
    password: '',
    repassword: '',
    vaildCode: '',
    inviteCode: getQueryString('inviteCode'),
    agree: false,
    graphicCode: '',
    errorTip: '',
    popup: false,
    count: 60
  };

  request = window.request;

  inputValue = e => {
    this.setState({ [e.target.id]: e.target.value });
    if (e.target.id === 'mail' && e.target.value) {
      this.setState({ errorTip: '' });
    }
  };
  //获取服务条款
  getService = () => {
    this.request('/cms/service', {
      method: 'GET',
      body: {
        language: 'zh_CN'
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.props.history.push('/agreement');
      } else {
        message.error(json.msg);
      }
    });
  };

  closePopup = () => {
    this.setState({ popup: false });
  };

  countDown = () => {
    let t = setInterval(() => {
      if (this.state.count > 0) {
        this.setState({ count: this.state.count - 1 });
      } else {
        this.setState({ count: 60 });
        clearInterval(t);
      }
    }, 1000);
  };

  getValidCode = () => {
    const { mail, count } = this.state;
    if (mail) {
      if (count == 60) {
        this.setState({
          popup: (
            <GraphicPopup
              mail={this.state.mail}
              type="register"
              cancelHandle={this.closePopup}
              confirmHandle={this.countDown}
            />
          )
        });
      }
    } else {
      this.setState({ errorTip: '请输入邮箱' });
    }
  };

  submit = () => {
    const { registerType, mail, password, repassword, vaildCode, inviteCode } = this.state;

    if (password === repassword) {
      let encrypt = new JSEncrypt();
      encrypt.setPublicKey(PUBLI_KEY);
      const enPassword = encrypt.encrypt(password);

      this.request('/user/register', {
        body: {
          registerType,
          mail: mail,
          password: enPassword,
          code: vaildCode,
          inviteCode
        }
      }).then(json => {
        if (json.code === 10000000) {
          message.success('恭喜你，注册成功！');
          this.props.history.push('/signin');
        } else {
          message.error(json.msg);
        }
      });
    } else {
      message.destroy();
      message.warn('密码不一致', 1);
    }
  };

  render() {
    const {
      mail,
      password,
      repassword,
      vaildCode,
      inviteCode,
      errorTip,
      agree,
      popup,
      count
    } = this.state;
    const ok = mail && password && repassword && vaildCode && agree;
    return (
      <div className="content">
        <div className="form-box">
          <h1>用户注册</h1>
          <p className="error-tip">
            {errorTip && <i className="iconfont icon-zhuyishixiang" />}
            {errorTip}
          </p>
          <ul className="form-list">
            <li>
              <i className="iconfont icon-youxiang" />
              <input
                type="email"
                className="text"
                id="mail"
                value={mail}
                onChange={this.inputValue}
                placeholder="邮箱"
              />
            </li>
            <li>
              <i className="iconfont icon-suo" />
              <input
                type="password"
                className="text"
                id="password"
                value={password}
                onChange={this.inputValue}
                placeholder="密码"
              />
            </li>
            <li>
              <i className="iconfont icon-suo" />
              <input
                type="password"
                className="text"
                id="repassword"
                value={repassword}
                onChange={this.inputValue}
                placeholder="确认密码"
              />
            </li>
            <li>
              <i className="iconfont icon-yanzhengma2" />
              <input
                type="text"
                className="text"
                id="vaildCode"
                value={vaildCode}
                onChange={this.inputValue}
                placeholder="邮箱验证码"
              />
              <button className="inner-button" onClick={this.getValidCode}>
                {count > 59 ? '获取验证码' : `${count}秒`}
              </button>
            </li>
            <li>
              <i className="iconfont icon-yaoqingma" />
              <input
                type="text"
                className="text"
                id="inviteCode"
                value={inviteCode}
                onChange={this.inputValue}
                disabled={inviteCode}
                placeholder="邀请码（选填）"
              />
            </li>
            <li>
              <input
                type="checkbox"
                className="checkbox"
                id="agree"
                checked={agree}
                onChange={() => {
                  this.setState({ agree: !agree });
                }}
              />
              <label htmlFor="agree">
                我已阅读并同意<Link to="/agreement" target="_blank">
                  {' '}
                  服务条款
                </Link>
              </label>
            </li>
            <li>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                disabled={!ok}
                onClick={this.submit}
                className="button"
              >
                注册
              </Button>
            </li>
            <li className="clear">
              <span className="pull-right">
                已经注册？<Link to="/signin">登录账号</Link>
              </span>
            </li>
          </ul>
          {popup}
        </div>
      </div>
    );
  }
}

export default SignUp;
