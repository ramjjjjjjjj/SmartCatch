/**
 * Smart Catch — Duotone SVG Icons
 * White duotone icons with opacity variations for a clean, contrast-rich look
 * against the dark #050D1A background.
 */

/* ─── Utility: white with opacity ─── */
const W = (opacity = 1) => `rgba(255,255,255,${opacity})`;

/* ─── Fish Icon (for logo, floating elements) ─── */
export function FishIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Body fill */}
      <path d="M3 12c0-2.5 3.5-6 9-6s9 3.5 9 6-3.5 6-9 6-9-3.5-9-6z" fill={W(0.1)} />
      {/* Body stroke */}
      <path d="M3.5 12c0-2.2 3.2-5.5 8.5-5.5s8.5 3.3 8.5 5.5-3.2 5.5-8.5 5.5-8.5-3.3-8.5-5.5z" stroke={W(0.85)} strokeWidth="1.4" />
      {/* Tail */}
      <path d="M12 6.5L4.5 12l7.5 5.5" stroke={W(0.85)} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Fin */}
      <path d="M14.5 9.5c1 1 1.5 2 1.5 2.5s-.5 1.5-1.5 2.5" stroke={W(0.4)} strokeWidth="1.2" strokeLinecap="round" />
      {/* Eye */}
      <circle cx="8" cy="11" r="1.2" fill={W(0.9)} />
    </svg>
  );
}

/* ─── Rod & Hook Icon (for Fisher tab) ─── */
export function HookIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Fishing rod */}
      <path d="M3 20c3-4 5-6.5 7-8" stroke={W(0.85)} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 20c0 1 1 1.5 2 1" stroke={W(0.85)} strokeWidth="1.4" strokeLinecap="round" />
      {/* Rod tip */}
      <circle cx="10" cy="12" r="0.8" fill={W(0.85)} />
      {/* Fishing line */}
      <path d="M10 12v3" stroke={W(0.3)} strokeWidth="1" strokeLinecap="round" />
      {/* Hook */}
      <path d="M10 15c0 2.5-2 3.5-4 3.5s-3.5-1.2-3.5-3" stroke={W(0.85)} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Hook barb */}
      <path d="M3 15.5l-1-1" stroke={W(0.85)} strokeWidth="1.3" strokeLinecap="round" />
      {/* Water surface */}
      <path d="M14 19.5c2 1 4 1 6 0" stroke={W(0.2)} strokeWidth="1" strokeLinecap="round" />
      <path d="M12 21c3 1 6 1 9 0" stroke={W(0.12)} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Shop / Store Icon (for Market tab) ─── */
export function ShopIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Roof */}
      <path d="M2 7l10-5 10 5" stroke={W(0.85)} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill={W(0.06)} />
      {/* Building */}
      <rect x="4" y="7" width="16" height="13" rx="1.5" stroke={W(0.85)} strokeWidth="1.4" fill={W(0.04)} />
      {/* Door */}
      <path d="M10 20v-5.5h4V20" stroke={W(0.85)} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill={W(0.08)} />
      {/* Door knob */}
      <circle cx="13" cy="15" r="0.5" fill={W(0.5)} />
      {/* Awning stripes */}
      <path d="M4 10h16" stroke={W(0.2)} strokeWidth="0.8" />
      <rect x="4" y="7" width="16" height="3" rx="0.5" fill={W(0.04)} />
    </svg>
  );
}

/* ─── Map & Pin Icon (for Inspector tab) ─── */
export function MapIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Map shape */}
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={W(0.85)} strokeWidth="1.4" fill={W(0.04)} />
      {/* Grid lines */}
      <path d="M4 9h16M4 15h16M10 3v18M14 3v18" stroke={W(0.12)} strokeWidth="0.8" />
      {/* Location pin */}
      <path d="M12 10.5c-1.4 0-2.5 1.1-2.5 2.5 0 1.7 2.5 4.2 2.5 4.2s2.5-2.5 2.5-4.2c0-1.4-1.1-2.5-2.5-2.5z" stroke={W(0.85)} strokeWidth="1.3" fill={W(0.15)} />
      {/* Pin dot */}
      <circle cx="12" cy="12.5" r="1" fill={W(0.9)} />
    </svg>
  );
}

