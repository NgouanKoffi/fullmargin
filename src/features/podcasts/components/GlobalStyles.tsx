// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\podcasts\GlobalStyles.tsx
export default function GlobalStyles() {
  return (
    <style>{`
        :root{ --scroll-thumb: rgba(0,0,0,.18); }
        .dark, [data-theme='dark']{ --scroll-thumb: rgba(255,255,255,.25); }
        .scrollbar-stealth{ scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .scrollbar-stealth:hover{ scrollbar-color: var(--scroll-thumb) transparent; }
        .scrollbar-stealth::-webkit-scrollbar{ width: 6px; height: 6px; }
        .scrollbar-stealth::-webkit-scrollbar-track{ background: transparent; }
        .scrollbar-stealth::-webkit-scrollbar-thumb{ background: transparent; border-radius: 9999px; }
        .scrollbar-stealth:hover::-webkit-scrollbar-thumb{ background: var(--scroll-thumb); }
  
        @keyframes eq1{ 0%,100%{height:20%} 50%{height:80%} }
        @keyframes eq2{ 0%,100%{height:35%} 50%{height:65%} }
        @keyframes eq3{ 0%,100%{height:15%} 50%{height:90%} }
        .eqbar{ width:3px; border-radius:9999px; background: currentColor; }
        .eqrun .b1{ animation: eq1 1s ease-in-out infinite; }
        .eqrun .b2{ animation: eq2 1s .1s ease-in-out infinite; }
        .eqrun .b3{ animation: eq3 1s .2s ease-in-out infinite; }
        .eqpaused .b1,.eqpaused .b2,.eqpaused .b3{ animation-play-state: paused; }
      `}</style>
  );
}
