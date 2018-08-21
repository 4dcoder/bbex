import React, { Component } from "react";
import { message, Modal } from "antd";
import NoCaptcha from "../nc";
import request from "../../../../utils/request";

class CodePopup extends Component {
  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel && onCancel();
  };

  handleOk = (appKey, token, ncData) => {
    const { onOk, username, type, flag, scene } = this.props;

    const { csessionid, sig } = ncData;
    let userProps = {};
    if (flag === "mail") {
      userProps = {
        mail: username
      };
    } else {
      userProps = {
        mobile: username
      };
    }
    request(`/${flag}/sendCode`, {
      body: {
        ...userProps,
        type,
        source: "pc",
        appKey,
        sessionId: csessionid,
        sig,
        vtoken: token,
        scene
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success(json.msg, 1);
        onOk && onOk();
      } else {
        message.destroy();
        message.warn(json.msg);
      }
    });
  };

  render() {
    const { scene } = this.props;
    return (
      <Modal
        title="验证码"
        visible={true}
        wrapClassName="v-center-modal mobile-register-modal"
        maskClosable={false}
        width={400}
        footer={null}
        onCancel={this.handleCancel}
      >
        <div
          className="graphic-popup"
          style={{ padding: "20px 0", textAlign: "center" }}
        >
          <NoCaptcha
            scene={scene}
            ncCallback={(appKey, token, ncData) => {
              if (ncData) {
                this.handleOk(appKey, token, ncData);
              } else {
                message.destroy();
                message.error("请先进行验证", 1);
              }
            }}
          />
        </div>
      </Modal>
    );
  }
}

export default CodePopup;
