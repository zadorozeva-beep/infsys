import { Outlet } from 'react-router-dom';

import { CommandPalette } from './CommandPalette';
import { ConfettiHost } from './ConfettiHost';
import { Navbar } from './Navbar';

export function Layout(): JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-mint-radial">
      {/* Декоративні плаваючі плями фону */}
      <div className="blob -left-32 top-20 h-96 w-96 animate-float-slow bg-mint-300/40" />
      <div className="blob right-[-10rem] top-[40%] h-[28rem] w-[28rem] animate-float-slower bg-teal-200/50" />
      <div className="blob bottom-[-8rem] left-1/3 h-80 w-80 animate-float-slow bg-cyan-200/40" />

      <Navbar />
      <CommandPalette />
      <ConfettiHost />

      <main className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">
        <div className="animate-fade-up">
          <Outlet />
        </div>
      </main>

      <footer className="relative mt-12 border-t border-white/50 bg-white/40 py-6 text-center text-xs text-mint-800/80 backdrop-blur dark:border-mint-800/50 dark:bg-mint-950/40 dark:text-mint-300/80">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4">
          <span className="font-semibold">АІС навчальних матеріалів</span>
          <span className="text-mint-700/70 dark:text-mint-400/70">
            © {new Date().getFullYear()} · Курсовий проєкт · Спеціальність 121 «Інженерія програмного забезпечення»
          </span>
        </div>
      </footer>
    </div>
  );
}
