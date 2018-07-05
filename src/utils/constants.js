
// const IMAGES_ADDRESS = 'https://images.ckex.com';
// const WS_ADDRESS = 'wss://api.bbex.one';
// eco  www.ecoexc.com
// ues www.uescoin.com

// 公钥
const PUBLI_KEY =
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCLADJL0WYJJrxmpNqKeoAXhW8P0GWMy7ZJG/I+8CwLZ2we83VnHcF4zXfpWrw3zY4RIYkFQT8EkW7FUDFeY9XzoxoQbcjyG3ywIzN6SI+7Jd07TGktNTTxFR6Bj4IjzAlazitFlUKAP77AyhT65YDChbNRul8u6M5qqt/ojjGb1QIDAQAB';


// ckex.com 地址配置
const IMAGES_ADDRESS = 'http://images.ecoexc.com';
const WS_PREFIX = `${window.location.origin.replace('http', 'ws')}/bbex/websocket`;

//内网 ws://192.168.1.80
//外网 wss://api.bbex.one

export {
    IMAGES_ADDRESS,
    WS_PREFIX,
    PUBLI_KEY
}