/* ─── Restaurant / Cutlery Icon (for Restaurant tab) ─── */
export function RestaurantIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Fork */}
      <path d="M7 4v9" stroke={W(0.85)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 4v3.5M9 4v3.5" stroke={W(0.85)} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 13c0 2.5 1.5 4 3 4" stroke={W(0.4)} strokeWidth="1.3" strokeLinecap="round" />
      {/* Knife */}
      <path d="M14 4v9" stroke={W(0.85)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 8c3 0 5 1.5 5 4.5V15" stroke={W(0.4)} strokeWidth="1.3" strokeLinecap="round" />
      {/* Plate line */}
      <path d="M3 19h18" stroke={W(0.15)} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Brain / AI Icon (for AI/Limits tab) ─── */
export function BrainIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Left hemisphere */}
      <path d="M12 3.5c-2.8 0-4.5 1.4-4.5 3.5 0 .9-.3 1.8-.9 2.7-.6.9-.9 2.2-.9 3.6s.9 2.7 2.2 3.6" stroke={W(0.85)} strokeWidth="1.4" strokeLinecap="round" fill={W(0.05)} />
      {/* Right hemisphere */}
      <path d="M12 3.5c2.8 0 4.5 1.4 4.5 3.5 0 .9.3 1.8.9 2.7.6.9.9 2.2.9 3.6s-.9 2.7-2.2 3.6" stroke={W(0.85)} strokeWidth="1.4" strokeLinecap="round" fill={W(0.05)} />
      {/* Center */}
      <path d="M12 3.5v14" stroke={W(0.15)} strokeWidth="0.8" />
      {/* Nodes */}
      <circle cx="9" cy="8" r="1" fill={W(0.5)} />
      <circle cx="15" cy="8" r="1" fill={W(0.5)} />
      <circle cx="8" cy="15" r="1" fill={W(0.4)} />
      <circle cx="16" cy="15" r="1" fill={W(0.4)} />
      {/* Connections */}
      <path d="M9 8l3 4M15 8l-3 4M8 15l4-3M16 15l-4-3" stroke={W(0.2)} strokeWidth="0.7" />
      {/* Bottom */}
      <path d="M9 17.5c1 1.2 2 1.7 3 1.7s2-.5 3-1.7" stroke={W(0.5)} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Profile / Person Icon ─── */
export function ProfileIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Head */}
      <circle cx="12" cy="8" r="4" stroke={W(0.85)} strokeWidth="1.4" fill={W(0.06)} />
      {/* Body */}
      <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" stroke={W(0.85)} strokeWidth="1.4" strokeLinecap="round" fill={W(0.04)} />
      {/* Shoulder line */}
      <path d="M4 20c.5-2.8 4-4.5 8-4.5s7.5 1.7 8 4.5" stroke={W(0.12)} strokeWidth="0.8" />
    </svg>
  );
}

/* ─── Menu / Grid Icon ─── */
export function MenuIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" stroke={W(0.85)} strokeWidth="1.3" fill={W(0.08)} />
      <circle cx="18" cy="6" r="2.5" stroke={W(0.85)} strokeWidth="1.3" fill={W(0.08)} />
      <circle cx="6" cy="18" r="2.5" stroke={W(0.85)} strokeWidth="1.3" fill={W(0.08)} />
      <circle cx="18" cy="18" r="2.5" stroke={W(0.85)} strokeWidth="1.3" fill={W(0.08)} />
    </svg>
  );
}

/* ─── Fish Floating Icon (for login page animation) ─── */
export function FishFloatingIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Body fill */}
      <path d="M4 12c0-2 2.5-5 8-5s8 3 8 5-2.5 5-8 5-8-3-8-5z" fill={W(0.08)} />
      {/* Body stroke */}
      <path d="M4.5 12c0-1.8 2.5-4.5 7.5-4.5s7.5 2.7 7.5 4.5-2.5 4.5-7.5 4.5-7.5-2.7-7.5-4.5z" stroke={W(0.5)} strokeWidth="1.2" />
      {/* Tail */}
      <path d="M12 7.5l-5.5 4.5 5.5 4.5" stroke={W(0.5)} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Eye */}
      <circle cx="8" cy="11" r="0.8" fill={W(0.4)} />
    </svg>
  );
}

/* ─── Map Marker (for inspector map) ─── */
export function MapMarkerIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 4c-3 0-5.5 2.5-5.5 5.5 0 3.5 5.5 10.5 5.5 10.5s5.5-7 5.5-10.5c0-3-2.5-5.5-5.5-5.5z" fill={W(0.15)} stroke={W(0.85)} strokeWidth="1.3" />
      <circle cx="12" cy="10" r="2.5" fill={W(0.9)} />
    </svg>
  );
}

/* ─── Gear / Settings Icon ─── */
export function GearIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke={W(0.85)} strokeWidth="1.4" fill={W(0.06)} />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2" stroke={W(0.3)} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Icon map for easy access ─── */
const ICON_MAP = {
  fish: FishIcon,
  hook: HookIcon,
  shop: ShopIcon,
  map: MapIcon,
  restaurant: RestaurantIcon,
  brain: BrainIcon,
  profile: ProfileIcon,
  menu: MenuIcon,
  fishFloat: FishFloatingIcon,
  marker: MapMarkerIcon,
  gear: GearIcon,
};

export function getDuotoneIcon(name, props = {}) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}

export default ICON_MAP;
