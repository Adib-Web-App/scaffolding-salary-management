export default function BrandIcon({ className = 'h-5 w-5', strokeWidth = 2 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5M3.75 9.75h16.5M5.25 6.75h13.5M8.25 3.75h7.5M12 3.75v3M6.75 9.75v11.25M17.25 9.75v11.25"
      />
    </svg>
  );
}
