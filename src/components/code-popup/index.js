import React, { Component } from 'react';
import { message, Modal, Button, Input } from 'antd';
import request from '../../utils/request';
import { IMAGES_ADDRESS } from '../../utils/constants';
import './code.css';

class CodePopup extends Component {

  constructor(props) {
    super(props);
    this.state = {
      code: '',
      imgName: '',
      errorTip: ''
    }
  }

  componentWillMount() {
    this.getValidImg();
  }

  codeChange = (e) => {
    const value = e.target.value;
    if ((/^\w{0,8}$/).test(value)) {
      this.setState({ code: value, errorTip: '' });
    }
  }

  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel && onCancel();
  }

  handleOk = () => {
    const { code } = this.state;
    const {
      flag,
      mail,
      type,
      onOk,
    } = this.props;

    let body = {};
    if (flag === 'mail') {
      body = { mail, type, code }
    } else {
      body = { mobile: mail, type, code }
    }
    if (code) {
      request(`/${flag}/sendCode`, {
        body
      }).then(json => {
        if (json.code === 10000000) {
          message.success(json.msg, 1);
          onOk && onOk();
        } else if (json.code === -2) {
          this.setState({ errorTip: json.msg });
        } else {
          this.setState({ errorTip: json.msg });
        }
      });
    } else {
      this.setState({ errorTip: '请输入验证码！' });
    }

  }

  getValidImg = () => {
    const { mail, type } = this.props;
    request('/valid/createCode', {
      method: 'GET',
      body: {
        type,
        username: mail,
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ imgName: json.data.imageName });
      } else {
        message.error(json.msg);
      }
    })
  }


  render() {

    const { imgName, code, errorTip } = this.state;

    return <Modal
      title="验证码"
      visible={true}
      wrapClassName='v-center-modal'
      maskClosable={false}
      width={400}
      footer={null}
      onCancel={this.handleCancel}
    >
      <div className='graphic-popup'>
        <div className='error-tip'>{errorTip}</div>
        <div className='graphic-content'>
          <Input
            value={code}
            placeholder='图形验证码'
            onChange={this.codeChange}
            prefix={<i className="iconfont icon-yanzhengma1"></i>}
          />
          {imgName && <img
            src={`${IMAGES_ADDRESS}/image/view/${imgName}`}
            className="graphic-img"
            alt="图形验证码"
            onClick={this.getValidImg}
          />}
        </div>
        <div className='graphic-img-text'>点击图片刷新验证码</div>
        <div className='graphic-btn'>
          <Button onClick={this.handleCancel}>取消</Button>
          <Button type='primary' onClick={this.handleOk}>确认</Button>
        </div>
      </div>

    </Modal>
  }
}

export default CodePopup;