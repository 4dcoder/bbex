import React, { Component } from 'react';
import { Input, Modal, message } from 'antd';

class Validate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      googleCode: '',
      number: 59,
      disabled: false
    };
  }

  request = window.request;

  handleOk = id => {
    const { googleCode } = this.state;
    if (/^\d{6}$/.test(googleCode) && googleCode) {
      this.validate({
        id,
        googleCode,
        callback: json => {
          if (json.code === 10000000) {
            let { okClick } = this.props;
            okClick();
          } else {
            message.destroy();
            message.info(json.msg);
          }
        }
      });
    } else {
      message.destroy();
      message.info('请输入数据', 1);
    }
  };

  handleCancel = () => {
    this.setState({ googleCode: '' });
    let { cancelClick } = this.props;
    cancelClick();
  };

  googleChange = e => {
    if (/^\d{0,6}$/.test(e.target.value)) {
      this.setState({ googleCode: e.target.value });
    }
  };

  validate = ({ id, googleCode, callback }) => {
    this.request('/coin/volume/withdraw/validate', {
      method: 'POST',
      body: {
        id,
        googleCode
      }
    }).then(json => {
      callback(json);
    });
  };
  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    const { googleCode } = this.state;
    return (
      <Modal
        title="提币验证"
        maskClosable={false}
        visible={true}
        width={400}
        cancelText="取消"
        wrapClassName="v-center-modal"
        okText="确认"
        onOk={() => {
          let id = this.props.id;
          this.handleOk(id);
        }}
        onCancel={this.handleCancel}
      >
        <div style={{ marginTop: 20 }}>
          <Input
            value={googleCode}
            size="large"
            onChange={this.googleChange}
            placeholder="请输入6位谷歌验证码"
          />
        </div>
      </Modal>
    );
  }
}
export default Validate;
