import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { getQueryString } from '../../../utils';
import request from '../../../utils/request';
import { JSEncrypt } from '../../../utils/jsencrypt.js';
import { PUBLI_KEY, PWD_REGEX } from '../../../utils/constants';
import CodePopup from './code-popup';
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
    if (!this.state.disabled) {
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
        this.props.form.setFields({
          mobile: {
            errors: [new Error('请输入正确的手机号')]
          }
        });
      }
    }
  };

  comparePassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && value !== form.getFieldValue('password')) {
      callback('两次密码不一致');
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
          message.destroy();
          message.warn('请先同意服务条款');
        }
      }
    });
  };

  register = ({ registerType, mobile, enPassword, code, inviteCode }) => {
    request('/user/register', {
      body: {
        registerType,
        mobile,
        password: enPassword,
        code,
        inviteCode
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success('恭喜你，注册成功！');
        this.props.history.push('/signin');
      } else {
        message.destroy();
        message.error(json.msg);
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { disabled, number, popup, inviteCode } = this.state;

    return (
      <div className="mobile-signin">
        <h2 className="mobile-signup-tit">注册</h2>
        <Form onSubmit={this.handleSubmit} className="mobile-signup-form">
          <FormItem>
            {getFieldDecorator('mobile', {
              rules: [
                { required: true, message: '请输入手机号' },
                { pattern: /^1[34578][0-9]{9}$/, message: '手机号不正确' }
              ],
              validateTrigger: 'onBlur'
            })(
              <Input
                size="large"
                placeholder="手机号"
                prefix={<i className="iconfont icon-shouji54" />}
              />
            )}
          </FormItem>
          <FormItem>
            {getFieldDecorator('password', {
              rules: [
                { required: true, message: '请输入密码' },
                { pattern: PWD_REGEX, message: '输入8-20位密码 包含数字,字母' },
                { validator: this.validateToNextPassword }
              ],
              validateTrigger: 'onBlur'
            })(
              <Input
                size="large"
                type="password"
                placeholder="密码"
                prefix={<i className="iconfont icon-suo" />}
              />
            )}
          </FormItem>
          <FormItem>
            {getFieldDecorator('confirm', {
              rules: [
                { required: true, message: '请输入确认密码' },
                { validator: this.comparePassword }
              ],
              validateTrigger: 'onBlur'
            })(
              <Input
                size="large"
                type="password"
                placeholder="确认密码"
                onBlur={this.handleConfirmBlur}
                prefix={<i className="iconfont icon-suo" />}
              />
            )}
          </FormItem>
          <FormItem className="mail-code">
            {getFieldDecorator('code', {
              rules: [
                { required: true, message: '请输入手机验证码' },
                { pattern: /^\d{6}$/, message: '请输入6位手机验证码' }
              ],
              validateTrigger: 'onBlur'
            })(
              <Input
                size="large"
                placeholder="手机验证码"
                prefix={<i className="iconfont icon-yanzhengma2" />}
              />
            )}
            <Button
              size="large"
              onClick={this.getMobileCode}
              type={disabled ? 'count-down' : 'primary'}
              className="mail-code-btn"
            >
              {!disabled ? '获取手机验证码' : number + 's'}
            </Button>
          </FormItem>
          <FormItem style={{display: 'none'}}>
            {getFieldDecorator('inviteCode', {
              initialValue: inviteCode,
              rules: [{ pattern: /^\d+$/, message: '请输入数字邀请码' }],
              validateTrigger: 'onBlur'
            })(
              <Input
                size="large"
                placeholder="邀请码"
                prefix={<i className="iconfont icon-yaoqingma" />}
              />
            )}
          </FormItem>
          <FormItem>
            {getFieldDecorator('agreement', {
              valuePropName: 'checked',
              initialValue: true
            })(<Checkbox className="agree-text">我已阅读并同意</Checkbox>)}
            <Link to="/agreement" className="link-agree" target="_blank">
              服务条款
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
              注册
            </Button>
          </div>
          {popup}
        </Form>
      </div>
    );
  }
}

export default Form.create()(MobileForm);
