import React, { Component } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import request from '../../../utils/request';

const FormItem = Form.Item;


class Mobile extends Component {

  constructor(props){
    super(props);
    this.state={
      number: 59,
      disabled: false
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
}
  //获取手机短信码
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
  //绑定手机号
  mobileBinder = (mobile, code) => {
    request('/user/mobileBinder', {
      method: 'POST',
      body: {
        mobile,
        code,
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

  // 点击绑定手机
  getMobileCode = () => {
    const mobile = this.props.form.getFieldsValue().mobile;
    if(/^1[34578][0-9]{9}$/.test(mobile)){

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
    }else{
        message.destroy();
        message.info('请输入正确的手机号', 1);
    }
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
        if (!err) {
           const { mobile, code } = values;
           this.mobileBinder(mobile,code);
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
          sm: { span: 18}
      }
  };

  const { disabled, number } = this.state;

    return (
        <Modal
            title="绑定手机号"
            visible
            width={440}
            wrapClassName="change-pwd-modal v-center-modal"
            onCancel={this.props.closeModal}
            footer={null}
        >
            <Form onSubmit={this.handleSubmit} className="change-password">
                <FormItem {...formLayoutMobile} label="手机号" className='code-row'>
                    {getFieldDecorator('mobile', {
                        rules: [
                            { required: true, message: '请输入手机号' },
                            { pattern: /^1[34578][0-9]{9}$/, message:'手机号不正确' }
                        ]
                    })(<Input size='large'/>)}
                    <Button 
                      onClick={this.getMobileCode} 
                      className='get-mobile-code' 
                      type="primary"
                      size='large'
                      disabled={disabled}
                      style={{width: 120}}
                    >
                        {!disabled ? '获取验证码' : number + 's'}
                    </Button>
                </FormItem>
                <FormItem {...formItemLayout} label="短信验证码">
                    {getFieldDecorator('code', {
                        rules: [
                            { required: true, message: '请输入手机验证码' },
                            { pattern: /^\d{6}$/, message:'请输入6位数字验证码' }
                        ]
                    })(<Input  size='large' />)}
                </FormItem>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        onClick={this.handleSubmit}
                        style={{ width: 100, height: 36}}
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