import React, { Component } from 'react';
import { message } from 'antd';
import './detail.css';

class Detail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: '<p></p>'
    };
  }

  request = window.request;

  container = document.querySelector('.container');

  componentWillMount() {
    this.getNoticeDetail(this.props.match.params.id);
  }

  componentDidMount() {
    // 给container 添加 html-wrap
    const classname = this.container.className;
    this.container.className = classname + ' html-wrap';
  }

  componentWillUnmount() {
    // 给container 移除 html-wrap
    this.container.className = 'container';
  }

  //获取公告
  getNoticeDetail = id => {
    this.request('/cms/view/' + id, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ content: json.data.content });
      } else {
        message.error(json.msg);
      }
    });
  };

  render() {
    return (
      <div className="content-inner notice-detail">
        <div dangerouslySetInnerHTML={{ __html: this.state.content }} />
      </div>
    );
  }
}

export default Detail;
