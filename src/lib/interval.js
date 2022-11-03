function addInterval(callback, time = 1000) {
  callback._timer = setInterval(() => {
    callback instanceof Function && callback();
  }, time);
}
let task = new Map();
function addTask(id, callback) {
  if (task.has(callback)) {
    return;
  }
  task.set(id, callback);
}

function removeTask(id) {
  if (task.has(id)) {
    task.delete(id);
  }
}

function useTask() {
  const arr = [...task];
  task.clear();
  arr.forEach((data) => {
    const [_, callback] = data;
    callback instanceof Function && callback();
  });
}
function removeInterval(callback) {
  clearInterval(callback._timer);
  callback.timer = void 0;
}

export { addInterval, removeInterval, addTask, removeTask, useTask };
