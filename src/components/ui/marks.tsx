export function Monogram() {
  return (
    <svg viewBox="0 0 64 52" aria-label="LM" role="img">
      <path
        d="M7 5v39h18M24 42V15l17 17 17-17v31"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
export function CharacterFallback({label="Criatura roxa de forma dobrada"}:{label?:string}) { return <img data-character-fallback src="/obras/criatura-v2.svg" alt={label} width={260} height={310}/>; }
export function SculptureFallback({
  label = "Escultura de planos dobrados em chumbo e prata",
}: {
  label?: string;
}) {
  return (
    <svg viewBox="0 0 540 540" role="img" aria-label={label}>
      <defs>
        <linearGradient id="silver">
          <stop stopColor="#24272B" />
          <stop offset=".55" stopColor="#F1F3F5" />
          <stop offset="1" stopColor="#A4ABB3" />
        </linearGradient>
        <linearGradient id="lead">
          <stop stopColor="#24272B" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
      </defs>
      <path
        d="M113 68l155 92v307l-155-26Z"
        fill="url(#lead)"
        stroke="#A4ABB3"
      />
      <path d="M113 68l155 92v187l-72-123Z" fill="url(#silver)" />
      <path
        d="M308 200l147-105 15 366-110-23Z"
        fill="url(#silver)"
        stroke="#A4ABB3"
      />
      <path d="M170 257l217 110-236 75Z" fill="url(#lead)" stroke="#C7CDD3" />
      <path d="M170 257l217 110 54 70-290 5Z" fill="url(#silver)" />
    </svg>
  );
}
export function PieceMark({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 120 90"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {index === 7 ? (
        <>
          <path d="M20 72h20V60h15V48h15V36h15V24h15" />
          <circle cx="91" cy="15" r="7" />
        </>
      ) : index === 5 ? (
        <>
          <path d="M20 48L55 20l42 37-60 19 18-56 4 47 38-10" />
          {[
            [20, 48],
            [55, 20],
            [97, 57],
            [37, 76],
            [59, 67],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill="currentColor" />
          ))}
        </>
      ) : index === 4 ? (
        <>
          <path d="M25 70V20l35 36 35-36v50M32 70V36l28 27 28-27v34" />
        </>
      ) : index === 6 ? (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M${25 + i * 6} ${20 + i * 3}l50 12-40 30-10-42Z`}
            />
          ))}
        </>
      ) : index === 3 ? (
        <>
          <ellipse cx="60" cy="45" rx="30" ry="30" />
          <ellipse cx="60" cy="45" rx="13" ry="30" />
          <path d="M30 45h60M38 25l44 40M38 65l44-40" />
        </>
      ) : index === 2 ? (
        <>
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse
              key={i}
              cx={30 + i * 13}
              cy={45 + Math.sin(i) * 8}
              rx="11"
              ry={20 + i * 2}
            />
          ))}
        </>
      ) : index === 1 ? (
        <path d="M60 45C8-25 7 94 53 64C91 24 80-12 64 27C33 81 113 103 103 45C89 4 42 25 60 45Z" />
      ) : (
        <>
          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={
                `M10 ${20 + i * 8}Q40 ${i * 8 - 4}  sixty 40`.replace(
                  " sixty ",
                  " 65 ",
                ) + `T110 ${24 + i * 8}`
              }
            />
          ))}
        </>
      )}
    </svg>
  );
}
