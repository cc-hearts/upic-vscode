import Logger from "./log.js";

async function searchAllTask(sqlImpl) {
  return new Promise((resolve, reject) => {
    sqlImpl.query(`select *
    from inter_task
    where is_delete = 0`, function (err, result) {
      if (err) {
        Logger.log(err);
        reject(err);
        return;
      }
      Logger.log("searchAllTask result: ", result);
      resolve(result);
    });
  });
}

export { searchAllTask };
