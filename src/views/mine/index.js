import React, { Component } from 'react';
import { Progress, Tabs, Table } from 'antd';
import { stampToDate } from '../../utils';

import './mine.less';

const TabPane = Tabs.TabPane;

class Mine extends Component {
  state = {
    holdingList: [],
    multipleList: [],
    dividendList: []
  };

  render() {
    const { holdingList, multipleList, dividendList } = this.state;
    const holdingColumns = [
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        render: text => {
          return <div>{stampToDate(text * 1)}</div>;
        }
      },
      {
        title: '持币数量',
        dataIndex: 'volume',
        key: 'volume'
      },
      {
        title: '持币排名',
        dataIndex: 'Ranking',
        key: 'Ranking'
      },
      {
        title: '挖矿量',
        dataIndex: 'volume',
        key: 'volume'
      }
    ];

    const multipleColumns = [
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        render: text => {
          return <div>{stampToDate(text * 1)}</div>;
        }
      },
      {
        title: '团队人数',
        dataIndex: 'number',
        key: 'number'
      },
      {
        title: '团队持币总量',
        dataIndex: 'groupHoldingVolume',
        key: 'groupHoldingVolume'
      },
      {
        title: '大区持币总量',
        dataIndex: 'areaHoldingVolume',
        key: 'areaHoldingVolume'
      },
      {
        title: '挖矿量',
        dataIndex: 'volume',
        key: 'volume'
      }
    ];

    const dividendColumns = [
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        render: text => {
          return <div>{stampToDate(text * 1)}</div>;
        }
      },
      {
        title: '平台手续费分红',
        dataIndex: 'volume',
        key: 'volume'
      },
      {
        title: '手机号归属地手续费分红',
        dataIndex: 'Ranking',
        key: 'Ranking'
      },
      {
        title: '推荐网体下手续费分红',
        dataIndex: 'volume',
        key: 'volume'
      }
    ];

    return (
      <div className="content mine">
        <div className="mine-wrap">
          <div className="mine-box global-dashboard">
            <h2>UES现价: 2.3USDT</h2>
            <Progress percent={50} strokeWidth={20} status="active" showInfo={false} />
            <div className="progress-info clear">
              <div className="global-dashboard-mined pull-left">
                已挖矿: <span className="font-color-primary">849797767.841545566</span> UES
              </div>
              <div className="global-dashboard-available pull-right">
                可挖总量: <span className="font-color-primary">155亿</span>
              </div>
            </div>
            <ul className="global-dashboard-info">
              <li>
                <strong className="font-color-primary">13,013,012</strong>昨日挖矿
              </li>
              <li>
                <strong className="font-color-primary">201,214,514</strong>锁仓总量
              </li>
              <li>
                <strong className="font-color-primary">249,418</strong>销毁总量
              </li>
            </ul>
          </div>
          <div className="mine-box my-dashboard">
            <h2>我的收益</h2>
            <ul className="my-dashboard-info">
              <li>
                <span>----.--</span>昨日分红(UES)
              </li>
              <li>
                <span>----.--</span>昨日挖矿总量(UES)
              </li>
              <li>
                <span>----.--</span>昨日持币挖矿(UES)
              </li>
              <li>
                <span>----.--</span>多元挖矿(UES)
              </li>
            </ul>
            <div className="min-box-sigin-tip">
              <a href="/signin">登录</a>&nbsp;&nbsp;后查看
            </div>
          </div>
          <div className="mine-box mine-count">
            <Tabs defaultActiveKey="1">
              <TabPane tab="持币挖矿" key="1">
                <Table
                  dataSource={holdingList}
                  columns={holdingColumns}
                  loading={!holdingList}
                  pagination={null}
                />
              </TabPane>
              <TabPane tab="多元挖矿" key="2">
                <Table
                  dataSource={multipleList}
                  columns={multipleColumns}
                  loading={!multipleList}
                  pagination={null}
                />
              </TabPane>
              <TabPane tab="区域合伙人分红" key="3">
                <Table
                  dataSource={dividendList}
                  columns={dividendColumns}
                  loading={!dividendList}
                  pagination={null}
                />
              </TabPane>
            </Tabs>
            <div className="min-box-sigin-tip">
              <a href="/signin">登录</a>&nbsp;&nbsp;后查看
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Mine;
