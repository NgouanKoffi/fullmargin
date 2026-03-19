import { useEffect, useMemo, useRef, useState } from "react";
import { isEmail, parseManyEmails, uniqEmails } from "../utils";
import useEmailSuggestions from "../hooks/useEmailSuggestions";

type Props = {
  toEmails: string[];
  setToEmails: (next: string[] | ((prev: string[]) => string[])) => void;
};

export default function RecipientsInput({ toEmails, setToEmails }: Props) {
  const [value, setValue] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // suggestions live depuis /api/admin/users?q=...
  const { items: suggestionsRaw } = useEmailSuggestions(value);
  const suggestions = useMemo<string[]>(
    () =>
      suggestionsRaw.filter(
        (e) => !toEmails.map((x) => x.toLowerCase()).includes(e.toLowerCase())
      ),
    [suggestionsRaw, toEmails]
  );

  useEffect(() => {
    setOpen(!!value.trim() && suggestions.length > 0);
    setActiveIndex(0);
  }, [value, suggestions.length]);

  function addEmail(email: string) {
    const e = email.trim();
    if (!e || !isEmail(e)) return;
    setToEmails((prev) => (prev.includes(e) ? prev : [...prev, e]));
  }

  function addMany(text: string) {
    const many = uniqEmails(parseManyEmails(text));
    if (many.length === 0) return;
    setToEmails((prev) => uniqEmails([...prev, ...many]));
  }

  function removeEmail(email: string) {
    setToEmails((prev) =>
      prev.filter((x) => x.toLowerCase() !== email.toLowerCase())
    );
  }

  function commit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (isEmail(trimmed)) addEmail(trimmed);
    else addMany(trimmed);
    setValue("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key.toLowerCase();

    if (
      open &&
      (key === "arrowdown" ||
        key === "arrowup" ||
        key === "enter" ||
        key === "escape")
    ) {
      e.preventDefault();
      if (key === "arrowdown")
        setActiveIndex((i: number) =>
          Math.min(i + 1, Math.max(0, suggestions.length - 1))
        );
      else if (key === "arrowup")
        setActiveIndex((i: number) => Math.max(i - 1, 0));
      else if (key === "enter") {
        const chosen = suggestions[activeIndex];
        if (chosen) addEmail(chosen);
        setValue("");
        setOpen(false);
      } else if (key === "escape") setOpen(false);
      return;
    }

    if (key === "enter" || key === "," || key === "tab" || key === " ") {
      e.preventDefault();
      commit();
    } else if (key === "backspace" && !value && toEmails.length) {
      setToEmails((prev) => prev.slice(0, -1));
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text") || "";
    if (text && parseManyEmails(text).length > 1) {
      e.preventDefault();
      addMany(text);
    }
  }

  return (
    <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-3">
      <label className="text-xs font-medium text-skin-muted">
        Destinataires (e-mail)
      </label>

      <div
        className="mt-1 rounded-xl border border-skin-border/30 bg-transparent px-2 py-1 flex flex-wrap gap-1 relative"
        onClick={() => inputRef.current?.focus()}
      >
        {toEmails.map((e: string) => (
          <span
            key={e}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs bg-skin-tile text-skin-base dark:bg-slate-800 dark:text-slate-100"
          >
            {e}
            <button
              className="opacity-70 hover:opacity-100"
              onClick={() => removeEmail(e)}
              aria-label={`Retirer ${e}`}
              type="button"
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Adresse e-mail…"
          className="flex-1 min-w-[140px] px-2 py-1 outline-none bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

        {/* menu suggestions */}
        {open && suggestions.length > 0 && (
          <div
            role="listbox"
            className="
              absolute left-0 top-[calc(100%+6px)] z-50 w-full
              rounded-xl border border-skin-border/30
              bg-white text-slate-900
              dark:bg-slate-900 dark:text-slate-100
              shadow-xl overflow-hidden
            "
          >
            {suggestions.map((s: string, i: number) => {
              const active = i === activeIndex;
              return (
                <button
                  key={`${s}-${i}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={(ev) => ev.preventDefault()} // éviter blur
                  onClick={() => {
                    addEmail(s);
                    setValue("");
                    setOpen(false);
                    inputRef.current?.focus();
                  }}
                  className={[
                    "w-full text-start px-3 py-2 text-sm",
                    active
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-1 text-[11px] text-skin-muted">
        Plusieurs adresses possibles (Entrée, virgule, espace, ou collage).
        Suggestions depuis l’annuaire.
      </p>
    </div>
  );
}
