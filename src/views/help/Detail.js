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
  
  componentWillMount() {
    this.getHelpDetail(this.props.match.params.id);
  }

  itemClick = item => {
    this.props.history.push(`/help/${item.id}`);
  };

  //获取公告
  getHelpDetail = id => {
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
    return <div dangerouslySetInnerHTML={{ __html: this.state.content }} />;
  }
}

export default Detail;
