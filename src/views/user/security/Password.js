import React, { Component } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { JSEncrypt } from '../../../utils/jsencrypt.js';
import { PUBLI_KEY, PWD_REGEX } from '../../../utils/constants';

const FormItem = Form.Item;

class Password extends Component {
    constructor(props) {
        super(props);
        this.state = {
            confirmDirty: false
        };
    }

    request = window.request;

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
        this.request('/user/updatePassword', {
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
                xs: { span: 18 },
                sm: { span: 18 }
            }
        };
        return (
            <Modal
                title="修改密码"
                visible
                width={440}
                wrapClassName="change-pwd-modal v-center-modal"
                onCancel={this.props.closeModal}
                footer={null}
            >
                <Form onSubmit={this.handleSubmit} autocomplete="off" className="change-password">
                    <Input style={{ display: 'none' }} type="password" autocomplete="off" />
                    <FormItem {...formItemLayout} label="原密码">
                        {getFieldDecorator('oldPassword', {
                            rules: [{ required: true, message: '请输入原密码' }]
                        })(<Input size='large' type="password" autocomplete="off" />)}
                    </FormItem>
                    <FormItem {...formItemLayout} label="新密码">
                        {getFieldDecorator('password', {
                            rules: [
                                { required: true, message: '请输入新密码' },
                                { pattern: PWD_REGEX, message: '输入8-20位密码 包含数字，字母' },
                                { validator: this.validateToNextPassword }
                            ]
                        })(<Input size='large' type="password" autocomplete="off" />)}
                    </FormItem>
                    <FormItem {...formItemLayout} label="确认密码">
                        {getFieldDecorator('confirm', {
                            rules: [
                                { required: true, message: '请再次输入密码' },
                                { validator: this.comparePassword }
                            ]
                        })(<Input size='large' type="password" autocomplete="off" onBlur={this.handleConfirmBlur} />)}
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

export default Form.create()(Password);
