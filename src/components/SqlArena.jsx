import React, { useState, useEffect } from 'react';
import * as dfd from 'danfojs';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import Plotter from "./Plotter";
import { ScrollableDataTable } from './DataTable';
import Notifier from '../utils/notifications';

import { DBEvents } from '../utils/dbs';
import { toDF } from '../utils/batcher';

import 'handsontable/dist/handsontable.full.css';
import '../Home.css';
import '../SQLComponent.css';

import { SqlLoaderStates } from '../utils/constants';

const worker = new Worker(
  new URL('../workers/sqlite.worker.js', import.meta.url),
  { type: "module" }
);

const notifier = new Notifier();
// await notifier.init();

const SqlArena = ({ df, file, tableName, launched, handleSqlState }) => {
  const [query, setQuery] = useState('');

  // const [data, setData] = useState([]);
  // const [columns, setColumns] = useState([]);
  const [resDf, setResDf] = useState(null);

  const [errorsResult, setErrors] = useState([]);

  let initalDbStatus = { status: SqlLoaderStates.LOADING, message: 'Creating Database', table: tableName }
  const [dataLoadStatus, setDataLoaded] = useState(initalDbStatus)


  useEffect(() => {
    const handleMessage = (e) => {
      // console.log("handling", e)
      const {
        status,
        data,
        errors,
        warns,
      } = e.data;

      if (!tableName || !df) {
        return;
      }

      if (!worker) return;

      if (warns.length) {
        console.warn(warns.join('\n'))
      }

      console.log('status', status)

      if (status === SqlLoaderStates.CREATED) {
        worker.postMessage({
          action: DBEvents.SEED,
          tableName: tableName,
          df: dfd.toJSON(df, { format: 'row' })
        })

        setDataLoaded({ status: SqlLoaderStates.SEEDING, message: 'Importing Data' })
        handleSqlState({ status: SqlLoaderStates.SEEDING, table: tableName })

        return;
      }

      if (status === SqlLoaderStates.SEEDED) {
        setErrors([])
        setDataLoaded({ status: SqlLoaderStates.SUCCESS, message: `Imported ${data} records` })
        handleSqlState({ status: SqlLoaderStates.SUCCESS, table: tableName })

        notifier.send('Success', `Imported ${data} records to ${tableName}`)
        return
      }

      if (status === SqlLoaderStates.RESULT) {
        setDataLoaded({ status: SqlLoaderStates.SUCCESS, message: '' })

        let resultColumns = [];
        let resultValues = [[]];
        let resultErrors = ['No results found'];

        if (data && data.length) {
          resultColumns = data[0].columns;
          resultValues = data[0].values;
          resultErrors = [];
        }

        setErrors(resultErrors);
        setResDf(toDF(resultColumns, resultValues))

        return;
      }

      if (status === SqlLoaderStates.FAILED) {
        let allErrs = Array.from(new Set([...errorsResult, ...errors]))

        if (errors.length === 0) {
          allErrs.push('Maybe Fix Headers first')
        }

        setDataLoaded({ status: SqlLoaderStates.FAILED, message: allErrs.join('\n') })
        setErrors(allErrs)

        // console.log("errors", allErrs.join('\n'))
        handleSqlState({ status: SqlLoaderStates.SUCCESS, table: tableName })
        return;
      }
    }

    const setup = async () => {
      console.log("setting up")

      await notifier.init();

      worker.onmessage = handleMessage
      worker.postMessage({ action: DBEvents.INIT })
    }

    setup()

    return () => {
      console.log("deregistered");

      setErrors([]);
      setResDf(null);
      // setColumns([]);
      // setData([]);

      worker.onmessage = null;
    }
  }, [launched, df, tableName,])


  const handleQueryExecution = () => {
    if (!worker || !query) return;

    worker.postMessage({
      action: DBEvents.EXEC,
      tableName: tableName,
      query: query,
    })
  }


  const render = () => {
    // if (dataLoadStatus.status === SqlLoaderStates.FAILED) {
    //   return <p className='error'>{dataLoadStatus.message}</p>
    // }

    if (dataLoadStatus.status === SqlLoaderStates.SUCCESS) {
      return (
        <section className='query-editor margin-b-xl' style={{ flex: 1 }}>
          <textarea
            className='query-playground'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`SELECT * FROM ${tableName}`}
          />
          <button className='Button Btn-green' onClick={handleQueryExecution}>Run Query</button>
        </section>
      )
    }

    return null;
  }

  const renderErrors = (errors) => {
    if (!errors.length) return null;

    return (
      <ul className='Table-errors List'>
        {errors.map((err, idx) => {
          return <li key={`table-errors-${idx}`}>{err}</li>
        })}
      </ul>
    )
  }

  const renderStatus = () => {
    const response = dataLoadStatus;

    console.log(response.status, "response status")

    if (response.status === SqlLoaderStates.SUCCESS) return null;
    if (errorsResult.length) return renderErrors(errorsResult);

    return <p style={{ fontWeight: 600, fontSize: '1.5rem' }}>{response.message}</p>
  }

  if (!df) return null;

  // console.log("sqlarenatrace", dataLoadStatus, data.length)

  return (
    <>
      <hr className='separator' />
      <section className="margin-b-xl">
        {/* Query Textarea */}
        <div className='editor-wrapper flex flex-row margin-b-m'>
          {render()}
        </div>
        {/* Results Table */}
        {renderStatus()}

        {resDf && resDf.size > 0 ? (
          <>
            <header className='flex flex-row' style={{ gap: '1.5rem' }}>
              <h3 className='Section-header'>Results</h3>
              <ArrowDownTrayIcon
                width={'2.25rem'}
                title='Export Data'
                style={{ cursor: 'pointer' }}
                onClick={() => dfd.toCSV(df, { fileName: file.name, download: true })}
              />
            </header>
            <ScrollableDataTable df={resDf} classNames={['query-result']} />
          </>
        ) : null}

      </section>
      <hr className="separator" />
      {df && df.size > 0 && resDf && resDf.size > 0 && <Plotter df={resDf} />}
    </>
  );
};

export default SqlArena;
