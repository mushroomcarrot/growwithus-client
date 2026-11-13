import { useAsync } from './useAsync';
import { taskService } from '../services';

// 오늘 할 일에서 taskId에 해당하는 텃밭과 작업을 찾음
export function findInToday(today, taskId) {
  for (const garden of today?.gardens ?? []) {
    const task = garden.tasks.find((t) => t.taskId === taskId);
    if (task) return { garden, task };
  }
  return { garden: null, task: null };
}

// 텃밭 단위 카드 목록: 할 일이 남은 텃밭이 앞에 옴
export function gardenCards(today) {
  return (today?.gardens ?? []).map((garden) => {
    const todo = garden.tasks.filter((t) => t.status === 'TODO');
    return { garden, todo, done: todo.length === 0 };
  });
}

export function useTodayTask(taskId) {
  const state = useAsync(() => taskService.getToday(), [taskId]);
  const { garden, task } = findInToday(state.data, taskId);
  return { ...state, today: state.data, garden, task };
}
