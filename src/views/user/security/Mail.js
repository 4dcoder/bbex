import React, { Component } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import request from '../../../utils/request';
import { MAIL_REGEX } from '../../../utils/constants'

const FormItem = Form.Item;

class Mail extends Component {

  constructor(props) {
    super(props);
    this.state = {
      number: 59,
      disabled: false
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  //获取邮箱短信码
  sendMobileSms = (mobile) => {
    request('/user/sendMobileSms', {
      method: 'POST',
      body: {
        mobile,
      }
    }).then(json => {
      if (json.code === 10000000) {

      }
    });
  }
  //绑定邮箱
  mobileBinder = (mobile, code, googleCode) => {
    request('/user/mobileBinder', {
      method: 'POST',
      body: {
        mobile,
        code,
        googleCode
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success(json.msg);
        let account = JSON.parse(sessionStorage.getItem('account'));
        account.mobile = mobile;
        sessionStorage.setItem('account', JSON.stringify(account));

        this.props.closeModal();
      } else {
        message.destroy();
        message.warn(json.msg, 1);
      }
    });
  }

  // 点击绑定邮箱
  getMobileCode = () => {
    const mobile = this.props.form.getFieldsValue().mobile;
    if (/^1[34578][0-9]{9}$/.test(mobile)) {

      this.sendMobileSms(mobile);

      this.setState({
        disabled: true
      });
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
    }
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const { mobile, code, googleCode } = values;
        this.mobileBinder(mobile, code, googleCode);
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 15 },
        sm: { span: 15 }
      }
    };
    const formLayoutMobile = {
      labelCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 12 },
        sm: { span: 12 }
      }
    };

    const { disabled, number } = this.state;

    return (
      <Modal
        title="绑定邮箱"
        visible
        width={440}
        wrapClassName="change-pwd-modal v-center-modal"
        onCancel={this.props.closeModal}
        footer={null}
      >
        <Form onSubmit={this.handleSubmit} className="change-password">
          <FormItem {...formLayoutMobile} label="手机号">
            {getFieldDecorator('mobile', {
              rules: [
                { required: true, message: '请输入邮箱' },
                { pattern: MAIL_REGEX, message: '邮箱格式不正确' }
              ]
            })(<Input />)}
            <Button
              onClick={this.getMobileCode}
              className='get-mobile-code'
              type="primary"
              disabled={disabled}
              style={{ width: 100 }}
            >
              {!disabled ? '获取验证码' : number + 's'}
            </Button>
          </FormItem>
          <FormItem {...formItemLayout} label="邮箱验证码">
            {getFieldDecorator('code', {
              rules: [
                { required: true, message: '请输入邮箱验证码' },
                { pattern: /^\d{6}$/, message: '请输入6位数字验证码' }
              ]
            })(<Input />)}
          </FormItem>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              htmlType="submit"
              onClick={this.handleSubmit}
              style={{ width: 100, height: 36, borderRadius: 4 }}
            >
              确认
            </Button>
          </div>
        </Form>
      </Modal>
    );
  }
}
export default Form.create()(Mail);