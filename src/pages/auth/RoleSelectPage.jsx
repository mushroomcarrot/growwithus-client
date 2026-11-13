import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useMeStore } from '../../store/ownerStore';
import { pathForNextStep } from '../../utils/nextStep';
import { SproutPot } from '../../components/common/Characters';
import { FieldError } from '../../components/common/Feedback';
import { IconHome, IconSprout } from '../../components/common/Icons';

const ROLES = [
  {
    role: 'OWNER',
    title: '텃밭 주인',
    desc: ['작물 캐릭터를 매일 키우고', '주말에 직접 수확해요'],
    icon: IconHome,
    iconBg: 'bg-[#FDE7E3] text-[#C2453A]',
  },
  {
    role: 'CARETAKER',
    title: '텃밭 관리사',
    desc: ['오늘 할 일만 큰 글씨로', '알려드려요'],
    icon: IconSprout,
    iconBg: 'bg-leaf-light text-[#3E7A33]',
  },
];

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const setRole = useAuthStore((s) => s.setRole);
  const clearMe = useMeStore((s) => s.clearMe);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');

  const choose = async (role) => {
    setPending(role);
    setError('');
    try {
      const res = await userService.setRole(role);
      setRole(res);
      clearMe();
      navigate(pathForNextStep(res.nextStep, res.role), { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(null);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-6 pt-20 pb-safe">
      <div className="flex flex-col items-center gap-2.5">
        <SproutPot size={92} />
        <h1 className="text-[30px] font-extrabold text-leaf-dark">대신텃밭</h1>
        <p className="text-center text-[13px] leading-relaxed text-sub">
          도시의 가족과 처인구의 손길이
          <br />
          함께 키우는 우리 텃밭
        </p>
      </div>
      <h2 className="mt-10 mb-3.5 text-[15px] font-bold">어떤 역할로 시작할까요?</h2>
      <div className="flex flex-col gap-3.5">
        {ROLES.map(({ role, title, desc, icon: Icon, iconBg }) => (
          <button
            key={role}
            type="button"
            onClick={() => choose(role)}
            disabled={Boolean(pending)}
            className="flex items-center gap-4 rounded-[20px] bg-white p-5 text-left shadow-[0_2px_10px_rgba(60,50,30,0.08)] disabled:opacity-60"
          >
            <span className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
              <Icon size={26} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-lg font-extrabold">{pending === role ? '잠시만요…' : title}</span>
              <span className="text-[13px] leading-normal text-sub">
                {desc[0]}
                <br />
                {desc[1]}
              </span>
            </span>
          </button>
        ))}
      </div>
      <FieldError>{error}</FieldError>
    </main>
  );
}
