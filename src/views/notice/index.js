import React, { Component } from 'react';
import { List, message } from 'antd';
import { stampToDate } from '../../utils';
import './notice.css';

class Notice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            total: 0,
            notices: [],
            current: 1,
            loading: false
        };
    }

    request = window.request;

    componentWillMount() {
        this.getNotice(1);
    }

    //获取公告
    getNotice = (page) => {
        this.setState({loading: true})
        this.request('/cms/notice/list', {
            body: {
                language: 'zh_CN',
                currentPage: page,
                showCount: 10
            }
        }).then(json => {
            if (json.code === 10000000) {
                this.setState({ notices: json.data.list, total: json.data.count })
                this.setState({loading: false})
            } else {
                message.error(json.msg);
                this.setState({loading: false})
            }
        });
    };

    itemClick = item => {
        this.props.history.push(`/notice/${item.id}`);
    };

    pageChange = (page) => {
        this.setState({ current: page });
        this.getNotice(page);
    }

    render() {
        const { current, notices, total, loading } = this.state;

        return <div className="notice">
            <div className="notice-container">
                <h4>公告</h4>
                <List
                    size="large"
                    loading={loading}
                    dataSource={notices}
                    renderItem={item => (<List.Item onClick={()=>{
                        this.itemClick(item);
                    }}>
                        <div className="notice-title">
                            {item.title}
                        </div>
                        <div className='notice-time'>
                            {stampToDate(item.createDate * 1)}
                        </div>
                    </List.Item>)}
                    pagination={{
                        current,
                        total,
                        pageSize: 10,
                        onChange: page => {
                            this.pageChange(page);
                        }
                    }}
                />
            </div>
        </div>
    }
}

export default Notice;
