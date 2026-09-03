import './styles/index.css';
import './styles/components.css';
import './styles/home.css';
import './styles/results.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppHeader from './components/common/AppHeader';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppHeader />
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
