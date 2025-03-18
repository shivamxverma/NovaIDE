import Terminal from './components/terminal';
import './App.css';
import { useEffect,useState } from 'react';

function App() {
  const [fileTree,setFileTree] = useState([]);

  const getFileTree = async ()=>{
    const response = await fetch('http://localhost:9000/files');
    const result = await response.json();
    setFileTree(result.tree);
  }
  
  useEffect(()=>{
    getFileTree();
  },[])

  return (
    <div className="app">
      <div className="editor-container">
        <header className="terminal-header">
          <fileTree tree={fileTree} />
        </header>
        <div className="terminal-container">
          <Terminal />
        </div>
      </div>
    </div>
  );
}

export default App;