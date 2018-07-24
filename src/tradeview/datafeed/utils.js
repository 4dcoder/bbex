export function transformResolution(resolution) {
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
