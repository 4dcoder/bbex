import React, { Component } from 'react';
import { Steps, Button, message, Upload, Icon } from 'antd';
import { IMAGES_ADDRESS } from '../../../utils/constants';
import VerForm from './VerForm';

import './verified.css';
import exampleImg from '../../../assets/images/card-template.png';

const Step = Steps.Step;

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

class Verified extends Component {
  constructor(props) {
    super(props);
    const { cardStatus } = this.account;
    const currentMap = {
      0: 0,
      9: 2,
      1: 3,
      2: 2
    };
    this.state = {
      current: currentMap[cardStatus],
      showExampleImage: false,
      reason: ''
    };
  }

  request = window.request;
  account = JSON.parse(sessionStorage.getItem('account'));

  showExample = () => {
    this.setState({ showExampleImage: true });
  };

  hideExample = () => {
    this.setState({ showExampleImage: false });
  };

  handleVerification = () => {
    const current = this.state.current + 1;
    this.setState({ current });
  };

  componentDidMount() {
    const { current } = this.state;
    if (current === 2) {
      this.getReason();
    }
  }
  // 获取审核不通过原因
  getReason = () => {
    this.request('/user/findCardStatus').then(json => {
      if (json.code === 10000000) {
        this.setState({ reason: json.data.reason });
      } else {
        message.success(json.msg);
      }
    });
  }
  //重新认证
  reVerified = () => {
    this.setState({ current: 0, reason: ''});
  }

  // 提交身份信息
  submitVer = values => {
    const { idCard, age, sex, realName, address } = values;
    const { frontIdCard, backIdCard, handheldIdCard } = this.state;
    this.request('/user/updateUser', {
      body: {
        idCard,
        age,
        sex,
        realName,
        address,
        cardUpId: frontIdCard.response,
        cardDownId: backIdCard.response,
        cardFaceId: handheldIdCard.response
      }
    }).then(json => {
      if (json.code === 10000000) {
        this.account.cardStatus = 2;
        sessionStorage.setItem('account', JSON.stringify(this.account));

        const current = this.state.current + 1;
        this.setState({ current });
        message.success('信息提交成功!');
      } else {
        message.success(json.msg);
      }
    });
  };

  beforeUpload = file => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('照片必须小于10MB!');
    }
    return isLt10M;
  };

  handleChange = ({ file }, type) => {
    if (file.status === 'uploading') {
      this.setState({ [`${type}Loading`]: true });
      return;
    }
    if (file.status === 'done') {
      getBase64(file.originFileObj, imageUrl =>
        this.setState({
          [`${type}IdCard`]: file,
          [`${type}ImageUrl`]: imageUrl,
          [`${type}Loading`]: false
        })
      );
    }
  };

  render() {
    const { current, showExampleImage, frontIdCard, backIdCard, handheldIdCard, reason } = this.state;

    const canSumbit = frontIdCard && backIdCard && handheldIdCard;
    const cardStatus = JSON.parse(sessionStorage.getItem('account')).cardStatus;

    return (
      <div className="user-cont verified">
        <Steps current={current}>
          {['上传证件', '填写资料', '等待审核', '完成认证'].map(text => (
            <Step key={text} title={text} />
          ))}
        </Steps>
        {current === 0 && (
          <div className="steps-content step1">
            <h2 className="steps-attention" id="attention">
              照片要求：大小不超过10M，照片清晰，手持有效证件、平台名称(UES) 及当天日期的字条
              <Button onFocus={this.showExample} onBlur={this.hideExample} type="primary">
                示例
              </Button>
              {showExampleImage && (
                <div className="example-box">
                  <img src={exampleImg} alt="" />
                  <div className="example-text">
                    <span>标准</span>
                    <span>边缘缺失</span>
                    <span>照片模糊</span>
                    <span>证件不在手心</span>
                  </div>
                </div>
              )}
            </h2>
            <div className="steps-photos">
              {['front', 'back', 'handheld'].map(type => {
                const uploadText = {
                  front: '上传身份证正面照',
                  back: '上传身份证背面照',
                  handheld: '上传手持身份证及字条图'
                };
                const uploaded = this.state[`${type}IdCard`];
                return (
                  <Upload
                    key={type}
                    action={`${IMAGES_ADDRESS}/card/upload`}
                    listType="picture-card"
                    className={`steps-photo-box${uploaded ? '' : ` ${type}`}`}
                    showUploadList={false}
                    beforeUpload={this.beforeUpload}
                    onChange={info => {
                      this.handleChange(info, type);
                    }}
                  >
                    {this.state[`${type}ImageUrl`] ? (
                      <img src={this.state[`${type}ImageUrl`]} alt="" />
                    ) : (
                        <div>
                          <Icon type={this.state[`${type}Loading`] ? 'loading' : 'plus'} />
                          <div className="ant-upload-text">{uploadText[type]}</div>
                        </div>
                      )}
                  </Upload>
                );
              })}
            </div>
          </div>
        )}
        {current === 1 && (
          <div className="steps-content step2">
            <VerForm
              submitVer={values => {
                this.submitVer(values);
              }}
            />
          </div>
        )}
        {current === 2 && (
          <div className="steps-content step3">
            <i className="iconfont icon-tubiaolunkuo-" />
            {
              cardStatus===9 ? 
              <div className='reason-des'>
                <div className='reason-result'>认证不通过</div>
                <h3>原因：{reason}</h3>
                <Button type="primary" onClick={this.reVerified}>重新认证</Button>
              </div>
              : 
              <h3>您的资料已递交审核，我们会在三个工作日内完成审核</h3>
            }

            <p>我们承诺保证您的个人隐私安全，请您积极配合，耐心等待审核</p>
          </div>
        )}
        {current === 3 && (
          <div className="steps-content step4">
            <i className="iconfont icon-shimingrenzheng1" />
            <h3 style={{ color: '#fff' }}>您已完成身份认证</h3>
            <p>您的真实姓名为：{this.account.realName}</p>
          </div>
        )}
        <div className="steps-action">
          {this.state.current === 0 && (
            <Button
              type="primary"
              size="large"
              onClick={this.handleVerification}
              disabled={!canSumbit}
            >
              提交审核
            </Button>
          )}
        </div>
      </div>
    );
  }
}

export default Verified;
