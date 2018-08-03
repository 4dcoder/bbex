import React, { Component } from 'react';

class Agreement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      detail: '<p></p>'
    };
  }

  componentWillMount() {
    this.getArgeement();
  }

  request = window.request;

  //获取用户协议
  getArgeement = () => {
    this.request('/cms/service', {
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
