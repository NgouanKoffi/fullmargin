// src/pages/communaute/public/components/feed/PostComposer/EmojiPicker.tsx

const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😚",
  "😙",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🤫",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "🤥",
  "😌",
  "😔",
  "😪",
  "🤤",
  "😴",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🤧",
  "🥵",
  "🥶",
  "🥴",
  "😵",
  "🤯",
  "🤠",
  "🥳",
  "😎",
  "🤓",
  "🧐",
  "😕",
  "😟",
  "🙁",
  "☹️",
  "😮",
  "😯",
  "😲",
  "😳",
  "🥺",
  "😦",
  "😧",
  "😨",
  "😰",
  "😥",
  "😢",
  "😭",
  "😱",
  "😖",
  "😣",
  "😞",
  "😓",
  "😩",
  "😫",
  "😤",
  "😡",
  "😠",
  "🤬",
  "💀",
  "☠️",
  "💩",
  "🤡",
  "👻",
  "👽",
  "🤖",
  "💋",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💯",
  "🔥",
  "✨",
  "⭐",
  "🌟",
  "⚡",
  "🎉",
  "🎊",
  "💥",
  "🫶",
  "👍",
  "👎",
  "🙏",
  "👏",
  "🙌",
  "💪",
];

type EmojiPickerProps = {
  onPick: (emoji: string) => void;
  onClose?: () => void;
};

export default function EmojiPicker({ onPick, onClose }: EmojiPickerProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black/10 dark:ring-white/10 p-3 w-64">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-200">
          Emojis
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            Fermer
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
        {EMOJIS.map((e, i) => (
          <button
            key={`${e}-${i}`}
            type="button"
            onClick={() => onPick(e)}
            className="text-lg leading-none hover:scale-110 transition-transform"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
