// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import './index.css'
import App from './App.jsx'

// Cho phép dayjs parse chuỗi theo định dạng tuỳ chỉnh (vd: 'DD-MM-YYYY').
dayjs.extend(customParseFormat)

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <App />
  // </StrictMode>,
)
