import React, { Component } from 'react';
import { Tabs, Table, Select, message, Button } from 'antd';
import { stampToDate } from '../../../utils/index';
import './finance.css';

const TabPane = Tabs.TabPane;
const Option = Select.Option;

class Finance extends Component {
    constructor(props) {
        super(props);
        this.state = {
            symbol: '全部',
            coinList: [],

            currentTab: 'recharge',

            rechargeList: null,
            rechargeTotal: 0,

            withdrawList: null,
            withdrawPage: 1,
            withdrawTotal: 0,
            expendKey: '',

            transferList: null,
            transferTotal: 0
        };
    }

    request = window.request;

    componentDidMount() {
        this.getCoinList();
        this.getRechargeList(1, '', '');
    }
    getCoinList = () => {
        this.request('/coin/list', {
            method: 'GET'
        }).then(json => {
            if (json.code === 10000000) {
                let myData = json.data.map(item => {
                    const { id, name } = item;
                    return { id, name };
                });
                myData.unshift({ id: '', name: '全部' });
                this.setState({ coinList: myData, symbol: '全部' });
            } else {
                message.error(json.msg);
            }
        });
    };

    getRechargeList = (page, coinId, symbol) => {
        let mSymbol = symbol == '全部' ? '' : symbol;
        let mCoinId = symbol == '全部' ? '' : coinId;
        this.request('/coin/deposit/list', {
            method: 'POST',
            body: {
                coinId: mCoinId,
                symbol: mSymbol,
                currentPage: page,
                showCount: 10
            }
        }).then(json => {
            if (json.code === 10000000) {
                this.setState({ rechargeList: json.data.list, rechargeTotal: json.data.count });
            } else {
                message.error(json.msg);
            }
        });
    };

    getWithdrawList = (page, coinId, symbol) => {
        let mSymbol = symbol == '全部' ? '' : symbol;
        let mCoinId = symbol == '全部' ? '' : coinId;
        this.request('/coin/withdraw/list ', {
            method: 'POST',
            body: {
                coinId: mCoinId,
                symbol: mSymbol,
                currentPage: page,
                showCount: 10
            }
        }).then(json => {
            if (json.code === 10000000) {
                let withdrawList = json.data.list.map((item, index)=>{
                    item.key = item.id;
                    return item;
                })
                this.setState({ withdrawList, withdrawTotal: json.data.count });
            } else {
                message.error(json.msg);
            }
        });
    };

    getTransferList = (page, coinId, symbol) => {
        let mSymbol = symbol == '全部' ? '' : symbol;
        let mCoinId = symbol == '全部' ? '' : coinId;
        this.request('/offline/coin/transfer/list', {
            method: 'POST',
            body: {
                coinId: mCoinId,
                symbol: mSymbol,
                currentPage: page,
                showCount: 10
            }
        }).then(json => {
            if (json.code === 10000000) {
                let transferList =  json.data.list.map((item)=>{
                    item.key = item.id;
                    return item;
                })
                this.setState({ transferList, transferTotal: json.data.count });
            } else {
                message.error(json.msg);
            }
        });
    };

    tabChange = value => {
        this.setState({ symbol: '全部', currentTab: value, withdrawPage: 1 });
        if (value == 'recharge') {
            this.getRechargeList(1, '', '');
        } else if (value == 'withdraw') {
            this.getWithdrawList(1, '', '');
        } else {
            this.getTransferList(1, '', '');
        }
    };

    // 取消
    cancelClick = (record) => {
     
      this.request(`/coin/volume/cancel/${record.id}`, {
        method: 'GET',
        }).then(json => {
            if (json.code === 10000000) {
               message.success(json.msg);
               const { coinList, symbol, withdrawPage } = this.state;
               const coinId = coinList.filter(item => {
                    return item.name == symbol;
                })[0].id;
               this.getWithdrawList(withdrawPage,coinId, symbol);
            } else {
                message.destroy();
                message.error(json.msg);
            }
        });
    }

