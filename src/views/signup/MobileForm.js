import React, { Component } from "react";
import { withRouter, Link } from "react-router-dom";
import { Form, Input, Button, Checkbox, message } from "antd";
import { getQueryString } from "../../utils";
import { JSEncrypt } from "../../utils/jsencrypt.js";
import { PUBLI_KEY, PWD_REGEX } from "../../utils/constants";
import NoCaptcha from "../../components/nc";
import "./signup.css";

const FormItem = Form.Item;

class MobileForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      registerType: 1,
      confirmDirty: false,
      disabled: false,
      inviteCode: getQueryString("inviteCode") || "",
      number: 90,
      appKey: "",
      token: "",
      ncData: "",
      nc: "",
      scene: window.navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      )
        ? "nc_register_h5"
        : "nc_register"
    };
  }

  request = window.request;

  countDown = () => {
    this.setState({ disabled: true });
    this.timer = setInterval(() => {
      let { number } = this.state;
      if (number === 0) {
        clearInterval(this.timer);
        this.setState({
          number: 90,
          disabled: false
        });
      } else {
        this.setState({ number: number - 1 });
      }
    }, 1000);
  };

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  sendMobileCode = () => {
    const { appKey, token, ncData, scene } = this.state;
    const { csessionid, sig } = ncData;
    const mobile = this.props.form.getFieldsValue().mobile;
    this.request(`/mobile/sendCode`, {
      body: {
        mobile,
        type: "register",
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
      } else {
        message.destroy();
        message.warn(json.msg);
      }
    });
  };

  getMobileCode = () => {
    const { ncData, nc, disabled } = this.state;
    const mobile = this.props.form.getFieldsValue().mobile;
    if (/^1[34578][0-9]{9}$/.test(mobile)) {
      if (ncData && !disabled) {
        this.sendMobileCode();
        this.countDown();
        if (nc) {
          nc.reload();
          this.setState({ ncData: "" });
        }
      } else {
        if (!disabled) {
          this.props.form.setFields({
            noCaptche: {
              errors: [new Error("请进行滑动验证")]
            }
          });
        }
      }
    } else {
      const { localization } = this.props;
      this.props.form.setFields({
        mobile: {
          errors: [new Error(localization["请输入正确的手机号"])]
        }
      });
    }
  };

  //滑动验证
  ncLoaded = (appKey, token, ncData, nc) => {
    if (ncData) {
      this.setState({ appKey, token, ncData, nc });
      this.props.form.setFields({
        noCaptche: {
          errors: null
        }
      });
    }
  };

  comparePassword = (rule, value, callback) => {
    const { localization, form } = this.props;
    if (value && value !== form.getFieldValue("password")) {
      callback(localization["两次密码不一致"]);
    } else {
      callback();
    }
  };
  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  validateToNextPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && this.state.confirmDirty) {
      form.validateFields(["confirm"], { force: true });
    }
    callback();
  };

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        let { mobile, password, code, inviteCode, agreement } = values;
        const { registerType } = this.state;
        if (agreement) {
          let encrypt = new JSEncrypt();
          encrypt.setPublicKey(PUBLI_KEY);
          const enPassword = encrypt.encrypt(password);

          this.register({ registerType, mobile, enPassword, code, inviteCode });
        } else {
          const { localization } = this.props;
          message.destroy();
          message.warn(localization["请先同意服务条款"]);
        }
      }
    });
  };

  register = ({ registerType, mobile, enPassword, code, inviteCode }) => {
    this.request("/user/register", {
      body: {
        registerType,
        mobile,
        password: enPassword,
        code,
        inviteCode
      }
    }).then(json => {
      if (json.code === 10000000) {
        const { localization } = this.props;
        message.success(localization["恭喜你，注册成功！"]);
        this.props.history.push("/signin");
      } else {
        message.destroy();
        message.error(json.msg);
      }
    });
  };

  render() {
    const { localization, form } = this.props;
    const { getFieldDecorator } = form;
    const { disabled, number, inviteCode, scene } = this.state;

    return (
      <Form onSubmit={this.handleSubmit} className="signup-form">
        <Input style={{ display: "none" }} type="password" />
        <FormItem>
          {getFieldDecorator("mobile", {
            rules: [
              { required: true, message: localization["请输入手机号"] },
              {
                pattern: /^1[34578][0-9]{9}$/,
                message: localization["手机号不正确"]
              }
            ],
            validateTrigger: "onBlur"
          })(
            <Input
              size="large"
              placeholder={localization["手机号"]}
              prefix={<i className="iconfont icon-shouji54" />}
            />
          )}
        </FormItem>
        <FormItem className="mail-code">
          {getFieldDecorator("noCaptche")(
            <NoCaptcha
              domID="nc_register_mobile"
              scene={scene}
              ncCallback={(appKey, token, ncData, nc) => {
                this.ncLoaded(appKey, token, ncData, nc);
              }}
            />
          )}
        </FormItem>
        <FormItem className="mail-code">
          {getFieldDecorator("code", {
            rules: [
              { required: true, message: localization["请输入手机验证码"] },
              {
                pattern: /^\d{6}$/,
                message: localization["请输入6位手机验证码"]
              }
            ],
            validateTrigger: "onBlur"
          })(
            <Input
              size="large"
              placeholder={localization["手机验证码"]}
              prefix={<i className="iconfont icon-yanzhengma2" />}
            />
          )}
          <div onClick={this.getMobileCode} className="mail-code-btn">
            {!disabled ? "获取验证码" : number + "S"}
          </div>
        </FormItem>
        <FormItem>
          {getFieldDecorator("password", {
            rules: [
              { required: true, message: localization["请输入密码"] },
              {
                pattern: PWD_REGEX,
                message: localization["输入8-20位密码 包含数字,字母"]
              },
              { validator: this.validateToNextPassword }
            ],
            validateTrigger: "onBlur"
          })(
            <Input
              size="large"
              type="password"
              placeholder={localization["密码"]}
              prefix={<i className="iconfont icon-suo" />}
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator("confirm", {
            rules: [
              { required: true, message: localization["请输入确认密码"] },
              { validator: this.comparePassword }
            ],
            validateTrigger: "onBlur"
          })(
            <Input
              size="large"
              type="password"
              placeholder={localization["确认密码"]}
              onBlur={this.handleConfirmBlur}
              prefix={<i className="iconfont icon-suo" />}
            />
          )}
        </FormItem>

        <FormItem>
          {getFieldDecorator("inviteCode", {
            initialValue: inviteCode,
            rules: [
              { pattern: /^\d+$/, message: localization["请输入数字邀请码"] }
            ],
            validateTrigger: "onBlur"
          })(
            <Input
              size="large"
              placeholder={localization["邀请码"]}
              prefix={<i className="iconfont icon-yaoqingma" />}
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator("agreement", {
            valuePropName: "checked",
            initialValue: true
          })(
            <Checkbox className="agree-text">
              {localization["我已阅读并同意"]}
            </Checkbox>
          )}
          <Link to="/agreement" className="link-agree" target="_blank">
            {localization["服务条款"]}
          </Link>
        </FormItem>
        <div
          className="submit-btn"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            onClick={this.handleSubmit}
            style={{ width: 400 }}
          >
            {localization["注册"]}
          </Button>
        </div>
      </Form>
    );
  }
}

export default withRouter(Form.create()(MobileForm));
