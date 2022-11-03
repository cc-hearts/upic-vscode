/**
 * @author heart
 * @description 发送http请求
 * @Date 2022-11-03
 */
import axios from "axios";
import { Shard } from "./index.js";
import Logger from "./log.js";
function formatMethod(method) {
  // TODO: 后续转大写
  switch (String(method)) {
    case "0":
    case "GET":
      return "GET";
    case "1":
    case "POST":
      return "POST";
    case "2":
    case "PUT":
      return "PUT";
    case "3":
    case "DELETE":
      return "DELETE";
  }
}
function request(url, method, params = {}, headers = {}) {
  method = formatMethod(method);
  axios({
    url,
    method: method || "get",
    params: params,
    headers: {
      ...headers,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36",
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      Logger.log(`success ${url} ======================\r\n`, res.data);
    })
    .catch((err) => {
      Logger.log(`fetch request ${url} error:`, err);
    });
}

export { request };