    // 提币记录 点击详情
    detailClick = (record) => {
        const { expendKey } = this.state;
        if(expendKey === record.id){
            this.setState({expendKey: ''})
        }else{
            this.setState({expendKey: record.id});
        }
    }


    coinSelect = value => {
        const { currentTab, coinList } = this.state;
        const coinId = coinList.filter(item => {
            return item.name == value;
        })[0].id;

        this.setState({ symbol: value, withdrawPage: 1 });

        if (currentTab == 'recharge') {
            this.getRechargeList(1, coinId, value);
        } else if (currentTab == 'withdraw') {
            this.getWithdrawList(1, coinId, value);
        } else {
            this.getTransferList(1, coinId, value);
        }
    };

    rechargePageChange = page => {
        const { symbol, coinList } = this.state;
        const coinId = coinList.filter(item => {
            return item.name == symbol;
        })[0].id;
        ///coin/deposit/list
        this.getRechargeList(page, coinId, symbol);
    };

    withdrawPageChange = page => {
        const { symbol, coinList } = this.state;
        const coinId = coinList.filter(item => {
            return item.name == symbol;
        })[0].id;
        this.setState({withdrawPage: page})
        ///coin/deposit/list
        this.getWithdrawList(page, coinId, symbol);
    };

    transferPageChange = page => {
        const { symbol, coinList } = this.state;
        const coinId = coinList.filter(item => {
            return item.name == symbol;
        })[0].id;
        ///coin/deposit/list
        this.getTransferList(page, coinId, symbol);
    };

