import React from 'react';
import ReactDOM from 'react-dom/client';
import '../src/index.css';
import { EditorApp } from './EditorApp';

ReactDOM.createRoot(document.getElementById('editor-root')!).render(
  <React.StrictMode>
    <EditorApp />
  </React.StrictMode>
);

