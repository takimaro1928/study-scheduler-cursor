import 'react-day-picker/dist/style.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictModeを一時的に無効化してパフォーマンス問題を修正
  <ErrorBoundary name="RootApp">
    <App />
  </ErrorBoundary>
);

// サービスワーカーを登録して、オフライン動作を有効にする
serviceWorkerRegistration.register();
