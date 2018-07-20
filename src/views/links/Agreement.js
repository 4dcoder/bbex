import React, { Component } from 'react';
import request from '../../utils/request';

class Agreement extends Component {
  constructor(props){
    super(props);
    this.state={
      detail: '<p></p>'
    }
  }
  componentDidMount(){
    this.getArgeement();
  }

  //获取用户协议
  getArgeement = () => {
    request('/cms/service', {
        method: 'GET',
        body: {
          language: 'zh_CN'
        }
    }).then(json => {
        if (json.code === 10000000) {
            this.setState({ detail: json.data });
        }
    });
  }

  render(){
    let { detail } = this.state;
    return <div dangerouslySetInnerHTML={{ __html: detail }}>
      
    </div>
  }
}
export default Agreement;