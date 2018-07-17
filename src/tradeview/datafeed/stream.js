import ReconnectingWebSocket from '../../utils/ReconnectingWebSocket';
import { WS_PREFIX } from '../../utils/constants';
import { transformResolution } from './utils';

export default {
  subscribeBars: function(symbolInfo, resolution, listener, uid, resetCache) {
    const [coinOther, coinMain] = symbolInfo.ticker.split('/');
    const time = transformResolution(resolution);

    if (window.klineWS && window.klineWS.readyState === 1) {
      window.klineWS.send(`${coinOther}_${coinMain}_${time}`);
    } else {
      window.klineWS = new ReconnectingWebSocket(`${WS_PREFIX}/kline`);
      // const klineWS = new ReconnectingWebSocket(`ws://localhost:3001`);

      window.klineWS.onopen = evt => {
        if (window.klineWS && window.klineWS.readyState === 1) {
          window.klineWS.send(`${coinOther}_${coinMain}_${time}`);
        }
      };
    }
    
    window.klineWS.onmessage = evt => {
      const data = JSON.parse(evt.data).data;
      if (data && data.length > 0) {
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
      }
    };
  },

  unsubscribeBars: function(uid) {
    
  } 
};
