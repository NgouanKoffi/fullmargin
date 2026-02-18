import { useEffect, useRef } from "react";

export default function Sparkline({
  points,
  height = 120,
}: {
  points: { x: number; y: number }[];
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const el = ref.current;
      if (!el) return;
      const w = el.parentElement?.clientWidth ?? 480;
      el.width = Math.max(240, w);
      el.height = height;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, el.width, el.height);

      ctx.strokeStyle = "rgba(148,163,184,0.15)";
      for (let i = 1; i < 6; i++) {
        const x = (i * el.width) / 6;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, el.height);
        ctx.stroke();
      }
      for (let j = 1; j < 4; j++) {
        const y = (j * el.height) / 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(el.width, y);
        ctx.stroke();
      }

      if (points.length < 1) return;

      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const pad = 8;

      const sx = (x: number) =>
        pad +
        (maxX === minX
          ? 0
          : ((x - minX) / (maxX - minX)) * (el.width - pad * 2));
      const sy = (y: number) =>
        el.height -
        pad -
        (maxY === minY
          ? 0
          : ((y - minY) / (maxY - minY)) * (el.height - pad * 2));

      ctx.beginPath();
      ctx.moveTo(sx(points[0].x), sy(points[0].y));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(sx(points[i].x), sy(points[i].y));
      }
      ctx.lineTo(sx(points[points.length - 1].x), el.height - pad);
      ctx.lineTo(sx(points[0].x), el.height - pad);
      ctx.closePath();
      ctx.fillStyle = "rgba(16,185,129,0.12)";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx(points[0].x), sy(points[0].y));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(sx(points[i].x), sy(points[i].y));
      }
      ctx.strokeStyle = "rgb(16,185,129)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const last = points[points.length - 1];
      ctx.fillStyle = "rgb(16,185,129)";
      ctx.beginPath();
      ctx.arc(sx(last.x), sy(last.y), 3.5, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [points, height]);

  return (
    <canvas ref={ref} style={{ display: "block", width: "100%", height }} />
  );
}
