// src/components/common/MobileLayout.jsx
import { Outlet } from 'react-router-dom';

export default function MobileLayout() {
  return (
    <div className="mx-auto min-h-full w-full max-w-[430px] bg-cream shadow-sm">
      <Outlet />
    </div>
  );
}