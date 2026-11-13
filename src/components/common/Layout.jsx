import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { IconBack, IconBook, IconHarvest, IconHome, IconUser } from './Icons';
import Toast from './Toast';

export function MobileLayout() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[430px] flex-col bg-cream shadow-[0_0_24px_rgba(60,50,30,0.06)]">
      <Outlet />
      <Toast />
    </div>
  );
}

export function Screen({ children, className = '' }) {
  return <main className={`flex flex-1 flex-col px-5 pt-12 pb-safe ${className}`}>{children}</main>;
}

export function BackButton({ to, label = '뒤로', light = false, large = false }) {
  const navigate = useNavigate();
  const size = large ? 'h-12 w-12' : 'h-11 w-11';
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={`flex ${size} items-center justify-center rounded-full ${
        light ? 'bg-white/15 text-white' : 'bg-white text-ink shadow-sm'
      }`}
    >
      <IconBack />
    </button>
  );
}

const TABS = [
  { to: '/owner', label: '홈', icon: IconHome, end: true },
  { to: '/owner/diary', label: '일기', icon: IconBook },
  { to: '/owner/harvest', label: '수확', icon: IconHarvest },
  { to: '/owner/my', label: '마이', icon: IconUser },
];

export function OwnerTabLayout() {
  return (
    <>
      <div className="flex flex-1 flex-col pb-[84px]">
        <Outlet />
      </div>
      <nav
        aria-label="하단 메뉴"
        className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-[#ECE6D8] bg-white pb-[max(10px,env(safe-area-inset-bottom))] pt-2"
      >
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 text-[11px] ${isActive ? 'font-bold text-leaf-dark' : 'text-muted'}`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
