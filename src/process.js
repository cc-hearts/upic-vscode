/**
 * @author heart
 * @description 流程
 * @Date 2022-11-03
 */

import { Interval, Config, Sql, Fetch, Shard, Log } from "./lib/index.js";
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

let interTask;
// 副作用的任务
function useTask(data) {
  const { mysqlImpl } = data;
  interTask = async () => {
    // 轮询需要做的操作:
    const arr = await Sql.searchAllTask(mysqlImpl);
    arr.forEach((acc) => {
      let { method, url, cookie, params, inter_time, id, update_time } = acc;
      const headers = {};
      if (cookie) {
        headers.Cookie = cookie;
      }
      try {
        params = JSON.parse(params);
        const originDate = Shard.formatHoursAndMinutes(inter_time);
        if (
          Shard.compareHourAndMinutes(originDate) &&
          !Shard.compareISODate(update_time)
        ) {
          Interval.addTask(id, () => {
            Logger.log("===============task start==============");
            Logger.log("inter_time", originDate);
            Logger.log("update_time", update_time);
            Fetch.request(url, method, params, headers).then(() => {
              Sql.updateTime(id);
            });
          });
        }
      } catch (e) {
        Logger.log("jsonParser error:", e);
        return;
      }
    });
  };
  Interval.addInterval(interTask);
}

// 结束的任务
function endTask() {
  Config.closeMysqlServer();
  Interval.removeInterval(interTask);
}

async function bootstrap() {
  const config = await initTask();
  useTask(config);
  // endTask();
}
export { bootstrap };
