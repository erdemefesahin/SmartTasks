import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
function DashboardPage() {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState('');
    useEffect(() => {
        async function fetchData() {
            try {
                const token = localStorage.getItem('smarttasks_token');
                const [projectsResponse, tasksResponse] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${import.meta.env.VITE_API_BASE_URL}/tasks`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                setProjects(projectsResponse.data.projects);
                setTasks(tasksResponse.data.tasks);
            }
            catch (err) {
                setError(err.response?.data?.error || 'Unable to load dashboard');
            }
        }
        fetchData();
    }, []);
    const groupedByProject = projects.map((project) => ({
        ...project,
        tasks: tasks.filter((task) => task.project.id === project.id),
    }));
    const priorityBuckets = ['HIGH', 'MEDIUM', 'LOW'];
    return (_jsx("div", { className: "min-h-screen bg-slate-50 px-6 py-8", children: _jsxs("div", { className: "mx-auto max-w-7xl", children: [_jsxs("header", { className: "mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-semibold text-slate-900", children: "SmartTasks Dashboard" }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: "Monitor priorities, active projects, and task progress in one place." })] }), _jsx("button", { onClick: () => {
                                localStorage.removeItem('smarttasks_token');
                                localStorage.removeItem('smarttasks_user');
                                window.location.href = '/login';
                            }, className: "rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800", children: "Logout" })] }), error ? (_jsx("div", { className: "rounded-3xl bg-rose-50 p-6 text-rose-700", children: error })) : (_jsxs("div", { className: "grid gap-6 lg:grid-cols-[1.4fr_0.6fr]", children: [_jsx("section", { className: "space-y-6", children: groupedByProject.map((project) => (_jsxs("div", { className: "rounded-3xl bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: project.name }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: project.description || 'No description yet' })] }), _jsxs("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600", children: [project.tasks.length, " tasks"] })] }), _jsx("div", { className: "mt-5 space-y-4", children: project.tasks.length ? (project.tasks.map((task) => (_jsx("div", { className: "rounded-3xl border border-slate-200 p-4", children: _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: task.title }), _jsx("p", { className: "text-sm text-slate-600", children: task.description || 'No description' })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-wide text-slate-700", children: task.priority }), _jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700", children: task.status === 'COMPLETED' ? 'Done' : 'In progress' }), task.estimate && _jsxs("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700", children: [task.estimate, "h"] })] })] }) }, task.id)))) : (_jsx("p", { className: "rounded-3xl bg-slate-50 p-4 text-sm text-slate-500", children: "No tasks yet for this project." })) })] }, project.id))) }), _jsxs("aside", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-3xl bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Priority overview" }), _jsx("div", { className: "mt-4 space-y-3", children: priorityBuckets.map((priority) => {
                                                const count = tasks.filter((task) => task.priority === priority).length;
                                                return (_jsxs("div", { className: "flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3", children: [_jsx("span", { className: "font-medium text-slate-700", children: priority }), _jsx("span", { className: "text-slate-900", children: count })] }, priority));
                                            }) })] }), _jsxs("div", { className: "rounded-3xl bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Quick insights" }), _jsxs("ul", { className: "mt-4 space-y-3 text-sm text-slate-600", children: [_jsxs("li", { children: [tasks.filter((task) => task.status === 'COMPLETED').length, " completed tasks"] }), _jsxs("li", { children: [tasks.filter((task) => task.status === 'PENDING').length, " pending tasks"] }), _jsxs("li", { children: [projects.length, " active projects"] })] })] })] })] }))] }) }));
}
export default DashboardPage;
