// 处理二进制流
const onWsMessage = params => {
  let { data, callback } = params;

  let initFileReader = function() {
    let reader = new FileReader();
    reader.onloadend = e => {
      let text = e.srcElement.result;
      callback(text);
    };
    return reader;
  };

  let reader = initFileReader();

  if (reader) {
    reader.readAsText(data);
  }
};

// 处理websocket返回的数据
const dealWebsocket = params => {
  let { data, resolutionTime, callback } = params;
  // if (data && data.data && data.data.length>0) {
  data = JSON.parse(data);
  let dataString = '';
  let dataJSON = '';
  let wsLocalStorage = 'wsTradeViewDataHistory';
  switch (data.type) {
    // k线历史图
    case 'kline':
      dataString = JSON.stringify(data.data);
      break;
    // 实时获取推送
    case 'realTime':
      dataString = localStorage.getItem(wsLocalStorage);
      dataJSON = JSON.parse(dataString);
      // debugger;
      if (dataJSON && dataJSON.length > 0) {
        let lastDataLength = dataJSON.length - 1;
        let newData = data.data[0];
        // debugger;
        let lastDataTime = dataJSON[lastDataLength]['t'];
        let newDataTime = parseInt(newData['t']);

        // 判断当前时间 + 时间间隔 和 最新时间的大小
        if (lastDataTime + resolutionTime > newDataTime) {
          // 替换最后一个, 交易量累加
          dataJSON[lastDataLength] = {
            ...newData,
            v: Number(dataJSON[lastDataLength]['v']) + Number(newData['v'])
          };
        } else {
          // 放入最新的
          dataJSON.push(newData);
        }

        dataString = JSON.stringify(dataJSON);
      }
      break;
  }
  localStorage.setItem(wsLocalStorage, dataString);
  callback(dataString);

  // }
};

const filteringTime = time => {
  let minuteTime = 60;
  let dayTime = 60 * 60 * 24;
  let longTime = 0;
  switch (time) {
    case '1D':
      longTime = dayTime * 1;
      break;
    case '1W':
      longTime = dayTime * 7;
      break;
    case '1M':
      longTime = dayTime * 30;
      break;
    default:
      longTime = parseInt(time) * minuteTime;
      break;
  }
  return longTime;
};

const transformTime = time => {
  let period = '';
  if (time.toString().indexOf('D') !== -1) {
    period = '1d';
  } else if (time.toString().indexOf('W') !== -1) {
    period = '1w';
  } else if (time.toString().indexOf('M') !== -1) {
    period = '1mth';
  } else {
    if (parseInt(time) < 60) {
      period = `${time}m`;
    } else {
      let hourNumber = Math.floor(parseInt(time) / 60);
      period = `${hourNumber}h`;
    }
  }

  return period;
};

export default {
  onWsMessage,
  dealWebsocket,
  filteringTime,
  transformTime
};
