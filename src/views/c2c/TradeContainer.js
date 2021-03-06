import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
import { Table, Button, Modal, Tabs, message } from 'antd';
import classnames from 'classnames';
import TransactionForm from './TransactionForm';
import { stampToDate, getMaxPoint } from '../../utils';
import { IMAGES_ADDRESS, WS_PREFIX } from '../../utils/constants';
import ReconnectingWebSocket from '../../utils/ReconnectingWebSocket';
import AppealModal from './AppealModal';

const TabPane = Tabs.TabPane;

const ExpandComponent = ({
  localization,
  record,
  previewImage,
  onPreview,
  onCloseImage,
  confirmPay,
  cancelPay,
  confirmReceipt,
  handleAppeal
}) => {
  const { bankInfo, totalPrice, radomNum, remarks, status } = record;

  return (
    <div className="payment-box">
      <Tabs
        tabBarExtraContent={
          <div className="extra-cont">
            <span>
              <i className="iconfont icon-phone" />
              {localization['商家']}：{bankInfo.mobile}
            </span>
            <a href="javascript:void(0);" onClick={handleAppeal}>
              <i className="iconfont icon-kefu" />
              {localization['申请客服处理']}
            </a>
          </div>
        }
      >
        <TabPane
          tab={
            <span>
              <i className="iconfont icon-yinhangqia" />
              {localization['商家银行卡信息']}
            </span>
          }
          key="bank"
        >
          <div className="payment-box-cont">
            <h3>{localization['请使用绑定的银行卡完成付款，付款时填写以下信息']}</h3>
            <table>
              <tbody>
                <tr>
                  <th>
                    <span className="font-color-red">*</span>
                    {localization['收款姓名']}
                  </th>
                  <th>
                    <span className="font-color-red">*</span>
                    {localization['银行卡号']}
                  </th>
                  <th>
                    <span className="font-color-red">*</span>
                    {localization['开户行']}/{localization['支行名称']}
                  </th>
                  <th>
                    <span className="font-color-red">*</span>
                    {localization['付款金额']}
                  </th>
                  <th>{localization['付款备注']}</th>
                </tr>
                <tr>
                  <td>
                    {bankInfo.realName}{' '}
                    <i
                      className="iconfont icon-copy copy-btn"
                      date-clipboard-text={bankInfo.realName}
                    />
                  </td>
                  <td>
                    {bankInfo.cardNo}{' '}
                    <i
                      className="iconfont icon-copy copy-btn"
                      date-clipboard-text={bankInfo.cardNo}
                    />
                  </td>
                  <td>
                    {bankInfo.bankName}/{bankInfo.branchBankName}{' '}
                    <i
                      className="iconfont icon-copy copy-btn"
                      date-clipboard-text={`${bankInfo.bankName}/${bankInfo.branchBankName}`}
                    />
                  </td>
                  <td>
                    {totalPrice}{' '}
                    <i className="iconfont icon-copy copy-btn" date-clipboard-text={totalPrice} />
                  </td>
                  <td>
                    {radomNum}{' '}
                    <i className="iconfont icon-copy copy-btn" date-clipboard-text={radomNum} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabPane>
        <TabPane
          tab={
            <span>
              <i className="iconfont icon-zhifubao" />
              {localization['商家支付宝信息']}
            </span>
          }
          key="alipay"
        >
          <div className="payment-box-cont clear">
            <div className="payment-box-qrcode pull-left clear">
              <img
                src={`${IMAGES_ADDRESS}/view/${bankInfo.alipayQrcodeId}`}
                alt={localization['付宝收款']}
                onClick={() => {
                  onPreview(bankInfo.alipayQrcodeId);
                }}
              />
              <h4>
                {localization['点击图片']}
                <br />
                {localization['扫码支付']}
              </h4>
            </div>
            <div className="payment-box-attr pull-left">
              <h3>{localization['手动付款']}</h3>
              <table>
                <tbody>
                  <tr>
                    <th width="100px">
                      <span className="font-color-red">*</span>
                      {localization['收款姓名']}
                    </th>
                    <th width="200px">
                      <span className="font-color-red">*</span>
                      {localization['支付宝']}
                    </th>
                    <th width="150px">
                      <span className="font-color-red">*</span>
                      {localization['付款金额']}
                    </th>
                    <th width="100px">{localization['付款备注']}</th>
                  </tr>
                  <tr>
                    <td>
                      {bankInfo.realName}{' '}
                      <i
                        className="iconfont icon-copy copy-btn"
                        data-clipboard-text={bankInfo.realName}
                      />
                    </td>
                    <td>
                      {bankInfo.alipayNo}{' '}
                      <i
                        className="iconfont icon-copy copy-btn"
                        data-clipboard-text={bankInfo.alipayNo}
                      />
                    </td>
                    <td>
                      {totalPrice}{' '}
                      <i className="iconfont icon-copy copy-btn" data-clipboard-text={totalPrice} />
                    </td>
                    <td>
                      {radomNum}{' '}
                      <i className="iconfont icon-copy copy-btn" data-clipboard-text={radomNum} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabPane>
        <TabPane
          tab={
            <span>
              <i className="iconfont icon-wxpay" />
              {localization['商家微信支付信息']}
            </span>
          }
          key="wechat"
        >
          <div className="payment-box-cont clear">
            <div className="payment-box-qrcode pull-left clear">
              <img
                src={`${IMAGES_ADDRESS}/view/${bankInfo.wechatQrcodeId}`}
                alt={localization['微信收款']}
                onClick={() => {
                  onPreview(bankInfo.wechatQrcodeId);
                }}
              />
              <h4>
                {localization['点击图片']}
                <br />
                {localization['扫码支付']}
              </h4>
            </div>
            <div className="payment-box-attr pull-left">
              <h3>{localization['手动付款']}</h3>
              <table>
                <tbody>
                  <tr>
                    <th width="100px">
                      <span className="font-color-red">*</span>
                      {localization['收款姓名']}
                    </th>
                    <th width="200px">
                      <span className="font-color-red">*</span>
                      {localization['微信']}
                    </th>
                    <th width="150px">
                      <span className="font-color-red">*</span>
                      {localization['付款金额']}
                    </th>
                    <th width="100px">{localization['付款备注']}</th>
                  </tr>
                  <tr>
                    <td>
                      {bankInfo.realName}{' '}
                      <i
                        className="iconfont icon-copy copy-btn"
                        data-clipboard-text={bankInfo.realName}
                      />
                    </td>
                    <td>
                      {bankInfo.wechatNo}{' '}
                      <i
                        className="iconfont icon-copy copy-btn"
                        data-clipboard-text={bankInfo.wechatNo}
                      />
                    </td>
                    <td>
                      {totalPrice}{' '}
                      <i className="iconfont icon-copy copy-btn" data-clipboard-text={totalPrice} />
                    </td>
                    <td>
                      {radomNum}{' '}
                      <i className="iconfont icon-copy copy-btn" data-clipboard-text={radomNum} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabPane>
      </Tabs>
      <div className="payment-box-action">
        {remarks === 'buy' &&
          status === 0 && (
            <Button
              type="primary"
              size="large"
              onClick={() => {
                confirmPay(record);
              }}
            >
              {localization['我已付款给商家']}
            </Button>
          )}
        {remarks === 'buy' &&
          status === 1 && (
            <Button type="primary" size="large" disabled>
              {localization['我已付款给商家']}
            </Button>
          )}
        {remarks === 'sell' &&
          status === 0 && (
            <Button size="large" disabled>
              {localization['等待商家确认付款']}
            </Button>
          )}
        {remarks === 'sell' &&
          status === 1 && (
            <Button
              type="primary"
              size="large"
              onClick={() => {
                confirmReceipt(record);
              }}
            >
              {localization['确认收款']}
            </Button>
          )}
        {remarks !== 'sell' && (
          <Button
            type="normal"
            size="large"
            onClick={() => {
              cancelPay(record, status);
            }}
          >
            {localization['取消订单']}
          </Button>
        )}
      </div>
      <div className="payment-box-notice">
        <h3>{localization['交易须知：']}</h3>
        <ul>
          <li>{localization['商家有一个未完成买单，无法继续买入，完成后方可进行买卖']}</li>
          <li>{localization['商家当天取消3笔交易，将禁止当天C2C买卖功能']}</li>
          <li>{localization['商家当天被申诉3次以上，禁止当天C2C买卖功能']}</li>
          <li>
            {localization['大于5万的付款，请务必将单笔金额拆分为5万以内分批转账，否则将延迟到账']}
          </li>
        </ul>
      </div>
      <Modal visible={!!previewImage} footer={null} onCancel={onCloseImage}>
        <img alt="example" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

class TradeContainer extends PureComponent {
  state = {
    coinVolume: 0,
    advertList: null,
    current: 1,
    pageSize: 10,
    selectedCoin: null,
    recordIndex: 0,
    releaseVisible: false,
    transactionVisible: false,
    myOrderList: null,
    myAdvertList: null,
    previewImage: '',
    appealList: null, //我的申诉
    showAppeal: '' //显示申诉弹窗
  };

  request = window.request;

  componentWillReceiveProps(nextProps) {
    this.getAdvertList(1, nextProps);
  }

  componentWillMount() {
    this.getAdvertList(1);

    if (sessionStorage.getItem('account')) {
      this.getMyOrderList();
      this.getMyAdvertList();
      //获取申诉
      this.getAppealList();
    }
  }

  componentDidMount() {
    //登录后才打开websockets
    if (JSON.parse(sessionStorage.getItem('account'))) {
      const userId = JSON.parse(sessionStorage.getItem('account')).id;
      this.offlineWS = new ReconnectingWebSocket(`${WS_PREFIX}/c2cUser?${userId}`);

      this.offlineInterval = setInterval(() => {
        if (this.offlineWS.readyState === 1) {
          this.offlineWS.send('ping');
        }
      }, 1000 * 10);

      this.offlineWS.onmessage = evt => {
        if (evt.data === 'pong') {
          return;
        }
        const record = JSON.parse(evt.data);
        if (record.id) {
          let hasRecord = false;
          const myOrderList = this.state.myOrderList.map(item => {
            if (record.subOrderId === item.subOrderId) {
              record.key = record.id;
              hasRecord = true;
              return record;
            }
            return item;
          });
          if (!hasRecord) {
            record.key = record.id;
            myOrderList.push(record);
          }
          this.setState({ myOrderList });
        }
      };
    }
  }

  componentWillUnmount() {
    clearInterval(this.offlineInterval);
    this.offlineWS && this.offlineWS.close();
  }

  pageOnChange = (page, pageSize) => {
    this.setState({current: page})
    this.getAdvertList(page);
  };

  //根据币种和交易类型分页获取广告列表
  getAdvertList = (current, props = this.props) => {
    const { exType, coin } = props;
    const { pageSize } = this.state;
    const typeMap = {
      buy: 1,
      sell: 0
    };
    this.request('/offline/gadvert/list', {
      body: {
        exType: typeMap[exType],
        coinId: coin.coinId,
        currentPage: current,
        showCount: pageSize
      }
    }).then(json => {
      if (json.code === 10000000) {
        const list = json.data.list.map(coin => {
          coin.key = coin.id;
          return coin;
        });
        let advertList = json.data;
        advertList.list = list;
        advertList.price = 0;
        this.setState({ advertList, current });
      } else {
        message.error(json.msg);
      }
    });
  };

  switchRecord = index => {
    this.setState({ recordIndex: index });
  };

  showModal = visible => {
    this.setState({ [visible]: true });
  };

  hideModal = visible => {
    this.setState({ [visible]: false });
  };

  triggerRelease = () => {
    const { localization } = this.props;
    if (!sessionStorage.getItem('account')) {
      message.info(localization['请先登录']);
      return;
    }

    //验证是否可以发布广告
    this.request('/offline/topublish', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        //通过验证，可以发广告
        this.showModal('releaseVisible');
      } else if (json.code === 10004017) {
        //请进行身份认证
        Modal.confirm({
          className: 'v-center-modal',
          title: localization['发布广告'],
          content: localization['为保证资金安全，请在交易前实名认证'],
          okText: localization['去实名'],
          cancelText: localization['取消'],
          onOk: () => {
            this.props.history.push('/user/verified');
          }
        });
      } else if (json.code === 10004018) {
        //请先绑定银行卡
        Modal.confirm({
          className: 'v-center-modal',
          title: localization['发布广告'],
          content: localization['为保证交易顺畅，请在交易前绑定银行卡'],
          okText: localization['去绑卡'],
          cancelText: localization['取消'],
          onOk: () => {
            this.props.history.push('/user/payment');
          }
        });
      } else if (json.code === 10005036) {
        //请先绑定手机
        Modal.confirm({
          className: 'v-center-modal',
          title: localization['发布广告'],
          content: localization['为保证交易顺畅，请在交易前绑定手机号'],
          okText: localization['去绑手机号'],
          cancelText: localization['取消'],
          onOk: () => {
            this.props.history.push('/user/security');
          }
        });
      } else {
        message.destroy();
        message.warn(json.msg, 1);
      }
    });
  };

  //发布广告
  handleRelease = ({ price, volume, exType }) => {
    const { localization } = this.props;
    this.hideModal('releaseVisible');
    const typeMap = {
      buy: 0,
      sell: 1
    };
    const { coin } = this.props;
    this.request('/offline/publish', {
      body: {
        volume,
        price,
        exType: typeMap[exType],
        coinId: coin.coinId,
        symbol: coin.symbol
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success(localization['发布广告成功！']);
        //刷新广告列表
        this.getAdvertList(this.state.current);
        //刷新我发布的广告列表
        this.getMyAdvertList();
      } else {
        message.error(json.msg);
      }
    });
  };

  triggerTransaction = ({ exType, record }) => {
    const { localization } = this.props;
    if (!sessionStorage.getItem('account')) {
      message.info(localization['请先登录']);
      return;
    }

    this.showModal('transactionVisible');
    this.setState({ selectedCoin: record });
  };

  handleTransaction = ({ price, volume, exType }) => {
    const { localization } = this.props;
    this.hideModal('transactionVisible');
    const { selectedCoin } = this.state;
    const typeText = {
      buy: localization['买入'],
      sell: localization['卖出']
    };

    this.request(`/offline/${exType}`, {
      body: {
        volume,
        orderId: selectedCoin.id,
        coinId: selectedCoin.coinId,
        symbol: selectedCoin.symbol
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success(`${typeText[exType]}${selectedCoin.symbol}${localization['成功']}`);
        this.getMyOrderList();
      } else if (json.code === 10004016) {
        //自己不能卖给自己
        Modal.error({
          title: typeText[exType],
          content: localization['自己不能卖给自己'],
          okText: localization['确定']
        });
      } else if (json.code === 10004009) {
        //没有足够资产
        Modal.error({
          title: typeText[exType],
          content: json.msg,
          okText: localization['确定']
        });
      } else if (json.code === 10004017) {
        //请进行身份认证
        if (exType === 'sell') {
          Modal.confirm({
            className: 'v-center-modal',
            content: localization['为保证资金安全，请在交易前实名认证'],
            okText: localization['去实名'],
            cancelText: localization['取消'],
            onOk: () => {
              this.props.history.push('/user/verified');
            }
          });
        }
      } else if (json.code === 10004018) {
        //请先绑定银行卡
        if (exType === 'sell') {
          Modal.confirm({
            className: 'v-center-modal',
            content: localization['为保证交易顺畅，请在交易前绑定银行卡'],
            okText: localization['去绑卡'],
            cancelText: localization['取消'],
            onOk: () => {
              this.props.history.push('/user/payment');
            }
          });
        }
      } else {
        message.error(json.msg);
      }
    });
  };

  //获取我的订单列表
  getMyOrderList = () => {
    this.request('/offline/myOrderDetail/list', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const myOrderList = json.data.map(order => {
          order.key = order.id;
          return order;
        });
        this.setState({ myOrderList });
      } else {
        message.error(json.msg);
      }
    });
  };

  //获取我的广告列表
  getMyAdvertList = () => {
    const { localization } = this.props;
    this.request('/offline/myAdvert/list', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        const typeMap = {
          0: localization['买入'],
          1: localization['卖出']
        };
        const myAdvertList = json.data.map(order => {
          order.key = order.id;
          order.exType = typeMap[order.exType];
          return order;
        });
        this.setState({ myAdvertList });
      } else {
        message.error(json.msg);
      }
    });
  };

  //根据币种ID获取余额
  getVolume = () => {
    this.request(`/offline/volume/${this.props.coin.coinId}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        if (json.data) {
          this.setState({ coinVolume: json.data.volume });
        }
      } else {
        message.error(json.msg);
      }
    });
  };

  //根据用户ID获取用户支付信息
  getBankInfo = (id, askUserId) => {
    let { myOrderList } = this.state;
    this.request(`/offline/bankInfo/${askUserId}`, {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000 && json.data) {
        // this.setState({ bankInfo: json.data });
        myOrderList = myOrderList.map(order => {
          if (id === order.id) {
            order.bankInfo = json.data;
          }
          return order;
        });
        this.setState({ myOrderList });
      } else {
        message.error(json.msg);
      }
    });
  };

  handleSwitchRelease = key => {
    if (key === '2') {
      this.getVolume();
    }
  };

  handleExpand = (expanded, record) => {
    if (expanded && !record.bankInfo) {
      this.getBankInfo(record.id, record.askUserId);
    }
  };

  handlePreview = qrcodeId => {
    this.setState({ previewImage: `${IMAGES_ADDRESS}/view/${qrcodeId}` });
  };

  handleCloseImage = () => {
    this.setState({ previewImage: '' });
  };

  //确认付款
  confirmPay = record => {
    const { localization } = this.props;
    this.request('/offline/buy/confirm', {
      body: {
        orderId: record.orderId,
        subOrderId: record.subOrderId
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.getMyOrderList();
        message.success(localization['确认付款成功！']);
      } else {
        message.error(json.msg);
      }
    });
  };

  //确认收款
  confirmReceipt = record => {
    const { localization } = this.props;
    this.request('/offline/sell/confirm', {
      body: {
        orderId: record.orderId,
        subOrderId: record.subOrderId
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.getMyOrderList();
        message.success(localization['确认收款成功！']);
      } else {
        message.error(json.msg);
      }
    });
  };

  cancelOrderSubmit = record => {
    const { localization } = this.props;
    this.request('/offline/detail/cancel', {
      body: {
        orderId: record.orderId,
        subOrderId: record.subOrderId
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.getMyOrderList();
        message.success(localization['撤销交易成功！']);
      } else {
        message.error(json.msg);
      }
    });
  };

  //撤销交易
  cancelPay = (record, status) => {
    const { localization } = this.props;
    if (status === 1) {
      this.setState({
        showAppeal: (
          <Modal
            title={localization['确认取消订单']}
            width={400}
            cancelText={localization['取消']}
            okText={localization['确认']}
            wrapClassName="v-center-modal"
            visible={true}
            onCancel={() => {
              this.setState({ showAppeal: '' });
            }}
            onOk={() => {
              this.setState({ showAppeal: '' });
              this.cancelOrderSubmit(record);
            }}
          >
            <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
              {localization['您已支付款项给对方, 请确认是否取消订单!']}
            </div>
          </Modal>
        )
      });
    } else {
      this.cancelOrderSubmit(record);
    }
  };

  //撤销广告
  cancelAdvert = record => {
    const { localization } = this.props;
    this.request('/offline/gadvert/cancel', {
      body: { orderId: record.id }
    }).then(json => {
      if (json.code === 10000000) {
        this.getMyAdvertList();
        message.success(localization['撤销广告成功！']);
      } else {
        message.error(json.msg);
      }
    });
  };

  //检查申诉
  checkAppeal = (subOrderId, callback) => {
    this.request('/offline/appeal/check', {
      method: 'GET',
      body: {
        subOrderId
      }
    }).then(json => {
      if (json.code === 10000000) {
        callback(true);
      } else {
        message.destroy();
        message.warn(json.msg, 1);
        callback(false);
      }
    });
  };
  // 撤销申诉
  cancelAppeal = appealId => {
    const { localization } = this.props;
    this.request('/offline/appeal/cancel', {
      method: 'POST',
      body: {
        appealId
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success(localization['撤销申诉成功！']);
        this.getAppealList();
      } else {
        message.destroy();
        message.warn(json.msg, 1);
      }
    });
  };

  // 点击撤销申诉
  handleCancel = appealId => {
    this.cancelAppeal(appealId);
  };

  // 获取申诉列表
  getAppealList = () => {
    this.request('/offline/appeal/findall', {
      method: 'GET'
    }).then(json => {
      if (json.code === 10000000) {
        let appealList = json.data.map(item => {
          item.key = item.id;
          return item;
        });
        this.setState({ appealList });
      }
    });
  };

  // 提交申诉
  submitAppeal = (subOrderId, appealType, reason) => {
    const { localization } = this.props;
    this.request('/offline/appeal/doappeal', {
      body: {
        subOrderId,
        appealType,
        reason
      }
    }).then(json => {
      if (json.code === 10000000) {
        message.success(localization['提交成功！'], 1);
        this.closeAppealModal();
        this.getAppealList();
      } else {
        message.destroy();
        message.warn(json.msg, 1);
      }
    });
  };

  closeAppealModal = () => {
    this.setState({ showAppeal: '' });
  };

  //点击申请客服处理
  handleAppeal = record => {
    const { subOrderId } = record;

    //检查是否可以申诉
    this.checkAppeal(subOrderId, check => {
      if (check) {
        this.setState({
          showAppeal: (
            <AppealModal
              onCancel={() => {
                this.closeAppealModal();
              }}
              onOk={(appealType, reason) => {
                this.submitAppeal(subOrderId, appealType, reason);
              }}
            />
          )
        });
      }
    });
  };

  render() {
    const { exType, coin, localization } = this.props;
    const typeText = {
      buy: localization['买入'],
      sell: localization['卖出']
    };

    const {
      coinVolume,
      advertList,
      current,
      pageSize,
      selectedCoin,
      releaseVisible,
      transactionVisible,
      recordIndex,
      myOrderList,
      myAdvertList,
      previewImage,
      appealList
    } = this.state;

    let undoneOrderList, completedOrderList, cancelledOrderList;
    if (myOrderList) {
      //未完成订单列表
      undoneOrderList = myOrderList.filter(order => order.status === 0 || order.status === 1);

      //已完成订单列表
      completedOrderList = myOrderList.filter(order => order.status === 2);

      //已取消订单列表
      cancelledOrderList = myOrderList.filter(order => order.status === 9);
    }

    const listColumns = [
      {
        title: localization['商家名称'],
        dataIndex: 'realName',
        render: (text, record) => {
          return (
            <span
              className={classnames({
                'name-wrap': true,
                online: true
              })}
            >
              {text && text.substr(0, 1)}
            </span>
          );
        }
      },
      {
        title: `${localization['挂单数量']}(${coin.symbol})`,
        dataIndex: 'volume',
        key: 'volume'
      },
      {
        title: `${localization['成交数量']}(${coin.symbol})`,
        dataIndex: 'successVolume',
        key: 'successVolume'
      },
      {
        title: `${localization['锁定数量']}(${coin.symbol})`,
        dataIndex: 'lockVolume',
        key: 'lockVolume'
      },
      {
        title: `${localization['价格']}(CNY)`,
        dataIndex: 'price',
        render: (text, record) => (
          <span
            className={classnames({
              'price-wrap': true,
              'font-color-green': exType === 'buy',
              'font-color-red': exType === 'sell'
            })}
          >
            {text}
          </span>
        )
      },
      {
        title: `${localization['金额']}(CNY)`,
        dataIndex: 'totalPrice',
        key: 'totalPrice'
      },
      {
        title: localization['支付方式'],
        dataIndex: 'wechatNo',
        key: 'wechatNo',
        render: (text, record) => {
          return (
            <div className="pay-list-icon">
              {record.cardNo && <i className="iconfont icon-yinhangqia" />}
              {record.alipayNo && <i className="iconfont icon-zhifubao" />}
              {record.wechatNo && <i className="iconfont icon-wxpay" />}
            </div>
          );
        }
      },
      {
        title: localization['操作'],
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => {
          if (Number(record.volume - record.lockVolume - record.successVolume) > 0) {
            return (
              <Button
                type={exType}
                onClick={this.triggerTransaction.bind(this, { exType, record })}
              >
                {typeText[exType]}
              </Button>
            );
          } else {
            return '';
          }
        }
      }
    ];

    const appealColumns = [
      {
        title: localization['订单号'],
        dataIndex: 'subOrderId',
        key: 'subOrderId'
      },
      {
        title: localization['时间'],
        dataIndex: 'createDate',
        key: 'createDate',
        render: text => {
          return stampToDate(text * 1);
        }
      },
      {
        title: localization['申诉类型'],
        dataIndex: 'appealType',
        key: 'appealType'
      },
      {
        title: localization['申诉理由'],
        dataIndex: 'reason',
        key: 'reason'
      },
      {
        title: localization['操作'],
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => {
          switch (text) {
            case '1':
              return (
                <Button
                  type="primary"
                  onClick={() => {
                    this.handleCancel(record.id);
                  }}
                  style={{ borderRadius: 4 }}
                >
                  {localization['撤销申诉']}
                </Button>
              );
            case '2':
              return <div>{localization['客服已处理完']}</div>;
            case '3':
              return <div>{localization['已撤销']}</div>;
            default:
              return '';
          }
        }
      }
    ];

    const orderColumns = [
      {
        title: localization['类型'],
        dataIndex: 'remarks',
        key: 'remarks',
        render: (text, record) => {
          const typeToText = {
            buy: localization['买入'],
            sell: localization['卖出']
          };
          return `${typeToText[text]} ${record.symbol}`;
        }
      },
      {
        title: localization['订单号'],
        dataIndex: 'subOrderId',
        key: 'subOrderId'
      },
      {
        title: `${localization['价格']}(CNY)`,
        dataIndex: 'price',
        key: 'price'
      },
      {
        title: localization['数量'],
        dataIndex: 'volume',
        key: 'volume'
      },
      {
        title: `${localization['总额']}(CNY)`,
        dataIndex: 'totalPrice',
        key: 'totalPrice'
      },
      {
        title: localization['状态'],
        dataIndex: 'status',
        key: 'status',
        render: text => {
          let status = '';
          switch (text) {
            case 0:
              status = '已挂单';
              break;
            case 1:
              status = '已付款';
              break;
            case 2:
              status = '确认收到款';
              break;
            case 3:
              status = '确认没收到款';
              break;
            case 4:
              status = '申诉';
              break;
            case 5:
              status = '仲裁结束';
              break;
            case 9:
              status = '取消';
              break;
            default:
              status = '';
          }
          return localization[status];
        }
      },
      // {
      //   title: '对方姓名',
      //   dataIndex: 'name',
      //   key: 'name'
      // },
      {
        title: localization['下单时间'],
        dataIndex: 'createDate',
        key: 'createDate',
        render: (text, record) => stampToDate(Number(text), 'MM-DD hh:mm:ss')
      },
      {
        title: localization['操作'],
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => {
          if (record.status === 0) {
            if (record.remarks === 'buy') {
              return (
                <Button type="primary" onClick={this.confirmPay.bind(this, record)}>
                  {localization['我已付款给商家']}
                </Button>
              );
            } else {
              return localization['等待收款'];
            }
          } else if (record.status === 1) {
            if (record.remarks === 'buy') {
              return localization['已付款'];
            } else {
              return (
                <Button type="primary" onClick={this.confirmReceipt.bind(this, record)}>
                  {localization['确认收款']}
                </Button>
              );
            }
          } else {
            return '--';
          }
        }
      }
    ];

    const advertColumns = [
      {
        title: localization['创建时间'],
        dataIndex: 'createDate',
        key: 'createDate',
        render: (text, record) => stampToDate(Number(text), 'MM-DD hh:mm:ss')
      },
      {
        title: localization['类型'],
        dataIndex: 'exType',
        key: 'exType'
      },
      {
        title: `${localization['价格']}(CNY)`,
        dataIndex: 'price',
        key: 'price'
      },
      {
        title: localization['币种'],
        dataIndex: 'symbol',
        key: 'symbol'
      },
      {
        title: `${localization['挂单数量']}`,
        dataIndex: 'volume',
        key: 'volume'
      },
      {
        title: `${localization['成交数量']}`,
        dataIndex: 'successVolume',
        key: 'successVolume'
      },
      {
        title: `${localization['锁定数量']}`,
        dataIndex: 'lockVolume',
        key: 'lockVolume'
      },

      {
        title: `${localization['总额']}(CNY)`,
        dataIndex: 'totalPrice',
        key: 'totalPrice'
      },
      {
        title: localization['状态'],
        dataIndex: 'status',
        key: 'status',
        render: text => {
          let status = '';
          switch (text) {
            case 0:
              status = '已发布';
              break;
            case 1:
              status = '已完成';
              break;
            case 2:
              status = '部分成交';
              break;
            case 3:
              status = '部分取消';
              break;
            case 9:
              status = '取消';
              break;
            default:
              status = '';
          }

          return localization[status];
        }
      },
      {
        title: localization['操作'],
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => {
          if (record.status === 0 || record.status === 2) {
            return (
              <Button type="primary" onClick={this.cancelAdvert.bind(this, record)}>
                {localization['撤销广告']}
              </Button>
            );
          } else {
            return '--';
          }
        }
      }
    ];

    // 买入数量默认值
    let defaultVolum = 0;

    if (selectedCoin) {
      // 获取三个值  最大小数位数
      let point = getMaxPoint([
        selectedCoin.volume,
        selectedCoin.lockVolume,
        selectedCoin.successVolume
      ]);

      defaultVolum = Number(
        selectedCoin.volume - selectedCoin.lockVolume - selectedCoin.successVolume
      ).toFixed(point);
    }

    return (
      <div className="trade-cont">
        <div className="trade-list">
          <div className="trade-list-header clear">
            <Button
              type="primary"
              size="large"
              onClick={this.triggerRelease}
              className="trade-release pull-right"
            >
              <i className="iconfont icon-jia" />
              {localization['发布广告']}
            </Button>
            <Modal
              title={localization['发布广告']}
              wrapClassName="c2c-modal v-center-modal"
              visible={releaseVisible}
              onCancel={this.hideModal.bind(this, 'releaseVisible')}
              footer={null}
            >
              <Tabs defaultActiveKey="1" onChange={this.handleSwitchRelease}>
                {releaseVisible && [
                  <TabPane tab={`${localization['买入']}${coin.symbol}`} key="1">
                    {releaseVisible && (
                      <TransactionForm
                        localization={localization}
                        coin={coin}
                        exType="buy"
                        price={advertList && advertList.price}
                        onSubmit={this.handleRelease}
                      />
                    )}
                  </TabPane>,
                  <TabPane tab={`${localization['卖出']}${coin.symbol}`} key="2">
                    {releaseVisible && (
                      <TransactionForm
                        localization={localization}
                        coin={coin}
                        exType="sell"
                        price={advertList && advertList.price}
                        volume={coinVolume}
                        onSubmit={this.handleRelease}
                      />
                    )}
                  </TabPane>
                ]}
              </Tabs>
            </Modal>
          </div>
          <Table
            dataSource={advertList && advertList.list}
            columns={listColumns}
            pagination={{
              current,
              pageSize,
              total: advertList && advertList.count,
              onChange: this.pageOnChange
            }}
            locale={{
              emptyText: (
                <span>
                  <i className="iconfont icon-zanwushuju" />
                  {localization['暂无数据']}
                </span>
              )
            }}
          />
        </div>
        <div className="trade-record">
          <ul className="trade-record-nav">
            {[
              localization['我的未完成订单'],
              localization['我发布的广告'],
              localization['我的已完成订单'],
              localization['我的已取消订单'],
              localization['我的申诉']
            ].map((text, index) => {
              return (
                <li
                  key={text}
                  className={classnames({
                    active: recordIndex === index
                  })}
                  onClick={this.switchRecord.bind(this, index)}
                >
                  {text}
                </li>
              );
            })}
          </ul>
          <div className="trade-record-cont">
            {recordIndex === 0 && (
              <Table
                dataSource={undoneOrderList}
                columns={orderColumns}
                onExpand={this.handleExpand}
                pagination={false}
                locale={{
                  emptyText: (
                    <span>
                      <i className="iconfont icon-zanwushuju" />
                      {localization['暂无数据']}
                    </span>
                  )
                }}
                expandedRowRender={record =>
                  record.bankInfo ? (
                    <ExpandComponent
                      localization={localization}
                      record={record}
                      previewImage={previewImage}
                      onPreview={this.handlePreview}
                      onCloseImage={this.handleCloseImage}
                      confirmPay={this.confirmPay}
                      cancelPay={this.cancelPay}
                      confirmReceipt={this.confirmReceipt}
                      handleAppeal={() => {
                        this.handleAppeal(record);
                      }}
                    />
                  ) : null
                }
              />
            )}
            {recordIndex === 1 && (
              <Table
                dataSource={myAdvertList}
                columns={advertColumns}
                pagination={false}
                locale={{
                  emptyText: (
                    <span>
                      <i className="iconfont icon-zanwushuju" />
                      {localization['暂无数据']}
                    </span>
                  )
                }}
              />
            )}
            {recordIndex === 2 && (
              <Table
                dataSource={completedOrderList}
                columns={orderColumns}
                pagination={false}
                locale={{
                  emptyText: (
                    <span>
                      <i className="iconfont icon-zanwushuju" />
                      {localization['暂无数据']}
                    </span>
                  )
                }}
              />
            )}
            {recordIndex === 3 && (
              <Table
                dataSource={cancelledOrderList}
                columns={orderColumns}
                pagination={false}
                locale={{
                  emptyText: (
                    <span>
                      <i className="iconfont icon-zanwushuju" />
                      {localization['暂无数据']}
                    </span>
                  )
                }}
              />
            )}
            {recordIndex === 4 && (
              <Table
                dataSource={appealList}
                columns={appealColumns}
                pagination={false}
                locale={{
                  emptyText: (
                    <span>
                      <i className="iconfont icon-zanwushuju" />
                      {localization['暂无数据']}
                    </span>
                  )
                }}
              />
            )}
          </div>
        </div>
        <Modal
          title={`${typeText[exType]} ${coin.symbol}`}
          wrapClassName="c2c-modal v-center-modal"
          visible={transactionVisible}
          onCancel={this.hideModal.bind(this, 'transactionVisible')}
          footer={null}
        >
          {transactionVisible && (
            <TransactionForm
              localization={localization}
              freezePrice
              coin={coin}
              exType={exType}
              price={selectedCoin.price}
              volume={defaultVolum}
              onSubmit={this.handleTransaction}
            />
          )}
        </Modal>

        {this.state.showAppeal}
      </div>
    );
  }
}

export default withRouter(TradeContainer);
