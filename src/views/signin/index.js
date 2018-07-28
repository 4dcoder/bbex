import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import { IMAGES_ADDRESS } from '../../utils/constants';
import classnames from 'classnames';
import { JSEncrypt } from '../../utils/jsencrypt.js';
import { PUBLI_KEY } from '../../utils/constants';

class SignIn extends Component {
  state = {
    username: '',
    password: '',
    imgName: '',
    errorTip: '',
    code: '',
    url: ''
  };

  request = window.request;

  inputValue = e => {
    this.setState({ [e.target.id]: e.target.value });
  };

  handleSubmit = () => {
    const { localization } = this.props;
    const { username, password, code } = this.state;
    let encrypt = new JSEncrypt();
    encrypt.setPublicKey(PUBLI_KEY);
    let enPassword = encrypt.encrypt(password);

    if (username && password) {
      this.request('/user/login', {
        body: {
          username,
          password: enPassword,
          code
        }
      }).then(json => {
        if (json.code === 10000000) {
          sessionStorage.setItem('account', JSON.stringify(json.data));
          this.props.history.push('/trade');
        } else if (json.code === 10001001) {
          this.getValidImg();
          this.setState({ errorTip: json.msg });
        } else if (json.code === 10001000) {
          this.setState({ errorTip: localization['用户名或密码不正确'] });
        } else {
          this.setState({ errorTip: json.msg });
        }
      });
    }
  };

  getValidImg = () => {
    const { username } = this.state;
    this.request('/valid/createCode', {
      method: 'GET',
      body: {
        username,
        type: 'login'
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ imgName: json.data.imageName });
      } else {
        message.error(json.msg);
      }
    });
  };

  //获取访问的网址
  getUrl = () => {
    this.request('/cms/link', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ url: json.data });
      } else {
        message.error(json.msg);
      }
    });
  };
  componentWillMount() {
    this.getUrl();
  }

  render() {
    const { localization } = this.props;
    const { username, password, errorTip, code, imgName, url } = this.state;
    const ok = this.state.username && this.state.password;
    return (
      <div className="content">
        <div className="form-box">
          <h1>{localization['用户登录']}</h1>
          <div className="attention">
            <i className="iconfont icon-zhuyishixiang" />
            {localization['请确认您正在访问']} <strong>{url}</strong>
          </div>
          <div className="safety-site">
            <i className="iconfont icon-suo1 font-color-green" />
            {url}
          </div>
          <p className="error-tip">
            {errorTip && <i className="iconfont icon-zhuyishixiang" />}
            {errorTip}
          </p>
          <ul className="form-list">
            <li>
              <i className="iconfont icon-yonghu1" />
              <input
                type="text"
                className="text"
                id="username"
                value={username}
                onChange={this.inputValue}
                placeholder={`${localization['手机']}/${localization['邮箱']}`}
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
                placeholder={localization['密码']}
                onKeyPress={e => {
                  if (e.which === 13) this.handleSubmit();
                }}
              />
            </li>
            {imgName && [
              <li key="code">
                <i className="iconfont icon-yanzhengma2" />
                <input
                  type="text"
                  className="text"
                  id="code"
                  value={code}
                  onChange={this.inputValue}
                  placeholder={localization['验证码']}
                  onKeyPress={e => {
                    if (e.which === 13) this.handleSubmit();
                  }}
                />
                <img
                  src={`${IMAGES_ADDRESS}/image/view/${imgName}`}
                  className="inner-graphic"
                  alt={localization['图片验证码']}
                  onClick={this.getValidImg}
                />
              </li>,
              <li key="tips" style={{ textAlign: 'right' }}>
                {localization['点击图片刷新验证码']}
              </li>
            ]}
            <li>
              <input
                type="submit"
                className={classnames({
                  button: true,
                  disabled: !ok
                })}
                onClick={this.handleSubmit}
                value={localization['登录']}
              />
            </li>
            <li className="clear">
              <Link to="/reset" className="pull-left">
                {localization['忘记密码？']}
              </Link>{' '}
              <span className="pull-right">
                {localization['还没账号？']}
                <Link to="/signup">{localization['立即注册']}</Link>
              </span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default SignIn;
