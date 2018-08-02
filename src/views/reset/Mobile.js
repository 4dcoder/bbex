import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd'
import { JSEncrypt } from '../../utils/jsencrypt.js';
import CodePopup from '../../components/code-popup';
import { PUBLI_KEY, PWD_REGEX } from '../../utils/constants';
import './mobile.css';

const FormItem = Form.Item;

class Mobile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      popup: '',
      confirmDirty: false,
      disabled: false,
      number: 59,
    }
  }

  request = window.request;

  componentWillUnmount() {
    clearInterval(this.timer);
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

  closeModal = () => {
    this.setState({ popup: "" });
  }

  //获取手机验证码
  getMobileCode = () => {
    const { mobile } = this.props.form.getFieldsValue();
    if (/^1[34578][0-9]{9}$/.test(mobile)) {
      this.setState({
        popup: (
          <CodePopup
            flag="mobile"
            mail={mobile}
            type="reset"
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
      message.destroy();
      message.error('手机号不能为空', 1);
    }
  };

  //重置密码
  resetPwd = (mobile, password, code) => {
    this.request('/user/mobile/resetpwd', {
      body: {
        mobile, password, code
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success(json.msg, 1);
        this.props.history.push('/signin');
      }
    });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        let { mobile, password, code } = values;

        let encrypt = new JSEncrypt();
        encrypt.setPublicKey(PUBLI_KEY);
        const enPassword = encrypt.encrypt(password);

        this.resetPwd(mobile, enPassword, code);

      }
    });
  }

  handlePre = () => {
    const { mobile } = this.props.form.getFieldsValue();
    this.props.history.push('/reset', { mobile });
  }

  comparePassword = (rule, value, callback) => {
    const { form } = this.props;
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

  render() {
    const { form, location } = this.props;
    const { getFieldDecorator } = form;
    const { disabled, number, popup } = this.state;

    let mobileValue = '';
    if (location.search) {
      mobileValue = location.search.substr(1).split('=')[1];
    }

    return (
      <div className="reset-mobile">
        <div className='content'>
          <h3 className='title'>重置密码</h3>
          <Form onSubmit={this.handleSubmit} className="signup-form">
            <FormItem>
              {getFieldDecorator('mobile', {
                initialValue: mobileValue
              })(
                <Input
                  size="large"
                  disabled
                  prefix={<i className="iconfont icon-shouji54" />}
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
                  placeholder={'手机验证码'}
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
                {!disabled ? '获取手机验证码' : number + 's'}
              </Button>
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
                  placeholder={'密码'}
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
                  placeholder={'确认密码'}
                  onBlur={this.handleConfirmBlur}
                  prefix={<i className="iconfont icon-suo" />}
                />
              )}
            </FormItem>

            <div className="submit-btn" style={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                type="primary"
                size="large"
                onClick={this.handlePre}
                style={{ width: 160, marginRight: 40 }}
              >
                上一步
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                onClick={this.handleSubmit}
                style={{ width: 160 }}
              >
                确定
              </Button>
            </div>
          </Form>
        </div>
        {popup}
      </div>
    );
  }
}

export default withRouter(Form.create()(Mobile));
