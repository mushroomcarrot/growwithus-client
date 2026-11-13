import { useSpeech } from '../../hooks/useSpeech';
import { IconSpeaker } from './Icons';

export default function ReadAloudButton({ text, label = '읽어주기', large = false }) {
  const { speak, stop, speaking } = useSpeech();
  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak(text))}
      aria-pressed={speaking}
      className={`flex items-center gap-1.5 rounded-xl bg-blue-light font-bold text-blue ${
        large ? 'h-11 px-3.5 text-base' : 'h-10 px-3 text-[15px]'
      }`}
    >
      <IconSpeaker />
      {speaking ? '그만 듣기' : label}
    </button>
  );
}
