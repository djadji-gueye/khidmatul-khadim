const num = (p: string | null) => { const d = (p || "").replace(/\D/g, "").replace(/^00/, ""); return d.length === 9 ? "221" + d : d; };
export const wa = (phone: string | null, text: string) => `https://wa.me/${num(phone)}?text=${encodeURIComponent(text)}`;
