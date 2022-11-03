import Logger from "./log.js";

async function searchAllTask(sqlImpl) {
  return new Promise((resolve, reject) => {
    sqlImpl.query(
      `select *
    from inter_task
    where is_delete = 0`,
      function (err, result) {
        if (err) {
          Logger.log(err);
          reject(err);
          return;
        }
        // Logger.log("searchAllTask result: ", result);
        resolve(result);
      }
    );
  });
}

function updateTime(sqlImpl, id) {
  const modSql = "UPDATE inter_task SET update_time = ? WHERE id = ?";
  const params = [new Date().toISOString, id];
  sqlImpl.query(modSql, params, (err, result) => {
    if (err) {
      Logger.log(err);
      reject(err);
      return;
    }
    Logger.log("UPDATE affectedRows", result.affectedRows);
  });
}

export { searchAllTask, updateTime };
