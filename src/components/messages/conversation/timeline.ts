// src/components/messages/timeline.ts
import type { ChatMessage } from "./messages.types";

export type TimelineItem =
  | { kind: "sep"; id: string; label: string }
  | { kind: "msg"; message: ChatMessage };

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function buildTimeline(messages: ChatMessage[]): TimelineItem[] {
  if (!messages.length) return [];

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const timeline: TimelineItem[] = [];
  let lastDateKey: string | null = null;

  for (const m of messages) {
    const d = new Date(m.createdAt);
    const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

    if (dayKey !== lastDateKey) {
      let label = d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      if (sameDay(d, now)) label = "Aujourd’hui";
      else if (sameDay(d, yesterday)) label = "Hier";

      timeline.push({ kind: "sep", id: dayKey, label });
      lastDateKey = dayKey;
    }

    timeline.push({ kind: "msg", message: m });
  }

  return timeline;
}
