import { getErrorMessage, logMessage } from './helpers';
import ReconnectingWebSocket from '../utils/ReconnectingWebSocket';
import { WS_PREFIX } from '../utils/constants';
var DataPulseProvider = /** @class */ (function() {
  function DataPulseProvider(historyProvider, updateFrequency) {
    this._subscribers = {};
    // this._requestsPending = 0;
    // this._historyProvider = historyProvider;
    // setInterval(this._updateData.bind(this), updateFrequency);
  }
  DataPulseProvider.prototype.subscribeBars = function(
    symbolInfo,
    resolution,
    newDataCallback,
    listenerGuid
  ) {
    if (this._subscribers.hasOwnProperty(listenerGuid)) {
      logMessage('DataPulseProvider: already has subscriber with id=' + listenerGuid);
      return;
    }
    this._subscribers[listenerGuid] = {
      lastBarTime: null,
      listener: newDataCallback,
      resolution: resolution,
      symbolInfo: symbolInfo
    };
    logMessage(
      'DataPulseProvider: subscribed for #' +
        listenerGuid +
        ' - {' +
        symbolInfo.name +
        ', ' +
        resolution +
        '}'
    );

    this._updateDataForSubscriber(listenerGuid);
  };
  DataPulseProvider.prototype.unsubscribeBars = function(listenerGuid) {
    delete this._subscribers[listenerGuid];
    logMessage('DataPulseProvider: unsubscribed for #' + listenerGuid);
  };
  DataPulseProvider.prototype._updateData = function() {
    // var _this = this;
    // if (this._requestsPending > 0) {
    //     return;
    // }
    // this._requestsPending = 0;
    // var _loop_1 = function (listenerGuid) {
    //     this_1._requestsPending += 1;
    //     this_1._updateDataForSubscriber(listenerGuid)
    //         .then(function () {
    //         _this._requestsPending -= 1;
    //         logMessage("DataPulseProvider: data for #" + listenerGuid + " updated successfully, pending=" + _this._requestsPending);
    //     })
    //         .catch(function (reason) {
    //         _this._requestsPending -= 1;
    //         logMessage("DataPulseProvider: data for #" + listenerGuid + " updated with error=" + getErrorMessage(reason) + ", pending=" + _this._requestsPending);
    //     });
    // };
    // var this_1 = this;
  };
  DataPulseProvider.prototype._updateDataForSubscriber = function(listenerGuid) {
    var _this = this;
    var subscriptionRecord = this._subscribers[listenerGuid];
    var rangeEndTime = parseInt((Date.now() / 1000).toString());
    // BEWARE: please note we really need 2 bars, not the only last one
    // see the explanation below. `10` is the `large enough` value to work around holidays
    var rangeStartTime = rangeEndTime - periodLengthSeconds(subscriptionRecord.resolution, 10);

    // this.WS = {};
    // this.interval = {};

    // this.WS[listenerGuid] = new ReconnectingWebSocket(`${WS_PREFIX}/kline`);

    // this.WS[listenerGuid].onopen = evt => {
    //   console.log(this.WS[listenerGuid], this.WS[listenerGuid].readyState);
    //   if (this.WS[listenerGuid] && this.WS[listenerGuid].readyState === 1) {
    //     const tradePair = localStorage.getItem('tradePair');
    //     this.WS[listenerGuid].send(tradePair);
    //   }
    // };

    // this.interval[listenerGuid] = setInterval(() => {
    //   if (this.WS[listenerGuid] && this.WS[listenerGuid].readyState === 1) {
    //     this.WS[listenerGuid].send('ping');
    //   }
    // }, 1000 * 5);

    // this.WS[listenerGuid].onmessage = evt => {
    //   if (evt.data && evt.data !== 'pong') {
    //     const result = JSON.parse(evt.data);
    //     this._onSubscriberDataReceived(listenerGuid, result);
    //   }
    // };

    // return this._historyProvider
    //   .getBars(
    //     subscriptionRecord.symbolInfo,
    //     subscriptionRecord.resolution,
    //     rangeStartTime,
    //     rangeEndTime
    //   )
    //   .then(function(result) {
    //     _this._onSubscriberDataReceived(listenerGuid, result);
    //   });
  };
  DataPulseProvider.prototype._onSubscriberDataReceived = function(listenerGuid, result) {
    // means the subscription was cancelled while waiting for data
    if (!this._subscribers.hasOwnProperty(listenerGuid)) {
      logMessage(
        'DataPulseProvider: Data comes for already unsubscribed subscription #' + listenerGuid
      );
      return;
    }
    var bars = result.data;
    if (bars.length === 0) {
      return;
    }
    var lastBar = bars[bars.length - 1];
    lastBar = {
      isBarClosed: false,
      isLastBar: true,
      time: lastBar.t * 1000,
      close: lastBar.c * 1,
      high: lastBar.h * 1,
      low: lastBar.l * 1,
      open: lastBar.o * 1,
      volume: lastBar.v * 100
    };
    var subscriptionRecord = this._subscribers[listenerGuid];
    if (subscriptionRecord.lastBarTime !== null && lastBar.time < subscriptionRecord.lastBarTime) {
      return;
    }
    var isNewBar =
      subscriptionRecord.lastBarTime !== null && lastBar.time > subscriptionRecord.lastBarTime;
    console.log(lastBar.time, subscriptionRecord.lastBarTime, isNewBar);
    // Pulse updating may miss some trades data (ie, if pulse period = 10 secods and new bar is started 5 seconds later after the last update, the
    // old bar's last 5 seconds trades will be lost). Thus, at fist we should broadcast old bar updates when it's ready.
    // if (isNewBar) {
    // if (bars.length < 2) {
    //   throw new Error('Not enough bars in history for proper pulse update. Need at least 2.');
    // }
    // var previousBar = bars[bars.length - 2];
    // subscriptionRecord.listener(previousBar);
    // }
    subscriptionRecord.lastBarTime = lastBar.time;
    subscriptionRecord.listener(lastBar);
    console.log('lastBar--------------: ', lastBar);
  };
  return DataPulseProvider;
})();
export { DataPulseProvider };
function periodLengthSeconds(resolution, requiredPeriodsCount) {
  console.log('resolution：', resolution);
  let minuteTime = 60;
  let dayTime = 60 * 60 * 24;
  let longTime = 0;
  switch (resolution) {
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
      longTime = parseInt(resolution) * minuteTime;
      break;
  }
  return longTime;
}
