import React, { Component } from 'react';
import './link.css';

class MyLink extends Component {
  constructor(props) {
    super(props);
    this.state = {
      detail: '<p></p>'
    };
  }

  request = window.request;

  componentWillMount() {
    this.getLinkDetail();
  }

  //获取访问的网址
  getLinkDetail = () => {
    const id = this.props.match.params.id;

    this.request(`/cms/view/${id}`, {
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
