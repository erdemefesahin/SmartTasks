import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import { useTheme } from './components/ThemeToggle';

function App() {
  const token = localStorage.getItem('smarttasks_token');
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Routes>
        <Route path="/login" element={<LoginPage dark={dark} toggle={toggle} />} />
        <Route path="/register" element={<RegisterPage dark={dark} toggle={toggle} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage dark={dark} toggle={toggle} />} />
        <Route path="/profile" element={token ? <ProfilePage dark={dark} toggle={toggle} /> : <Navigate to="/login" replace />} />
        <Route path="/" element={token ? <DashboardPage dark={dark} toggle={toggle} /> : <Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
