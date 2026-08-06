import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Тёмная тема по умолчанию (переключение тем — этап 5, раздел 4.4.3)
document.documentElement.classList.add('dark');

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root не найден');
}
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
