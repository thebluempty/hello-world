import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { DialogProvider } from './components/Dialog.jsx';
import { getThemeMode, applyTheme } from './lib/theme.js';
import './styles.css';

// 렌더 전에 테마 적용 (라이트/다크 플래시 방지)
applyTheme(getThemeMode());

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
    <DialogProvider>
        <App />
    </DialogProvider>
);
