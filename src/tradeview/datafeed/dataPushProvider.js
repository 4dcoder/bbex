import ReconnectingWebSocket from '../../utils/ReconnectingWebSocket';
import { WS_PREFIX } from '../../utils/constants';
import { resolutionToTime, resolutionToStamp } from './helpers';

export default {
  lastBar: {},

  prevBar: {
    time: 0,
    volume: 0
  },

  getLastBar(lastBar) {
    this.lastBar = lastBar;
  },

  subscribeBars(symbolInfo, resolution, listener, uid, resetCache) {
    const [coinOther, coinMain] = symbolInfo.ticker.split('/');
    const time = resolutionToTime(resolution);

    if (window.klineWS && window.klineWS.readyState === 1) {
      window.klineWS.send(`${coinOther}_${coinMain}_${time}`);
    } else {
      window.klineWS = new ReconnectingWebSocket(`${WS_PREFIX}/kline`);

      window.klineWS.onopen = evt => {
        if (window.klineWS && window.klineWS.readyState === 1) {
          window.klineWS.send(`${coinOther}_${coinMain}_${time}`);
        }
      };

      window.klineInterval = setInterval(() => {
        if (window.klineWS && window.klineWS.readyState === 1) {
          window.klineWS.send('ping');
        }
      }, 1000 * 10);
    }

    window.klineWS.onmessage = evt => {
      if (evt.data === 'pong') {
        return;
      }

      const barData = JSON.parse(evt.data).data;
      const hasData = barData && barData.length > 0;
      if (hasData) {
        const resBar = barData[barData.length - 1];
        const period =
          resolution === 1
            ? this.lastBar.time
            : this.lastBar.time + resolutionToStamp(resolution - 1);
        let bar = {};
        if (!this.lastBar.time || period < resBar.t * 1) {
          // 新增一条K线
          bar = {
            time: resBar.t * 1,
            close: resBar.c * 1,
            high: resBar.h * 1,
            low: resBar.l * 1,
            open: resBar.o * 1,
            volume: resBar.v * 1
          };

          // 清空上一分钟的时间和数量
          // this.prevBar = { 
          //   time: this.lastBar.time, 
          //   volume: 0
          // };
        } else {
          // 保存上一分钟的时间和数量
          // if(this.prevBar.time === 0) {
          //   this.prevBar = { 
          //     time: this.lastBar.time, 
          //     volume: 0
          //   };
          // }
          // if (this.prevBar.time < resBar.t * 1) {
          //   this.prevBar = { 
          //     time: this.lastBar.time, 
          //     volume: this.lastBar.volume
          //   };
          // }

          // console.log(this.prevBar.volume)
          // 当前实时推送合并到最后一根k线
          bar = {
            time: this.lastBar.time,
            close: resBar.c * 1,
            high: this.lastBar.high > resBar.h ? this.lastBar.high : resBar.h * 1,
            low: this.lastBar.low < resBar.l ? this.lastBar.low : resBar.l * 1,
            open: this.lastBar.open,
            volume: resBar.v * 1
          };
        }

        listener(bar);
        this.lastBar = bar;
      }
    };
  },

  unsubscribeBars(uid) {}
};
