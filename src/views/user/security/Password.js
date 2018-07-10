import React, { Component } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { JSEncrypt } from '../../../utils/jsencrypt.js';
import request from '../../../utils/request';
import { PUBLI_KEY, PWD_REGEX } from '../../../utils/constants';


const FormItem = Form.Item;

//公钥

class Password extends Component {
    constructor(props) {
        super(props);
        this.state = {
            confirmDirty: false
        };
    }

    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const { oldPassword, password } = values;
                // this.changePassword(oldPassword, password);
                let encrypt = new JSEncrypt();
                encrypt.setPublicKey(PUBLI_KEY);
                let enOldPassword = encrypt.encrypt(oldPassword);
                let enNewPassword = encrypt.encrypt(password);

                this.changePassword(enOldPassword, enNewPassword);
            }
        });
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

    changePassword = (oldPassword, password) => {
        request('/user/updatePassword', {
            method: 'POST',
            body: {
                password,
                oldPassword
            }
        }).then(json => {
            if (json.code === 10000000) {
                message.success(json.msg);
                this.props.closeModal();
            } else {
                message.destroy();
                message.error(json.msg);
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
                xs: { span: 16 },
                sm: { span: 16 }
            }
        };
        return (
            <Modal
                title="修改密码"
                visible
                width={420}
                wrapClassName="change-pwd-modal v-center-modal"
                onCancel={this.props.closeModal}
                footer={null}
            >
                <Form onSubmit={this.handleSubmit} className="change-password">
                    <FormItem {...formItemLayout} label="原密码">
                        {getFieldDecorator('oldPassword', {
                            rules: [{ required: true, message: '请输入原密码' }]
                        })(<Input type="password" />)}
                    </FormItem>
                    <FormItem {...formItemLayout} label="新密码">
                        {getFieldDecorator('password', {
                            rules: [
                                { required: true, message: '请输入新密码' },
                                { pattern: PWD_REGEX, message: '输入8-20位密码'},
                                { validator: this.validateToNextPassword }
                            ]
                        })(<Input type="password" />)}
                    </FormItem>
                    <FormItem {...formItemLayout} label="确认密码">
                        {getFieldDecorator('confirm', {
                            rules: [
                                { required: true, message: '请再次输入密码' },
                                { validator: this.comparePassword }
                            ]
                        })(<Input type="password" onBlur={this.handleConfirmBlur} />)}
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

export default Form.create()(Password);
