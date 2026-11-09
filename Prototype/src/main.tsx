import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AcademicProvider } from './context/AcademicContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AcademicProvider>
        <App />
      </AcademicProvider>
    </BrowserRouter>
  </React.StrictMode>
);
