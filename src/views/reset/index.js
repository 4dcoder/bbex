import React, { Component } from "react";
import { Tabs, Form, Input, Button, message } from "antd";
import { MAIL_REGEX } from "../../utils/constants";
import classnames from "classnames";
import NoCaptcha from "../../components/nc";
import "./index.css";

const TabPane = Tabs.TabPane;
const FormItem = Form.Item;

class Reset extends Component {
  state = {
    mobile: "",
    errorMobileTip: "",
    currentTab: "mail",
    popup: false,
    resetConfirm: false,
    appKey: "",
    token: "",
    ncData: "",
    nc: "",
    scene: window.navigator.userAgent.match(
      /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
    )
      ? "nc_register_h5"
      : "nc_register",
    disabled: false
  };

  request = window.request;

  componentDidMount() {
    const { state } = this.props.history.location;
    if (state && state.mobile) {
      this.setState({ mobile: state.mobile, currentTab: "mobile" });
    }
  }

  mobileChange = e => {
    let value = e.target.value;
    this.setState({ mobile: value });
    if (value) {
      this.setState({ errorMobileTip: "" });
    }
  };

  ncLoaded = (appKey, token, ncData, nc) => {
    if (ncData) {
      this.setState({ appKey, token, ncData, nc });
      this.props.form.setFields({
        noCaptche: {
          errors: []
        }
      });
    }
  };

  tabChange = key => {
    this.setState({ currentTab: key });
  };

  sendMailCode = () => {
    this.setState({ disabled: true });
    const { appKey, token, ncData, scene } = this.state;
    const { csessionid, sig } = ncData;
    const mail = this.props.form.getFieldsValue().mail;
    this.request(`/mail/sendCode`, {
      body: {
        mail,
        type: "reset",
        source: "pc",
        appKey,
        sessionId: csessionid,
        sig,
        vtoken: token,
        scene
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success(json.msg);
        this.setState({ resetConfirm: true });
      } else {
        message.destroy();
        message.warn(json.msg);
      }
      this.setState({ disabled: false });
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { ncData } = this.state;
    this.props.form.validateFields(err => {
      if (!err) {
        if (ncData) {
          this.sendMailCode();
        } else {
          this.props.form.setFields({
            noCaptche: {
              errors: [new Error("请进行滑动验证")]
            }
          });
        }
      }
    });
  };

  handleMobile = () => {
    const { mobile } = this.state;
    if (/^1[34578][0-9]{9}$/.test(mobile)) {
      this.props.history.push(`/reset/mobile?mobile=${mobile}`);
    } else {
      this.setState({ errorMobileTip: "手机格式不正确" });
    }
  };

  render() {
    const {
      mobile,
      currentTab,
      errorMobileTip,
      popup,
      resetConfirm,
      scene,
      disabled
    } = this.state;

    const { form } = this.props;
    const { getFieldDecorator } = form;

    return (
      <div className="content">
        {resetConfirm ? (
          <div className="form-box">
            <h1>重置密码确认</h1>
            <ul className="form-list">
              <li className="form-box-text" style={{ color: "#dadada" }}>
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
                <Form className="reset-mail-form" onSubmit={this.handleSubmit}>
                  <Input style={{ display: "none" }} type="password" />
                  <FormItem>
                    {getFieldDecorator("mail", {
                      rules: [
                        { required: true, message: "请输入邮箱" },
                        {
                          pattern: MAIL_REGEX,
                          message: "邮箱格式不正确"
                        }
                      ],
                      validateTrigger: "onBlur"
                    })(
                      <Input
                        placeholder="邮箱"
                        size="large"
                        prefix={<i className="iconfont icon-youxiang" />}
                      />
                    )}
                  </FormItem>
                  <FormItem className="mail-code">
                    {getFieldDecorator("noCaptche")(
                      <NoCaptcha
                        domID="nc_reset_mail"
                        scene={scene}
                        ncCallback={(appKey, token, ncData, nc) => {
                          this.ncLoaded(appKey, token, ncData, nc);
                        }}
                      />
                    )}
                  </FormItem>
                  <Button
                    disabled={disabled}
                    type="primary"
                    htmlType="submit"
                    size="large"
                    onClick={this.handleSubmit}
                  >
                    确认
                  </Button>
                </Form>
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
                    <i className="iconfont icon-shouji54" />
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

export default Form.create()(Reset);
