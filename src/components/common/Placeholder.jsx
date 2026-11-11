// src/components/common/Placeholder.jsx
export default function Placeholder({ title }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 p-6">
      <p className="text-sm text-sub">준비 중인 화면</p>
      <h1 className="text-2xl font-extrabold">{title}</h1>
    </div>
  );
}