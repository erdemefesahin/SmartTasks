import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
function App() {
    const token = localStorage.getItem('smarttasks_token');
    return (_jsx("div", { className: "min-h-screen bg-slate-50 text-slate-900", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/", element: token ? _jsx(DashboardPage, {}) : _jsx(Navigate, { to: "/login", replace: true }) })] }) }));
}
export default App;
