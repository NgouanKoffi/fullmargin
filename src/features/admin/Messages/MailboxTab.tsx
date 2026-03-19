// src/pages/admin/Messages/MailboxTab.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Folder } from "./MailboxTab/types";
import TrashPanel from "./MailboxTab/panels/TrashPanel";
import SentPanel from "./MailboxTab/panels/SentPanel";
import InboxPanel from "./MailboxTab/panels/InboxPanel";
import MailTabsBar from "./MailboxTab/MailTabsBar";
import { DEFAULT_FOLDER } from "./MailboxTab/constants";

export default function MailboxTab() {
  const [sp, setSp] = useSearchParams();
  const initialFolder = (sp.get("folder") as Folder) || DEFAULT_FOLDER;
  const [folder, setFolder] = useState<Folder>(initialFolder);

  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set("folder", folder);
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  // Plus de fm-hide-left-rail ici

  const Panel = useMemo(() => {
    switch (folder) {
      case "inbox":
        return InboxPanel;
      case "sent":
        return SentPanel;
      case "trash":
      default:
        return TrashPanel;
    }
  }, [folder]);

  return (
    <div className="space-y-4">
      <MailTabsBar value={folder} onChange={setFolder} />
      <Panel />
    </div>
  );
}
