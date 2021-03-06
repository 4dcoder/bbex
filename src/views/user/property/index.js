import React, { Component } from 'react';
import { Tabs, Table, Button, Input, message, Modal, Checkbox } from 'antd';
import Recharge from './Recharge';
import Withdraw from './Withdraw';

import './property.css';

const TabPane = Tabs.TabPane;
const Search = Input.Search;

class Property extends Component {
  state = {
    modalTit: '',
    showModal: false,
    actionType: '',
    availableC2c: 0,
    handleCoin: null,
    handleVolume: 0,
    c2cData: null,
    normalData: null,
    normalAllData: null,
    expandedRowKey: '',
    expendedFlag: '',
    currencyName: '',
    checked: false
  };

  request = window.request;

  componentWillMount() {
    this.getNormalData();
  }

  inputVolume = e => {
    let value = e.target.value;
    if (/^\d*\.{0,1}\d{0,8}$/.test(value) && value.length < 16) {
      this.setState({ handleVolume: value });
    }
  };

  tabChange = key => {
    if (key === 'routine') {
      this.getNormalData();
      this.setState({ currencyName: '' });
    } else if (key === 'c2c') {
      this.getC2cData();
    } else {
    }
  };
  getC2cData = () => {
    this.request('/offline/volume/list', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const c2cData = json.data.map(item => {
          item.key = item.coinId;
          item.volume = item.volume || '0.00000000';
          item.advertVolume = item.advertVolume || '0.00000000';
          item.lockVolume = item.lockVolume || '0.00000000';
          item.totalPrice = (
            Number(item.volume) +
            Number(item.advertVolume) +
            Number(item.lockVolume)
          ).toFixed(8);
          return item;
        });
        this.setState({ c2cData });
      } else {
        message.error(json.msg);
      }
    });
  };
  getNormalData = () => {
    this.request('/coin/volume/list', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const normalAllData = json.data.map(item => {
          let totalPrice = 0;
          let {
            id,
            name,
            volume,
            lockVolume,
            tokenStatus,
            withdrawFee,
            withdrawFeeType,
            withdrawMaxVolume,
            withdrawMinVolume
          } = item;
          volume = volume || '0.00000000';
          lockVolume = lockVolume || '0.00000000';
          totalPrice = (Number(volume) + Number(lockVolume)).toFixed(8);
          withdrawFee = withdrawFee || '0.00000000';
          return {
            key: id,
            id,
            name,
            volume,
            lockVolume,
            totalPrice,
            tokenStatus,
            withdrawFee,
            withdrawFeeType,
            withdrawMaxVolume,
            withdrawMinVolume
          };
        });
        const checked = localStorage.getItem('zeroChecked');
        let normalData = normalAllData;
        if (checked && checked === "true") {
          normalData = normalAllData.filter(item => {
            return item.volume > 0;
          });
          this.setState({ normalData, normalAllData, checked: true });
        } else {
          this.setState({ normalData, normalAllData, checked: false });
        }

      } else {
        message.error(json.msg);
      }
    });
  };

  handleRecharge = record => {
    this.setState({
      expandedRowKey: record.key,
      expendedFlag: 'recharge'
    });
  };
  handleWithdraw = record => {
    this.setState({
      expandedRowKey: record.key,
      expendedFlag: 'withdraw'
    });
  };

  handleSearch = e => {
    let value = e.target.value;
    if (value.length < 16) {
      let { normalAllData, checked } = this.state;
      let normalData = normalAllData;
      if (checked) {
        normalData = normalAllData.filter(item => {
          return item.volume > 0;
        });
      }
      let target = value.toUpperCase();
      normalData = normalData.filter(item => {
        return item.name.indexOf(target) > -1;
      });
      this.setState({ currencyName: value, normalData });
    }
  };

  zeroChange = (e) => {
    const checked = e.target.checked;
    const { normalAllData, currencyName } = this.state;
    const target = currencyName.toUpperCase();
    let normalData = normalAllData.filter(item => {
      return item.name.indexOf(target) > -1;
    });
    if (checked) {
      normalData = normalData.filter(item => {
        return item.volume > 0;
      });
    }
    this.setState({ checked, normalData });
    localStorage.setItem("zeroChecked", checked);
  }


  triggerAction = ({ type, coin }) => {
    const typeToTit = {
      turnIn: '从常规账户转入到C2C账户',
      turnOut: '从C2C账户转出到常规账户'
    };
    let url;
    if (type.indexOf('turn') > -1) {
      url = `/${type === 'turnIn' ? 'coin' : 'offline'}/volume/${coin.coinId}`;
    }
    this.request(url, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        if (!json.data) {
          message.info('您没有该币种资产！');
          return;
        }
        this.setState({
          modalTit: typeToTit[type],
          showModal: true,
          actionType: type,
          handleCoin: coin,
          availableC2c: json.data.volume
        });
      } else {
        message.error(json.msg);
      }
    });
  };

  turnAction = type => {
    const { handleCoin, handleVolume } = this.state;
    this.request(`/offline/volume/${type.substr(4).toLowerCase()}`, {
      body: {
        coinId: handleCoin.coinId,
        symbol: handleCoin.symbol,
        volume: handleVolume
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.getC2cData();
        message.success('操作成功！');
        this.hideModal();
      } else {
        if (type === 'turnOut' && json.code === 10004015) {
          message.error('资产不足');
        } else {
          message.error(json.msg);
        }
      }
    });
  };

  hideModal = () => {
    this.setState({
      modalTit: '',
      showModal: false,
      handleVolume: 0,
      availableC2c: 0
    });
  };

  render() {
    const {
      modalTit,
      showModal,
      actionType,
      availableC2c,
      handleCoin,
      handleVolume,
      c2cData,
      normalData,
      expandedRowKey,
      expendedFlag,
      currencyName,
      checked
    } = this.state;

    const routineColumns = [
      {
        title: '资金名称',
        dataIndex: 'name',
        key: 'name',
        render: text => {
          const type = text.toLowerCase();
          return (
            <div>
              <span className={`currency-logo ${type}`} />
              {text}
            </div>
          );
        }
      },
      {
        title: '可用资金',
        dataIndex: 'volume',
        key: 'volume',
        render: text => {
          return (
            <div className="available-col">
              <i className="iconfont icon-qianbao" /> {Number(text).toFixed(8)}
            </div>
          );
        }
      },
      {
        title: '挂单金额',
        dataIndex: 'lockVolume',
        key: 'lockVolume',
        render: text => {
          return <div>{Number(text).toFixed(8)}</div>;
        }
      },
      {
        title: '总计',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        render: text => {
          return <div>{text}</div>;
        }
      },
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => (
          <div className="property-action">
            {(record.tokenStatus * 1 === 1 || record.tokenStatus * 1 === 2) && (
              <Button
                type="primary"
                onClick={() => {
                  this.handleRecharge(record);
                }}
              >
                充币
              </Button>
            )}
            {(record.tokenStatus * 1 === 1 || record.tokenStatus * 1 === 3) && (
              <Button
                type="primary"
                onClick={() => {
                  this.handleWithdraw(record);
                }}
              >
                提币
              </Button>
            )}
          </div>
        )
      }
    ];

    const c2cColumns = [
      {
        title: '资金名称',
        dataIndex: 'symbol',
        key: 'symbol',
        render: (text, record) => {
          const type = text.toLowerCase();
          return (
            <div>
              <span className={`currency-logo ${type}`} />
              {text}
            </div>
          );
        }
      },
      {
        title: '可用资金',
        dataIndex: 'volume',
        key: 'volume',
        render: (text, record) => {
          return (
            <div className="available-col">
              <i className="iconfont icon-qianbao" /> {Number(text).toFixed(8)}
            </div>
          );
        }
      },
      {
        title: '广告冻结',
        dataIndex: 'advertVolume',
        key: 'advertVolume',
        render: text => {
          return <div>{Number(text).toFixed(8)}</div>;
        }
      },
      {
        title: '交易冻结',
        dataIndex: 'lockVolume',
        key: 'lockVolume',
        render: text => {
          return <div>{Number(text).toFixed(8)}</div>;
        }
      },
      {
        title: '总计',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        render: text => {
          return <div>{text}</div>;
        }
      },
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => (
          <div className="property-action">
            <Button
              type="primary"
              onClick={this.triggerAction.bind(this, { type: 'turnIn', coin: record })}
            >
              转入
            </Button>
            <Button
              type="normal"
              onClick={this.triggerAction.bind(this, { type: 'turnOut', coin: record })}
            >
              转出
            </Button>
          </div>
        )
      }
    ];

    return (
      <div className="user-cont property">
        <Tabs defaultActiveKey="routine" onChange={this.tabChange}>
          <TabPane tab="常规账户" key="routine">
            <header className="property-header clear">
              <h2 className="pull-left">我的资金一览表</h2>
              <div className="header-search">
                <Checkbox onChange={this.zeroChange} checked={checked}>隐藏资产为0的币种</Checkbox>,
                <Search value={currencyName} onChange={this.handleSearch} style={{ width: 100 }} />
              </div>
              {/* <ul className="pull-right">
                                <li className="assets-estimate">資產估算：0.000000 BTC</li>
                                <li>
                                    <span>
                                        <Tooltip title="还有 20:30:15 恢复全部额度，若需更高提币额度，请向客服申请">
                                            <span><Icon type="question-circle-o" /></span>
                                        </Tooltip>
                                        日提币额度：30BTC
                                    </span>
                                    <span>今日已用：0.000000BTC</span>
                                </li>
                            </ul> */}
            </header>
            <Table
              dataSource={normalData}
              columns={routineColumns}
              pagination={false}
              expandedRowRender={record => {
                if (expendedFlag === 'recharge') {
                  return <Recharge {...record} />;
                } else if (expendedFlag === 'withdraw') {
                  return <Withdraw {...record} />;
                } else {
                }
              }}
              expandedRowKeys={[expandedRowKey]}
            />
          </TabPane>
          <TabPane tab="C2C账户" key="c2c">
            <header className="property-header clear">
              <h2 className="pull-left">我的资金一览表</h2>
              <ul className="pull-right">
                <li>&nbsp;</li>
                {/* <li className="assets-estimate">资产估算：0.000000 BTC</li> */}
              </ul>
            </header>
            <Table dataSource={c2cData} columns={c2cColumns} pagination={false} />
          </TabPane>
        </Tabs>
        <Modal
          title={modalTit}
          wrapClassName="property-modal v-center-modal"
          visible={showModal}
          onCancel={this.hideModal}
          footer={null}
        >
          {(actionType => {
            if (actionType.indexOf('turn') > -1) {
              //转入转出C2C
              return (
                <ul className="c2c-form">
                  <li>
                    <Input addonBefore="币种名称" size="large" value={handleCoin.symbol} disabled />
                  </li>
                  <li className="line-li">
                    <Input
                      addonBefore="输入划转数量"
                      size="large"
                      value={handleVolume}
                      onChange={this.inputVolume}
                    />
                  </li>
                  <li className="aviable-symbol">
                    可用：{availableC2c} {handleCoin.symbol}
                  </li>
                  <li className="c2c-submit">
                    <Button
                      type="primary"
                      size="large"
                      onClick={this.turnAction.bind(this, actionType)}
                    >
                      立即转{actionType === 'turnIn' ? '入' : '出'}
                    </Button>
                  </li>
                </ul>
              );
            } else if (actionType === 'recharge') {
              return '充值';
            }
          })(actionType)}
        </Modal>
      </div>
    );
  }
}

export default Property;
