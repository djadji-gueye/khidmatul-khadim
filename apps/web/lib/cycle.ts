export const fmt = (d: Date) =>
  d.toLocaleString("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
