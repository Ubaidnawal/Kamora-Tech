const items = [
  "Web Development",
  "Custom Software",
  "Business Automation",
  "Digital Strategy",
  "E-Commerce",
  "Management Systems",
];

export function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-[#e5e5e5] bg-[#FFFFFF]" aria-label="Our capabilities">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#FFFFFF] to-transparent sm:w-24" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#FFFFFF] to-transparent sm:w-24" aria-hidden="true" />
      <div className="marquee-track flex w-max animate-marquee items-center py-5">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {items.map((item) => (
              <span key={item} className="flex items-center">
                <span className="font-condense text-lg tracking-[0.12em] text-[#333333] sm:text-xl">
                  {item}
                </span>
                <span className="mx-6 h-1.5 w-1.5 rotate-45 bg-brass sm:mx-10" aria-hidden="true" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
