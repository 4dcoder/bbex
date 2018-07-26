import React, { Component } from 'react';
import { List } from 'antd';
import './help.css';

const data = [
  'Racing car sprays burning fuel into crowd.Racing car sprays burning fuel into crowdRacing car sprays burning fuel into crowdRacing car sprays burning fuel into crowd',
  'Japanese princess to wed commoner.',
  'Australian walks 100km after outback crash.',
  'Man charged over missing wedding girl.',
  'Los Angeles battles huge wildfires.',
  'Racing car sprays burning fwwuel into crowd.',
  'Japanese princess to wed cowwmmoner.',
  'Australian walks 100km afterww outback crash.',
  'Man charged over missing wedwwding girl.',
  'Los Angeles battles huge www.',
  'Racing car sprays burning fwwuel into crowd.',
  'Japanese princess to wed cowwwmmoner.',
  'Australian walks 100km aftwwwer outback crash.',
  'Man charged over missing wwwwedding girl.',
  'Los Angeles battles huge wiwwwwldfires.',
  'Man charged over missing wedwwding girl.',
  'Los Angeles battles huge www.',
  'Racing car sprays burning fwwuel into crowd.',
  'Japanese princess to wed cowwwmmoner.',
  'Australian walks 100km aftwwwer outback crash.',
  'Man charged over missing wwwwedding girl.',
  'Los Angeles battles huge wiwwwwldfires.',
]

class Help extends Component {

  constructor(props) {
    super(props);
    this.state = {
      current: 1
    }
  }

  pageChange = (page) => {
    this.setState({current: page})
  }


  render() {
    const { current } = this.state;
    return (
      <div className="help">
        <div className="help-container">
          <h4>帮助中心</h4>
          <List
            size="large"
            dataSource={data}
            renderItem={item => (<List.Item>{item}</List.Item>)}
            pagination={{
              current,
              total: 22,
              pageSize: 10,
              onChange: page => {
                this.pageChange(page);
              }
            }}
          />
        </div>
      </div>
    )
  }
}

export default Help;
