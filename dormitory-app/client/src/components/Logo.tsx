export default function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  // Placeholder mark following Section VIII of the spec (gold circle, green field, eagle motif)
  // until the official UPH College logo asset (PNG/SVG) is supplied.
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="UPH College">
      <circle cx="32" cy="32" r="30" fill="#BD8C00" />
      <circle cx="32" cy="32" r="24" fill="#00504C" />
      <path d="M20 38 L32 20 L44 38 Z" fill="#FFBF00" />
      <rect x="24" y="38" width="16" height="6" rx="1" fill="#FFBF00" />
    </svg>
  );
}
