import historyProvider from './historyProvider';
import stream from './stream';

export default {
  onReady: callback => {
    console.log('=====onReady running');
    const config = {
      supports_search: true,
      supports_time: true,
      supports_timescale_marks: false,
      supports_group_request: false,
      supports_marks: false,
      supported_resolutions: ['1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M']
    };

    callback(config);
  },

  searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
    console.log('====searchSymbols running');
  },

  resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
    console.log('====resolveSymbol running');
    const symbolInfo = {
      name: symbolName,
      timezone: 'Asia/Shanghai',
      minmov: 1,
      minmov2: 0,
      pointvalue: 1,
      session: '24x7',
      has_intraday: true,
      intraday_multipliers: ['1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'],
      has_daily: true,
      has_weekly_and_monthly: true,
      has_empty_bars: false,
      has_no_volume: false,
      type: 'index',
      supported_resolutions: ['1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'],
      pricescale: 10 ** 8,
      ticker: symbolName,
      exchange: 'BBEX'
    };

    onSymbolResolvedCallback(symbolInfo);
  },

  getBars: function(
    symbolInfo,
    resolution,
    from,
    to,
    onHistoryCallback,
    onErrorCallback,
    firstDataRequest
  ) {
    console.log('=====getBars running');
    // console.log('function args',arguments)
    // console.log(`Requesting bars between ${new Date(from * 1000).toISOString()} and ${new Date(to * 1000).toISOString()}`)
    historyProvider
      .getBars(symbolInfo, resolution, from, to, firstDataRequest)
      .then(bars => {
        if (bars.length) {
          onHistoryCallback(bars, { noData: false });
        } else {
          onHistoryCallback(bars, { noData: true });
        }
      })
      .catch(err => {
        console.log({ err });
        onErrorCallback(err);
      });
  },

  subscribeBars: (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscribeUID,
    onResetCacheNeededCallback
  ) => {
    console.log('=====subscribeBars runnning');
    stream.subscribeBars(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscribeUID,
      onResetCacheNeededCallback
    );
  },

  unsubscribeBars: subscriberUID => {
    console.log('=====unsubscribeBars running');

    stream.unsubscribeBars(subscriberUID);
  },

  calculateHistoryDepth: (resolution, resolutionBack, intervalBack) => {
    //optional
    console.log('=====calculateHistoryDepth running', resolution, resolutionBack, intervalBack);
    // while optional, this makes sure we request 24 hours of minute data at a time
    // CryptoCompare's minute data endpoint will throw an error if we request data beyond 7 days in the past, and return no data
    return resolution < 60 ? { resolutionBack: 'D', intervalBack: '1' } : undefined;
  },

  getMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
    //optional
    console.log('=====getMarks running');
  },

  getTimeScaleMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
    //optional
    console.log('=====getTimeScaleMarks running');
  },

  getServerTime: callback => {
    console.log('=====getServerTime running');
    callback(new Date().getTime());
  }
};
