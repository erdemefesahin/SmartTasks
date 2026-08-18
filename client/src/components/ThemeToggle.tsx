import { useEffect, useState } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

export function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button onClick={toggle} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
      {dark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}