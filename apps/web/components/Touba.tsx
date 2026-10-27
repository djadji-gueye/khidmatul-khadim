// La Grande Mosquée de Touba, stylisée : sept minarets (le plus haut au centre) et des dômes.
// Les fenêtres s'allument au fil de l'avancement (light de 0 à 1).
const WIN = Array.from({ length: 17 }, (_, i) => 30 + i * 16);

function Minaret({ x, top, w = 10 }: { x: number; top: number; w?: number }) {
  const h = w / 2;
  return (
    <g>
      <rect className="tb-body" x={x - h} y={top + 6} width={w} height={118 - top - 6} />
      <rect className="tb-body" x={x - h - 3} y={top + 16} width={w + 6} height={3} />
      <rect className="tb-body" x={x - h - 3} y={top + 34} width={w + 6} height={3} />
      <path className="tb-dome" d={`M${x - h} ${top + 6}a${h} 7 0 0 1 ${w} 0z`} />
      <path className="tb-gold" d={`M${x} ${top - 1}v-5`} strokeWidth={1.6} />
      <circle className="tb-gold" cx={x} cy={top - 7} r={1.8} />
    </g>
  );
}

export default function Touba({ light = 0 }: { light?: number }) {
  return (
    <svg className="touba" viewBox="0 -12 320 132" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <Minaret x={160} top={0} w={14} />
      <Minaret x={122} top={30} />
      <Minaret x={198} top={30} />
      <Minaret x={80} top={42} />
      <Minaret x={240} top={42} />
      <Minaret x={38} top={54} w={9} />
      <Minaret x={282} top={54} w={9} />
      <rect className="tb-body" x={20} y={90} width={280} height={28} />
      <path className="tb-dome" d="M134 90a26 26 0 0 1 52 0z" />
      <path className="tb-dome" d="M87 90a14 14 0 0 1 28 0z" />
      <path className="tb-dome" d="M205 90a14 14 0 0 1 28 0z" />
      <path className="tb-dome" d="M47 90a12 12 0 0 1 24 0z" />
      <path className="tb-dome" d="M249 90a12 12 0 0 1 24 0z" />
      {[160, 101, 219, 59, 261].map((x, i) => <circle key={x} className="tb-gold" cx={x} cy={[62, 74, 74, 77, 77][i]} r={1.8} />)}
      {WIN.map((x, i) => (
        <path key={x} className={i / WIN.length < light ? "tb-lit" : "tb-off"} d={`M${x} 114v-9a3 3 0 0 1 6 0v9z`} />
      ))}
    </svg>
  );
}
