import { SqlLoaderStates } from '../utils/constants';
import { DuckDB, DBEvents } from '../utils/dbs';
import * as dfd from 'danfojs';

/* eslint-disable */

console.log("loading webworker")

const sqlite = new DuckDB();

function Message(status, { data, errors, warns }) {
  return {
    status: status,
    data: data || null,
    errors: errors || [],
    warns: warns || [],
  }
}

const handleMessage = async function(e) {
  // console.log("datataa", e);
  if (!e.data) {
    self.postMessage(new Message(DBEvents.ERROR, { warns: ['No data found'] }))
    return;
  }

  let { action, tableName, df, query } = e.data;

  if (action === DBEvents.INIT) {
    try {
      await sqlite.init();
      self.postMessage(new Message(
        SqlLoaderStates.CREATED,
        {},
      ))
    } catch (e) {
      self.postMessage(new Message(
        SqlLoaderStates.FAILED,
        { errors: [e.message] }
      ))
    }

    return;
  }

  if (action === DBEvents.SEED) {
    df = new dfd.DataFrame(df);
    console.log(df, df.columns);

    try {
      let totalRecords = await sqlite.loadCSV(tableName, null, df);
      console.log("totalRec", totalRecords);

      self.postMessage(new Message(
        SqlLoaderStates.SEEDED,
        { data: totalRecords },
      ))
    } catch (e) {
      console.log("failed to insert data", e);

      self.postMessage(new Message(
        SqlLoaderStates.FAILED,
        { errors: [e.message] }
      ))
    }

    return
  }

  if (action === DBEvents.EXEC) {
    query = query.trim();

    if (!query) {
      self.postMessage(new Message(DBEvents.ERROR, { errors: ['No Query Provided'] }))
      return;
    }

    try {
      let result = sqlite.exec(query);
      self.postMessage(
        new Message(
          SqlLoaderStates.RESULT,
          { data: result }
        )
      )
    } catch (e) {
      console.log(`failed to execute ${e}`);
      self.postMessage(new Message(SqlLoaderStates.RESULT, { errors: [e.message] }))
    }

    return
  }
}

self.onmessage = handleMessage;

