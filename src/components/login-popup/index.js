import React, { Component } from "react";
import { Modal, Button, Input } from "antd";
import request from "../../utils/request";
import "./login.css";

class LoginPopup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorTip: "",
      code: ""
    };
  }

  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel && onCancel();
  };

  handleOk = () => {
    const { code } = this.state;
    const { onOk, tempToken, tokenType } = this.props;
    if (code) {
      request("/user/loginValid", {
        body: { code, tempToken, tokenType }
      }).then(json => {
        if (json.code === 10000000) {
          onOk && onOk(json.data);
        } else {
          this.setState({ errorTip: json.msg });
        }
      });
    } else {
      this.setState({ errorTip: "请输入验证码" });
    }
  };

  codeOnchange = e => {
    let value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      this.setState({ code: value, errorTip: "" });
    }
  };

  render() {
    const { code, errorTip } = this.state;
    return (
      <Modal
        title="验证码"
        visible={true}
        wrapClassName="v-center-modal"
        maskClosable={false}
        width={400}
        footer={null}
        onCancel={this.handleCancel}
      >
        <div className="google-popup">
          <p className='show-txt'>请在2分钟内登录</p>
          <div className="error-tip">{errorTip}</div>
          <Input
            size="large"
            value={code}
            placeholder="验证码"
            onChange={this.codeOnchange}
          />
          <div className="google-btn">
            <Button onClick={this.handleOk} type="primary">
              确定
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
}

export default LoginPopup;
