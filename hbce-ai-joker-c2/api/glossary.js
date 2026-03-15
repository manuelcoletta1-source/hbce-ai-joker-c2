export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    service: "joker-c2-glossary",
    entries: [
      {
        key: "IPR",
        value: "Identity Primary Record, livello di identità fondamentale dell’ecosistema HBCE."
      },
      {
        key: "HBCE",
        value: "Ecosistema operativo centrato su identità, registri e infrastrutture di evidenza verificabile."
      },
      {
        key: "Joker-C2",
        value: "Interfaccia operativa e livello di coordinamento cibernetico che connette identità, eventi e infrastrutture."
      },
      {
        key: "Enterprise Space",
        value: "Ambiente operativo dove convergono identità, sistemi autonomi, operatori umani e registrazione degli eventi."
      },
      {
        key: "Event Registry",
        value: "Registro append-only degli eventi operativi con identità, timestamp, hash verificabile e metadati."
      },
      {
        key: "PhiOmega",
        value: "Cervello Cibernetico ΦΩ come nodo pensante opponibile del sistema."
      },
      {
        key: "UNEBDO",
        value: "Infrastruttura metrologica e temporale opponibile sub-secondo."
      }
    ]
  });
}
