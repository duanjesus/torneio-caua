// Ícones de traço simples (no estilo Lucide), desenhados aqui para não depender de emoji,
// que muda de cara em cada celular.

type P = { className?: string };
const base = (className = "size-5") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const IconeCalendario = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const IconeRelogio = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const IconeLocal = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const IconeCopo = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 4h14l-1.5 16a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2Z" />
    <path d="M5.5 9h13" />
  </svg>
);

export const IconeBola = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="10" />
    <path d="m12 7 4 3-1.5 4.5h-5L8 10Z" />
    <path d="M12 7V2.5M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5 7 18.5M8 10 3.5 8.5" />
  </svg>
);

export const IconeSeta = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
