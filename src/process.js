/**
 * @author heart
 * @description 流程
 * @Date 2022-11-03
 */

import { Interval, Config, Sql, Fetch, Log } from "./lib/index.js";
import Logger from "./lib/log.js";

// 每分钟的轮询
function createMinutesInterval(callback) {
  const { addInterval, removeInterval } = Interval;
  if (callback._timer) {
    removeInterval(callback);
  }
  addInterval(callback);
}

// 初始化任务的func 获取一些配置参数 以及连接mysql redis
async function initTask() {
  // 获取mysql数据
  const data = Config.getYamlConfig();
  Logger.log(data);
  const mysqlImpl = Config.connectMysqlServer(data.mysql);

  return { mysqlImpl };
}

// 副作用的任务
async function useTask(data) {
  console.log(data);
  const { mysqlImpl } = data;

  // 轮询需要做的操作:
  const arr = await Sql.searchAllTask(mysqlImpl);
  arr.forEach((acc) => {
    let { method, url, cookie, params } = acc;
    const headers = {};
    if (cookie) {
      headers.Cookie = cookie;
    }
    try {
      params = JSON.parse(params);
      Fetch.request(url, method, params, headers);
    } catch (e) {
      Logger.log("jsonParser error:", e);
      return;
    }
  });
}

// 结束的任务
function endTask() {
  Config.closeMysqlServer();
}

async function bootstrap() {
  const config = await initTask();
  useTask(config);

  endTask();
}
export { bootstrap };
