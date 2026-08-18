import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ThemeToggle } from '../components/ThemeToggle';

interface Project {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimate?: number;
  status: 'PENDING' | 'COMPLETED';
  dueDate?: string;
  project: Project;
  subtasks?: Subtask[];
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

const API = () => import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem('smarttasks_token');
const headers = () => ({ Authorization: `Bearer ${token()}` });

function DashboardPage({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [subtaskInput, setSubtaskInput] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'LIST' | 'BOARD' | 'CALENDAR'>('LIST');
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', title: '', priority: 'MEDIUM', estimate: '', dueDate: '' });

  const fetchData = async () => {
    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        axios.get(`${API()}/projects`, { headers: headers() }),
        axios.get(`${API()}/tasks`, { headers: headers() }),
      ]);
      setProjects(projectsResponse.data.projects);
      setTasks(tasksResponse.data.tasks);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load dashboard');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const createProject = async () => {
    try {
      if (editingProjectId) {
        await axios.put(`${API()}/projects/${editingProjectId}`, { name: form.name, description: form.description }, { headers: headers() });
      } else {
        await axios.post(`${API()}/projects`, { name: form.name, description: form.description }, { headers: headers() });
      }
      setShowProjectModal(false);
      setEditingProjectId(null);
      setForm({ name: '', description: '', title: '', priority: 'MEDIUM', estimate: '', dueDate: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save project');
    }
  };

  const openEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setForm({ name: project.name, description: project.description || '', title: '', priority: 'MEDIUM', estimate: '', dueDate: '' });
    setShowProjectModal(true);
  };

  const deleteProject = async (project: Project) => {
    if (!window.confirm(`Delete project "${project.name}" and all its tasks?`)) return;
    try {
      await axios.delete(`${API()}/projects/${project.id}`, { headers: headers() });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const createTask = async () => {
    try {
      if (editingTaskId) {
        await axios.put(`${API()}/tasks/${editingTaskId}`, {
          title: form.title, priority: form.priority, estimate: form.estimate ? Number(form.estimate) : undefined,
          dueDate: form.dueDate || undefined,
        }, { headers: headers() });
      } else {
        await axios.post(`${API()}/tasks`, {
          title: form.title, projectId: selectedProjectId,
          priority: form.priority, estimate: form.estimate ? Number(form.estimate) : undefined,
          dueDate: form.dueDate || undefined,
        }, { headers: headers() });
      }
      setShowTaskModal(false);
      setEditingTaskId(null);
      setForm({ name: '', description: '', title: '', priority: 'MEDIUM', estimate: '', dueDate: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save task');
    }
  };

  const openEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setForm({ name: '', description: '', title: task.title, priority: task.priority, estimate: String(task.estimate || ''), dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '' });
    setSelectedProjectId(task.project.id);
    setShowTaskModal(true);
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await axios.delete(`${API()}/tasks/${task.id}`, { headers: headers() });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const addSubtask = async (taskId: string) => {
    const title = subtaskInput[taskId]?.trim();
    if (!title) return;
    try {
      await axios.post(`${API()}/tasks/${taskId}/subtasks`, { title }, { headers: headers() });
      setSubtaskInput((prev) => ({ ...prev, [taskId]: '' }));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add subtask');
    }
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await axios.patch(`${API()}/tasks/${taskId}/subtasks/${subtaskId}/complete`, {}, { headers: headers() });
      fetchData();
    } catch { }
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await axios.delete(`${API()}/tasks/${taskId}/subtasks/${subtaskId}`, { headers: headers() });
      fetchData();
    } catch { }
  };

  const enhanceTask = async () => {
    if (!form.title || form.title.length < 10) {
      alert('Enter at least 10 characters for the task title to use AI enhancement.');
      return;
    }
    setAiLoading(true);
    try {
      const response = await axios.post(`${API()}/ai/enhance-task`, { description: form.title }, { headers: headers() });
      const data = response.data;
      setForm((prev) => ({ ...prev, priority: data.priority || 'MEDIUM', estimate: data.estimate ? String(data.estimate) : prev.estimate }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'AI enhancement failed. Check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const exportCsv = () => {
    const rows = filteredTasks.map((t) => [
      t.title.replace(/,/g, ' '),
      t.status,
      t.priority,
      t.estimate ?? '',
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
      t.project.name,
      t.subtasks ? `${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length}` : '',
    ]);
    const csv = [['Title', 'Status', 'Priority', 'Estimate(h)', 'Due Date', 'Project', 'Subtasks'], ...rows]
      .map((r) => r.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smarttasks-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleComplete = async (taskId: string) => {
    try {
      await axios.patch(`${API()}/tasks/${taskId}/complete`, {}, { headers: headers() });
      fetchData();
    } catch { }
  };

  const toggleSelect = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const moveTask = async (taskId: string, status: 'PENDING' | 'COMPLETED') => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    try {
      await axios.patch(`${API()}/tasks/${taskId}/complete`, {}, { headers: headers() });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to move task');
    }
  };

  const bulkComplete = async () => {
    try {
      await Promise.all(
        [...selectedTaskIds].map((id) => axios.patch(`${API()}/tasks/${id}/complete`, {}, { headers: headers() }))
      );
      setSelectedTaskIds(new Set());
      fetchData();
    } catch { }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTaskIds.size} selected task(s)?`)) return;
    try {
      await Promise.all(
        [...selectedTaskIds].map((id) => axios.delete(`${API()}/tasks/${id}`, { headers: headers() }))
      );
      setSelectedTaskIds(new Set());
      fetchData();
    } catch { }
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
      if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'PRIORITY') {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
      }
      if (sortBy === 'DUE_DATE') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'TITLE') return a.title.localeCompare(b.title);
      return 0;
    });

  const groupedByProject = projects.map((project) => ({
    ...project,
    tasks: filteredTasks.filter((task) => task.project.id === project.id),
  }));

  const priorityBuckets = ['HIGH', 'MEDIUM', 'LOW'] as const;
  const priorityData = priorityBuckets.map((p) => ({ name: p, count: filteredTasks.filter((t) => t.priority === p).length }));
  const priorityColors: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#94a3b8' };
  const completionData = [
    { name: 'Completed', value: tasks.filter((t) => t.status === 'COMPLETED').length, color: '#22c55e' },
    { name: 'Pending', value: tasks.filter((t) => t.status === 'PENDING').length, color: '#3b82f6' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">SmartTasks Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Monitor priorities, active projects, and task progress in one place.</p>
          </div>
          <div className="flex gap-3">
            <ThemeToggle dark={dark} toggle={toggle} />
            <div className="flex rounded-2xl border border-slate-200 p-1 dark:border-slate-700">
              <button onClick={() => setView('LIST')} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${view === 'LIST' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>List</button>
              <button onClick={() => setView('BOARD')} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${view === 'BOARD' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>Board</button>
              <button onClick={() => setView('CALENDAR')} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${view === 'CALENDAR' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>Calendar</button>
            </div>
            <button onClick={() => { window.location.href = '/profile'; }} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" title="Profile">
              👤 Profile
            </button>
            <button onClick={exportCsv} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" title="Export tasks to CSV">
              ⬇ Export
            </button>
            <button onClick={() => { setEditingProjectId(null); setForm({ name: '', description: '', title: '', priority: 'MEDIUM', estimate: '', dueDate: '' }); setShowProjectModal(true); }} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
              + New Project
            </button>
            <button onClick={() => { localStorage.removeItem('smarttasks_token'); localStorage.removeItem('smarttasks_user'); window.location.href = '/login'; }}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Logout
            </button>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none min-w-[200px] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500" />
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <option value="DEFAULT">Sort: Default</option>
            <option value="PRIORITY">Sort: Priority</option>
            <option value="DUE_DATE">Sort: Due Date</option>
            <option value="TITLE">Sort: Title</option>
          </select>
          {(searchQuery || filterPriority !== 'ALL' || filterStatus !== 'ALL' || sortBy !== 'DEFAULT') && (
            <button onClick={() => { setSearchQuery(''); setFilterPriority('ALL'); setFilterStatus('ALL'); setSortBy('DEFAULT'); }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Clear</button>
          )}
        </div>

        {selectedTaskIds.size > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedTaskIds.size} selected</span>
            <button onClick={bulkComplete} className="rounded-xl bg-green-100 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50">
              ✓ Complete Selected
            </button>
            <button onClick={bulkDelete} className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50">
              ✕ Delete Selected
            </button>
            <button onClick={() => setSelectedTaskIds(new Set())} className="ml-auto text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
              Clear selection
            </button>
          </div>
        )}

        {error ? (
          <div className="rounded-3xl bg-rose-50 p-6 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">{error}</div>
        ) : view === 'BOARD' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {(['PENDING', 'COMPLETED'] as const).map((status) => (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragTaskId) moveTask(dragTaskId, status); setDragTaskId(null); }}
                className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {status === 'PENDING' ? '📋 Pending' : '✅ Completed'}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {filteredTasks.filter((t) => t.status === status).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {filteredTasks.filter((t) => t.status === status).length === 0 && (
                    <p className="rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center text-sm text-slate-400 dark:border-slate-700">
                      Drop tasks here
                    </p>
                  )}
                  {filteredTasks.filter((t) => t.status === status).map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragTaskId(task.id)}
                      onDragEnd={() => setDragTaskId(null)}
                      className="cursor-grab rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition hover:shadow-md active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-semibold ${task.status === 'COMPLETED' ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>{task.title}</h3>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{task.project.name}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs uppercase tracking-wide ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {task.estimate && <span>⏱ {task.estimate}h</span>}
                        {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span>☑ {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}</span>
                        )}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => openEditTask(task)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300" title="Edit task">✎</button>
                        <button onClick={() => deleteTask(task)} className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400" title="Delete task">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : view === 'CALENDAR' ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">◀</button>
                <button onClick={() => setCalendarDate(new Date())} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Today</button>
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">▶</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
                const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
                const cells: (Date | null)[] = [
                  ...Array.from({ length: firstDay }, () => null),
                  ...Array.from({ length: daysInMonth }, (_, i) => new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i + 1)),
                ];
                return cells.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;
                  const dayKey = date.toISOString().slice(0, 10);
                  const dayTasks = filteredTasks.filter((t) => t.dueDate && t.dueDate.slice(0, 10) === dayKey);
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div key={dayKey} className={`min-h-[90px] rounded-xl border p-1.5 ${isToday ? 'border-slate-900 dark:border-slate-100' : 'border-slate-100 dark:border-slate-800'}`}>
                      <span className={`text-xs font-medium ${isToday ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{date.getDate()}</span>
                      <div className="mt-1 space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div key={task.id} onClick={() => openEditTask(task)} className={`cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] leading-tight ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-800 line-through dark:bg-green-900/30 dark:text-green-400' : task.priority === 'HIGH' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`} title={task.title}>
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && <div className="px-1.5 text-[11px] text-slate-400">+{dayTasks.length - 3} more</div>}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <section className="space-y-6">
              {groupedByProject.length === 0 && (
                <div className="rounded-3xl bg-white p-12 text-center shadow-sm dark:bg-slate-900">
                  <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No projects yet</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your first project to get started.</p>
                  <button onClick={() => { setEditingProjectId(null); setForm({ name: '', description: '', title: '', priority: 'MEDIUM', estimate: '', dueDate: '' }); setShowProjectModal(true); }} className="mt-4 rounded-2xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                    + New Project
                  </button>
                </div>
              )}
              {groupedByProject.map((project) => (
                <div key={project.id} className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{project.name}</h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{project.description || 'No description yet'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditProject(project)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300" title="Edit project">✎</button>
                      <button onClick={() => deleteProject(project)} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400" title="Delete project">✕</button>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">{project.tasks.length} tasks</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {project.tasks.length === 0 ? '0%' : `${Math.round((project.tasks.filter((t) => t.status === 'COMPLETED').length / project.tasks.length) * 100)}%`}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all duration-500 dark:bg-slate-100"
                        style={{ width: `${project.tasks.length === 0 ? 0 : (project.tasks.filter((t) => t.status === 'COMPLETED').length / project.tasks.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    {project.tasks.map((task) => (
                      <div key={task.id} className={`rounded-3xl border p-4 transition ${task.status === 'COMPLETED' ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <input type="checkbox" checked={selectedTaskIds.has(task.id)} onChange={() => toggleSelect(task.id)}
                              className="mt-1 h-5 w-5 rounded-full border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800" title={task.status === 'COMPLETED' ? 'Select' : 'Select'} />
                            <div>
                              <h3 className={`text-lg font-semibold ${task.status === 'COMPLETED' ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>{task.title}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{task.description || 'No description'}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0">
                            {task.status === 'PENDING' && (
                              <button onClick={() => toggleComplete(task.id)} className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50">✓ Complete</button>
                            )}
                            <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                              {task.priority}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                              {task.status === 'COMPLETED' ? 'Done' : 'In progress'}
                            </span>
                            {task.estimate && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-400">{task.estimate}h</span>}
                            {task.dueDate && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-400">{new Date(task.dueDate).toLocaleDateString()}</span>}
                            <button onClick={() => openEditTask(task)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300" title="Edit task">✎</button>
                            <button onClick={() => deleteTask(task)} className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400" title="Delete task">✕</button>
                          </div>
                        </div>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <button onClick={() => toggleExpand(task.id)} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
                              {expandedTasks.has(task.id) ? '▼' : '▶'} Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
                            </button>
                            {expandedTasks.has(task.id) && (
                              <div className="mt-2 space-y-1.5">
                                {task.subtasks.map((subtask) => (
                                  <div key={subtask.id} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <input type="checkbox" checked={subtask.completed} onChange={() => toggleSubtask(task.id, subtask.id)}
                                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800" />
                                    <span className={`flex-1 text-sm ${subtask.completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>{subtask.title}</span>
                                    <button onClick={() => deleteSubtask(task.id, subtask.id)} className="rounded p-0.5 text-slate-400 hover:text-red-500">✕</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                          <input value={subtaskInput[task.id] || ''} onChange={(e) => setSubtaskInput((prev) => ({ ...prev, [task.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(task.id); }}
                            placeholder="Add subtask..."
                            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                          <button onClick={() => addSubtask(task.id)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">+</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => { setEditingTaskId(null); setForm({ name: '', description: '', title: '', priority: 'MEDIUM', estimate: '', dueDate: '' }); setSelectedProjectId(project.id); setShowTaskModal(true); }}
                      className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-300">
                      + Add Task
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Priority overview</h2>
                <div className="mt-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: dark ? '#94a3b8' : '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: dark ? '#94a3b8' : '#64748b' }} allowDecimals={false} />
                      <Tooltip contentStyle={dark ? { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' } : undefined} labelStyle={dark ? { color: '#e2e8f0' } : undefined} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {priorityData.map((entry) => <Cell key={entry.name} fill={priorityColors[entry.name]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Completion status</h2>
                <div className="mt-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={completionData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={4}>
                        {completionData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={dark ? { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' } : undefined} labelStyle={dark ? { color: '#e2e8f0' } : undefined} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-center gap-4 text-sm">
                  {completionData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                      {d.name}: {d.value}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Quick insights</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <li>{tasks.filter((task) => task.status === 'COMPLETED').length} completed tasks</li>
                  <li>{tasks.filter((task) => task.status === 'PENDING').length} pending tasks</li>
                  <li>{projects.length} active projects</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>

      {showProjectModal && (
        <Modal title={editingProjectId ? 'Edit Project' : 'New Project'} onClose={() => { setShowProjectModal(false); setEditingProjectId(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" rows={3} />
            </div>
            <button onClick={createProject} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
              {editingProjectId ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </Modal>
      )}

      {showTaskModal && (
        <Modal title={editingTaskId ? 'Edit Task' : 'New Task'} onClose={() => { setShowTaskModal(false); setEditingTaskId(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Task Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Estimate (hours)</label>
              <input type="number" value={form.estimate} onChange={(e) => setForm({ ...form, estimate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>
            <button type="button" onClick={enhanceTask} disabled={aiLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50">
              {aiLoading ? 'Analyzing...' : '✨ AI Enhance'}
            </button>
            <button onClick={createTask} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
              {editingTaskId ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:shadow-slate-950/50" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default DashboardPage;