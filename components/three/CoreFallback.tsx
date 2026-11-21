export function CoreFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="relative mx-auto flex h-full w-full items-center justify-center"
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass/[0.1] blur-[70px]" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[86%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-dashed border-white/10" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[64%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07]" />
      <svg
        viewBox="0 0 300 300"
        className={`relative z-10 aspect-square w-[72%] max-w-[400px] animate-float ${compact ? "w-[78%]" : ""}`}
        fill="none"
      >
        <path d="M150 22 268 88v124L150 278 32 212V88L150 22Z" stroke="rgba(139,13,26,0.5)" strokeWidth="1" />
        <path d="M150 22v256M32 88l236 124M268 88 32 212" stroke="rgba(139,13,26,0.2)" strokeWidth="1" />
        <path d="M150 66 224 108v84l-74 42-74-42v-84l74-42Z" fill="rgba(139,13,26,0.06)" stroke="rgba(245,242,237,0.28)" strokeWidth="1" />
        <path d="M150 66v168M76 108l148 84M224 108 76 192" stroke="rgba(245,242,237,0.12)" strokeWidth="1" />
        <circle cx="150" cy="150" r="6" fill="#8B0D1A" />
        <circle cx="268" cy="88" r="3" fill="#8B0D1A" />
        <circle cx="32" cy="212" r="3" fill="#8B0D1A" />
      </svg>
      <div className="absolute inset-0 bg-noise opacity-[0.025]" />
    </div>
  );
}
