// src/pages/communaute/private/community-details/tabs/PostComposer/Trigger.tsx

import { loadSession } from "../../../../../../auth/lib/storage";
import { requireAuthThen, getAvatarFromSession } from "./helpers";
import type { SessionShape } from "./types";

export default function Trigger({ onOpen }: { onOpen: () => void }) {
  const session = (loadSession() ?? null) as SessionShape;
  const avatarUrl = getAvatarFromSession(session);

  return (
    <div className="rounded-2xl bg-white/70 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-3 sm:p-4 md:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <img
          src={avatarUrl}
          alt="Votre avatar"
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover shrink-0"
          loading="lazy"
          decoding="async"
        />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value=""
            readOnly
            placeholder="Quoi de neuf ? (cliquer pour écrire…)"
            onFocus={(e) => {
              e.currentTarget.blur();
              requireAuthThen(onOpen, "signin");
            }}
            onClick={(e) => {
              e.preventDefault();
              requireAuthThen(onOpen, "signin");
            }}
            className="w-full h-10 rounded-xl px-3.5 bg-transparent outline-none text-sm sm:text-[15px] placeholder:text-slate-400 dark:placeholder:text-slate-500 ring-1 ring-black/10 dark:ring-white/10 cursor-text"
          />
        </div>
      </div>
    </div>
  );
}
