import { useEffect, useState } from "react";
import type { Currency } from "../../../types";
import { fmtMoney } from "../../../utils";
import { classNames, toDecimalInput } from "./helpers";
import type { Option } from "../../../types";

type CommitFn<T> = (next: T) => void;

/* ---------- texte simple (inline) ---------- */
export function EditableText({
  value,
  onCommit,
  placeholder,
  canEdit,
  className,
  width,
}: {
  value: string | undefined;
  onCommit: CommitFn<string>;
  placeholder?: string;
  canEdit: boolean;
  className?: string;
  width?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  useEffect(() => setVal(value || ""), [value]);

  // affichage (non éditable)
  if (!canEdit) {
    return (
      <div
        title={value}
        className={classNames("w-full text-center", className)}
        style={width ? { width } : {}}
      >
        <span className="block truncate">{value || "—"}</span>
      </div>
    );
  }

  // mode édition
  return editing ? (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (val !== (value || "")) onCommit(val);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setVal(value || "");
          setEditing(false);
        }
      }}
      placeholder={placeholder}
      className={classNames(
        "h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 w-full",
        className
      )}
      style={width ? { width } : {}}
    />
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={classNames(
        "inline-flex items-center justify-center text-center h-8 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 w-full",
        className
      )}
      style={width ? { width } : {}}
      title={value}
    >
      <span className="block truncate w-full">{value || "—"}</span>
    </button>
  );
}

/* ---------- textarea (grand) ---------- */
export function EditableTextarea({
  value,
  onCommit,
  placeholder,
  canEdit,
  className,
  width = 240,
  rows = 4,
}: {
  value: string | undefined;
  onCommit: CommitFn<string>;
  placeholder?: string;
  canEdit: boolean;
  className?: string;
  width?: number;
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  useEffect(() => setVal(value || ""), [value]);

  if (!canEdit) {
    return (
      <div
        title={value}
        className={classNames("w-full text-center", className)}
        style={{ width }}
      >
        <span className="block truncate">{value || "—"}</span>
      </div>
    );
  }

  return editing ? (
    <div className="relative w-[420px] max-w-[90vw]">
      <textarea
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (val !== (value || "")) onCommit(val);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setVal(value || "");
            setEditing(false);
          }
        }}
        rows={rows}
        placeholder={placeholder}
        className={classNames(
          "w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm",
          className
        )}
      />
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={classNames(
        "inline-flex items-center justify-center text-center h-8 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 w-full",
        className
      )}
      style={{ width }}
      title={value}
    >
      <span className="block truncate w-full">
        {value && value.trim().length > 0 ? value : "Ajouter un commentaire…"}
      </span>
    </button>
  );
}

