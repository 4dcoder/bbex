import React, { Component } from 'react';
import { message, Modal, Button, Input } from 'antd';
import request from '../../utils/request';
import './google.css';


class GooglePopup extends Component {
  constructor(props){
    super(props);
    this.state = {
      errorTip: '',
      code: ''
    }
  }

  handleCancel=()=>{
    const { cancelHandle } = this.props;
    cancelHandle && cancelHandle();
  }

  handleOk = () =>{
    const { code } = this.state;
    const { confirmHandle } = this.props;
    if (code) {
      request('/user/googleValid', {
        body: { code }
      }).then(json => {
        if (json.code === 10000000) {
          message.success('谷歌验证成功！');

          confirmHandle && confirmHandle();
        
        } else {
          this.setState({errorTip: json.msg})
        }
      });
    } else {
      this.setState({errorTip: '请输入谷歌验证码'})
    }
  }

  codeOnchange = (e) => {
    let value  = e.target.value;
    if(/^\d{0,6}$/.test(value)){
      this.setState({code: value, errorTip: ''})
    }
  }

  render(){
    const { code, errorTip } = this.state;
    return <Modal
      title="谷歌验证码"
      visible={true}
      wrapClassName='v_center_modal'
      maskClosable={false}
      width={400}
      footer={null}
      onCancel={this.handleCancel}
  >
    <div className='google_popup'>
      <div className='error_tip'>{errorTip}</div>
      <Input size='large' value={code} placeholder='谷歌验证码' onChange={this.codeOnchange}/>
      <div className='google_btn'>
        <Button type='normal' onClick={this.handleCancel}>取消</Button>
        <Button onClick={this.handleOk} type='primary'>确定</Button>
      </div>
    </div>
  </Modal>
  }
}

export default GooglePopup;