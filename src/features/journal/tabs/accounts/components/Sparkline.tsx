import { useEffect, useRef } from "react";

export default function Sparkline({
  points,
  className,
  height = 160,
}: {
  points: Array<{ x: number; y: number }>;
  className?: string;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const el = ref.current;
      if (!el) return;

      const w = el.parentElement?.clientWidth ?? 540;
      el.width = Math.max(200, w);
      el.height = height;

      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, el.width, el.height);

      ctx.strokeStyle = "rgba(148,163,184,0.15)";
      ctx.lineWidth = 1;
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

      if (points.length < 2) return;

      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs),
        maxX = Math.max(...xs);
      const minY = Math.min(...ys),
        maxY = Math.max(...ys);
      const pad = 8;

      const scaleX = (x: number) =>
        pad +
        (maxX === minX
          ? 0
          : ((x - minX) / (maxX - minX)) * (el.width - pad * 2));
      const scaleY = (y: number) =>
        el.height -
        pad -
        (maxY === minY
          ? 0
          : ((y - minY) / (maxY - minY)) * (el.height - pad * 2));

      ctx.beginPath();
      ctx.moveTo(scaleX(points[0].x), scaleY(points[0].y));
      for (let i = 1; i < points.length; i++)
        ctx.lineTo(scaleX(points[i].x), scaleY(points[i].y));
      ctx.lineTo(scaleX(points[points.length - 1].x), el.height - pad);
      ctx.lineTo(scaleX(points[0].x), el.height - pad);
      ctx.closePath();
      ctx.fillStyle = "rgba(16,185,129,0.12)";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(scaleX(points[0].x), scaleY(points[0].y));
      for (let i = 1; i < points.length; i++)
        ctx.lineTo(scaleX(points[i].x), scaleY(points[i].y));
      ctx.strokeStyle = "rgba(16,185,129,1)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const last = points[points.length - 1];
      ctx.fillStyle = "rgba(16,185,129,1)";
      ctx.beginPath();
      ctx.arc(scaleX(last.x), scaleY(last.y), 3.5, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [points, height]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ display: "block", width: "100%", height }}
    />
  );
}
