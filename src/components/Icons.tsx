import type { CSSProperties } from "react";

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

const base = (size: number, className?: string, style?: CSSProperties) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  style,
  "aria-hidden": true,
});

export const PlayIcon = ({ size = 18, className, strokeWidth = 2 , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={strokeWidth}>
    <path d="M7 4.5 19 12 7 19.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const ArrowRight = ({ size = 18, className, strokeWidth = 1.8 , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={strokeWidth}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

export const ArrowLeft = ({ size = 18, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.8}>
    <path d="M20 12H4M10 6l-6 6 6 6" />
  </svg>
);

export const CarIcon = ({ size = 20, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.5}>
    <path d="M3 13.5 5 8l2.2-2.6A2 2 0 0 1 8.7 4.6h6.6a2 2 0 0 1 1.5.8L19 8l2 5.5v3.2a1 1 0 0 1-1 1h-1.4" />
    <path d="M3 13.5v3.2a1 1 0 0 0 1 1h1.4M9 17.7h6M3.5 13.5h17" />
    <circle cx="7.2" cy="17.7" r="1.6" />
    <circle cx="16.8" cy="17.7" r="1.6" />
  </svg>
);

export const TrackIcon = ({ size = 20, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.5}>
    <path d="M5.5 19.5C2.7 17.8 3.3 14 6.5 12.7c2-.8 3.8.2 5.5 1 2.3 1 4.6.3 5.7-1.9 1.5-3.1-1.2-6.1-4.4-6.1-2.2 0-3.8 1.1-4.6 2.8" />
    <path d="M18.7 4.3c3 2.1 2.8 6.2-.5 7.7-2 .9-4-.1-5.7-1-2.2-1-4.5-.2-5.6 2" />
    <path d="M2.8 8.5 5.5 8M18.7 4.3 21 7.2M7 19.8l1.8 1.2M15.5 18l2.3-2.5" />
  </svg>
);

export const SettingsIcon = ({ size = 20, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.6}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.87 2.87-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H8.5v-.1A1.7 1.7 0 0 0 7.4 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06-2.87-2.87.06-.06A1.7 1.7 0 0 0 3 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H1V8.5h.3A1.7 1.7 0 0 0 3 7.4a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.87-2.87.06.06A1.7 1.7 0 0 0 7.4 3 1.7 1.7 0 0 0 8.4 2.4 1.7 1.7 0 0 0 8.8 1.3V1h6.4v.3A1.7 1.7 0 0 0 16.6 3a1.7 1.7 0 0 0 1.87-.34l.06-.06 2.87 2.87-.06.06A1.7 1.7 0 0 0 21 7.4a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.3v6.4h-.3a1.7 1.7 0 0 0-1.3 1.3Z" transform="translate(0.2 0.9) scale(0.93)" />
  </svg>
);

export const VolumeIcon = ({ size = 20, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.7}>
    <path d="M11 5 6.5 8.5H3v7h3.5L11 19z" />
    <path d="M15 8.5a5 5 0 0 1 0 7M17.7 5.8a9 9 0 0 1 0 12.4" />
  </svg>
);

export const MuteIcon = ({ size = 20, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.7}>
    <path d="M11 5 6.5 8.5H3v7h3.5L11 19zM15.5 9l5 6M20.5 9l-5 6" />
  </svg>
);

export const PauseIcon = ({ size = 18, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={0}>
    <rect x="6" y="5" width="3.6" height="14" fill="currentColor" />
    <rect x="14.4" y="5" width="3.6" height="14" fill="currentColor" />
  </svg>
);

export const RestartIcon = ({ size = 18, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.8}>
    <path d="M3 5v6h6" />
    <path d="M3.6 11a9 9 0 1 1 .8 5" />
  </svg>
);

export const HomeIcon = ({ size = 18, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.7}>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 9.5V21h14V9.5M9.5 21v-6h5v6" />
  </svg>
);

export const TrophyIcon = ({ size = 22, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.5}>
    <path d="M7 4h10v4.5a5 5 0 0 1-10 0zM7 5.5H3.5V7A3.5 3.5 0 0 0 7 10.5M17 5.5h3.5V7A3.5 3.5 0 0 1 17 10.5M12 13.5V18M8 21h8M9.5 18h5" />
  </svg>
);

export const FlagIcon = ({ size = 20, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.5}>
    <path d="M5 21V4M5 5h9M5 10h13M5 15h8" />
    <path d="M14 5v5M18 10v5" />
  </svg>
);

export const BoltIcon = ({ size = 20, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.5}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
  </svg>
);

export const ChevronIcon = ({ size = 16, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.8}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const InfoIcon = ({ size = 18, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.7}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.6v.8" />
  </svg>
);

export const GaugeIcon = ({ size = 18, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.6}>
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="m12 14 4-4" />
    <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const FullscreenIcon = ({ size = 18, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.7}>
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </svg>
);

export const CloseIcon = ({ size = 18, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.8}>
    <path d="m5 5 14 14M19 5 5 19" />
  </svg>
);

export const CheckIcon = ({ size = 16, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={2.2}>
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
);

export const DriftIcon = ({ size = 18, className , style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.6}>
    <path d="M4 17c4.5 0 6-3 8-6s4-5 8-5M17 3l3 3-3 3M4 21c4.5 0 6-2 8-4" />
  </svg>
);

export const MailIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const PortfolioIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <rect x="2.5" y="3.5" width="19" height="17" rx="2" />
    <path d="M2.5 8.5h19M7 3.5v5M12 3.5v5" />
    <path d="M6.5 12.5h5M6.5 16h8" />
  </svg>
);

export const InstagramIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const SparkIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.6}>
    <path d="M12 2.5 14 9l6.5 2L14 13l-2 6.5L10 13 3.5 11 10 9z" />
    <path d="M19 3v3M17.5 4.5h3M5 18v3M3.5 19.5h3" />
  </svg>
);

export const CameraIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.7}>
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8l1.4-2h5.2L16 6h2.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
    <circle cx="12" cy="12.5" r="3.4" />
  </svg>
);

export const KeyIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.6}>
    <circle cx="8" cy="8" r="4.2" />
    <path d="m11 11 8 8M16 16l2.5-2.5M13.5 13.5 16 11" />
  </svg>
);