    render() {
        const rechargeColumns = [
            {
                title: '时间',
                dataIndex: 'createDate',
                key: 'createDate',
                render: text => {
                    return <div>{stampToDate(text * 1)}</div>;
                }
            },
            {
                title: '币种',
                dataIndex: 'coinSymbol',
                key: 'coinSymbol'
            },
            {
                title: '类型',
                dataIndex: 'type',
                key: 'type',
                render: () => {
                    return <div>币币交易</div>;
                }
            },
            {
                title: '数量',
                dataIndex: 'volume',
                key: 'volume',
                render: text => {
                    return <div>{Number(text).toFixed(8)}</div>;
                }
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: text => {
                    if (text == 0) {
                        return <div>确认中</div>;
                    } else if (text == 1) {
                        return <div>已成功</div>;
                    } else {
                        return <div>{text}</div>;
                    }
                }
            },
            {
                title: '操作',
                dataIndex: 'address',
                key: 'address',
                render: () => {
                    return <div>操作</div>;
                }
            }
        ];
        const withdrowColumns = [
            {
                title: '时间',
                dataIndex: 'createDate',
                key: 'createDate',
                render: text => {
                    return <div>{stampToDate(text * 1)}</div>;
                }
            },
            {
                title: '币种',
                dataIndex: 'coinSymbol',
                key: 'coinSymbol'
            },
            {
                title: '类型',
                dataIndex: 'type',
                key: 'type',
                render: () => {
                    return <div>币币交易</div>;
                }
            },
            {
                title: '数量',
                dataIndex: 'volume',
                key: 'volume',
                render: text => {
                    return <div>{Number(text).toFixed(8)}</div>;
                }
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (text, record) => {
                    let myNote = '';
                    switch (text) {
                        case 0:
                            myNote = <Button type="primary" onClick={()=>{this.cancelClick(record)}}>取消</Button>;
                            break;
                        case 1:
                            myNote = '审核通过';
                            break;
                        case 2:
                            myNote = '审核不通过';
                            break;
                        case 3:
                            myNote = '已汇出';
                            break;
                        case 8:
                            myNote = '预处理';
                            break;
                        case 9:
                            myNote = '已取消';
                            break;
                        default:
                    }
                    return <div>{myNote}</div>;
                }
            },
            {
                title: '操作',
                dataIndex: 'updateDate',
                key: 'updateDate',
                render: (text, record) => {
                    return <div onClick={()=>{this.detailClick(record)}} style={{cursor: 'pointer', color: '#d4a668'}}>
                        详情
                    </div>;
                }
            },
        ];
        const transferColumns = [
            {
                title: '时间',
                dataIndex: 'createDate',
                key: 'createDate',
                render: text => {
                    return <div>{stampToDate(text * 1)}</div>;
                }
            },
            {
                title: '币种',
                dataIndex: 'coinSymbol',
                key: 'coinSymbol'
            },
            {
                title: '类型',
                dataIndex: 'type',
                key: 'type',
                render: text => {
                    if (text == 0) {
                        return <div className="font-color-green">转入</div>;
                    } else {
                        return <div className="font-color-red">转出</div>;
                    }
                }
            },
            {
                title: '数量',
                dataIndex: 'volume',
                key: 'volume',
                render: text => {
                    return <div>{Number(text).toFixed(8)}</div>;
                }
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: () => {
                    return <div>成功</div>;
                }
            },
        ];

        const {
            symbol,
            coinList,
            currentTab,
            rechargeList,
            rechargeTotal,
            withdrawList,
            withdrawPage,
            withdrawTotal,
            transferList,
            transferTotal,
            expendKey
        } = this.state;
        return (
            <ul className="finance-content user-cont">
                <Tabs
                    value={currentTab}
                    tabBarExtraContent={
                        <Select style={{ width: 100 }} value={symbol} onChange={this.coinSelect}>
                            {coinList.map(item => {
                                return (
                                    <Option key={item.id} value={item.name}>
                                        {item.name}
                                    </Option>
                                );
                            })}
                        </Select>
                    }
                    onChange={this.tabChange}
                >
                    <TabPane tab="充币记录" key="recharge">
                        <Table
                            dataSource={rechargeList}
                            loading={!rechargeList}
                            columns={rechargeColumns}
                            pagination={{
                                defaultCurrent: 1,
                                total: rechargeTotal,
                                pageSize: 10,
                                onChange: page => {
                                    this.rechargePageChange(page);
                                }
                            }}
                        />
                    </TabPane>
                    <TabPane tab="提币记录" key="withdraw">
                        <Table
                            dataSource={withdrawList}
                            columns={withdrowColumns}
                            loading={!withdrawList}
                            pagination={{
                                defaultCurrent: 1,
                                current: withdrawPage,
                                total: withdrawTotal,
                                pageSize: 10,
                                onChange: page => {
                                    this.withdrawPageChange(page);
                                }
                            }}
                            expandedRowKeys={[expendKey]}
                            expandedRowRender = {(record)=>{
                                let {updateDate, fee, address, txId} = record;
                                if(txId && txId.length>40){
                                    txId = txId.subString(0,40)+'...';
                                }
                                return <ul className='withdraw-expend'>
                                    <li>
                                        <div> <span className="title">钱包处理时间 : </span>{updateDate && stampToDate(updateDate*1)}</div>
                                        <div> <span className="title">手续费 : </span>{(fee*1).toFixed(8)}</div>
                                    </li>
                                    <li>
                                        <div> <span className="title">提币地址 :</span>{address}</div>
                                        <div> <span className="title">区块链交易ID : </span>{txId}</div>
                                    </li>
                                </ul>
                            }}
                        />
                    </TabPane>
                    <TabPane tab="划转记录" key="transfer">
                        <Table
                            dataSource={transferList}
                            columns={transferColumns}
                            loading={!transferList}
                            pagination={{
                                defaultCurrent: 1,
                                total: transferTotal,
                                pageSize: 10,
                                onChange: page => {
                                    this.transferPageChange(page);
                                }
                            }}
                        />
                    </TabPane>
                </Tabs>
            </ul>
        );
    }
}
export default Finance;
