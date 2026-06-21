export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#02030A]" />

      <div
        data-animate="aurora"
        className="absolute -inset-[35%] blur-3xl opacity-60 mix-blend-screen will-change-transform"
        style={{
          background:
            "radial-gradient(circle at 20% 25%, rgba(16, 185, 129, 0.5), transparent 65%), radial-gradient(circle at 78% 18%, rgba(59, 130, 246, 0.45), transparent 60%), radial-gradient(circle at 55% 82%, rgba(45, 212, 191, 0.35), transparent 60%)",
          animation: "aurora-shift 28s ease-in-out infinite alternate",
        }}
      />

      <div
        data-animate="grid"
        className="absolute inset-0 opacity-30 mix-blend-screen"
        style={{
          backgroundImage: "radial-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 0)",
          backgroundSize: "120px 120px",
          animation: "grid-fade 26s linear infinite",
        }}
      />

      <div
        data-animate="pulse"
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, rgba(16, 185, 129, 0.12), transparent 68%)",
          animation: "pulse-glow 22s ease-in-out infinite alternate",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div
        data-animate="glow"
        className="absolute inset-x-0 top-0 h-[45vh]"
        style={{
          background: "radial-gradient(circle at top, rgba(59, 130, 246, 0.18), transparent 70%)",
          filter: "blur(45px)",
          opacity: 0.65,
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-[35vh] bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
    </div>
  )
}
