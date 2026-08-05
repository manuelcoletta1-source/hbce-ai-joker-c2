"use client";

import { useState } from "react";

export default function RepositoryIntelligencePage() {

  const [result, setResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  async function execute() {

    setLoading(true);

    setResult(null);

    try {

      const response =
        await fetch(

          "/api/runtime/repository-intelligence",

          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                identity: {

                  humanIpr:
                    "IPR-3",

                  runtimeIpr:
                    "IPR-AI-0001",

                  tenantId:
                    "HBCE",

                  workspaceId:
                    "DEFAULT",

                  sessionId:
                    crypto.randomUUID(),

                },

                mission:
                  "Repository Intelligence",

                idempotencyKey:
                  crypto.randomUUID(),

                humanAuthorization:
                  true,

                legalCertification:
                  false,

                repository: {

                  repositoryId:
                    "HBCE",

                  repositoryName:
                    "hbce-ai-joker-c2",

                  branch:
                    "main",

                  commitSha:
                    "LOCAL",

                  files: [],

                },

              }),

          },

        );

      setResult(

        await response.json(),

      );

    }

    finally {

      setLoading(false);

    }

  }

  return (

    <main
      style={{
        padding: 40,
      }}
    >

      <h1>

        Repository Intelligence

      </h1>

      <p>

        MOD-001 Runtime

      </p>

      <button

        onClick={execute}

      >

        {

          loading

            ? "Running..."

            : "Execute"

        }

      </button>

      <pre
        style={{

          marginTop: 30,

          overflow: "auto",

        }}
      >

        {

          JSON.stringify(

            result,

            null,

            2,

          )

        }

      </pre>

    </main>

  );

}
