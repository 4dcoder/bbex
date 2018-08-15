import React, { Component, Fragment } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Carousel, message, Modal } from 'antd';
import { stampToDate } from '../../utils';

class NoticeBar extends Component {
  state = {
    notices: [],
    noticeContent: '<p></p>',
    modalVisible: false
  };

  request = window.request;

  componentWillMount() {
    this.getNotice();
  }

  moreNoticeClick = () => {
    this.props.history.push('/notice');
  };

  //获取公告
  getNotice = () => {
    this.request('/cms/notice/list', {
      body: {
        language: 'zh_CN',
        currentPage: 1,
        showCount: 3
      }
    }).then(json => {
      if (json.code === 10000000) {
        const notices = json.data.list;
        const latestNoticeId = localStorage.getItem('latestNoticeId');
        if (notices.length > 0 && notices[0].id !== latestNoticeId) {
          const noticeId = notices[0].id;
          this.getNoticeDetail(noticeId);
          localStorage.setItem('latestNoticeId', noticeId);
        }
        this.setState({ notices });
      } else {
        message.error(json.msg);
      }
    });
  };

  //获取公告
  getNoticeDetail = id => {
    this.request('/cms/view/' + id, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ noticeContent: json.data.content });
        this.showModal();
      } else {
        message.error(json.msg);
      }
    });
  };

  showModal = () => {
    this.setState({ modalVisible: true });
  };

  hideModal = () => {
    this.setState({ modalVisible: false });
  };

  render() {
    const { localization } = this.props;
    const { notices, modalVisible, noticeContent } = this.state;
    return (
      <div className="scroll-notice">
        <i className="iconfont icon-notice" />
        <Carousel autoplay={true} vertical={true} dots={false}>
          {notices.map(notice => {
            return (
              <div key={notice.id}>
                <Link to={`/notice/${notice.id}`}>
                  {notice.title}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {stampToDate(Number(notice.createDate), 'YYYY-MM-DD')}
                </Link>
              </div>
            );
          })}
        </Carousel>
        <span className="notice-more" onClick={this.moreNoticeClick}>
          {localization['more']}
          >>
        </span>
        <Modal
          title={localization['公告']}
          width={800}
          wrapClassName="v-center-modal"
          visible={modalVisible}
          onCancel={this.hideModal}
          footer={null}
        >
          <div dangerouslySetInnerHTML={{ __html: noticeContent }} />
        </Modal>
      </div>
    );
  }
}

export default withRouter(NoticeBar);
