// src/pages/fm-metrix/components/LoopVideo.tsx
export default function LoopVideo({
  webm,
  mp4,
  label,
  className,
}: {
  webm: string;
  mp4: string;
  label: string;
  className: string;
}) {
  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
    >
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
    </video>
  );
}
