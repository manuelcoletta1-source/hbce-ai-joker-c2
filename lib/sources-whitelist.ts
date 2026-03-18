export const TRUSTED_SOURCES = [
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "ft.com",
  "politico.eu",
  "euronews.com",

  // EU istituzionali
  "europa.eu",
  "consilium.europa.eu",
  "eeas.europa.eu",
  "ec.europa.eu",

  // sicurezza
  "nato.int",
  "enisa.europa.eu",

  // energia / economia
  "iea.org",
  "imf.org",
  "worldbank.org"
];

export function isTrustedSource(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return TRUSTED_SOURCES.some(d => host.endsWith(d));
  } catch {
    return false;
  }
}
