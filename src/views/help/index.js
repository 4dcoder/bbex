import React, { Component } from 'react';
import { List, message } from 'antd';
import './help.css';


class Help extends Component {

  constructor(props) {
    super(props);
    this.state = {
      current: 1,
      helps: [],
      total: 0,
      loading: false
    }
  }

  request = window.request;

  componentWillMount() {
    this.getHelp(1);
  }

  getHelp = (page) => {
    this.setState({ loading: true })
    this.request('/cms/helpCenter/list', {
      body: {
        language: 'zh_CN',
        currentPage: page,
        showCount: 10
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ helps: json.data.list, total: json.data.count })
        this.setState({ loading: false })
      } else {
        message.error(json.msg);
        this.setState({ loading: false })
      }
    });
  };

  itemClick = item => {
    this.props.history.push(`/help/${item.id}`);
  };

  pageChange = (page) => {
    this.getHelp(page);
    this.setState({ current: page })
  }


  render() {
    const { current, helps, total, loading } = this.state;
    return (
      <div className="help">
        <div className="help-container">
          <h4>帮助中心</h4>
          <List
            size="large"
            dataSource={helps}
            loading={loading}
            renderItem={item => (<List.Item onClick={() => {
              this.itemClick(item)
            }}>
              {item.title}
            </List.Item>)}
            pagination={{
              current,
              total,
              pageSize: 10,
              onChange: page => {
                this.pageChange(page);
              }
            }}
          />
        </div>
      </div>
    )
  }
}

export default Help;
