export function resolutionToTime(resolution) {
  let time = '';
  if (resolution.toString().indexOf('D') !== -1) {
    time = '1d';
  } else if (resolution.toString().indexOf('W') !== -1) {
    time = '1w';
  } else if (resolution.toString().indexOf('M') !== -1) {
    time = '1mth';
  } else if (parseInt(resolution) < 60) {
    time = `${resolution}m`;
  } else {
    const hourNumber = Math.floor(parseInt(resolution) / 60);
    time = `${hourNumber}h`;
  }
  return time;
}

export function resolutionToStamp(resolution) {
  let timeStamp = 60*1000;
  let dayTime = 60 * 60 * 24 * timeStamp;
  let stamp = 0;
  switch (resolution) {
    case '1D':
      stamp = dayTime * 1;
      break;
    case '1W':
      stamp = dayTime * 7;
      break;
    case '1M':
      stamp = dayTime * 30;
      break;
    default:
      stamp = resolution * timeStamp;
      break;
  }
  return stamp;
}
