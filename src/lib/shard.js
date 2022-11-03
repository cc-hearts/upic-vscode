import Logger from "./log.js";

const noop = () => {};
function getHoursAndMinutes(date) {
  if (date instanceof Date) {
    return `${date.getHours()}-${date.getMinutes()}`;
  }
  return null;
}

function getCurrentDate() {
  const date = new Date();
  return `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

function compareHourAndMinutes(timer) {
  if (!timer) {
    return;
  }
  // 一分钟轮询一次 获取需要轮训的操作
  // 时分相等则运行
  const currentDate = getHoursAndMinutes(new Date());
  const originDate = getHoursAndMinutes(new Date(timer));
  Logger.log("currentDate :", currentDate);
  Logger.log("originDate :", originDate);
  return currentDate === originDate;
}

export { getHoursAndMinutes, getCurrentDate, compareHourAndMinutes, noop };
