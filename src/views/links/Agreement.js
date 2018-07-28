import React, { Component } from 'react';
import request from '../../utils/request';

class Agreement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      detail: '<p></p>'
    };
  }

  container = document.querySelector('.container');

  componentDidMount() {
    // 给container 添加 html-wrap
    const classname = this.container.className;
    this.container.className = classname + ' html-wrap';

    this.getArgeement();
  }

  componentWillUnmount() {
    // 给container 移除 html-wrap
    this.container.className = 'container';
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
  };

  render() {
    let { detail } = this.state;
    return <div dangerouslySetInnerHTML={{ __html: detail }} />;
  }
}
export default Agreement;
