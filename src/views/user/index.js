import React, { Component } from 'react';
import { Route, NavLink } from 'react-router-dom';
import Property from './property';
import Verified from './verified';
import Payment from './payment';
import Transaction from './transaction';
import Finance from './finance';
import Address from './address';
import Status from './status';
import Security from './security';
import Invite from './invite';
import Verification from '../../components/verification';

import './user.css';

class UserCenter extends Component {
  state = {
    popup: false
  };

  componentDidMount() {
    if (sessionStorage.getItem('account')) {
      const account = JSON.parse(sessionStorage.getItem('account'));
      const { pathname } = this.props.location;
      if (!account.googleAuth && pathname.indexOf('security') === -1) {
        this.setState({
          popup: (
            <Verification
              closeModal={() => {
                this.closePopup();
              }}
              gotoSetting={() => {
                this.closePopup();
                this.props.history.push('/user/security');
              }}
            />
          )
        });
      }
    }
  }

  closePopup = () => {
    this.setState({ popup: false });
  };

  render() {
    const { match } = this.props;
    const { popup } = this.state;
    const account = JSON.parse(sessionStorage.getItem('account'));
    return (
      <div className="content user">
        <div className="content-inner">
          <div className="user-bar">
            <div className="user-header">
              <div className="user-avatar">
                {account.realName ? account.realName.substr(0, 1) : '?'}
              </div>
              {account.mail}
            </div>
            <div className="user-nav">
              <NavLink to={`${match.path}`} exact className="user-link" activeClassName="active">
                <i className="iconfont icon-zichan" />我的资产
              </NavLink>
              <NavLink
                to={`${match.path}/transaction`}
                className="user-link"
                activeClassName="active"
              >
                <i className="iconfont icon-jiaoyi" />我的交易
              </NavLink>
              <NavLink to={`${match.path}/finance`} className="user-link" activeClassName="active">
                <i className="iconfont icon-caiwu" />财务记录
              </NavLink>
              <NavLink to={`${match.path}/security`} className="user-link" activeClassName="active">
                <i className="iconfont icon-anquanzhongxin" />安全中心
              </NavLink>
              <NavLink to={`${match.path}/verified`} className="user-link" activeClassName="active">
                <i className="iconfont icon-shimingrenzheng" />实名认证
              </NavLink>
              <NavLink to={`${match.path}/payment`} className="user-link" activeClassName="active">
                <i className="iconfont icon-zhifu" />支付绑定
              </NavLink>
              <NavLink to={`${match.path}/address`} className="user-link" activeClassName="active">
                <i className="iconfont icon-navicon-fwdzpz" />地址管理
              </NavLink>
              <NavLink to={`${match.path}/invite`} className="user-link" activeClassName="active">
                <i className="iconfont icon-yaoqingma" />我的邀请
              </NavLink>
            </div>
          </div>
          <Route exact path={`${match.path}/`} component={Property} />
          <Route path={`${match.path}/verified`} component={Verified} />
          <Route path={`${match.path}/payment`} component={Payment} />
          <Route path={`${match.path}/transaction`} component={Transaction} />
          <Route path={`${match.path}/finance`} component={Finance} />
          <Route path={`${match.path}/address`} component={Address} />
          <Route path={`${match.path}/security`} component={Security} />
          <Route path={`${match.path}/status`} component={Status} />
          <Route path={`${match.path}/invite`} component={Invite} />
        </div>
        {popup}
      </div>
    );
  }
}

export default UserCenter;
