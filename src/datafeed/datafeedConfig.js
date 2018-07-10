const config = symbol => {
  const configJSON = {
    supports_search: true,
    supports_time: true,
    supports_timescale_marks: false,
    supports_group_request: false,
    supports_marks: false,
    supported_resolutions: ['1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M']
  };

  const symbolResolveJSON = {
    name: symbol,
    'exchange-traded': '',
    'exchange-listed': '',
    timezone: 'Asia/Shanghai',
    minmov: 1,
    minmov2: 0,
    pointvalue: 1,
    session: '24x7',
    has_intraday: true,
    intraday_multipliers: ['1', '5', '15', '30', '60','120', '240','480', '1D', '1W', '1M'],
    has_daily: true,
    has_weekly_and_monthly: true,
    has_empty_bars: false,
    has_no_volume: false,
    description: '',
    type: 'Index',
    supported_resolutions: ['1', '5', '15', '30', '60', '120', '240', '480', '1D', '1W', '1M'],
    pricescale: 10**8,
    ticker: symbol
  };

  return { configJSON, symbolResolveJSON };
};
export default config;
