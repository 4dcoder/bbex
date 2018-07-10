
// const IMAGES_ADDRESS = 'https://images.ckex.com';
// const WS_ADDRESS = 'wss://api.bbex.one';
// eco  www.ecoexc.com
// ues www.uescoin.com

// 密码正则表达式
export const PWD_REGEX = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,20}$/;

// 邮箱正则
export const MAIL_REGEX  = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

// 公钥
export const PUBLI_KEY =
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCLADJL0WYJJrxmpNqKeoAXhW8P0GWMy7ZJG/I+8CwLZ2we83VnHcF4zXfpWrw3zY4RIYkFQT8EkW7FUDFeY9XzoxoQbcjyG3ywIzN6SI+7Jd07TGktNTTxFR6Bj4IjzAlazitFlUKAP77AyhT65YDChbNRul8u6M5qqt/ojjGb1QIDAQAB';

// 地址配置
export const IMAGES_ADDRESS = 'http://images.uescoin.com';
export const WS_PREFIX = `${window.location.origin.replace('http', 'ws')}/bbex/websocket`;

//内网 ws://192.168.1.80
//外网 wss://api.bbex.one
