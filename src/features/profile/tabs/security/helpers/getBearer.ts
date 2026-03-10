export default function getBearer(): string {
    try {
      const raw = localStorage.getItem("fm:session");
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.token) return `Bearer ${s.token}`;
      }
      const t = localStorage.getItem("fm:token");
      return t ? `Bearer ${t}` : "";
    } catch {
      return "";
    }
  }
  