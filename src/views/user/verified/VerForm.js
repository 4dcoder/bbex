import React, { Component } from 'react';
import { Form, Input, Radio, Button, message } from 'antd';
import './form.css';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

class VerForm extends Component{

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
        if (!err) {
          this.props.submitVer(values);
        }
    });
  }

    render(){
      const { type, form } = this.props;
      const { getFieldDecorator } = form;

      const formItemLayout = {
        labelCol: {
            xs: { span: 4 },
            sm: { span: 4 },
        },
        wrapperCol: {
            xs: { span: 14 },
            sm: { span: 14 },
        },
      };

      return <Form onSubmit={this.handleSubmit} className="ver-form">
          <FormItem
            {...formItemLayout}
            label="身份证号"
          >
            {getFieldDecorator('idCard', {
                rules: [{ required: true, message: '请输入身份证号', whitespace: true},
              {validator:(rule, value, callback)=>{
                const form = this.props.form;
                if(/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(form.getFieldValue('idCard'))){
                  callback();
                }else{
                  callback('身份证号为15或18位');
                }
              }}],
            })(
                <Input size="large" placeholder="请输入身份证号" />
            )}
          </FormItem>
         <FormItem
            {...formItemLayout}
            label="姓名"
          >
            {getFieldDecorator('realName', {
                rules: [{ required: true, message: '请输入姓名', whitespace: true},{max: 50, message: '姓名不能超过50位'}],
            })(
                <Input size="large" placeholder="请输入姓名" />
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="年龄"
          >
            {getFieldDecorator('age', {
                rules: [{ required: true, message: '请输入年龄', whitespace: true},{pattern: /^[0-9]{0,2}$/, message: '年龄不正确'}],
            })(
                <Input  size="large" placeholder="请输入年龄" />
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="性别"
            className='sex-item'
          >
          {getFieldDecorator('sex',{
            rules: [{required: true, message: '请选择性别',}]
          })(
            <RadioGroup>
              <Radio value="1">男</Radio>
              <Radio value="2">女</Radio>
            </RadioGroup>
          )}
           
          </FormItem>

           <FormItem
              {...formItemLayout}
              label="地址"
            >
              {getFieldDecorator('address', {
                  rules: [{ required: true, message: '请输入地址', whitespace: true},{max: 100, message: '地址不能超过100位'}],
              })(
                  <Input size="large" placeholder="请输入地址" />
              )}
            </FormItem>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                    type="primary"
                    htmlType="submit"
                    onClick={this.handleSubmit}
                    style={{ width: 160, height: 40, borderRadius: 4 }}
                >
                    提交信息
                </Button>
            </div>
      </Form>
    }
}

export default Form.create()(VerForm);