export const GearIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.6}>
    <path d="M12 3v18M5 7l14 10M19 7 5 17" />
    <circle cx="12" cy="12" r="2.2" />
  </svg>
);

export const WeatherIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.6}>
    <path d="M7 14a3.5 3.5 0 1 1 .7-6.9A5 5 0 0 1 17 8a3.5 3.5 0 0 1 0 7H8" />
    <path d="M8.5 18.5 7.5 21M12 18.5 11 21M15.5 18.5 14.5 21" />
  </svg>
);

export const FuelIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.6}>
    <path d="M4 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M3 21h12M4 10h9" />
    <path d="M16 8h1.5a2 2 0 0 1 2 2v6a1.6 1.6 0 0 0 3.2 0V9l-2.2-3" />
  </svg>
);

export const WrenchIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.6}>
    <path d="M14.5 6.5a4 4 0 0 0 5 5L21 10l-7-7-1.5.5v3z" />
    <path d="m14 7-9.5 9.5a2.2 2.2 0 0 0 3 3L17 10" />
  </svg>
);

export const GitHubIcon = ({ size = 18, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.13c-3.2.7-3.88-1.36-3.88-1.36-.52-1.32-1.28-1.67-1.28-1.67-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

export const ExternalLinkIcon = ({ size = 16, className, style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.8}>
    <path d="M14 4h6v6M20 4 10 14" />
    <path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
  </svg>
);

export const PlayCircleIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8.5 5.5 3.5L10 15.5Z" fill="currentColor" stroke="none" />
  </svg>
);
