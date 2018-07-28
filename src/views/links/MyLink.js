import React, { Component } from 'react';
import request from '../../utils/request';
import './link.css';

class MyLink extends Component {
  constructor(props) {
    super(props);
    this.state = {
      detail: '<p></p>'
    };
  }

  container = document.querySelector('.container');

  componentDidMount() {
    // 给container 添加 link-container
    const classname = this.container.className;
    this.container.className = classname + ' link-container';


    this.getLinkDetail();
  }

  componentWillUnmount() {
    // 给container 移除 link-container
    this.container.className = 'container';
  }

  //获取访问的网址
  getLinkDetail = () => {
    const id = this.props.match.params.id;

    request(`/cms/view/${id}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ detail: json.data.content });
      } else {
      }
    });
  };
  render() {
    let { detail } = this.state;
    return <div dangerouslySetInnerHTML={{ __html: detail }} />;
  }
}
export default MyLink;
