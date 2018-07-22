import React, { Component } from 'react';
import { Input, Select, Button, message } from 'antd';
import { withRouter } from 'react-router-dom';
import Validate from './Validate';
import CodePopup from '../../../components/code-popup';
import './withdraw.css';

const Option = Select.Option;

class Withdraw extends Component {
  constructor(props) {
    super(props);
    this.state = {
      addressHistory: [],
      myCoinCount: '',
      address: '',
      fee: 0,
      popup: '',
      vmodal: ''
    };
  }

  request = window.request;

  closeModal = () => {
    this.setState({ vmodal: '' });
  };

  withdrawClick = () => {
    const { myCoinCount, address } = this.state;
    if (address && address.length > 64) {
      message.destroy();
      message.warn('地址不能超过64位');
      return;
    }
    if (!address) {
      message.destroy();
      message.warn('地址不能为空');
      return;
    }
    if (!myCoinCount) {
      message.destroy();
      message.warn('数量不能为空');
      return;
    }
    this.submitWithdraw(json => {
      let mail = JSON.parse(sessionStorage.getItem('account')).mail;

      if (json.code === 10000000) {
        let id = json.data;
        this.setState({
          popup: (
            <Validate
              id={id}
              cancelClick={() => {
                this.setState({ popup: '' });
              }}
              okClick={() => {
                this.setState({ popup: '' });
                const { name, withdrawFee } = this.props;
                const myVolume = myCoinCount - withdrawFee;
                this.props.history.push('/user/status', { name, myVolume, address });
              }}
              getCode={() => {
                this.setState({
                  vmodal: (
                    <CodePopup
                      flag="mail"
                      mail={mail}
                      type="withdraw"
                      onCancel={() => {
                        this.closeModal();
                      }}
                      onOk={() => {
                        this.closeModal();
                      }}
                    />
                  )
                });
              }}
            />
          )
        });
      } else {
        message.destroy();
        message.info(json.msg);
      }
    });
  };

  submitWithdraw = callback => {
    const { id, name } = this.props;
    let { address, myCoinCount } = this.state;
    this.request('/coin/volume/withdraw', {
      method: 'POST',
      body: {
        coinId: id,
        symbol: name,
        address: address,
        volume: myCoinCount
      }
    }).then(json => {
      callback(json);
    });
  };

  componentWillMount() {
    this.getAddress();
  }

  // 获取提币地址
  getAddress = () => {
    const { id } = this.props;
    this.request('/withdraw/address/list/' + id, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        let addressHistory = json.data.map(item => {
          const { address } = item;
          return address;
        });
        this.setState({ addressHistory });
      }
    });
  };

  addressOnChange = value => {
    this.setState({ address: value });
  };

  countChange = e => {
    let value = e.target.value;
    if (/^\d*\.{0,1}\d{0,8}$/.test(value) && value.length < 16) {
      this.setState({ myCoinCount: value });
    }
  };

  render() {
    const { id, name, volume, withdrawFee, withdrawMaxVolume, withdrawMinVolume } = this.props;
    let { addressHistory, myCoinCount, address } = this.state;

    let lastCount = myCoinCount - withdrawFee;
    if (isNaN(lastCount)) {
      lastCount = 0;
    } else if (lastCount > 0) {
      lastCount = lastCount.toFixed(8);
    } else {
      lastCount = 0;
    }

    return (
      <div className="withdraw-content">
        <div className="title">提币地址</div>
        <div>
          <Select
            style={{ width: '100%' }}
            onChange={this.addressOnChange}
            size="large"
            value={address}
            mode="combobox"
          >
            {addressHistory.map(item => {
              return (
                <Option key={item} value={item}>
                  {item}
                </Option>
              );
            })}
          </Select>
        </div>
        <ul className="count-top">
          <li className="title">数量</li>
          <li className="title">
            可用余额： <span className="rest-number">{volume}</span>限额：{' '}
            <span className="limite-number">{withdrawMaxVolume}</span>
          </li>
        </ul>
        <Input
          placeholder="请输入数量"
          onChange={this.countChange}
          value={myCoinCount}
          size="large"
        />

        <ul className="my-count">
          <li>
            <div className="title">手续费</div>
            <div className="money">
              <Input disabled size="large" value={withdrawFee} />
              <span>{name}</span>
            </div>
          </li>
          <li>
            <div className="title">到账数量</div>
            <div className="number">
              <Input disabled size="large" value={lastCount} />
              <span>{name}</span>
            </div>
          </li>
        </ul>
        <div className="btn-block">
          <ul>
            <li>温馨提示</li>
            <li>
              {' '}
              最小提币数量为：<span className="min-withdraw">{withdrawMinVolume}</span>
              {name}
            </li>
            <li>
              为保障资金安全，当您账户安全策略变更，密码修改，使用新地址提币。我们会对你提笔币进行人工审核，请耐心等待工作人员电话或邮件联系。
            </li>
            <li>请务必确认电脑及浏览器安全，防止信息被篡改或泄漏。</li>
          </ul>

          <div className="btn">
            <Button onClick={this.withdrawClick} type="primary" size="large" style={{ width: 100 }}>
              提币
            </Button>
          </div>
        </div>

        {this.state.popup}
        {this.state.vmodal}
      </div>
    );
  }
}

export default withRouter(Withdraw);
