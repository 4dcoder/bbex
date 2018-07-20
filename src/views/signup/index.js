import React, { Component } from 'react';
import { Tabs } from 'antd';
import MailForm from './MailForm';
import MobileForm from './MobileForm';
import './signup.css';
const TabPane = Tabs.TabPane;

class SignUp extends Component {

  render() {
    return (
      <div className="sign-up">
        <div className='sign-up-content'>
          <h4>用户注册</h4>
          <Tabs defaultActiveKey="mail">
            <TabPane tab="邮箱注册" key="mail">
              <MailForm />
            </TabPane>
            <TabPane tab="手机注册" key="mobile">
              <MobileForm />
            </TabPane>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default SignUp;
