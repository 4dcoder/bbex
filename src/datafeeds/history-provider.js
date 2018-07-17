import { getErrorMessage } from './helpers';
var HistoryProvider = /** @class */ (function() {
  function HistoryProvider(datafeedUrl, requester) {
    this._datafeedUrl = datafeedUrl;
    this._requester = requester;
  }
  HistoryProvider.prototype.getBars = function(
    symbolInfo,
    resolution,
    rangeStartDate,
    rangeEndDate
  ) {
    var _this = this;

    // var requestParams = {
    //   symbol: symbolInfo.ticker || '',
    //   resolution: resolution,
    //   from: rangeStartDate,
    //   to: rangeEndDate
    // };
    const [coinOther, coinMain] = symbolInfo.ticker.split('/');
    const time = this.transformTime(resolution);

    return new Promise(function(resolve, reject) {
      _this._requester
        .sendRequest(
          _this._datafeedUrl,
          `index/kline?coinMain=${coinMain}&coinOther=${coinOther}&time=${time}`
        )
        .then(function(response) {
          const responseBars = response.data.data;
          if (!responseBars) {
            reject(response.msg);
            return;
          }

          var bars = [];
          var meta = {
            noData: false
          };
          if (responseBars.length < 1) {
            meta.noData = true;
            meta.nextTime = response.nextTime;
          } else {
            for (var i = 0; i < responseBars.length; i++) {
              var barValue = {
                time: responseBars[i].t * 1000,
                close: Number(responseBars[i].c),
                open: Number(responseBars[i].o),
                high: Number(responseBars[i].h),
                low: Number(responseBars[i].l),
                volume: Number(responseBars[i].v)
              };
              bars.push(barValue);
            }
          }

          console.log('000000000000000000000: ', bars[bars.length - 1]);
          resolve({ bars, meta });
        })
        .catch(function(reason) {
          var reasonString = getErrorMessage(reason);
          console.warn('HistoryProvider: getBars() failed, error=' + reasonString);
          reject(reasonString);
        });
    });
  };
  HistoryProvider.prototype.transformTime = function(resolution) {
    let period = '';
    if (resolution.toString().indexOf('D') !== -1) {
      period = '1d';
    } else if (resolution.toString().indexOf('W') !== -1) {
      period = '1w';
    } else if (resolution.toString().indexOf('M') !== -1) {
      period = '1mth';
    } else {
      if (parseInt(resolution) < 60) {
        period = `${resolution}m`;
      } else {
        let hourNumber = Math.floor(parseInt(resolution) / 60);
        period = `${hourNumber}h`;
      }
    }

    return period;
  };
  return HistoryProvider;
})();
export { HistoryProvider };
