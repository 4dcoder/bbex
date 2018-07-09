import React, { Component } from 'react';
import { Table, Row, Col, Input, Button, message } from 'antd';
import { copy } from '../../../utils';

import './invite.css';

class Invite extends Component {
  state = {
    currentPage: 1,
    showCount: 10,
    totalCount: 0,
    inviteList: []
  };

  request = window.request;

  handleCopy = text => {
    copy(text).then(() => {
      message.success('复制成功！');
    });
  };

  getInvitedPerson = currentPage => {
    this.setState({ inviteList: null });
    this.request('/user/invotes', {
      method: 'GET',
      body: {
        currentPage,
        showCount: this.state.showCount
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({
          currentPage,
          totalCount: json.data.count,
          inviteList: json.data.list
        });
      } else {
        this.setState({
          currentPage,
          totalCount: 0,
          inviteList: []
        });
      }
    });
  };

  componentDidMount() {
    this.getInvitedPerson(this.state.currentPage);
  }

  render() {
    const { currentPage, showCount, totalCount, inviteList } = this.state;
    const { inviteCode } = JSON.parse(sessionStorage.getItem('account'));
    const inviteLink = `${window.location.origin}/signup?inviteCode=${inviteCode}`;

    const inviteColumns = [
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        render: (text, record, index) => (currentPage - 1) * showCount + index + 1
      },
      {
        title: '用户名',
        dataIndex: 'username',
        key: 'username'
      },
      {
        title: '邮箱',
        dataIndex: 'mail',
        key: 'mail'
      }
    ];

    return (
      <div className="user-cont invite">
        <div className="invite-box">
          <h2 className="invite-box-tit">我的邀请方式</h2>
          <div className="invite-box-cont">
            <Row gutter={16}>
              <Col className="gutter-row" span={7}>
                <Input
                  addonAfter={
                    <span onClick={this.handleCopy.bind(this, inviteCode)}>
                      复制邀请码
                    </span>
                  }
                  size="large"
                  defaultValue={inviteCode}
                  disabled
                />
              </Col>
              <Col className="gutter-row" span={15} offset={2}>
                <Input
                  addonAfter={
                    <span onClick={this.handleCopy.bind(this, inviteLink)}>
                      复制邀请链接
                    </span>
                  }
                  size="large"
                  defaultValue={inviteLink}
                  disabled
                />
              </Col>
            </Row>
          </div>
        </div>
        <div className="invite-box">
          <h2 className="invite-box-tit">我邀请的人</h2>
          <div className="invite-box-cont">
            <Table
              dataSource={inviteList}
              columns={inviteColumns}
              loading={!inviteList}
              pagination={{
                current: currentPage,
                total: totalCount,
                pageSize: showCount,
                onChange: page => {
                  this.getInvitedPerson(page);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Invite;
