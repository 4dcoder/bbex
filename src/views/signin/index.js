import React, { Component } from "react";
import { Link } from "react-router-dom";
import { message } from "antd";
import classnames from "classnames";
import { JSEncrypt } from "../../utils/jsencrypt.js";
import { PUBLI_KEY } from "../../utils/constants";
import NoCaptcha from "../../components/nc";
// import LoginPopup from "../../components/login-popup";

class SignIn extends Component {
  state = {
    username: "",
    password: "",
    errorTip: "",
    url: "",
    popup: "",
    disabled: false,
    requireCaptcha: false,
    appKey: "",
    token: "",
    ncData: "",
    scene: window.navigator.userAgent.match(
      /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
    )
      ? "nc_register_h5"
      : "nc_register",
    nc: null
  };

  request = window.request;

  inputValue = e => {
    this.setState({ [e.target.id]: e.target.value });
  };
  closeModal = () => {
    this.setState({ popup: "" });
  };

  handleSubmit = () => {
    this.setState({ disabled: true });
    const { localization } = this.props;
    const { username, password, appKey, token, ncData, scene } = this.state;
    const { csessionid, sig } = ncData;
    let encrypt = new JSEncrypt();
    encrypt.setPublicKey(PUBLI_KEY);
    let enPassword = encrypt.encrypt(password);

    if (username && password) {
      const ncParams = ncData
        ? {
            appKey,
            sessionId: csessionid,
            sig,
            vtoken: token,
            scene
          }
        : {};

      this.request("/user/login", {
        body: {
          username,
          password: enPassword,
          source: "pc",
          ...ncParams
        }
      })
        .then(json => {
          this.setState({ disabled: false });
          if (json.code === 10000000) {
            sessionStorage.setItem("account", JSON.stringify(json.data));
            this.props.history.push("/trade");
            /*  message.success("验证码发送成功", 1);
            const { tempToken, tempTokenType } = json.data;
            this.setState({
              popup: (
                <LoginPopup
                  tempToken={tempToken}
                  tokenType={tempTokenType}
                  onCancel={this.closeModal}
                  onOk={account => {
                    message.success("登录成功", 1);
                    sessionStorage.setItem("account", JSON.stringify(account));
                    this.closeModal();
                    this.props.history.push("/trade");
                  }}
                />
              )
            }); */
          } else {
            const { nc } = this.state;
            if (nc) {
              nc.reload();
              this.setState({ ncData: "" });
            }
            if (json.code === 10001001) {
              this.setState({ requireCaptcha: true });
              if (
                json.msg === "Invalid Credentials" ||
                json.msg === "用户不存在"
              ) {
                this.setState({ errorTip: localization["用户名或密码不正确"] });
              } else {
                this.setState({ errorTip: json.msg });
              }
            } else if (json.code === 10001000) {
              this.setState({ errorTip: localization["用户名或密码不正确"] });
            } else if (json.code === 10004007) {
              this.setState({ errorTip: localization["用户名或密码不正确"] });
            } else {
              if (json.msg === "Invalid Credentials") {
                this.setState({ errorTip: localization["用户名或密码不正确"] });
              } else {
                this.setState({ errorTip: json.msg });
              }
            }
          }
        })
        .catch(error => {
          this.setState({ disabled: false });
        });
    }
  };

  //获取访问的网址
  getUrl = () => {
    this.request("/cms/link", {
      method: "GET"
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ url: json.data });
      } else {
        message.error(json.msg);
      }
    });
  };
  componentWillMount() {
    this.getUrl();
  }

  render() {
    const { localization } = this.props;
    const {
      popup,
      username,
      password,
      errorTip,
      requireCaptcha,
      url,
      disabled,
      ncData,
      scene
    } = this.state;
    const ok =
      this.state.username &&
      this.state.password &&
      (!requireCaptcha || (requireCaptcha && ncData));

    return (
      <div className="content">
        <div className="form-box">
          <h1>{localization["用户登录"]}</h1>
          <div className="attention">
            <i className="iconfont icon-zhuyishixiang" />
            {localization["请确认您正在访问"]} <strong>{url}</strong>
          </div>
          <div className="safety-site">
            <i className="iconfont icon-suo1 font-color-green" />
            {url}
          </div>
          <p className="error-tip">
            {errorTip && <i className="iconfont icon-zhuyishixiang" />}
            {errorTip}
          </p>
          <ul className="form-list">
            <li>
              <i className="iconfont icon-yonghu1" />
              <input
                type="text"
                className="text"
                id="username"
                value={username}
                onChange={this.inputValue}
                placeholder={`${localization["手机"]}/${localization["邮箱"]}`}
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
                placeholder={localization["密码"]}
                onKeyPress={e => {
                  if (e.which === 13) this.handleSubmit();
                }}
              />
            </li>
            {requireCaptcha && (
              <li key="code">
                <NoCaptcha
                  scene={scene}
                  ncCallback={(appKey, token, ncData, nc) => {
                    if (ncData) {
                      this.setState({ appKey, token, ncData, nc });
                    } else {
                      message.destroy();
                      message.error("请先进行验证", 1);
                    }
                  }}
                />
              </li>
            )}
            <li>
              <input
                type="submit"
                className={classnames({
                  button: true,
                  disabled: !ok || disabled
                })}
                onClick={this.handleSubmit}
                value={localization["登录"]}
              />
            </li>
            <li className="clear">
              <Link to="/reset" className="pull-left">
                {localization["忘记密码？"]}
              </Link>{" "}
              <span className="pull-right">
                {localization["还没账号？"]}
                <Link to="/signup">{localization["立即注册"]}</Link>
              </span>
            </li>
          </ul>
        </div>
        {popup}
      </div>
    );
  }
}

export default SignIn;
