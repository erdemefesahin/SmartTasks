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

function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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
      } catch (err: any) {
        setError(err.response?.data?.error || 'Unable to load dashboard');
      }
    }
    fetchData();
  }, []);

  const groupedByProject = projects.map((project) => ({
    ...project,
    tasks: tasks.filter((task) => task.project.id === project.id),
  }));

  const priorityBuckets = ['HIGH', 'MEDIUM', 'LOW'] as const;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">SmartTasks Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Monitor priorities, active projects, and task progress in one place.</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('smarttasks_token');
              localStorage.removeItem('smarttasks_user');
              window.location.href = '/login';
            }}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Logout
          </button>
        </header>

        {error ? (
          <div className="rounded-3xl bg-rose-50 p-6 text-rose-700">{error}</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <section className="space-y-6">
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
                    {project.tasks.length ? (
                      project.tasks.map((task) => (
                        <div key={task.id} className="rounded-3xl border border-slate-200 p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                              <p className="text-sm text-slate-600">{task.description || 'No description'}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-wide text-slate-700">
                                {task.priority}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                {task.status === 'COMPLETED' ? 'Done' : 'In progress'}
                              </span>
                              {task.estimate && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{task.estimate}h</span>}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">No tasks yet for this project.</p>
                    )}
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
    </div>
  );
}

export default DashboardPage;
