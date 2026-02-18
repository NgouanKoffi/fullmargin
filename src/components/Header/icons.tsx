export type IconProps = {
    className?: string;
    title?: string;
  };
  
  /* Utilitaire a11y: si title -> role="img", sinon aria-hidden */
  function a11y(title?: string) {
    return {
      role: title ? "img" : undefined,
      "aria-hidden": title ? undefined : true,
    } as const;
  }
  
  export const ChevronDown = ({ className = "w-4 h-4", title }: IconProps) => (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.16l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18z"/>
    </svg>
  );
  
  export const Globe = ({ className = "w-5 h-5", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z" strokeWidth="1.6"/>
      <path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" strokeWidth="1.2"/>
    </svg>
  );
  
  export const Cart = ({ className = "w-6 h-6", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h8.7a2 2 0 0 0 2-1.6L22 8H6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  export const Bars = ({ className = "w-7 h-7", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  );
  
  export const Close = ({ className = "w-7 h-7", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18"/>
    </svg>
  );
  
  export const User = ({ className = "w-6 h-6", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path d="M20 21a8 8 0 1 0-16 0" strokeWidth="1.6"/>
      <circle cx="12" cy="7" r="4" strokeWidth="1.6"/>
    </svg>
  );
  
  export const Heart = ({ className = "w-5 h-5", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" strokeWidth="1.6"/>
    </svg>
  );
  
  export const Package = ({ className = "w-5 h-5", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z" strokeWidth="1.6"/>
      <path d="M3.3 7L12 12l8.7-5M12 22V12" strokeWidth="1.6"/>
    </svg>
  );
  
  export const Store = ({ className = "w-5 h-5", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path d="M3 9l1-5h16l1 5" strokeWidth="1.6"/>
      <path d="M5 9v11h14V9" strokeWidth="1.6"/>
      <path d="M9 13h6v7H9z" strokeWidth="1.6"/>
    </svg>
  );
  
  export const Bell = ({ className = "w-5 h-5", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path d="M6 8a6 6 0 0 1 12 0v5l2 2H4l2-2Z" strokeWidth="1.6"/>
      <path d="M10 21h4" strokeWidth="1.6"/>
    </svg>
  );
  
  export const Note = ({ className = "w-5 h-5", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="1.6"/>
      <path d="M8 7h8M8 11h8M8 15h5" strokeWidth="1.6"/>
    </svg>
  );
  
  export const Mic = ({ className = "w-5 h-5", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <rect x="9" y="2" width="6" height="11" rx="3" strokeWidth="1.6"/>
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 19v3" strokeWidth="1.6"/>
    </svg>
  );
  
  export const Chart = ({ className = "w-5 h-5", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path d="M3 3v18h18" strokeWidth="1.6"/>
      <path d="M7 14l4-4 3 3 5-6" strokeWidth="1.6"/>
    </svg>
  );
  
  export const Book = ({ className = "w-5 h-5", title }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="1.6"/>
      <path d="M6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5v-13A2.5 2.5 0 0 1 6.5 2z" strokeWidth="1.6"/>
    </svg>
  );
  
  export const Help = ({ className = "w-6 h-6", title = "Support" }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      {/* Arceau */}
      <path d="M4.5 12a7.5 7.5 0 0 1 15 0" strokeWidth="1.6" strokeLinecap="round" />
      {/* Oreillettes */}
      <rect x="3" y="11" width="4.6" height="6.6" rx="2.3" strokeWidth="1.6" />
      <rect x="16.4" y="11" width="4.6" height="6.6" rx="2.3" strokeWidth="1.6" />
      {/* Micro */}
      <path d="M7 18.5a3.5 3.5 0 0 0 3.5 3.5h2.5" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="13.5" cy="22" r="1" fill="currentColor" />
    </svg>
  );


  
  export const CloseCircle = ({ className = "w-6 h-6", title = "Fermer" }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      {...a11y(title)}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
      <path d="M9 9l6 6M15 9l-6 6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );  