import React, { Component } from 'react';
import { Button } from 'antd';
import './404.css';

class NotFound extends Component {
  handleToIndex = () => {
    this.props.history.push('/');
  };
  render() {
    return (
      <div className="content page-404">
        <div className="banner">404</div>
        <h3 className>对不起，未找到该页面。</h3>
        <Button type="normal" onClick={this.handleToIndex} style={{ width: 140, height: 40 }}>
          回到首页
        </Button>
      </div>
    );
  }
}

export default NotFound;
