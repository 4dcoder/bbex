import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { getQueryString } from '../../utils';
import { JSEncrypt } from '../../utils/jsencrypt.js';
import { PUBLI_KEY, PWD_REGEX } from '../../utils/constants';
import CodePopup from '../../components/code-popup';
import './signup.css';

const FormItem = Form.Item;

class MobileForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      registerType: 1,
      confirmDirty: false,
      disabled: false,
      inviteCode: getQueryString('inviteCode') || '',
      number: 59,
      popup: ''
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
          number: 59,
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

  closeModal = () => {
    this.setState({ popup: '' });
  };

  getMobileCode = () => {
    const mobile = this.props.form.getFieldsValue().mobile;
    if (/^1[34578][0-9]{9}$/.test(mobile)) {
      this.setState({
        popup: (
          <CodePopup
            flag="mobile"
            mail={mobile}
            type="register"
            onCancel={() => {
              this.closeModal();
            }}
            onOk={() => {
              this.closeModal();
              this.countDown();
            }}
          />
        )
      });
    } else {
      const { localization } = this.props;
      this.props.form.setFields({
        mobile: {
          errors: [new Error(localization['请输入正确的手机号'])]
        }
      });
    }
  };

  comparePassword = (rule, value, callback) => {
    const { localization, form } = this.props;
    if (value && value !== form.getFieldValue('password')) {
      callback(localization['两次密码不一致']);
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
      form.validateFields(['confirm'], { force: true });
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
          message.warn(localization['请先同意服务条款']);
        }
      }
    });
  };

  register = ({ registerType, mobile, enPassword, code, inviteCode }) => {
    this.request('/user/register', {
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
        message.success(localization['恭喜你，注册成功！']);
        this.props.history.push('/signin');
      } else {
        message.destroy();
        message.error(json.msg);
      }
    });
  };

  render() {
    const { localization, form } = this.props;
    const { getFieldDecorator } = form;
    const { disabled, number, popup, inviteCode } = this.state;

    return (
      <Form onSubmit={this.handleSubmit} className="signup-form">
        <Input style={{ display: 'none' }} type="password" />
        <FormItem>
          {getFieldDecorator('mobile', {
            rules: [
              { required: true, message: localization['请输入手机号'] },
              { pattern: /^1[34578][0-9]{9}$/, message: localization['手机号不正确'] }
            ],
            validateTrigger: 'onBlur'
          })(
            <Input
              size="large"
              placeholder={localization['手机号']}
              prefix={<i className="iconfont icon-shouji54" />}
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('password', {
            rules: [
              { required: true, message: localization['请输入密码'] },
              { pattern: PWD_REGEX, message: localization['输入8-20位密码 包含数字,字母'] },
              { validator: this.validateToNextPassword }
            ],
            validateTrigger: 'onBlur'
          })(
            <Input
              size="large"
              type="password"
              placeholder={localization['密码']}
              prefix={<i className="iconfont icon-suo" />}
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('confirm', {
            rules: [
              { required: true, message: localization['请输入确认密码'] },
              { validator: this.comparePassword }
            ],
            validateTrigger: 'onBlur'
          })(
            <Input
              size="large"
              type="password"
              placeholder={localization['确认密码']}
              onBlur={this.handleConfirmBlur}
              prefix={<i className="iconfont icon-suo" />}
            />
          )}
        </FormItem>
        <FormItem className="mail-code">
          {getFieldDecorator('code', {
            rules: [
              { required: true, message: localization['请输入手机验证码'] },
              { pattern: /^\d{6}$/, message: localization['请输入6位手机验证码'] }
            ],
            validateTrigger: 'onBlur'
          })(
            <Input
              size="large"
              placeholder={localization['手机验证码']}
              prefix={<i className="iconfont icon-yanzhengma2" />}
            />
          )}
          <Button
            size="large"
            onClick={this.getMobileCode}
            type="primary"
            disabled={disabled}
            className="mail-code-btn"
          >
            {!disabled ? localization['获取手机验证码'] : number + 's'}
          </Button>
        </FormItem>
        <FormItem>
          {getFieldDecorator('inviteCode', {
            initialValue: inviteCode,
            rules: [{ pattern: /^\d+$/, message: localization['请输入数字邀请码'] }],
            validateTrigger: 'onBlur'
          })(
            <Input
              size="large"
              placeholder={localization['邀请码']}
              prefix={<i className="iconfont icon-yaoqingma" />}
            />
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('agreement', {
            valuePropName: 'checked',
            initialValue: true
          })(<Checkbox className="agree-text">{localization['我已阅读并同意']}</Checkbox>)}
          <Link to="/agreement" className="link-agree" target="_blank">
            {localization['服务条款']}
          </Link>
        </FormItem>
        <div className="submit-btn" style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            onClick={this.handleSubmit}
            style={{ width: 400 }}
          >
            {localization['注册']}
          </Button>
        </div>
        {popup}
      </Form>
    );
  }
}

export default withRouter(Form.create()(MobileForm));
