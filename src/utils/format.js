const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDate(value) {
  if (value instanceof Date) return value;
  // 'YYYY-MM-DD'는 로컬 날짜로 해석
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

export function formatMonthDay(value) {
  const d = toDate(value);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function formatMonthDayWeekday(value) {
  const d = toDate(value);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`;
}

export function weekdayName(value) {
  return `${WEEKDAYS[toDate(value).getDay()]}요일`;
}

export function formatTime(value) {
  const d = toDate(value);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${hh}:${String(m).padStart(2, '0')}`;
}

// '10:00' → '오전 10시'
export function formatHourLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return m ? `${ampm} ${hh}시 ${m}분` : `${ampm} ${hh}시`;
}

export function relativeDayLabel(value) {
  const d = toDate(value);
  const today = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diff === 0) return `오늘 · ${formatMonthDay(d)}`;
  if (diff === 1) return `어제 · ${formatMonthDay(d)}`;
  return formatMonthDay(d);
}

export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
