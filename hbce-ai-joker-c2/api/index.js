export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    service: "joker-c2-docs",
    endpoints: [
      {
        path: "/api",
        method: "GET",
        description: "Root API con manifest sintetico del motore Joker-C2."
      },
      {
        path: "/api/chat",
        method: "POST",
        description: "Motore principale di ricerca locale sul corpus HBCE e layer alieno."
      },
      {
        path: "/api/health",
        method: "GET",
        description: "Controllo rapido dello stato del servizio."
      },
      {
        path: "/api/glossary",
        method: "GET",
        description: "Glossario sintetico dei termini canonici principali."
      }
    ]
  });
}
