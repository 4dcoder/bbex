/**
 * @author William Cui
 * @description 数字不够位数前面自动补零
 * @param number {number} 需要格式化的数字
 * @param n {number} 需要格式化成的位数
 * @returns {string} 格式化后的字符串
 **/
function fillZero(number, n) {
  return (Array(n).join(0) + number).slice(-n);
}

/**
* @author William Cui
* @description 根据后端返回的时间戳格式化成指定的格式
* @param timestamp {number} 需要格式化的时间戳
* @param pattern {string} 指定的格式字符串 默认是'YYYY-MM-DD hh:mm:ss'
* @returns {string} 格式化后的日期时间字符串
Y: 代表年份， M: 代表月份， D: 代表一个月中的第几天， h: 代表小时， m: 代表分, s: 代表秒
**/
function stampToDate(timestamp, pattern = 'YYYY-MM-DD hh:mm:ss') {
  const date = new Date(timestamp);
  const dateObj = {
    Y: date.getFullYear(),
    M: date.getMonth() + 1,
    D: date.getDate(),
    h: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds()
  };
  return pattern.replace(/\w+/g, match => {
    return fillZero(dateObj[match[0]], match.length);
  });
}

/**
 * @author William Cui
 * @description 把日期字符串转成时间戳
 * @param dateStr {string} 需要格式化的日期字符串
 * @returns {number} 时间戳
 **/
function dateToStamp(dateStr) {
  return new Date(dateStr).getTime();
}

/**
 * @author William Cui
 * @description 复制传入的text文本
 * @param text { string }
 * @returns 没有返回值
 **/
function copy(text) {
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.style.position = 'fixed';
    textArea.style.left = '-1000px';
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      resolve(true);
    } catch (error) {
      reject(error);
      throw new Error('该浏览器不支持点击复制到剪贴板');
    }

    document.body.removeChild(textArea);
  });
}

/**
 * @author William Cui
 * @description 根据URL参数名获取参数值
 * @param name {string} 参数名
 * @returns value {string} 参数值
 **/
function getQueryString(name) {
  let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  let r = window.location.search.substr(1).match(reg);
  if (r !== null) return unescape(r[2]);
  return null;
}

/**
 * @author gm
 * @description 获取几个数字 最大 小数位数
 * @param name {array} 参数名
 * @returns
 **/
function getMaxPoint(numbers) {
  if (numbers.length > 0) {
    let points = numbers.map(item => {
      if ((item + '').indexOf('.') > -1) {
        return (item + '').split('.')[1].length;
      } else {
        return 0;
      }
    });
    return Math.max(...points);
  } else {
    return 0;
  }
}

export { fillZero, stampToDate, dateToStamp, copy, getQueryString, getMaxPoint };
