import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { getQueryString } from '../../utils';
import { JSEncrypt } from '../../utils/jsencrypt.js';
import { PUBLI_KEY, PWD_REGEX, MAIL_REGEX } from '../../utils/constants';
import CodePopup from '../../components/code_popup';
import './signup.css';

const FormItem = Form.Item;

class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      registerType: 2,
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

  getMailCode = () => {
    const mail = this.props.form.getFieldsValue().mail;
    if (MAIL_REGEX.test(mail)) {
      this.setState({
        popup: (
          <CodePopup
            mail={mail}
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
        mail: {
          errors: [new Error('请输入正确的邮箱')]
        }
      });
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
        let { mail, password, code, inviteCode, agreement } = values;
        const { registerType } = this.state;
        if (agreement) {
          let encrypt = new JSEncrypt();
          encrypt.setPublicKey(PUBLI_KEY);
          const enPassword = encrypt.encrypt(password);

          this.register({ registerType, mail, enPassword, code, inviteCode });
        } else {
          message.destroy();
          message.warn('请先同意服务条款');
        }
      }
    });
  };

  register = ({ registerType, mail, enPassword, code, inviteCode }) => {
    this.request('/user/register', {
      body: {
        registerType,
        mail,
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
      <div className="sign_up">
        <Form onSubmit={this.handleSubmit} className="signup_form">
          <FormItem>
            {getFieldDecorator('mail', {
              rules: [
                { required: true, message: '请输入邮箱' },
                { pattern: MAIL_REGEX, message: '邮箱格式不正确' }
              ]
            })(
              <Input
                size="large"
                type="mail"
                placeholder="邮箱"
                prefix={<i className="iconfont icon-youxiang" />}
              />
            )}
          </FormItem>
          <FormItem>
            {getFieldDecorator('password', {
              rules: [
                { required: true, message: '请输入密码' },
                { pattern: PWD_REGEX, message: '输入8-20位密码' },
                { validator: this.validateToNextPassword }
              ]
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
              ]
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
          <FormItem className="mail_code">
            {getFieldDecorator('code', {
              rules: [
                { required: true, message: '请输入邮箱验证码' },
                { pattern: /^\w{6}$/, message: '请输入6位验证码' }
              ]
            })(
              <Input
                size="large"
                placeholder="邮箱验证码"
                prefix={<i className="iconfont icon-yanzhengma2" />}
              />
            )}
            <Button
              size="large"
              onClick={this.getMailCode}
              type="primary"
              disabled={disabled}
              className="mail_code_btn"
            >
              {!disabled ? '获取邮箱验证码' : number + 's'}
            </Button>
          </FormItem>
          <FormItem>
            {getFieldDecorator('inviteCode', {
              initialValue: inviteCode,
              rules: [{ pattern: /^\w{4}$/, message: '请输入4位邀请码' }]
            })(
              <Input
                size="large"
                placeholder="邀请码 (选填)"
                prefix={<i className="iconfont icon-yaoqingma" />}
              />
            )}
          </FormItem>
          <FormItem>
            {getFieldDecorator('agreement', {
              valuePropName: 'checked',
              initialValue: true
            })(<Checkbox className="agree_text">我已阅读并同意</Checkbox>)}
            <Link to="/agreement" className="link_agree" target="_blank">
              服务条款
            </Link>
          </FormItem>
          <div className="submit_btn" style={{ display: 'flex', justifyContent: 'center' }}>
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
        </Form>
        {popup}
      </div>
    );
  }
}

export default Form.create()(SignUp);
