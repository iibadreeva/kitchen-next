export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle
        cx="20"
        cy="20"
        r="19"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.35"
      />
      <path
        d="M12 16.5c0-2.2 2.6-4 5.8-4h4.4c3.2 0 5.8 1.8 5.8 4v1.2c0 .7-.4 1.3-1 1.6l-1.2.6v6.1c0 1.7-1.8 3-4.1 3h-4.4c-2.3 0-4.1-1.3-4.1-3v-6.1l-1.2-.6c-.6-.3-1-.9-1-1.6V16.5Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M16 14.2c.8-1.4 2.4-2.3 4-2.3s3.2.9 4 2.3"
        stroke="var(--kitchen-porcelain)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="20" cy="11" r="1.35" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
