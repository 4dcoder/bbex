import React, { Component } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';

const FormItem = Form.Item;


class Mobile extends Component {

  constructor(props) {
    super(props);
    this.state = {
      number: 59,
      disabled: false,
      newnumber: 59,
      newdisabled: false
    }
  }

  request = window.request;

  componentWillUnmount() {
    clearInterval(this.timer);
    clearInterval(this.newtimer);
  }
  //获取手机短信码
  sendMobileSms = (mobile) => {
    let body = null;
    if (mobile) {
      body = { mobile };
    }
    this.request('/user/updateMobileSms', {
      method: 'POST',
      body: body,
    }).then(json => {
      if (json.code === 10000000) {
        message.success(json.msg);
      }
    });

  }

  //更新手机号
  mobileChangeSubmit = (oldCode, newMobile, newCode) => {
    this.request('/user/updateUserMobile', {
      method: 'POST',
      body: {
        oldCode,
        newMobile,
        newCode
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success(json.msg);
        let account = JSON.parse(sessionStorage.getItem('account'));
        account.mobile = newMobile;
        sessionStorage.setItem('account', JSON.stringify(account));

        this.props.closeModal();
      } else {
        message.destroy();
        message.warn(json.msg, 1);
      }
    });
  }

  // 获取验证码
  getOldMobileCode = () => {
    const { mobile } = this.props;
    if (/^1[34578][0-9]{9}$/.test(mobile)) {

      this.sendMobileSms();
      this.countDown();
    } else {
      message.destroy();
      message.info('请输入正确的手机号', 1);
    }
  }

  getNewMobileCode = () => {
    const newMobile = this.props.form.getFieldsValue().newMobile;
    if (/^1[34578][0-9]{9}$/.test(newMobile)) {

      this.sendMobileSms(newMobile);
      this.newcountDown();

    } else {
      message.destroy();
      message.info('请输入正确的手机号', 1);
    }
  }

  countDown = () => {
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

  newcountDown = () => {
    this.setState({
      newdisabled: true
    });
    this.newtimer = setInterval(() => {
      let { newnumber } = this.state;
      if (newnumber === 0) {
        clearInterval(this.newtimer);
        this.setState({
          newnumber: 59,
          newdisabled: false
        });
      } else {
        this.setState({ newnumber: newnumber - 1 });
      }
    }, 1000);
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const { oldCode, newMobile, newCode } = values;
        this.mobileChangeSubmit(oldCode, newMobile, newCode);
      }
    });
  };

  render() {
    const { mobile, form } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 18 },
        sm: { span: 18 }
      }
    };
    const formLayoutMobile = {
      labelCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 18 },
        sm: { span: 18 }
      }
    };

    const { disabled, number, newdisabled, newnumber } = this.state;

    return (
      <Modal
        title="绑定手机号"
        visible
        width={500}
        wrapClassName="change-pwd-modal v-center-modal"
        onCancel={this.props.closeModal}
        footer={null}
      >
        <Form onSubmit={this.handleSubmit} className="change-password">
          <FormItem {...formLayoutMobile} label="手机号">
            {getFieldDecorator('mobile', {
              rules: [
                { required: true, message: '请输入手机号' },
                { pattern: /^1[34578][0-9]{9}$/, message: '手机号不正确' }
              ],
              initialValue: mobile,
            })(<Input size='large' disabled />)}
          </FormItem>
          <FormItem {...formItemLayout} label="短信验证码" className='code-row'>
            {getFieldDecorator('oldCode', {
              rules: [
                { required: true, message: '请输入手机验证码' },
                { pattern: /^\d{6}$/, message: '请输入6位数字验证码' }
              ],
              validateTrigger: 'onBlur'
            })(<Input size='large' />)}
            <Button
              onClick={this.getOldMobileCode}
              className='get-mobile-code'
              type="primary"
              size='large'
              disabled={disabled}
              style={{ width: 120 }}
            >
              {!disabled ? '获取验证码' : number + 's'}
            </Button>
          </FormItem>
          <FormItem {...formLayoutMobile} label="新手机号">
            {getFieldDecorator('newMobile', {
              rules: [
                { required: true, message: '请输入新的手机号' },
                { pattern: /^1[34578][0-9]{9}$/, message: '手机号不正确' }
              ],
              validateTrigger: 'onBlur'
            })(<Input size='large' />)}
          </FormItem>
          <FormItem {...formItemLayout} label="新短信验证码" className='code-row'>
            {getFieldDecorator('newCode', {
              rules: [
                { required: true, message: '请输入新的手机验证码' },
                { pattern: /^\d{6}$/, message: '请输入6位数字验证码' }
              ],
              validateTrigger: 'onBlur'
            })(<Input size='large' />)}
            <Button
              onClick={this.getNewMobileCode}
              className='get-mobile-code'
              type="primary"
              size='large'
              disabled={newdisabled}
              style={{ width: 120 }}
            >
              {!newdisabled ? '获取验证码' : newnumber + 's'}
            </Button>
          </FormItem>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              htmlType="submit"
              onClick={this.handleSubmit}
              style={{ width: 100, height: 36 }}
            >
              确认
            </Button>
          </div>
        </Form>
      </Modal>
    );
  }
}
export default Form.create()(Mobile);