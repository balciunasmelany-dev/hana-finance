export function CherryBlossom({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <ellipse cx="10" cy="5" rx="2.5" ry="4" fill="#FFB7C5" transform="rotate(0 10 10)" />
      <ellipse cx="10" cy="5" rx="2.5" ry="4" fill="#FFB7C5" transform="rotate(72 10 10)" />
      <ellipse cx="10" cy="5" rx="2.5" ry="4" fill="#FFB7C5" transform="rotate(144 10 10)" />
      <ellipse cx="10" cy="5" rx="2.5" ry="4" fill="#FFB7C5" transform="rotate(216 10 10)" />
      <ellipse cx="10" cy="5" rx="2.5" ry="4" fill="#FFB7C5" transform="rotate(288 10 10)" />
      <circle cx="10" cy="10" r="2" fill="#C9920A" />
    </svg>
  )
}
