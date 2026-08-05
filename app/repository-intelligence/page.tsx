"use client";

import { useEffect, useState } from "react";

import { RepositoryDashboardRenderer } from "@/src/modules/dashboard/repository-dashboard-renderer";

import {
  buildRepositoryDashboardViewModel,
} from "@/src/modules/dashboard/repository-dashboard-view-model";

export default function RepositoryIntelligencePage() {
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [viewModel, setViewModel] =
    useState<ReturnType<
      typeof buildRepositoryDashboardViewModel
    > | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const mod001Response =
          await fetch(
            "/api/runtime/repository-intelligence",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                identity: {
                  humanIpr: "IPR-3",
                  runtimeIpr: "IPR-AI-0001",
                  tenantId: "HBCE",
                  workspaceId: "DEFAULT",
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

        const mod001 =
          await mod001Response.json();

        let mod002 = null;

        try {
          const semanticResponse =
            await fetch(
              "/api/runtime/repository-semantic-intelligence",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  identity:
                    mod001.identity,

                  repository:
                    mod001.repository,

                  humanAuthorization:
                    true,

                  legalCertification:
                    false,
                }),
              },
            );

          if (semanticResponse.ok) {
            mod002 =
              await semanticResponse.json();
          }
        } catch {
          mod002 = null;
        }

        const dashboard =
          buildRepositoryDashboardViewModel({
            structural:
              mod001,

            semantic:
              mod002,

            legalCertification:
              false,
          });

        setViewModel(
          dashboard,
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Unexpected dashboard error",
        );
      } finally {
        setLoading(
          false,
        );
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <main
        style={{
          padding: 40,
          fontFamily:
            "Inter, sans-serif",
        }}
      >
        <h1>
          Repository Intelligence
        </h1>

        <p>
          Loading Repository Dashboard...
        </p>
      </main>
    );
  }

  if (error || !viewModel) {
    return (
      <main
        style={{
          padding: 40,
          color: "#b91c1c",
        }}
      >
        <h1>
          Repository Intelligence
        </h1>

        <p>
          {error ??
            "Dashboard unavailable"}
        </p>
      </main>
    );
  }

  return (
    <RepositoryDashboardRenderer
      model={
        viewModel.model
      }
    />
  );
}
