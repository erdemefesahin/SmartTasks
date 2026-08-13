import { useEffect, useState } from 'react';
import axios from 'axios';

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
  project: Project;
}

const API = () => import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem('smarttasks_token');
const headers = () => ({ Authorization: `Bearer ${token()}` });

function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [form, setForm] = useState({ name: '', description: '', title: '', priority: 'MEDIUM', estimate: '' });

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
      await axios.post(`${API()}/projects`, { name: form.name, description: form.description }, { headers: headers() });
      setShowProjectModal(false);
      setForm({ name: '', description: '', title: '', priority: 'MEDIUM', estimate: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create project');
    }
  };

  const createTask = async () => {
    try {
      await axios.post(`${API()}/tasks`, {
        title: form.title, projectId: selectedProjectId,
        priority: form.priority, estimate: form.estimate ? Number(form.estimate) : undefined,
      }, { headers: headers() });
      setShowTaskModal(false);
      setForm({ name: '', description: '', title: '', priority: 'MEDIUM', estimate: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const toggleComplete = async (taskId: string) => {
    try {
      await axios.patch(`${API()}/tasks/${taskId}/complete`, {}, { headers: headers() });
      fetchData();
    } catch { }
  };

  const groupedByProject = projects.map((project) => ({
    ...project,
    tasks: tasks.filter((task) => task.project.id === project.id),
  }));

  const priorityBuckets = ['HIGH', 'MEDIUM', 'LOW'] as const;

  const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">SmartTasks Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Monitor priorities, active projects, and task progress in one place.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowProjectModal(true)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              + New Project
            </button>
            <button onClick={() => { localStorage.removeItem('smarttasks_token'); localStorage.removeItem('smarttasks_user'); window.location.href = '/login'; }}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Logout
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl bg-rose-50 p-6 text-rose-700">{error}</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <section className="space-y-6">
              {groupedByProject.length === 0 && (
                <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
                  <p className="text-lg font-medium text-slate-900">No projects yet</p>
                  <p className="mt-1 text-sm text-slate-500">Create your first project to get started.</p>
                  <button onClick={() => setShowProjectModal(true)} className="mt-4 rounded-2xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    + New Project
                  </button>
                </div>
              )}
              {groupedByProject.map((project) => (
                <div key={project.id} className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{project.name}</h2>
                      <p className="mt-1 text-sm text-slate-600">{project.description || 'No description yet'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                      {project.tasks.length} tasks
                    </span>
                  </div>
                  <div className="mt-5 space-y-4">
                    {project.tasks.map((task) => (
                      <div key={task.id} className={`rounded-3xl border p-4 transition ${task.status === 'COMPLETED' ? 'border-green-200 bg-green-50/50' : 'border-slate-200'}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <input type="checkbox" checked={task.status === 'COMPLETED'} onChange={() => toggleComplete(task.id)}
                              className="mt-1 h-5 w-5 rounded-full border-slate-300 text-slate-900 focus:ring-slate-900" />
                            <div>
                              <h3 className={`text-lg font-semibold ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</h3>
                              <p className="text-sm text-slate-600">{task.description || 'No description'}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0">
                            <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                              {task.priority}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {task.status === 'COMPLETED' ? 'Done' : 'In progress'}
                            </span>
                            {task.estimate && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{task.estimate}h</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => { setSelectedProjectId(project.id); setShowTaskModal(true); }}
                      className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700">
                      + Add Task
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Priority overview</h2>
                <div className="mt-4 space-y-3">
                  {priorityBuckets.map((priority) => {
                    const count = tasks.filter((task) => task.priority === priority).length;
                    return (
                      <div key={priority} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                        <span className="font-medium text-slate-700">{priority}</span>
                        <span className="text-slate-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Quick insights</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
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
        <Modal title="New Project" onClose={() => setShowProjectModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Project Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none" rows={3} />
            </div>
            <button onClick={createProject} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Create Project
            </button>
          </div>
        </Modal>
      )}

      {showTaskModal && (
        <Modal title="New Task" onClose={() => setShowTaskModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Task Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Estimate (hours)</label>
              <input type="number" value={form.estimate} onChange={(e) => setForm({ ...form, estimate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-slate-400 focus:outline-none" />
            </div>
            <button onClick={createTask} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Create Task
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DashboardPage;