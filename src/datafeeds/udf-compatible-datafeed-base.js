import { getErrorMessage, logMessage } from './helpers';
import { HistoryProvider } from './history-provider';
import { DataPulseProvider } from './data-pulse-provider';
import { QuotesPulseProvider } from './quotes-pulse-provider';
import { SymbolsStorage } from './symbols-storage';
function extractField(data, field, arrayIndex) {
  var value = data[field];
  return Array.isArray(value) ? value[arrayIndex] : value;
}
/**
 * This class implements interaction with UDF-compatible datafeed.
 * See UDF protocol reference at https://github.com/tradingview/charting_library/wiki/UDF
 */
var UDFCompatibleDatafeedBase = /** @class */ (function() {
  function UDFCompatibleDatafeedBase(datafeedURL, quotesProvider, requester, updateFrequency) {
    if (updateFrequency === void 0) {
      updateFrequency = 10 * 1000;
    }
    var _this = this;
    this._configuration = defaultConfiguration();
    this._symbolsStorage = null;
    this._datafeedURL = datafeedURL;
    this._requester = requester;
    this._historyProvider = new HistoryProvider(datafeedURL, this._requester);
    this._quotesProvider = quotesProvider;
    this._dataPulseProvider = new DataPulseProvider(this._historyProvider, updateFrequency);
    this._quotesPulseProvider = new QuotesPulseProvider(this._quotesProvider);
    this._setupWithConfiguration(defaultConfiguration()); //由请求 /config获取的配置改为 写死的默认配置
    // this._configurationReadyPromise = this._requestConfiguration()
    //     .then(function (configuration) {
    //     if (configuration === null) {
    //         configuration = defaultConfiguration();
    //     }
    //     _this._setupWithConfiguration(configuration);
    // });
  }
  UDFCompatibleDatafeedBase.prototype.onReady = function(callback) {
    callback(this._configuration); //由请求 /config获取的配置改为 写死的默认配置
    // var _this = this;
    // this._configurationReadyPromise.then(function() {
    //   callback(_this._configuration);
    // });
  };
  UDFCompatibleDatafeedBase.prototype.getQuotes = function(
    symbols,
    onDataCallback,
    onErrorCallback
  ) {
    this._quotesProvider
      .getQuotes(symbols)
      .then(onDataCallback)
      .catch(onErrorCallback);
  };
  UDFCompatibleDatafeedBase.prototype.subscribeQuotes = function(
    symbols,
    fastSymbols,
    onRealtimeCallback,
    listenerGuid
  ) {
    this._quotesPulseProvider.subscribeQuotes(
      symbols,
      fastSymbols,
      onRealtimeCallback,
      listenerGuid
    );
  };
  UDFCompatibleDatafeedBase.prototype.unsubscribeQuotes = function(listenerGuid) {
    this._quotesPulseProvider.unsubscribeQuotes(listenerGuid);
  };
  UDFCompatibleDatafeedBase.prototype.calculateHistoryDepth = function(
    resolution,
    resolutionBack,
    intervalBack
  ) {
    return undefined;
  };
  UDFCompatibleDatafeedBase.prototype.getMarks = function(
    symbolInfo,
    startDate,
    endDate,
    onDataCallback,
    resolution
  ) {
    if (!this._configuration.supports_marks) {
      return;
    }

    //手动写死代替http请求marks
    // try {
    //   const response = {
    //     id: [0, 1, 2, 3, 4, 5],
    //     time: [1531699200, 1531353600, 1531094400, 1531094400, 1530403200, 1529107200],
    //     color: ['red', 'blue', 'green', 'red', 'blue', 'green'],
    //     text: [
    //       'Today',
    //       '4 days back',
    //       '7 days back + Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    //       '7 days back once again',
    //       '15 days back',
    //       '30 days back'
    //     ],
    //     label: ['A', 'B', 'CORE', 'D', 'EURO', 'F'],
    //     labelFontColor: ['white', 'white', 'red', '#FFFFFF', 'white', '#000'],
    //     minSize: [14, 28, 7, 40, 7, 14]
    //   };
    //   onDataCallback(response);
    // } catch (error) {
    //   logMessage('UdfCompatibleDatafeed: Request marks failed: ' + getErrorMessage(error));
    //   onDataCallback([]);
    // }
    //手动写死代替http请求marks

    // var requestParams = {
    //     symbol: symbolInfo.ticker || '',
    //     from: startDate,
    //     to: endDate,
    //     resolution: resolution
    //   };

    // this._send('marks', requestParams)
    //   .then(function(response) {
    //     if (!Array.isArray(response)) {
    //       var result = [];
    //       for (var i = 0; i < response.id.length; ++i) {
    //         result.push({
    //           id: extractField(response, 'id', i),
    //           time: extractField(response, 'time', i),
    //           color: extractField(response, 'color', i),
    //           text: extractField(response, 'text', i),
    //           label: extractField(response, 'label', i),
    //           labelFontColor: extractField(response, 'labelFontColor', i),
    //           minSize: extractField(response, 'minSize', i)
    //         });
    //       }
    //       response = result;
    //     }
    //     onDataCallback(response);
    //   })
    //   .catch(function(error) {
    //     logMessage('UdfCompatibleDatafeed: Request marks failed: ' + getErrorMessage(error));
    //     onDataCallback([]);
    //   });
  };
  UDFCompatibleDatafeedBase.prototype.getTimescaleMarks = function(
    symbolInfo,
    startDate,
    endDate,
    onDataCallback,
    resolution
  ) {
    if (!this._configuration.supports_timescale_marks) {
      return;
    }

    // 手动写死代替 http请求/timescale_marks 获取
    // const response = [
    //   { id: 'tsm1', time: 1531699200, color: 'red', label: 'A', tooltip: '' },
    //   {
    //     id: 'tsm2',
    //     time: 1531353600,
    //     color: 'blue',
    //     label: 'D',
    //     tooltip: ['Dividends: $0.56', 'Date: Thu Jul 12 2018']
    //   },
    //   {
    //     id: 'tsm3',
    //     time: 1531094400,
    //     color: 'green',
    //     label: 'D',
    //     tooltip: ['Dividends: $3.46', 'Date: Mon Jul 09 2018']
    //   },
    //   {
    //     id: 'tsm4',
    //     time: 1530403200,
    //     color: '#999999',
    //     label: 'E',
    //     tooltip: ['Earnings: $3.44', 'Estimate: $3.60']
    //   },
    //   {
    //     id: 'tsm7',
    //     time: 1529107200,
    //     color: 'red',
    //     label: 'E',
    //     tooltip: ['Earnings: $5.40', 'Estimate: $5.00']
    //   }
    // ];
    // onDataCallback(response);
    // 手动写死代替 http请求/timescale_marks 获取

    // var requestParams = {
    //     symbol: symbolInfo.ticker || '',
    //     from: startDate,
    //     to: endDate,
    //     resolution: resolution
    //   };

    // this._send('timescale_marks', requestParams)
    //   .then(function(response) {
    //     if (!Array.isArray(response)) {
    //       var result = [];
    //       for (var i = 0; i < response.id.length; ++i) {
    //         result.push({
    //           id: extractField(response, 'id', i),
    //           time: extractField(response, 'time', i),
    //           color: extractField(response, 'color', i),
    //           label: extractField(response, 'label', i),
    //           tooltip: extractField(response, 'tooltip', i)
    //         });
    //       }
    //       response = result;
    //     }
    //     onDataCallback(response);
    //   })
    //   .catch(function(error) {
    //     logMessage(
    //       'UdfCompatibleDatafeed: Request timescale marks failed: ' + getErrorMessage(error)
    //     );
    //     onDataCallback([]);
    //   });
  };
  UDFCompatibleDatafeedBase.prototype.getServerTime = function(callback) {
    if (!this._configuration.supports_time) {
      return;
    }

    callback(Math.floor(new Date().getTime()/1000)); //1531726207
    // this._send('time')
    //   .then(function(response) {
    //     var time = parseInt(response);
    //     if (!isNaN(time)) {
    //       callback(time);
    //     }
    //   })
    //   .catch(function(error) {
    //     logMessage(
    //       'UdfCompatibleDatafeed: Fail to load server time, error=' + getErrorMessage(error)
    //     );
    //   });
  };
  UDFCompatibleDatafeedBase.prototype.searchSymbols = function(
    userInput,
    exchange,
    symbolType,
    onResult
  ) {
    if (this._configuration.supports_search) {
      var params = {
        limit: 30 /* SearchItemsLimit */,
        query: userInput.toUpperCase(),
        type: symbolType,
        exchange: exchange
      };
      this._send('search', params)
        .then(function(response) {
          if (response.s !== undefined) {
            logMessage('UdfCompatibleDatafeed: search symbols error=' + response.errmsg);
            onResult([]);
            return;
          }
          onResult(response);
        })
        .catch(function(reason) {
          logMessage(
            "UdfCompatibleDatafeed: Search symbols for '" +
              userInput +
              "' failed. Error=" +
              getErrorMessage(reason)
          );
          onResult([]);
        });
    } else {
      if (this._symbolsStorage === null) {
        throw new Error('UdfCompatibleDatafeed: inconsistent configuration (symbols storage)');
      }
      this._symbolsStorage
        .searchSymbols(userInput, exchange, symbolType, 30 /* SearchItemsLimit */)
        .then(onResult)
        .catch(onResult.bind(null, []));
    }
  };
  UDFCompatibleDatafeedBase.prototype.resolveSymbol = function(symbolName, onResolve, onError) {
    logMessage('Resolve requested');
    var resolveRequestStartTime = Date.now();

    //手动写死代替 http请求/symbols
    const symbolInfo = {
      name: symbolName,
      'exchange-traded': '',
      'exchange-listed': '',
      timezone: 'Asia/Shanghai',
      minmov: 1,
      minmov2: 0,
      pointvalue: 1,
      // session: '0930-1630',
      session: '24x7',
      // has_intraday: false,
      has_intraday: true,
      intraday_multipliers: ['1', '5', '15', '30', '60','120', '240','480', '1D', '1W', '1M'],
      has_daily: true,
      has_weekly_and_monthly: true,
      has_empty_bars: false,
      has_no_volume: false,
      description: '',
      type: 'Index',
      supported_resolutions: ['1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'],
      pricescale: 10 ** 8,
      ticker: symbolName
    };
    onResultReady(symbolInfo);
    //手动写死代替 http请求/symbols

    function onResultReady(symbolInfo) {
      logMessage('Symbol resolved: ' + (Date.now() - resolveRequestStartTime) + 'ms');
      onResolve(symbolInfo);
    }
    // if (!this._configuration.supports_group_request) {
    //   var params = {
    //     symbol: symbolName
    //   };
    //   this._send('symbols', params)
    //     .then(function(response) {
    //       if (response.s !== undefined) {
    //         onError('unknown_symbol');
    //       } else {
    //         onResultReady(response);
    //       }
    //     })
    //     .catch(function(reason) {
    //       logMessage('UdfCompatibleDatafeed: Error resolving symbol: ' + getErrorMessage(reason));
    //       onError('unknown_symbol');
    //     });
    // } else {
    //   if (this._symbolsStorage === null) {
    //     throw new Error('UdfCompatibleDatafeed: inconsistent configuration (symbols storage)');
    //   }
    //   this._symbolsStorage
    //     .resolveSymbol(symbolName)
    //     .then(onResultReady)
    //     .catch(onError);
    // }
  };
  UDFCompatibleDatafeedBase.prototype.getBars = function(
    symbolInfo,
    resolution,
    rangeStartDate,
    rangeEndDate,
    onResult,
    onError
  ) {
    this._historyProvider
      .getBars(symbolInfo, resolution, rangeStartDate, rangeEndDate)
      .then(function(result) {
        onResult(result.bars, result.meta);
      })
      .catch(onError);
  };
  UDFCompatibleDatafeedBase.prototype.subscribeBars = function(
    symbolInfo,
    resolution,
    onTick,
    listenerGuid,
    onResetCacheNeededCallback
  ) {
    this._dataPulseProvider.subscribeBars(symbolInfo, resolution, onTick, listenerGuid);
  };
  UDFCompatibleDatafeedBase.prototype.unsubscribeBars = function(listenerGuid) {
    this._dataPulseProvider.unsubscribeBars(listenerGuid);
  };
  UDFCompatibleDatafeedBase.prototype._requestConfiguration = function() {
    return this._send('config').catch(function(reason) {
      logMessage(
        'UdfCompatibleDatafeed: Cannot get datafeed configuration - use default, error=' +
          getErrorMessage(reason)
      );
      return null;
    });
  };
  UDFCompatibleDatafeedBase.prototype._send = function(urlPath, params) {
    return this._requester.sendRequest(this._datafeedURL, urlPath, params);
  };
  UDFCompatibleDatafeedBase.prototype._setupWithConfiguration = function(configurationData) {
    this._configuration = configurationData;
    if (configurationData.exchanges === undefined) {
      configurationData.exchanges = [];
    }
    if (!configurationData.supports_search && !configurationData.supports_group_request) {
      throw new Error(
        'Unsupported datafeed configuration. Must either support search, or support group request'
      );
    }
    if (configurationData.supports_group_request || !configurationData.supports_search) {
      this._symbolsStorage = new SymbolsStorage(
        this._datafeedURL,
        configurationData.supported_resolutions || [],
        this._requester
      );
    }
    logMessage('UdfCompatibleDatafeed: Initialized with ' + JSON.stringify(configurationData));
  };
  return UDFCompatibleDatafeedBase;
})();
export { UDFCompatibleDatafeedBase };
function defaultConfiguration() {
  return {
    supports_search: true,
    supports_time: true,
    supports_timescale_marks: false,
    supports_group_request: false,
    supports_marks: false,
    supported_resolutions: ['1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M']
  };
}
