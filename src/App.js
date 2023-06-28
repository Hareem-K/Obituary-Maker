import React, { useEffect, useState } from 'react';
import Create from './Create';
import Empty from './Empty';
import Obituaries from './Obituaries';

function App() {
  const [showCreate, setShowCreate] = useState(false);
  const [obituaries, setObituaries] = useState([]);

  // this will run once when the component (App) renders for the first time
  useEffect(()=> {
    const asyncEffect = async () => {
      const res = await fetch(
        "https://g62orluwh4d3hyeaen6ojtymxq0esvkk.lambda-url.ca-central-1.on.aws/",
        {
          method: "GET"
        }
      );
      const jsonRes = await res.json();
      // update the state
      setObituaries(jsonRes)
    }
    
    asyncEffect();
  }, [])

  const handleCreateClick = () => {
    setShowCreate(true);
  }
const handleClose = () => {
  setShowCreate(false);
}



  const onCreate = async (obituaryData) => {
    setObituaries([obituaryData, ...obituaries]); // newest created obituary is at the beginning of the array
    setShowCreate(false);
  }

  return (
<div id="container">
      <header>
        <div id="app-header">
          <h1 id="app-moto">The Last Show</h1>
        </div>
        <aside>
          <button onClick={handleCreateClick} id="menu-button">
            + New Obituary
          </button>
        </aside>
      </header>
      {!showCreate && obituaries.length === 0 ? <Empty /> : null}
      {!showCreate && obituaries.length > 0 ? (
        <Obituaries obituaries={obituaries} />
      ) : null}
      {showCreate && 
      (<Create onCreate={onCreate} handleClose={handleClose} />)}
    </div>
  );
}

export default App;
