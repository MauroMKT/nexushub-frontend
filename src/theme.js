// Applica il tema white-label del tenant (colori personalizzabili per cliente, Fase 4)
// impostando le variabili CSS --nx-*-rgb lette da tailwind.config.js. Vedi il commento
// in tailwind.config.js per il perché del formato "r g b" invece di un hex/var() diretto.

function hexToRgbSpace(hex) {
  if (!hex) return null;
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return `${r} ${g} ${b}`;
}

export function applyTenantTheme(tenant) {
  if (!tenant) return;
  const root = document.documentElement;
  const map = {
    "--nx-primary-rgb": tenant.primary_color,
    "--nx-secondary-rgb": tenant.secondary_color,
    "--nx-accent-rgb": tenant.accent_color,
  };
  for (const [cssVar, hex] of Object.entries(map)) {
    const rgb = hexToRgbSpace(hex);
    if (rgb) root.style.setProperty(cssVar, rgb);
  }
}
