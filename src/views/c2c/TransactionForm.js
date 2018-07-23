import React, { Component } from 'react';
import { Input, Button } from 'antd';

class TransactionForm extends Component {
  componentDidMount(){
    console.log('props',this.props);
  }
  state = {
    price: this.props.price||'',
    volume: this.props.volume|| '',
    amount: this.props.volume ? (this.props.price * this.props.volume).toFixed(2) : ''
  };

  componentWillReceiveProps(nextProps) {
    this.setState({ volume: nextProps.volume || 0 });
  }

  handleSubmit = e => {
    e.preventDefault();
    const { exType } = this.props;
    const { price, volume } = this.state;
    if (Number(price) > 0 && Number(volume) > 0) {
      const { onSubmit } = this.props;
      onSubmit && onSubmit({ price, volume, exType });
    }
  };

  handlePrice = e => {
    const price = e.target.value;
    if(/^\d*\.{0,1}\d{0,2}$/.test(price) && price.length<16 ){
      const amount = (price * this.state.volume).toFixed(2);
      this.setState({ price, amount });
    }
   
  };

  handleVolume = e => {
    const volume = e.target.value;
    if(/^\d*\.{0,1}\d{0,8}$/.test(volume) && volume.length<16 ){
      const amount = (volume * this.state.price).toFixed(2);
      this.setState({ volume, amount });
    }
    
  };

  handleAmount = e => {
    const amount = e.target.value;
    if(/^\d*\.{0,1}\d{0,2}$/.test(amount) && amount.length<16 ){
      const volume = (amount / this.state.price).toFixed(8);
      this.setState({amount });
      if( this.state.price>0){
        this.setState({volume})
      }
    }
  };

  render() {
    const { localization, coin, exType, freezePrice } = this.props;
    const { price, volume, amount } = this.state;
    const typeText = {
      buy: localization['买入'],
      sell: localization['卖出']
    };

    return (
      <ul className="c2c-form">
        <li>
          <Input
            addonBefore={`${localization['价格']}（CNY）`}
            size="large"
            value={price}
            placeholder={localization['请输入价格']}
            disabled={freezePrice}
            onChange={this.handlePrice}
          />
        </li>
        <li>
          <Input
            addonBefore={`${localization['数量']}（${coin.symbol}）`}
            size="large"
            value={volume}
            placeholder={localization['请输入数量']}
            onChange={this.handleVolume}
          />
        </li>
        <li>
          <Input
            addonBefore={`${localization['总额']}（CNY）`}
            size="large"
            value={amount}
            placeholder={localization['请输入总额']}
            onChange={this.handleAmount}
          />
        </li>
        <li>
          <Button type={exType} size="large" onClick={this.handleSubmit}>
            <i className="iconfont icon-jia" />
            {`${typeText[exType]} ${coin.symbol}`}
          </Button>
        </li>
        <li style={{color: '#dadada'}}>{localization['费率']} 0%</li>
      </ul>
    );
  }
}

export default TransactionForm;