/* ---------- nombre ---------- */
export function EditableNumber({
  value,
  onCommit,
  canEdit,
  decimals = 2,
  allowNegative = false,
  width = 120,
  className,
}: {
  value: string | number | undefined;
  onCommit: CommitFn<string>;
  canEdit: boolean;
  decimals?: number;
  allowNegative?: boolean;
  width?: number;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(
    typeof value === "number" ? String(value) : value || ""
  );
  useEffect(() => {
    setVal(typeof value === "number" ? String(value) : value || "");
  }, [value]);

  if (!canEdit) {
    return (
      <div
        className={classNames("w-full text-center tabular-nums", className)}
        style={{ width }}
      >
        {typeof value === "string" || typeof value === "number"
          ? String(value)
          : "—"}
      </div>
    );
  }

  return editing ? (
    <input
      autoFocus
      inputMode="decimal"
      value={val}
      onChange={(e) =>
        setVal(toDecimalInput(e.target.value, decimals, allowNegative))
      }
      onBlur={() => {
        setEditing(false);
        const normalized = toDecimalInput(val, decimals, allowNegative)
          .replace(/\.$/, "")
          .trim();
        if (
          normalized !==
          (typeof value === "string" ? value : String(value ?? ""))
        ) {
          onCommit(normalized);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setVal(typeof value === "number" ? String(value) : value || "");
          setEditing(false);
        }
      }}
      className={classNames(
        "h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 tabular-nums w-full text-center",
        className
      )}
      style={{ width }}
    />
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={classNames(
        "inline-flex items-center justify-center h-8 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 tabular-nums w-full",
        className
      )}
      style={{ width }}
      title={
        typeof value === "string" || typeof value === "number"
          ? String(value)
          : ""
      }
    >
      {typeof value === "string" || typeof value === "number"
        ? String(value)
        : "—"}
    </button>
  );
}

/* ---------- argent ---------- */
export function EditableMoney({
  value,
  currency,
  onCommit,
  canEdit,
  decimals = 2,
  allowNegative = false,
  width = 140,
  className,
  positiveClass,
  negativeClass,
}: {
  value: string | number | undefined;
  currency: Currency;
  onCommit: CommitFn<string>;
  canEdit: boolean;
  decimals?: number;
  allowNegative?: boolean;
  width?: number;
  className?: string;
  positiveClass?: string;
  negativeClass?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(
    typeof value === "number" ? String(value) : value || ""
  );
  useEffect(() => {
    setVal(typeof value === "number" ? String(value) : value || "");
  }, [value]);

  // affichage
  if (!canEdit) {
    const num = Number(String(value ?? "").replace(",", "."));
    const tone =
      Number.isFinite(num) && num < 0
        ? negativeClass ||
          "text-rose-400 dark:text-rose-300 font-medium tabular-nums"
        : positiveClass || "text-slate-50 font-medium tabular-nums";
    const forcedCenter =
      className && className.includes("text-center")
        ? "text-center"
        : "text-right";

    return (
      <div
        className={classNames(className, forcedCenter, tone)}
        style={{ width }}
        title={
          Number.isFinite(num) ? fmtMoney(num, currency) : String(value ?? "")
        }
      >
        {Number.isFinite(num) ? fmtMoney(num, currency) : value || "—"}
      </div>
    );
  }

  // édition
  const wantsCenter =
    className?.includes("text-center") || className?.includes("mx-auto");

  return editing ? (
    <input
      autoFocus
      inputMode="decimal"
      value={val}
      onChange={(e) =>
        setVal(toDecimalInput(e.target.value, decimals, allowNegative))
      }
      onBlur={() => {
        setEditing(false);
        const normalized = toDecimalInput(val, decimals, allowNegative)
          .replace(/\.$/, "")
          .trim();
        if (
          normalized !==
          (typeof value === "string" ? value : String(value ?? ""))
        ) {
          onCommit(normalized);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setVal(typeof value === "number" ? String(value) : value || "");
          setEditing(false);
        }
      }}
      className={classNames(
        "h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 tabular-nums w-full",
        wantsCenter ? "text-center" : "text-right",
        className
      )}
      style={{ width }}
    />
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={classNames(
        "inline-flex items-center h-8 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 tabular-nums w-full",
        wantsCenter ? "justify-center" : "justify-end",
        className
      )}
      style={{ width }}
      title={String(value ?? "")}
    >
      {(() => {
        const num = Number(String(value ?? "").replace(",", "."));
        return Number.isFinite(num) ? fmtMoney(num, currency) : value || "—";
      })()}
    </button>
  );
}

/* ---------- date ---------- */
export function EditableDate({
  value,
  onCommit,
  canEdit,
  width = 140,
  className,
}: {
  value: string | undefined;
  onCommit: CommitFn<string>;
  canEdit: boolean;
  width?: number;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  useEffect(() => setVal(value || ""), [value]);

  if (!canEdit) {
    return (
      <div
        className={classNames("w-full text-center", className)}
        style={{ width }}
      >
        {val || "—"}
      </div>
    );
  }
  return editing ? (
    <input
      type="date"
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (val !== (value || "")) onCommit(val);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setVal(value || "");
          setEditing(false);
        }
      }}
      className={classNames(
        "h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 w-full text-center",
        className
      )}
      style={{ width }}
    />
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={classNames(
        "inline-flex items-center justify-center h-8 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 w-full",
        className
      )}
      style={{ width }}
      title={value}
    >
      {val || "—"}
    </button>
  );
}

/* ---------- select simple ---------- */
export function EditableSelect({
  value,
  options,
  onCommit,
  canEdit,
  width = 160,
  className,
}: {
  value: string | undefined;
  options: ReadonlyArray<string>;
  onCommit: CommitFn<string>;
  canEdit: boolean;
  width?: number;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  useEffect(() => setVal(value || ""), [value]);

  if (!canEdit) {
    return (
      <div
        className={classNames("w-full text-center", className)}
        style={{ width }}
      >
        {value || "—"}
      </div>
    );
  }

  return editing ? (
    <select
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (val !== (value || "")) onCommit(val);
      }}
      className={classNames(
        "h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 w-full text-center",
        className
      )}
      style={{ width }}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={classNames(
        "inline-flex items-center justify-center h-8 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 w-full",
        className
      )}
      style={{ width }}
      title={value}
    >
      <span className="block truncate w-full text-center">{value || "—"}</span>
    </button>
  );
}

/* ---------- select id/name ---------- */
export function EditableSelectKV({
  value,
  options,
  onCommit,
  canEdit,
  width = 200,
  className,
}: {
  value: string | undefined;
  options: ReadonlyArray<Option>;
  onCommit: CommitFn<{ id: string; name: string }>;
  canEdit: boolean;
  width?: number;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [id, setId] = useState(value || "");
  useEffect(() => setId(value || ""), [value]);

  const display = options.find((o) => o.id === (value || ""))?.name || "—";

  if (!canEdit) {
    return (
      <div
        className={classNames("w-full text-center", className)}
        style={{ width }}
      >
        <span className="block truncate">{display}</span>
      </div>
    );
  }

  return editing ? (
    <select
      autoFocus
      value={id}
      onChange={(e) => setId(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (id !== (value || "")) {
          const opt = options.find((o) => o.id === id);
          if (opt) onCommit({ id: opt.id, name: opt.name });
        }
      }}
      className={classNames(
        "h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 w-full text-center",
        className
      )}
      style={{ width }}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={classNames(
        "inline-flex items-center justify-center h-8 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 w-full",
        className
      )}
      style={{ width }}
      title={display}
    >
      <span className="block truncate w-full text-center">{display}</span>
    </button>
  );
}
