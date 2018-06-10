import React, { Component } from 'react';
import { Button, Row, Col } from 'antd';
import Password from './Password';
import './security.css'

class Security extends Component {
  constructor(props){
    super(props);
    this.state = {
      dialog: '',
    }
  }

  showDialog = () =>{
    this.setState({dialog: <Password 
      closeModal = {()=>{
        this.setState({dialog: ''});
      }}
    />})
  }

  render(){
    const mobile = sessionStorage.getItem('account')? JSON.parse(sessionStorage.getItem('account')).mobile : "";
    return <div className="security_con user-cont">
      <Row type="flex">
        <Col span={6}>手机号</Col>
        <Col span={18}>{mobile}</Col>
      </Row>
      <Row type="flex">
        <Col span={6} style={{lineHeight: 40, height: 40}}>密码</Col>
        <Col span={18} style={{lineHeight: 40, height: 40}}> <Button onClick={this.showDialog} type="primary" style={{borderRadius: 4}}>修改密码</Button></Col>
      </Row>
      {this.state.dialog}
    </div>
  }
}

export default Security;