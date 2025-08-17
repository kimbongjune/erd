import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ReactFlowProvider } from 'reactflow'

console.log("Vite Test Message:", import.meta.env.VITE_TEST_MESSAGE);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  </React.StrictMode>,
)
