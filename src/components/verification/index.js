import React, { Component } from 'react';
import { Modal, Button } from 'antd';

class Verification extends Component{

  render() {
    return (
      <Modal
          title=""
          wrapClassName='verification_modal'
          visible={true}
          width={400}
          footer={null}
          onCancel={this.props.closeModal}
        >
          <div className='verification_content'>
              <i className="iconfont icon-icon" />
          </div>
          <p className="message">为了您的账号安全，我们强烈建议您开启二次验证。</p>
          <div className='footer_btn'>
            <Button onClick={this.props.closeModal}>暂不设置</Button>
            <Button type="primary" onClick={this.props.gotoSetting}>立即设置</Button>
          </div>
        </Modal>
    );
  }
}

export default Verification;