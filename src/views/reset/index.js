import React, { Component } from 'react';
import { Tabs } from 'antd';
import { MAIL_REGEX } from '../../utils/constants';
import CodePopup from '../../components/code-popup';
import classnames from 'classnames';

const TabPane = Tabs.TabPane;

class Reset extends Component {
  state = {
    mail: '',
    mobile: '',
    errorMailTip: '',
    errorMobileTip: '',
    currentTab: 'mail',
    popup: false,
    resetConfirm: false
  };

  componentDidMount() {
    const { state } = this.props.history.location;
    if (state && state.mobile) {
      this.setState({ mobile: state.mobile, currentTab: 'mobile' });
    }
  }

  inputValue = e => {
    let value = e.target.value;
    this.setState({ [e.target.id]: value })
    if (value) {
      this.setState({ errorMailTip: '' });
    }
  };

  mobileChange = e => {
    let value = e.target.value;
    this.setState({ mobile: value })
    if (value) {
      this.setState({ errorMobileTip: '' });
    }
  }

  tabChange = (key) => {
    this.setState({ currentTab: key });
  }

  closePopup = () => {
    this.setState({ popup: false });
  };

  handleMobile = () => {
    const { mobile } = this.state;
    if ((/^1[34578][0-9]{9}$/).test(mobile)) {
      this.props.history.push(`/reset/mobile?mobile=${mobile}`)
    } else {
      this.setState({ errorMobileTip: '手机格式不正确' });
    }
  }

  getMailValidCode = () => {
    if (MAIL_REGEX.test(this.state.mail)) {
      this.setState({
        popup: (
          <CodePopup
            flag="mail"
            mail={this.state.mail}
            type="reset"
            onCancel={() => {
              this.closePopup();
            }}
            onOk={() => {
              this.setState({ resetConfirm: true });
            }}
          />
        )
      });
    } else {
      this.setState({ errorMailTip: '邮箱格式不正确' });
    }
  };

  render() {
    const { mail, mobile, currentTab, errorMailTip, errorMobileTip, popup, resetConfirm } = this.state;
    return (
      <div className="content">
        {resetConfirm ? (
          <div className="form-box">
            <h1>重置密码确认</h1>
            <ul className="form-list">
              <li className="form-box-text" style={{ color: '#dadada' }}>
                已向您的注册邮箱发送了一封重置密码邮件，请点击邮件中的链接前去重置登录密码。
                如果长时间未收到邮件，请尝试在垃圾邮件中查找。
              </li>
            </ul>
          </div>
        ) : (
            <div className="form-box">
              <h1>找回密码</h1>
              <Tabs activeKey={currentTab} onChange={this.tabChange}>
                <TabPane tab="邮箱找回" key="mail">
                  <p className="error-tip">
                    {errorMailTip && (
                      <i className="iconfont icon-zhuyishixiang" />
                    )}
                    {errorMailTip}
                  </p>
                  <ul className="form-list">
                    <li>
                      <i className="iconfont icon-youxiang" />
                      <input
                        type="text"
                        className="text"
                        id="mail"
                        value={mail}
                        onChange={this.inputValue}
                        placeholder="输入您的邮箱"
                      />
                    </li>
                    <li>
                      <input
                        type="submit"
                        className={classnames({
                          button: true,
                          disabled: !mail
                        })}
                        onClick={this.getMailValidCode}
                        value="确定"
                      />
                    </li>
                  </ul>
                </TabPane>
                <TabPane tab="手机找回" key="mobile">
                  <p className="error-tip">
                    {errorMobileTip && (
                      <i className="iconfont icon-zhuyishixiang" />
                    )}
                    {errorMobileTip}
                  </p>
                  <ul className="form-list">
                    <li>
                      <i className="iconfont icon-youxiang" />
                      <input
                        type="text"
                        className="text"
                        value={mobile}
                        onChange={this.mobileChange}
                        placeholder="输入您的手机号"
                      />
                    </li>
                    <li>
                      <input
                        type="submit"
                        className={classnames({
                          button: true,
                          disabled: !mobile
                        })}
                        onClick={this.handleMobile}
                        value="确定"
                      />
                    </li>
                  </ul>
                </TabPane>
              </Tabs>
              {popup}
            </div>
          )}
      </div>
    );
  }
}

export default Reset;
