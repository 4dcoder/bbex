import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { JSEncrypt } from '../../utils/jsencrypt.js';
import { PUBLI_KEY } from '../../utils/constants';

class SubmitRest extends Component {
    state = {
        ptoken: this.props.location.search.substr(1).split('=')[1],
        password: '',
        repassword: '',
        errorTip: '',
        resetSuccess: false
    };

    request = window.request;

    inputValue = e => {
        this.setState({ [e.target.id]: e.target.value });
    };

    reset = () => {
        const { password, repassword } = this.state;

        if (password === repassword) {

            let encrypt = new JSEncrypt();
            encrypt.setPublicKey(PUBLI_KEY);
            let enPassword = encrypt.encrypt(password);

            this.request('/user/mail/resetpwd', {
                body: {
                    password: enPassword,
                    ptoken: this.state.ptoken
                }
            }).then(json => {
                if (json.code === 10000000) {
                    this.setState({ resetSuccess: true });
                } else {
                    this.setState({ errorTip: '该链接已经失效' });
                }
            });
        } else {
            this.setState({ errorTip: '两次密码输入不一致！' });
        }
    };

    render() {
        const { password, repassword, errorTip, resetSuccess } = this.state;
        const ok = password && repassword;
        return (
            <div className="content">
                {resetSuccess ? (
                    <div className="form-box">
                        <h1>重置密码成功！</h1>
                        <ul className="form-list">
                            <li className="form-box-desc">
                                现在去
                                <Link to="/signin">登录</Link>
                            </li>
                        </ul>
                    </div>
                ) : (
                        <div className="form-box">
                            <h1>重置密码</h1>
                            <p className="error-tip">
                                {errorTip && (
                                    <i className="iconfont icon-zhuyishixiang" />
                                )}
                                {errorTip}
                            </p>
                            <ul className="form-list">
                                <input
                                    type="password"
                                    style={{display: 'none'}}
                                    autocomplete='off'
                                />
                                <li>
                                    <i className="iconfont icon-youxiang" />
                                    <input
                                        type="password"
                                        className="text"
                                        id="password"
                                        value={password}
                                        onChange={this.inputValue}
                                        placeholder="新密码"
                                        autocomplete='off'
                                    />
                                </li>
                                <li>
                                    <i className="iconfont icon-youxiang" />
                                    <input
                                        type="password"
                                        className="text"
                                        id="repassword"
                                        value={repassword}
                                        onChange={this.inputValue}
                                        placeholder="确认密码"
                                        autocomplete='off'
                                    />
                                </li>
                                <li>
                                    <input
                                        type="submit"
                                        className={classnames({
                                            button: true,
                                            disabled: !ok
                                        })}
                                        onClick={this.reset}
                                        value="确定"
                                    />
                                </li>
                            </ul>
                        </div>
                    )}
            </div>
        );
    }
}

export default SubmitRest;
