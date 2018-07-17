import request from '../../utils/request';
const history = {};

const transformResolution = resolution => {
  let time = '';
  if (resolution.toString().indexOf('D') !== -1) {
    time = '1d';
  } else if (resolution.toString().indexOf('W') !== -1) {
    time = '1w';
  } else if (resolution.toString().indexOf('M') !== -1) {
    time = '1mth';
  } else {
    if (parseInt(resolution) < 60) {
      time = `${resolution}m`;
    } else {
      let hourNumber = Math.floor(parseInt(resolution) / 60);
      time = `${hourNumber}h`;
    }
  }
  return time;
};

export default {
  history: history,

  getBars: function(symbolInfo, resolution, from, to, first, limit) {
    const [coinOther, coinMain] = symbolInfo.ticker.split('/');
    const time = transformResolution(resolution);
    return request(`/index/kline?coinMain=${coinMain}&coinOther=${coinOther}&time=${time}`, {
      method: 'GET'
    }).then(json => {
      const resBars = json.data.data;
      const bars = [];
      if (resBars.length > 0 && first) {
        resBars.forEach(bar =>
          bars.push({
            time: bar.t * 1,
            close: bar.c * 1,
            high: bar.h * 1,
            low: bar.l * 1,
            open: bar.o * 1,
            volume: bar.v * 1
          })
        );
      }
      return bars;
    });
  }
};
