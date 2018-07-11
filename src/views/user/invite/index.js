import React, { Component } from 'react';
import { Table, Modal, Input, message } from 'antd';
import QRCode from 'qrcode.react';
import { copy } from '../../../utils';

import './invite.css';

class Invite extends Component {
  state = {
    currentPage: 1,
    showCount: 10,
    totalCount: 0,
    inviteList: [],
    showQRCode: false
  };

  request = window.request;

  handleCopy = text => {
    copy(text).then(() => {
      message.success('复制成功！');
    });
  };

  handleShowQRCode = () => {
    this.setState({ showQRCode: true });
  };

  handleHideQRCode = () => {
    this.setState({ showQRCode: false });
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
    const { currentPage, showCount, totalCount, inviteList, showQRCode } = this.state;
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
          <ul className="invite-box-cont clear">
            <li className="pull-left">
              <QRCode
                value={inviteLink}
                size={110}
                style={{ marginRight: 40, border: '1px solid #e8e8e8', cursor: 'pointer' }}
                bgColor={'#ffffff'}
                fgColor={'#000000'}
                level={'L'}
                onClick={this.handleShowQRCode}
              />
            </li>
            <li>
              <Input
                addonAfter={
                  <span onClick={this.handleCopy.bind(this, inviteCode)}>复制邀请码</span>
                }
                size="large"
                style={{ width: 200 }}
                defaultValue={inviteCode}
                disabled
              />
            </li>
            <li style={{ marginTop: 30 }}>
              <Input
                addonAfter={
                  <span onClick={this.handleCopy.bind(this, inviteLink)}>复制邀请链接</span>
                }
                size="large"
                style={{ width: 550 }}
                defaultValue={inviteLink}
                disabled
              />
            </li>
          </ul>
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
        <Modal
          wrapClassName="v-center-modal"
          visible={showQRCode}
          footer={null}
          onCancel={this.handleHideQRCode}
        >
          <QRCode
            value={inviteLink}
            size={450}
            style={{ margin: 10, border: '1px solid #e8e8e8' }}
            bgColor={'#ffffff'}
            fgColor={'#000000'}
            level={'L'}
          />
        </Modal>
      </div>
    );
  }
}

export default Invite;
