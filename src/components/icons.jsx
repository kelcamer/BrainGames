// Small line-icons for each game card. Plain inline SVG, colored via currentColor
// so a single CSS custom property (--r) drives both the card accent and the icon.

export function FlashFocusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </svg>
  );
}

export function ToneTraceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h2l2-7 3 14 3-11 2 4h5" />
    </svg>
  );
}

export function MotorChainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8 17 16 8M12 8h4v4" />
    </svg>
  );
}

export function WordBlitzIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M14 4v5h5M8 13h8M8 16.5h5" />
    </svg>
  );
}

export function TraceMapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17M15 3.5v17" />
      <circle cx="6.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TraceMapHardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17M15 3.5v17" />
    </svg>
  );
}

export function RhythmRecallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v6c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
      <path d="M9 12.5 12 10l3 2.5" />
    </svg>
  );
}

export function MagicNumberIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
      <path d="M7.5 10.5v3M7.5 10.5h1.4M7.5 13.5h1.4M12 10.5v3M15.5 10.5l1.6 3 1.6-3" strokeLinecap="round" />
    </svg>
  );
}

export function ConstellationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="14" cy="4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="20" cy="10" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="7" cy="15" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M4 6 14 4 20 10M7 15 17 18 10 20" strokeDasharray="1.5 2.2" />
    </svg>
  );
}

export function BlockBuilderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3 19 7v10l-7 4-7-4V7l7-4Z" />
      <path d="M12 3v8M12 11l7-4M12 11l-7-4" />
      <path d="M12 11v10" />
    </svg>
  );
}

export function GoNoGoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="12" r="4" />
      <path d="M15 16 L20 7 L20.2 7 L15.2 16 Z M14.5 16.5h6" strokeLinejoin="round" />
    </svg>
  );
}

export function NBackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="5" height="8" rx="1" />
      <rect x="9.5" y="8" width="5" height="8" rx="1" />
      <rect x="16" y="8" width="5" height="8" rx="1" />
      <path d="M18.5 5.5 A6 6 0 0 0 6 6" strokeLinecap="round" />
      <path d="M6 4 L6 6.4 L8.4 6.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TaskSwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h11l-3-3 M20 16H9l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WordRushIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 7 L9 17 L13 7 M15 7 v10 M15 7 h4 M15 12 h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EbbFlowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 15c3.5-8 12.5-8 16 0-3.5 5-12.5 5-16 0Z" />
      <path d="M4 15c4 2.5 12 2.5 16 0" />
      <path d="M2.5 15H4" strokeLinecap="round" />
    </svg>
  );
}

export function WayfinderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v18" strokeLinecap="round" />
      <path d="M12 5h6l2 2-2 2h-6z" />
      <path d="M12 11H6l-2 2 2 2h6z" />
      <circle cx="12" cy="21" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const GAME_ICONS = {
  flashfocus: FlashFocusIcon,
  tonetrace: ToneTraceIcon,
  motorchain: MotorChainIcon,
  wordblitz: WordBlitzIcon,
  tracemap: TraceMapIcon,
  tracemaphard: TraceMapHardIcon,
  rhythmrecall: RhythmRecallIcon,
  constellation: ConstellationIcon,
  magicnumber: MagicNumberIcon,
  blockbuilder: BlockBuilderIcon,
  gonogo: GoNoGoIcon,
  nback: NBackIcon,
  taskswitch: TaskSwitchIcon,
  wordrush: WordRushIcon,
  ebbflow: EbbFlowIcon,
  wayfinder: WayfinderIcon,
};
