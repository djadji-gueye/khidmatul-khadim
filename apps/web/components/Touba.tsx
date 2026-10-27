// La Grande Mosquée de Touba, stylisée : un minaret central et quatre minarets, deux dômes.
// Les fenêtres s'allument au fil de l'avancement (light de 0 à 1).
const WIN = Array.from({ length: 13 }, (_, i) => 56 + i * 16);

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
      <rect className="tb-body" x={48} y={88} width={224} height={30} />
      <rect className="tb-body" x={138} y={58} width={44} height={32} />
      <path className="tb-dome" d="M94 88a24 24 0 0 1 48 0z" />
      <path className="tb-dome" d="M178 88a24 24 0 0 1 48 0z" />
      <circle className="tb-gold" cx={118} cy={61} r={2} /><circle className="tb-gold" cx={202} cy={61} r={2} />
      <Minaret x={160} top={0} w={14} />
      <Minaret x={70} top={36} />
      <Minaret x={250} top={36} />
      <Minaret x={32} top={52} w={9} />
      <Minaret x={288} top={52} w={9} />
      {WIN.map((x, i) => (
        <path key={x} className={i / WIN.length < light ? "tb-lit" : "tb-off"} d={`M${x} 110v-9a3 3 0 0 1 6 0v9z`} />
      ))}
      <path className={light >= 1 ? "tb-lit" : "tb-off"} d="M154 86v-12a6 6 0 0 1 12 0v12z" />
    </svg>
  );
}
