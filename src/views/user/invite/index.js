import React, { Component } from 'react';
import { Table, Modal, Input } from 'antd';
import QRCode from 'qrcode.react';

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
    const { realName, inviteCode } = JSON.parse(sessionStorage.getItem('account'));
    const inviteLink = `${window.location.origin}/signup?inviteCode=${inviteCode}`;
    const mobileLink = `${window.location.origin}/share.html?realName=${encodeURI(
      realName ? realName : ''
    )}&inviteCode=${inviteCode}`;

    const inviteColumns = [
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        render: (text, record, index) => (currentPage - 1) * showCount + index + 1
      },
      {
        title: '用户名',
        dataIndex: 'realName',
        key: 'realName'
      },
      {
        title: '手机号',
        dataIndex: 'mobile',
        key: 'mobile'
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
                value={mobileLink}
                size={180}
                style={{ marginRight: 40, border: '1px solid #dadada', cursor: 'pointer' }}
                bgColor={'#ffffff'}
                fgColor={'#000000'}
                level={'L'}
                onClick={this.handleShowQRCode}
              />
              <div style={{ paddingLeft: '40px' }}>手机邀请二维码</div>
            </li>
            <li>
              <Input
                addonAfter={
                  <span className="copy-btn" data-clipboard-text={inviteCode}>
                    复制邀请码
                  </span>
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
                  <span className="copy-btn" data-clipboard-text={inviteLink}>
                    复制PC端邀请链接
                  </span>
                }
                size="large"
                style={{ width: 550 }}
                defaultValue={inviteLink}
                disabled
              />
            </li>
            <li style={{ marginTop: 30 }}>
              <Input
                addonAfter={
                  <span className="copy-btn" data-clipboard-text={mobileLink}>
                    复制手机邀请链接
                  </span>
                }
                size="large"
                style={{ width: 600 }}
                defaultValue={mobileLink}
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
            style={{ margin: 10, border: '1px solid #dadada' }}
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
