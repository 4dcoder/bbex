import React, { Component } from 'react';
import { Tabs } from 'antd';
import MailForm from './MailForm';
import MobileForm from './MobileForm';
import './signup.css';
const TabPane = Tabs.TabPane;

class SignUp extends Component {

  render() {
    const { localization } = this.props;
    return (
      <div className="sign-up">
        <div className='sign-up-content'>
          <h4>{localization['用户注册']}</h4>
          <Tabs defaultActiveKey="mobile">
            <TabPane tab={localization['手机注册']} key="mobile">
              <MobileForm localization={localization} />
            </TabPane>
            <TabPane tab={localization['邮箱注册']} key="mail">
              <MailForm localization={localization} />
            </TabPane>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default SignUp;
