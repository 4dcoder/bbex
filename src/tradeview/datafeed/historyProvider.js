import request from '../../utils/request';
import { transformResolution } from './utils';

export default {
  getBars: function(symbolInfo, resolution, from, to, first, limit) {
    const [coinOther, coinMain] = symbolInfo.ticker.split('/');
    const time = transformResolution(resolution);
    return request(`/index/kline?coinMain=${coinMain}&coinOther=${coinOther}&time=${time}`, {
      method: 'GET'
    }).then(json => {
      const resBars = json.data.data;
      const bars = [];
      if (resBars && resBars.length > 0 && first) {
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
