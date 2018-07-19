import React, { Component } from 'react';
import request from '../../utils/request';
import './link.css';

class MyLink extends Component {
  constructor(props){
    super(props);
    this.state={
      detail:'<p></p>'
    }
  }

  componentDidMount(){
    this.getLinkDetail();
  }

  //获取访问的网址
  getLinkDetail = () => {
    const id = this.props.match.params.id;

    request(`/cms/view/${id}`, {
        method: 'GET',
    }).then(json => {
        if (json.code === 10000000) {
            this.setState({ detail: json.data.content });
        } else {

        }
    });
  }
  render(){
    let { detail } = this.state;
    return <div style={{ padding:'10px 20px 0' }} >
      <div id='link_container' dangerouslySetInnerHTML={{ __html: detail }} >
        
      </div>
    </div>
  }
}
export default MyLink;