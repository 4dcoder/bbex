import React, { Component } from 'react';
import { Button, Row, Col, message } from 'antd';
import Password from './Password';
import Mobile from './Mobilde';
import QRCode from 'qrcode.react';
import classnames from 'classnames';
import './security.css';

class Security extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialog: '',
      qrcodeContent: '',
      secret: '',
      code: '',
      errorTip: ''
    };
  }

  request = window.request;

  componentDidMount() {
    this.request('/user/createGoogleSecret').then(json => {
      if (json.code === 10000000) {
        const { qrcodeContent, secret } = json.data;
        this.setState({ qrcodeContent, secret });
      } else {
        message.error(json.msg);
      }
    });
  }

  submit = () => {
    const { secret, code } = this.state;
    this.request('/user/googleBinder', {
      body: { secret, code }
    }).then(json => {
      if (json.code === 10000000) {
        const account = JSON.parse(sessionStorage.getItem('account'));
        account.googleAuth = secret;
        sessionStorage.setItem('account', JSON.stringify(account));
        // this.props.history.push('/user');
      } else {
        message.error(json.msg);
      }
    });
  };

  // 绑定手机号
  handleBind = () => {
    this.setState({
      dialog: (
        <Mobile
          closeModal={() => {
            this.setState({ dialog: '' });
          }}
        />
      )
    });
  };

  inputValue = e => {
    this.setState({ [e.target.id]: e.target.value });
  };
  showDialog = () => {
    this.setState({
      dialog: (
        <Password
          closeModal={() => {
            this.setState({ dialog: '' });
          }}
        />
      )
    });
  };

  render() {
    const { qrcodeContent, secret, code, errorTip } = this.state;
    let account = '';
    if (sessionStorage.getItem('account')) {
      account = JSON.parse(sessionStorage.getItem('account'));
    }

    return (
      <div className="security_con user-cont">
        <Row type="flex">
          <Col span={2} className="title">
            手机号:{' '}
          </Col>
          {account && account.mobile ? (
            <Col span={20} className="col_content">
              {account.mobile}
            </Col>
          ) : (
            <Col span={20} className="col_content">
              <Button onClick={this.handleBind} type="primary">
                绑定手机号
              </Button>
            </Col>
          )}
        </Row>
        <Row type="flex" className="password_row">
          <Col span={2} className="title">
            密码:{' '}
          </Col>
          <Col span={20} className="pwd_btn">
            {' '}
            <Button onClick={this.showDialog} type="primary">
              修改密码
            </Button>
          </Col>
        </Row>
        <Row type="flex" className="google_ver_row">
          <Col span={2} className="title">
            谷歌验证:{' '}
          </Col>
          {account && account.googleAuth ? (
            <Col span={20} className="col_content">
              已认证
            </Col>
          ) : (
            <Col span={20} className="google_ver_con">
              <div>
                <div className="step_title">
                  <span>第一步: </span> 下载并安装谷歌验证器APP
                </div>
                <div className="step_content">
                  <a
                    href="https://itunes.apple.com/us/app/google-authenticator/id388497605?mt=8"
                    className="down-btn apple"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {' '}
                  </a>
                  <a
                    href="http://sj.qq.com/myapp/detail.htm?apkName=com.google.android.apps.authenticator2"
                    className="down-btn google"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {' '}
                  </a>
                </div>
              </div>
              <div>
                <div className="step_title">
                  <span>第二步: </span> 扫描二维码
                </div>
                <div className="step_content clear">
                  <div className="qrcode-box pull-left">
                    <QRCode
                      value={qrcodeContent}
                      size={110}
                      bgColor={'#ffffff'}
                      fgColor={'#000000'}
                      level={'L'}
                    />
                    <p>使用谷歌验证器APP扫描该二维码</p>
                  </div>
                  <div className="qrcode-text">
                    <span className="qrcode-num">{secret}</span>
                    <p>
                      如果您无法扫描二维码，<br /> 可以将该16位密钥手动输入到谷歌验证APP中
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="step_title">
                  <span>第三步: </span> 备份密钥
                </div>
                <div className="step_content">
                  <div className="key-box">
                    <i className="iconfont icon-miyao" />
                    {secret}
                  </div>
                  <div className="key-text">
                    <p>
                      请将16位密钥记录在纸上，并保存在安全的地方。<br />如遇手机丢失，你可以通过该密钥恢复你的谷歌验证。
                    </p>
                    <p>
                      <strong className="iconfont icon-zhuyishixiang stress" />通过人工客服重置你的谷歌验证需提交工单，可能需要<strong className="stress">
                        至少7天
                      </strong>时间来处理。
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="step_title">
                  <span>第四步: </span> 开启谷歌验证
                </div>
                <div className="step_content">
                  <p className="error-tip">
                    {errorTip && <i className="iconfont icon-zhuyishixiang" />}
                    {errorTip}
                  </p>
                  <ul className="form-list">
                    <li>
                      <i className="iconfont icon-miyao" />
                      <input
                        type="text"
                        className="text"
                        value={secret}
                        placeholder="16位秘钥"
                        disabled
                      />
                    </li>
                    <li>
                      <i className="iconfont icon-google" />
                      <input
                        type="text"
                        className="text"
                        id="code"
                        value={code}
                        onChange={this.inputValue}
                        placeholder="谷歌验证码"
                      />
                    </li>
                  </ul>
                  <div className="auth-direction">
                    <button
                      className={classnames({
                        'button primary submit': true,
                        disabled: !code
                      })}
                      onClick={this.submit}
                    >
                      提交
                    </button>
                  </div>
                </div>
              </div>
            </Col>
          )}
        </Row>
        {this.state.dialog}
      </div>
    );
  }
}

export default Security;
