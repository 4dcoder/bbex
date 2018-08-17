import React, { Component } from 'react';
import { Tabs, Input, Select, Button, Table, message, List } from 'antd';
import { stampToDate } from '../../../utils/index';
import './transaction.css';

const TabPane = Tabs.TabPane;
const Option = Select.Option;

class Transaction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTab: 'current',
      currency: '',
      coin: 'USDT',
      coinList: [{ name: 'USDT' }, { name: 'ETH' }, { name: 'BTC' }],

      currentList: null,
      currentTotal: 0,
      currentPage: 1,
      expendRecordKey: '',

      recordList: null,
      recordTotal: 0,
      recordPage: 1,
      recordAllDetail: [],

      detailList: null,
      detailPage: 1,
      detailTotal: 0
    };
  }

  request = window.request;

  componentDidMount() {
    let { coin } = this.state;
    this.getCurrentTrade(1, '', coin);
  }

  tabChange = value => {
    if (value == 'current') {
      this.getCurrentTrade(1, '', 'USDT');
    } else if (value == 'record') {
      this.setState({ expendRecordKey: '' });
      this.getRecordTrade(1, '', 'USDT');
    } else {
      this.getTradeDetail(1, '', 'USDT');
    }
    this.setState({ currentTab: value, currency: '', coin: 'USDT' });
  };

  getCurrentTrade = (page, coinOther, coinMain) => {
    this.request('/coin/userTradeOrder', {
      method: 'POST',
      body: {
        coinMain,
        coinOther,
        status: 0,
        currentPage: page,
        showCount: 10
      }
    }).then(json => {
      if (json.code === 10000000) {
        let currentList = json.data.list.map(item => {
          item.key = item.id;
          return item;
        });
        this.setState({ currentList, currentTotal: json.data.count, currentPage: page });
      } else {
        message.error(json.msg);
      }
    });
  };

  getRecordTrade = (page, coinOther, coinMain) => {
    this.request('/coin/userTradeOrder', {
      method: 'POST',
      body: {
        coinMain,
        coinOther,
        status: 1,
        currentPage: page,
        showCount: 10
      }
    }).then(json => {
      if (json.code === 10000000) {
        let recordList = json.data.list.map(item => {
          item.key = item.id;
          return item;
        });
        this.setState({ recordList, recordTotal: json.data.count, recordPage: page });
      } else {
        message.error(json.msg);
      }
    });
  };

 
  // 撤单
  cancelTrade = (orderNo) => {
    this.request(`/trade/cancelTrade/${orderNo}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        message.success('撤单成功！');
        let { currency, coin, currentPage } = this.state;
        this.getCurrentTrade(currentPage, currency, coin);

      } else {
        message.destroy();
        message.error(json.msg);
      }
    });
  };

  getTradeDetail = (page, coinOther, coinMain) => {
    this.request('/coin/userTradeOrderDetail', {
      method: 'POST',
      body: {
        coinMain,
        coinOther,
        status: 1,
        currentPage: page,
        showCount: 10
      }
    }).then(json => {
      if (json.code === 10000000) {
        let detailList = json.data.list.map(item => {
          item.key = item.id;
          return item;
        });
        this.setState({ detailList, detailTotal: json.data.count, detailPage: page });
      } else {
        message.error(json.msg);
      }
    });
  };

  currencyChange = e => {
    this.setState({ currency: e.target.value });
  };

  detailPageChange = page => {
    let { currency, coin } = this.state;
    this.getTradeDetail(page, currency, coin);
  };
  currentPageChange = page => {
    let { currency, coin } = this.state;
    this.getCurrentTrade(page, currency, coin);
  };
  recordPageChange = page => {
    let { currency, coin } = this.state;
    this.getRecordTrade(page, currency, coin);
  };

  // 撤单点击事件
  handleCancelTrade = (record) =>{
    this.cancelTrade(record.id);

  }
  
  coinSelectChange = value => {
    let { currentTab, currency } = this.state;
    this.setState({ coin: value });
    if (currentTab == 'current') {
      this.getCurrentTrade(1, currency, value);
    } else if (currentTab == 'record') {
      this.setState({ expendRecordKey: '' });
      this.getRecordTrade(1, currency, value);
    } else {
      this.getTradeDetail(1, currency, value);
    }
  };

  searchClick = () => {
    let { currentTab, currency, coin } = this.state;
    currency = currency.toUpperCase();
    if (currentTab == 'current') {
      this.getCurrentTrade(1, currency, coin);
    } else if (currentTab == 'record') {
      this.setState({ expendRecordKey: '' });
      this.getRecordTrade(1, currency, coin);
    } else {
      this.getTradeDetail(1, currency, coin);
    }
  };

  detailClick = record => {
    let { recordAllDetail, expendRecordKey } = this.state;
    if (recordAllDetail.length > 0 && expendRecordKey == record.id) {
      this.setState({ expendRecordKey: '' });
    } else {
      this.setState({ expendRecordKey: record.id });
      this.getDetailList(record.id);
    }
  };

  getDetailList = id => {
    this.request(`/coin/tradeOrderDetail/${id}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        this.setState({ recordAllDetail: json.data });
      } else {
        message.error(json.msg);
      }
    });
  };

  render() {
    const currentColumns = [
      {
        title: '时间',
        dataIndex: 'createDate',
        key: 'createDate',
        render: text => {
          return <div>{stampToDate(text * 1)}</div>;
        }
      },
      {
        title: '交易类型',
        dataIndex: 'exType1',
        key: 'exType1',
        render: () => {
          return <div>币币交易</div>;
        }
      },
      {
        title: '交易对',
        dataIndex: 'coinMain',
        key: 'coinMain',
        render: (text, record) => {
          return (
            <div>
              {record.coinOther}/{record.coinMain}
            </div>
          );
        }
      },
      {
        title: '方向',
        dataIndex: 'exType',
        key: 'exType',
        render: text => {
          if (text == 0) {
            return <div className="font-color-green">买入</div>;
          } else {
            return <div className="font-color-red">卖出</div>;
          }
        }
      },
      {
        title: '价格',
        dataIndex: 'price',
        key: 'price',
        render: text => {
          return <div>{Number(text * 1).toFixed(8)}</div>;
        }
      },
      {
        title: '数量',
        dataIndex: 'askVolume',
        key: 'askVolume'
      },
      {
        title: '委托总额',
        dataIndex: 'all',
        key: 'all',
        render: (text, record) => {
          return <div>{(record.price * record.askVolume).toFixed(8)}</div>;
        }
      },
      {
        title: '已成交',
        dataIndex: 'successVolume',
        key: 'successVolume'
      },
      {
        title: '未成交',
        dataIndex: 'not',
        key: 'not',
        render: (text, record) => {
          return <div>{(record.askVolume - record.successVolume).toFixed(4)}</div>;
        }
      },
      {
        title: '操作',
        dataIndex: 'toCoinVolume',
        key: 'toCoinVolume',
        render: (text, record) => {
          return (
            <Button type="primary" onClick={()=>{this.handleCancelTrade(record)}}>
              撤单
            </Button>
          );
        }
      }
    ];
    const recordColumns = [
      {
        title: '时间',
        dataIndex: 'createDate',
        key: 'createDate',
        render: text => {
          return <div>{stampToDate(text * 1)}</div>;
        }
      },
      {
        title: '交易类型',
        dataIndex: 'exType1',
        key: 'exType1',
        render: () => {
          return <div>币币交易</div>;
        }
      },
      {
        title: '交易对',
        dataIndex: 'coinMain',
        key: 'coinMain',
        render: (text, record) => {
          return (
            <div>
              {record.coinOther}/{record.coinMain}
            </div>
          );
        }
      },
      {
        title: '方向',
        dataIndex: 'exType',
        key: 'exType',
        render: text => {
          if (text == 0) {
            return <div className="font-color-green">买入</div>;
          } else {
            return <div className="font-color-red">卖出</div>;
          }
        }
      },
      {
        title: '价格',
        dataIndex: 'price',
        key: 'price',
        render: text => {
          return <div>{Number(text * 1).toFixed(8)}</div>;
        }
      },
      {
        title: '委托量',
        dataIndex: 'askVolume',
        key: 'askVolume'
      },
      {
        title: '已成交',
        dataIndex: 'successVolume',
        key: 'successVolume',
        render: text => {
          return <div>{Number(text).toFixed(8)}</div>;
        }
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: text => {
          switch (text) {
            case 0:
              return <div>未成交</div>;
            case 1:
              return <div>部分成交</div>;
            case 2:
              return <div>全部成交</div>;
            case 3:
              return <div>部分取消</div>;
            case 4:
              return <div>全部取消</div>;
            default:
              return <div>--</div>;
          }
        }
      },
      {
        title: '操作',
        dataIndex: 'lockVolume0',
        key: 'lockVolume0',
        render: (text, record) => {
          return (
            <div
              onClick={() => {
                this.detailClick(record);
              }}
              style={{ cursor: 'pointer', color: '#d4a668' }}
            >
              详情
            </div>
          );
        }
      }
    ];
    const detailColumns = [
      {
        title: '时间',
        dataIndex: 'createDate',
        key: 'createDate',
        render: text => {
          return <div>{stampToDate(text * 1)}</div>;
        }
      },
      {
        title: '交易类型',
        dataIndex: 'exType1',
        key: 'exType1',
        render: () => {
          return <div>币币交易</div>;
        }
      },
      {
        title: '交易对',
        dataIndex: 'coinMain',
        key: 'coinMain',
        render: (text, record) => {
          return (
            <div>
              {record.coinOther}/{record.coinMain}
            </div>
          );
        }
      },
      {
        title: '方向',
        dataIndex: 'exType',
        key: 'exType',
        render: text => {
          if (text == 0) {
            return <div className="font-color-green">买入</div>;
          } else {
            return <div className="font-color-red">卖出</div>;
          }
        }
      },
      {
        title: '价格',
        dataIndex: 'price',
        key: 'price',
        render: text => {
          return <div>{Number(text * 1).toFixed(8)}</div>;
        }
      },
      {
        title: '数量',
        dataIndex: 'successVolume',
        key: 'successVolume',
        render: text => {
          return <div>{Number(text * 1).toFixed(8)}</div>;
        }
      },
      {
        title: '成交量额',
        dataIndex: 'toCoinVolume',
        key: 'toCoinVolume',
        render: (text, record) => {
          return <div>{(record.price * record.successVolume).toFixed(8)}</div>;
        }
      },
      {
        title: '手续费',
        dataIndex: 'exFee',
        key: 'exFee',
        render: text => {
          return <div>{Number(text * 1).toFixed(8)}</div>;
        }
      }
    ];
    const {
      currency,
      currentPage,
      recordPage,
      detailPage,
      expendRecordKey,
      currentTotal,
      recordTotal,
      currentList,
      recordList,
      detailList,
      detailTotal,
      coinList,
      coin,
      recordAllDetail
    } = this.state;
    return (
      <div className="transation-content user-cont">
        <Tabs
          defaultActiveKey="current"
          tabBarExtraContent={
            <div className="search">
              <Input
                value={currency}
                onChange={this.currencyChange}
                placeholder="币种"
                style={{ width: 100 }}
              />
              <span className="line">/</span>
              <Select
                value={coin}
                style={{ width: 100 }}
                onChange={this.coinSelectChange}
              >
                {coinList.map(item => {
                  return (
                    <Option key={item.name} value={item.name}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
              <Button
                type="primary"
                onClick={this.searchClick}
                style={{ width: 80, marginLeft: 20 }}
              >
                搜索
              </Button>
            </div>
          }
          onChange={this.tabChange}
        >
          <TabPane tab="当前委托" key="current">
            <Table
              dataSource={currentList}
              columns={currentColumns}
              loading={!currentList}
              pagination={{
                defaultCurrent: 1,
                total: currentTotal,
                current: currentPage,
                pageSize: 10,
                onChange: page => {
                  this.currentPageChange(page);
                }
              }}
            />
          </TabPane>
          <TabPane tab="委托记录" key="record">
            <Table
              dataSource={recordList}
              columns={recordColumns}
              loading={!recordList}
              pagination={{
                defaultCurrent: 1,
                total: recordTotal,
                current: recordPage,
                pageSize: 10,
                onChange: page => {
                  this.recordPageChange(page);
                }
              }}
              expandedRowRender={record => {
                return (
                  <div className="expend-content">
                    <List
                      size="small"
                      header={
                        <ul className="expent-title">
                          <li>成交时间</li>
                          <li>成交价格</li>
                          <li>成交数量</li>
                          <li>成交额</li>
                          <li>手续费</li>
                        </ul>
                      }
                      dataSource={recordAllDetail}
                      renderItem={item => (
                        <List.Item className="list-lis">
                          <ul className="list-item">
                            <li>{stampToDate(item.createDate * 1)}</li>
                            <li>{Number(item.price).toFixed(8)}</li>
                            <li>{Number(item.successVolume).toFixed(8)}</li>
                            <li>{Number(item.price * item.successVolume).toFixed(8)}</li>
                            <li>{Number(item.exFee).toFixed(8)}</li>
                          </ul>
                        </List.Item>
                      )}
                    />
                  </div>
                );
              }}
              expandedRowKeys={[expendRecordKey]}
            />
          </TabPane>
          <TabPane tab="成交明细" key="detail">
            <Table
              dataSource={detailList}
              loading={!detailList}
              columns={detailColumns}
              pagination={{
                defaultCurrent: 1,
                total: detailTotal,
                current: detailPage,
                pageSize: 10,
                onChange: page => {
                  this.detailPageChange(page);
                }
              }}
            />
          </TabPane>
        </Tabs>
      </div>
    );
  }
}
export default Transaction;
