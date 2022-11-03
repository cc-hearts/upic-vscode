import { readFileSync } from "node:fs";
import { createConnection } from "mysql2";
import { load } from "js-yaml";
import Logger from "./log.js";

function getYamlConfig() {
  try {
    // pwd = /Users/heart/Desktop/i/interval/interval-engine
    return load(
      readFileSync(process.cwd() + "/app.yaml", { encoding: "utf8" })
    );
  } catch (e) {
    Logger.log(e);
  }
}

function connectMysqlServer(mysqlConfig) {
  if (connectMysqlServer._mysqlImpl) return connectMysqlServer._mysqlImpl;
  connectMysqlServer._mysqlImpl = createConnection(mysqlConfig);
  return connectMysqlServer._mysqlImpl;
}
function closeMysqlServer() {
  if (connectMysqlServer._mysqlImpl) {
    connectMysqlServer._mysqlImpl.end();
  }
  connectMysqlServer._mysqlImpl = null;
}

export { getYamlConfig, connectMysqlServer, closeMysqlServer };
