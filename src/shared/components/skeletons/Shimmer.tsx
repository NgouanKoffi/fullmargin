export const ShimmerStyle = () => (
  <style>{`
    @keyframes fm-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    .fm-shimmer {
      background: linear-gradient(
        90deg,
        rgba(148,163,184,0.12) 0%,
        rgba(148,163,184,0.22) 50%,
        rgba(148,163,184,0.12) 100%
      );
      background-size: 600px 100%;
      animation: fm-shimmer 1.4s ease-in-out infinite;
    }
    .dark .fm-shimmer {
      background: linear-gradient(
        90deg,
        rgba(30,41,59,0.25) 0%,
        rgba(30,41,59,0.45) 50%,
        rgba(30,41,59,0.25) 100%
      );
      background-size: 600px 100%;
      animation: fm-shimmer 1.4s ease-in-out infinite;
    }
  `}</style>
);
