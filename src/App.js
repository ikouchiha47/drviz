import React, { useState } from 'react';

import { registerAllModules } from 'handsontable/registry';

import './App.css';
import './Home.css';

import WareHouse from './WareHouse';
import DataTable from './DataTable';
import AnalysisTables from './AnalysisTables';

Array.zip = (src, dst) => {
  return src.map((item, i) => [item, dst[i]])
}

registerAllModules();

function Header() {
  return (
    <header className="App-header">
      <a
        className="App-link"
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        dr.csv
      </a>
    </header>
  )
}

function App() {
  const [df, setDf] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleDataProcessed = (dataFrame, fileName) => {
    setDf(dataFrame);
    setFileName(fileName);

    window.df = dataFrame.copy()
  };

  return (
    <div className="App">
      <Header />
      <section className='App-container'>
        <WareHouse df={df} onDataProcessed={handleDataProcessed} />
        <section className='Main'>
          {df && <DataTable df={df} header={fileName} />}
          {df && <AnalysisTables
            df={df}
            fileName={fileName}
          />
          }
        </section>
      </section>
    </div>
  );
}

export default App;
