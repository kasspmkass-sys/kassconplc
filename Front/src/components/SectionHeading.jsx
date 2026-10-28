export default function SectionHeading({
  kicker,
  title,
  lead,
  dark = false,
  id,
  className = '',
}) {
  return (
    <div className={`max-w-3xl ${className}`.trim()}>
      {kicker && (
        <div className="flex items-center gap-3 mb-5">
          <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
          <p
            className={`editorial-eyebrow `}
            id={id}
          >
            {kicker}
          </p>
        </div>
      )}
      {title && (
        <h2 className={`editorial-title ${dark ? '!text-white' : ''}`}>{title}</h2>
      )}
      {lead && (
        <p
          className={`mt-5 text-base sm:text-lg leading-relaxed max-w-2xl ${
            dark ? 'text-white/65' : 'text-slate-600'
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
