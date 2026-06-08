import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AppProvider } from './context/AppProvider.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ConfigError from './components/ConfigError.jsx'
import { isProductionConfigValid } from './config/appConfig.js'

const app = isProductionConfigValid ? (
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
) : <ConfigError />;

ReactDOM.createRoot(document.getElementById('root')).render(app)
