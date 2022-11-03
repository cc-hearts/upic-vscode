function addInterval(callback, time = 1000) {
  callback._timer = setInterval(() => {
    callback instanceof Function && callback();
  }, time);
}

function removeInterval(callback) {
  clearInterval(callback._timer);
  callback.timer = void 0;
}

export { addInterval, removeInterval };
