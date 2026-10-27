// Les 30 juz en cercle : un trait par juz, coloré selon l'état. Les juz de la personne sont plus longs.
export default function Ring({ cells, mine = [], children }: { cells: string[]; mine?: number[]; children?: React.ReactNode }) {
  return (
    <div className="ring">
      <svg viewBox="-110 -110 220 220" role="img" aria-label="Avancement des 30 juz">
        {cells.map((s, i) => {
          const a = (i / 30) * 2 * Math.PI - Math.PI / 2, m = mine.includes(i + 1), r1 = m ? 70 : 82, r2 = 100;
          return <line key={i} className={`t-${s}`} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} strokeWidth={m ? 8 : 6} strokeLinecap="round" />;
        })}
      </svg>
      <div className="ring-c">{children}</div>
    </div>
  );
}
