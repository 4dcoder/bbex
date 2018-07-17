import historyProvider from './historyProvider.js';
import ReconnectingWebSocket from '../../utils/ReconnectingWebSocket';
import { WS_PREFIX } from '../../utils/constants';
const _subs = {};

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
  subscribeBars: function(symbolInfo, resolution, listener, uid, resetCache) {
    const [coinOther, coinMain] = symbolInfo.ticker.split('/');
    const time = transformResolution(resolution);
    const klineWS = new ReconnectingWebSocket(`${WS_PREFIX}/kline`);
    // const klineWS = new ReconnectingWebSocket(`ws://localhost:3001`);

    klineWS.onopen = evt => {
      if (klineWS && klineWS.readyState === 1) {
        klineWS.send(`${coinOther}_${coinMain}_${time}`);
      }
    };

    klineWS.onmessage = evt => {
      const data = JSON.parse(evt.data).data;
      const resBar = data[data.length - 1];
      const bar = {
        time: resBar.t * 1,
        close: resBar.c * 1,
        high: resBar.h * 1,
        low: resBar.l * 1,
        open: resBar.o * 1,
        volume: resBar.v * 1
      };
      // const bar = {
      //   time: resBar.t * 1000,
      //   close: resBar.c / 20,
      //   high: resBar.h / 20,
      //   low: resBar.l / 20,
      //   open: resBar.o / 20,
      //   volume: resBar.v / 10000
      // };
      listener(bar);
    };

    _subs[uid] = {
      resolution,
      symbolInfo,
      klineWS,
      listener
    };
  },
  
  unsubscribeBars: function(uid) {
    if (_subs[uid]) {
      delete _subs[uid];
    }
  }
};