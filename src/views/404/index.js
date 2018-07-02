import React, { Component } from 'react';
import { Button } from 'antd';
import './404.css';

class NotFound extends Component {

  handleToIndex = () => {
    this.props.history.push('/');
  }
  render() {
    return (
     <div className="page_404">
        <div>
          <h1>未找到该页面</h1>
          <Button type='primary' onClick={this.handleToIndex} style={{borderRadius:4, width: 140, height: 40 }}>回到首页</Button>
        </div>
     </div>
    )
  }
}

export default NotFound;
