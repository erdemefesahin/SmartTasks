import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
                name,
                email,
                password,
            });
            localStorage.setItem('smarttasks_token', response.data.token);
            localStorage.setItem('smarttasks_user', JSON.stringify(response.data.user));
            navigate('/');
        }
        catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center px-4 py-8", children: _jsxs("div", { className: "w-full max-w-md rounded-3xl bg-white p-8 shadow-lg", children: [_jsx("h1", { className: "text-3xl font-semibold text-slate-900", children: "Create your SmartTasks account" }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: "Register to start managing projects and tasks." }), _jsxs("form", { className: "mt-8 space-y-6", onSubmit: handleSubmit, children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Name" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), className: "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-slate-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-slate-400 focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-slate-400 focus:outline-none" })] }), error && _jsx("div", { className: "rounded-xl bg-red-50 p-3 text-sm text-red-700", children: error }), _jsx("button", { type: "submit", className: "w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800", children: "Register" })] }), _jsxs("p", { className: "mt-6 text-center text-sm text-slate-600", children: ["Already registered?", ' ', _jsx(Link, { to: "/login", className: "font-medium text-slate-900 hover:underline", children: "Sign in" })] })] }) }));
}
export default RegisterPage;
