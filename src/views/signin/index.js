import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import { IMAGES_ADDRESS } from '../../utils/constants';
import classnames from 'classnames';
import { JSEncrypt } from '../../utils/jsencrypt.js';

//公钥
const PUBLI_KEY =
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCLADJL0WYJJrxmpNqKeoAXhW8P0GWMy7ZJG/I+8CwLZ2we83VnHcF4zXfpWrw3zY4RIYkFQT8EkW7FUDFeY9XzoxoQbcjyG3ywIzN6SI+7Jd07TGktNTTxFR6Bj4IjzAlazitFlUKAP77AyhT65YDChbNRul8u6M5qqt/ojjGb1QIDAQAB';

class SignIn extends Component {
    state = {
        username: '',
        password: '',
        imgName: '',
        errorTip: '',
        code: ''
    };
    request = window.request;
    inputValue = e => {
        this.setState({ [e.target.id]: e.target.value });
    };

    handleSubmit = () => {
        const { username, password, code } = this.state;
        let encrypt = new JSEncrypt();
        encrypt.setPublicKey(PUBLI_KEY);
        let enPassword = encrypt.encrypt(password);

        if (username && password) {
            this.request('/user/login', {
                body: {
                    username,
                    password: enPassword,
                    code
                }
            }).then(json => {
                if (json.code === 10000000) {
                    sessionStorage.setItem('account', JSON.stringify(json.data));
                    this.props.history.push('/user');
                } else {
                    this.setState({ errorTip: json.msg });
                    if (json.data === 10001001) {
                        this.getValidImg();
                    }
                }
            });
        }
    };

    getValidImg = () => {
        const { username } = this.state;
        this.request('/valid/createCode', {
            method: 'GET',
            body: {
                username,
                type: 'login'
            }
        }).then(json => {
            if (json.code === 10000000) {
                this.setState({ imgName: json.data.imageName });
            } else {
                message.error(json.msg);
            }
        });
    };

    render() {
        const { username, password, errorTip, code, imgName } = this.state;
        const ok = this.state.username && this.state.password;
        return (
            <div className="content">
                <div className="form-box">
                    <h1>用户登录</h1>
                    <div className="attention">
                        <i className="iconfont icon-zhuyishixiang" />请确认您正在访问{' '}
                        <strong>http://www.uescoin.com</strong>
                    </div>
                    <div className="safety-site">
                        <i className="iconfont icon-suo1" />
                        <em>http</em>://www.uescoin.com
                    </div>
                    <p className="error-tip">
                        {errorTip && <i className="iconfont icon-zhuyishixiang" />}
                        {errorTip}
                    </p>
                    <ul className="form-list">
                        <li>
                            <i className="iconfont icon-youxiang" />
                            <input
                                type="text"
                                className="text"
                                id="username"
                                value={username}
                                onChange={this.inputValue}
                                placeholder="邮箱"
                            />
                        </li>
                        <li>
                            <i className="iconfont icon-suo" />
                            <input
                                type="password"
                                className="text"
                                id="password"
                                value={password}
                                onChange={this.inputValue}
                                placeholder="密码"
                                onKeyPress={e => {
                                    if (e.which === 13) this.handleSubmit();
                                }}
                            />
                        </li>
                        {imgName && [
                            <li key="code">
                                <i className="iconfont icon-yanzhengma2" />
                                <input
                                    type="text"
                                    className="text"
                                    id="code"
                                    value={code}
                                    onChange={this.inputValue}
                                    placeholder="验证码"
                                    onKeyPress={e => {
                                        if (e.which === 13) this.handleSubmit();
                                    }}
                                />
                                <img
                                    src={`${IMAGES_ADDRESS}/image/view/${imgName}`}
                                    className="inner-graphic"
                                    alt="图形验证码"
                                    onClick={this.getValidImg}
                                />
                            </li>,
                            <li key="tips" style={{ textAlign: 'right' }}>
                                点击图片刷新验证码
                            </li>
                        ]}
                        <li>
                            <input
                                type="submit"
                                className={classnames({
                                    button: true,
                                    disabled: !ok
                                })}
                                onClick={this.handleSubmit}
                                value="登录"
                            />
                        </li>
                        <li className="clear">
                            <Link to="/reset" className="pull-left">
                                忘记密码？
                            </Link>{' '}
                            <span className="pull-right">
                                还没账号？<Link to="/signup">立即注册</Link>
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}

export default SignIn;
