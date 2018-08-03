/**
 * @author William Cui
 * @description 使用Promise封装接口请求方法
 * @param url {String} 请求地址 【必填】
 * @param method {String} 请求方式 【选填】 默认POST
 * @param headers {Object} 请求头对象 【选填】
 * @param body {Object} 请求参数对象 【选填】
 * @param timeout {Number} 请求超时时间 【选填】 默认10s
 * @return Promise 对象
 * @date 2017-08-25
 **/
function request(url, { method = 'POST', headers, body, timeout = 1000 * 10 } = {}) {
  //键值对转换为字符串
  function params(body) {
    var arr = [];
    Object.keys(body).forEach((key, index) => {
      arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(body[key]));
    });
    return arr.join('&');
  }

  const requestPromise = new Promise((resolve, reject) => {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers
      }
    };

    if (body) {
      if (method === 'POST') {
        opts.body = params(body);
      } else {
        url = `${url}?${params(body)}`;
      }
    }

    //如果已经登录了要把stoken放入headers
    if (sessionStorage.getItem('account')) {
      const account = JSON.parse(sessionStorage.getItem('account'));
      opts.headers['stoken'] = account.token;
    }

    fetch(`/bbex${url}`, opts)
      .then(response => {
        if (response.ok) {
          return response.status === 200 ? response.json() : { status: response.status };
        }
        switch (response.status) {
          case -2:
            reject({
              status: response.status,
              msg: '全局错误'
            });
            break;
          case 404:
            reject({
              status: response.status,
              msg: '没有找到相关接口'
            });
            break;
          case 500:
            reject({
              status: response.status,
              msg: '服务器内部错误 [500].'
            });
            break;
          default:
            reject({
              status: response.status,
              msg: response.statusText
            });
        }
      })
      .then(json => {
        resolve(json);
      })
      .catch(error => {
        console.log('请求错误：', error);
        reject(error);
      });
  });

  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(function() {
      reject('请求超时!');
    }, timeout);
  });

  return Promise.race([requestPromise, timeoutPromise]);
}

export default request;
