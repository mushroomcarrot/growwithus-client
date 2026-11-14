import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Pretendard (가변 폰트, 화면에 쓰인 글자 묶음만 내려받음)
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);