import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { notificationService } from '../../services';
import { formatTime, relativeDayLabel } from '../../utils/format';
import { BackButton } from '../../components/common/Layout';
import { ErrorBox, LoadingSpinner } from '../../components/common/Feedback';

// 알림을 누르면 이동할 화면 (서버의 target.screen 기준)
const TARGET_PATH = {
  DT_HOME: '/owner',
  DT_DIARY: '/owner/diary',
  DT_HARVEST: '/owner/harvest',
  DT_MY: '/owner/my',
  DT_LEAGUE: '/owner/my',
};

export default function OwnerNotificationsPage() {
  const navigate = useNavigate();

  // 목록을 받은 뒤 모두 읽음 처리함. 이번 화면에서는 받은 그대로 안 읽은 표시를 남겨 둠
  const load = useCallback(async () => {
    const list = await notificationService.getList();
    if (list?.unreadCount > 0) notificationService.readAll().catch(() => {});
    return list;
  }, []);

  const { data, error, reload } = useAsync(load, []);

  if (error && !data) return <ErrorBox message={error.message} onRetry={reload} />;
  if (!data) return <LoadingSpinner />;

  const items = data.items ?? [];

  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-11 pb-4">
      <div className="flex items-center gap-3">
        <BackButton to="/owner" label="홈으로 돌아가기" />
        <h1 className="text-[22px] font-extrabold">알림</h1>
      </div>

      {items.length === 0 ? (
        <p className="rounded-[18px] bg-white p-4 text-center text-sm text-sub">아직 받은 알림이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => {
            const path = TARGET_PATH[n.target?.screen];
            return (
              <li key={n.notificationId}>
                <button
                  type="button"
                  disabled={!path}
                  onClick={() => navigate(path)}
                  className={`flex w-full flex-col gap-1 rounded-[16px] p-3.5 text-left shadow-[0_2px_8px_rgba(60,50,30,0.06)] ${
                    n.read ? 'bg-white' : 'bg-leaf-soft'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[13px] font-extrabold">
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-heart" aria-label="안 읽음" />}
                    {n.title}
                  </span>
                  {n.body && <span className="text-xs leading-normal text-[#3B4A36]">{n.body}</span>}
                  <span className="text-[11px] text-muted">
                    {relativeDayLabel(n.createdAt)} {formatTime(n.createdAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
