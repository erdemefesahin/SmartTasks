import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';

const API = () => import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem('smarttasks_token');
const headers = () => ({ Authorization: `Bearer ${token()}` });

function ProfilePage({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  const [user, setUser] = useState<{ id: string; email: string; name: string; createdAt?: string } | null>(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API()}/auth/me`, { headers: headers() });
      setUser(response.data.user);
      setName(response.data.user.name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load profile');
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const payload: { name?: string; currentPassword?: string; newPassword?: string } = { name };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const response = await axios.put(`${API()}/auth/me`, payload, { headers: headers() });
      setUser(response.data.user);
      localStorage.setItem('smarttasks_user', JSON.stringify(response.data.user));
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Profile</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Manage your account details.</p>
          </div>
          <div className="flex gap-3">
            <ThemeToggle dark={dark} toggle={toggle} />
            <Link to="/" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
        {message && <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">{message}</div>}

        {user && (
          <form onSubmit={saveProfile} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input value={user.email} disabled
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Member since</label>
                <input value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'} disabled
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>

            <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Change password</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Leave blank to keep your current password.</p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
              Save Changes
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;