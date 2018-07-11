import React, { Component } from 'react';
import { Modal, Select, Input, message } from 'antd';

const Option = Select.Option;
const { TextArea } = Input;
const list = [
  '对方未付款','对方未放行','对方无应答','对方有欺诈行为','其他'
]

class AppealModal extends Component{
  constructor(props){
    super(props);
    this.state={
      appealType: '',
      reason: ''
    }
  }

  handleChange=(appealType)=>{
    this.setState({appealType})
  }

  desChange=(e) => {
    
    let value = e.target.value
    if(value.length<500){
      this.setState({reason: value})
    }
    
  }

  // 提交申诉
  okClick=()=>{
    const {appealType, reason} = this.state;
    if(appealType){
      this.props.onOk(appealType, reason);
    }else{
      message.destroy();
      message.warn('请选择申诉类型');
    }
  }

  render(){
    const { appealType, reason } = this.state;
    return <Modal
      title="订单申诉"
      visible
      width={500}
      wrapClassName="v-center-modal"
      okText='确认'
      cancelText='取消'
      onCancel={this.props.onCancel}
      onOk={this.okClick}
    >
      <div className='appeal_content'>
        <p>提起申诉后资产将会冻结，申诉专员将介入本次交易，直至申诉结束。恶意申诉者将会被冻结账户。付款成功或者取消申诉后5分钟才可发起申诉</p>
        <h4 style={{margin: '8px 0', color: '#e8e8e8'}}>申诉类型</h4>
        <Select value={appealType} onChange={this.handleChange} style={{width:450}}>
          {list.map((item, index)=>{
            return  <Option value={item} key={index}>{item}</Option>
          })}
        </Select>
        <h4 style={{margin: '8px 0', color: '#e8e8e8'}}>申诉理由</h4>
        <TextArea rows={5} value={reason} onChange={this.desChange}/>
      </div>
    </Modal>
  }
}
export default AppealModal;