/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Repository Intelligence Dashboard
 *
 * Dashboard Renderer
 *
 * Revision:
 * AIJC2-REPOSITORY-DASHBOARD-RENDERER-v1_0
 *
 * Purpose:
 * - render the canonical Repository Dashboard model;
 * - present MOD-001 and MOD-002 state without executing analysis;
 * - separate metrics, modules, capabilities, findings and governance;
 * - preserve fail-closed and legal boundaries.
 *
 * Explicit exclusions:
 * - no repository analysis execution;
 * - no filesystem access;
 * - no GitHub API access;
 * - no autonomous mutation;
 * - no persistent memory;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

import type {
  CSSProperties,
  ReactNode,
} from "react";

import type {
  RepositoryDashboardCapability,
  RepositoryDashboardFinding,
  RepositoryDashboardMetric,
  RepositoryDashboardModel,
  RepositoryDashboardModuleStatus,
  RepositoryDashboardStatus,
} from "./repository-dashboard-model";

export const REPOSITORY_DASHBOARD_RENDERER_REVISION =
  "AIJC2-REPOSITORY-DASHBOARD-RENDERER-v1_0" as const;

export interface RepositoryDashboardRendererProps {
  model:
    RepositoryDashboardModel;
}

const pageStyle: CSSProperties = {
  minHeight:
    "100vh",

  padding:
    "32px",

  background:
    "#07090d",

  color:
    "#f3f4f6",

  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const containerStyle: CSSProperties = {
  width:
    "100%",

  maxWidth:
    "1440px",

  margin:
    "0 auto",

  display:
    "grid",

  gap:
    "24px",
};

const panelStyle: CSSProperties = {
  border:
    "1px solid rgba(255, 255, 255, 0.12)",

  borderRadius:
    "16px",

  padding:
    "20px",

  background:
    "rgba(255, 255, 255, 0.035)",

  boxShadow:
    "0 12px 40px rgba(0, 0, 0, 0.22)",
};

const gridStyle: CSSProperties = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",

  gap:
    "16px",
};

const labelStyle: CSSProperties = {
  margin:
    0,

  fontSize:
    "12px",

  textTransform:
    "uppercase",

  letterSpacing:
    "0.08em",

  opacity:
    0.65,
};

const valueStyle: CSSProperties = {
  margin:
    "8px 0 0",

  fontSize:
    "24px",

  fontWeight:
    700,
};

function getStatusLabel(
  status:
    RepositoryDashboardStatus,
): string {
  switch (status) {
    case "READY":
      return "Ready";

    case "DEGRADED":
      return "Degraded";

    case "FAIL_CLOSED":
      return "Fail Closed";

    case "NOT_EXECUTED":
      return "Not Executed";

    default:
      return status;
  }
}

function getStatusSymbol(
  status:
    RepositoryDashboardStatus,
): string {
  switch (status) {
    case "READY":
      return "●";

    case "DEGRADED":
      return "▲";

    case "FAIL_CLOSED":
      return "■";

    case "NOT_EXECUTED":
      return "○";

    default:
      return "○";
  }
}

function formatMetric(
  metric:
    RepositoryDashboardMetric,
): string {
  switch (metric.unit) {
    case "PERCENT":
      return `${metric.value}%`;

    case "BYTES":
      return `${metric.value.toLocaleString()} B`;

    case "MILLISECONDS":
      return `${metric.value.toLocaleString()} ms`;

    case "COUNT":
    default:
      return metric.value.toLocaleString();
  }
}

function Section({
  title,
  children,
}: {
  title:
    string;

  children:
    ReactNode;
}) {
  return (
    <section
      style={panelStyle}
    >
      <h2
        style={{
          margin:
            "0 0 16px",

          fontSize:
            "18px",
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function MetricCard({
  metric,
}: {
  metric:
    RepositoryDashboardMetric;
}) {
  return (
    <article
      style={{
        ...panelStyle,

        padding:
          "16px",
      }}
    >
      <p
        style={labelStyle}
      >
        {metric.label}
      </p>

      <p
        style={valueStyle}
      >
        {formatMetric(
          metric,
        )}
      </p>

      <p
        style={{
          margin:
            "8px 0 0",

          fontSize:
            "12px",

          opacity:
            0.55,
        }}
      >
        Source: {metric.sourceModuleId}
      </p>
    </article>
  );
}

function ModuleCard({
  module,
}: {
  module:
    RepositoryDashboardModuleStatus;
}) {
  return (
    <article
      style={{
        ...panelStyle,

        padding:
          "16px",
      }}
    >
      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          gap:
            "16px",

          alignItems:
            "center",
        }}
      >
        <div>
          <p
            style={labelStyle}
          >
            {module.moduleId}
          </p>

          <h3
            style={{
              margin:
                "6px 0 0",

              fontSize:
                "16px",
            }}
          >
            {module.moduleName}
          </h3>
        </div>

        <strong>
          {getStatusSymbol(
            module.status,
          )}{" "}
          {getStatusLabel(
            module.status,
          )}
        </strong>
      </div>

      <dl
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",

          gap:
            "12px",

          margin:
            "16px 0 0",
        }}
      >
        <div>
          <dt
            style={labelStyle}
          >
            Version
          </dt>

          <dd
            style={{
              margin:
                "4px 0 0",
            }}
          >
            {module.version}
          </dd>
        </div>

        <div>
          <dt
            style={labelStyle}
          >
            Verified
          </dt>

          <dd
            style={{
              margin:
                "4px 0 0",
            }}
          >
            {module.verified
              ? "Yes"
              : "No"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function CapabilityCard({
  capability,
}: {
  capability:
    RepositoryDashboardCapability;
}) {
  return (
    <article
      style={{
        border:
          "1px solid rgba(255, 255, 255, 0.10)",

        borderRadius:
          "12px",

        padding:
          "16px",
      }}
    >
      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          gap:
            "16px",
        }}
      >
        <div>
          <h3
            style={{
              margin:
                0,

              fontSize:
                "15px",
            }}
          >
            {capability.name}
          </h3>

          <p
            style={{
              margin:
                "6px 0 0",

              opacity:
                0.7,

              fontSize:
                "13px",
            }}
          >
            {capability.domain}
          </p>
        </div>

        <strong>
          {capability.state}
        </strong>
      </div>

      <p
        style={{
          margin:
            "14px 0 0",

          lineHeight:
            1.55,

          opacity:
            0.82,
        }}
      >
        {capability.description}
      </p>

      <p
        style={{
          margin:
            "12px 0 0",

          fontSize:
            "13px",
        }}
      >
        Confidence: {capability.confidence}%
      </p>
    </article>
  );
}

function FindingCard({
  finding,
}: {
  finding:
    RepositoryDashboardFinding;
}) {
  return (
    <article
      style={{
        border:
          finding.blocking
            ? "1px solid rgba(255, 80, 80, 0.5)"
            : "1px solid rgba(255, 255, 255, 0.10)",

        borderRadius:
          "12px",

        padding:
          "16px",
      }}
    >
      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          gap:
            "16px",
        }}
      >
        <div>
          <p
            style={labelStyle}
          >
            {finding.type}
          </p>

          <h3
            style={{
              margin:
                "6px 0 0",

              fontSize:
                "15px",
            }}
          >
            {finding.title}
          </h3>
        </div>

        <strong>
          {finding.severity}
        </strong>
      </div>

      <p
        style={{
          margin:
            "14px 0 0",

          lineHeight:
            1.55,

          opacity:
            0.82,
        }}
      >
        {finding.description}
      </p>

      {finding.recommendation
        ? (
            <p
              style={{
                margin:
                  "14px 0 0",

                padding:
                  "12px",

                borderRadius:
                  "10px",

                background:
                  "rgba(255, 255, 255, 0.05)",
              }}
            >
              <strong>
                Recommendation:
              </strong>{" "}
              {finding.recommendation}
            </p>
          )
        : null}
    </article>
  );
}

export function RepositoryDashboardRenderer({
  model,
}: RepositoryDashboardRendererProps) {
  return (
    <main
      style={pageStyle}
    >
      <div
        style={containerStyle}
      >
        <header
          style={panelStyle}
        >
          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              gap:
                "24px",

              alignItems:
                "flex-start",

              flexWrap:
                "wrap",
            }}
          >
            <div>
              <p
                style={labelStyle}
              >
                HBCE / AI JOKER-C2
              </p>

              <h1
                style={{
                  margin:
                    "8px 0 0",

                  fontSize:
                    "32px",
                }}
              >
                Repository Intelligence
              </h1>

              <p
                style={{
                  margin:
                    "10px 0 0",

                  opacity:
                    0.72,
                }}
              >
                Structural and semantic repository analysis
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                System status
              </p>

              <p
                style={{
                  margin:
                    "8px 0 0",

                  fontSize:
                    "18px",

                  fontWeight:
                    700,
                }}
              >
                {getStatusSymbol(
                  model.status,
                )}{" "}
                {getStatusLabel(
                  model.status,
                )}
              </p>
            </div>
          </div>
        </header>

        <Section
          title="Repository"
        >
          <div
            style={gridStyle}
          >
            <div>
              <p
                style={labelStyle}
              >
                Repository
              </p>

              <p
                style={valueStyle}
              >
                {model.repository.repositoryName}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Branch
              </p>

              <p
                style={valueStyle}
              >
                {model.repository.branch}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Commit
              </p>

              <p
                style={{
                  ...valueStyle,

                  fontSize:
                    "15px",

                  wordBreak:
                    "break-all",
                }}
              >
                {model.repository.commitSha}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Generated
              </p>

              <p
                style={{
                  ...valueStyle,

                  fontSize:
                    "15px",
                }}
              >
                {model.operation.generatedAt}
              </p>
            </div>
          </div>
        </Section>

        <section
          style={gridStyle}
        >
          {model.metrics.map(
            (metric) => (
              <MetricCard
                key={metric.metricId}
                metric={metric}
              />
            ),
          )}
        </section>

        <Section
          title="Operational Modules"
        >
          <div
            style={gridStyle}
          >
            {model.modules.map(
              (module) => (
                <ModuleCard
                  key={module.moduleId}
                  module={module}
                />
              ),
            )}
          </div>
        </Section>

        <Section
          title="Architecture"
        >
          <div
            style={gridStyle}
          >
            <div>
              <p
                style={labelStyle}
              >
                Files
              </p>

              <p
                style={valueStyle}
              >
                {model.architecture.totalFiles}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Directories
              </p>

              <p
                style={valueStyle}
              >
                {model.architecture.totalDirectories}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Architecture nodes
              </p>

              <p
                style={valueStyle}
              >
                {model.architecture.architectureNodes}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Boundaries
              </p>

              <p
                style={valueStyle}
              >
                {model.architecture.architectureBoundaries}
              </p>
            </div>
          </div>
        </Section>

        <Section
          title="Semantic Intelligence"
        >
          <div
            style={gridStyle}
          >
            <div>
              <p
                style={labelStyle}
              >
                Components
              </p>

              <p
                style={valueStyle}
              >
                {model.semantic.totalComponents}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Capabilities
              </p>

              <p
                style={valueStyle}
              >
                {model.semantic.totalCapabilities}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Relations
              </p>

              <p
                style={valueStyle}
              >
                {model.semantic.totalRelations}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Findings
              </p>

              <p
                style={valueStyle}
              >
                {model.semantic.totalFindings}
              </p>
            </div>
          </div>
        </Section>

        <Section
          title="Capabilities"
        >
          {model.capabilities.length >
          0
            ? (
                <div
                  style={gridStyle}
                >
                  {model.capabilities.map(
                    (capability) => (
                      <CapabilityCard
                        key={capability.capabilityId}
                        capability={capability}
                      />
                    ),
                  )}
                </div>
              )
            : (
                <p
                  style={{
                    margin:
                      0,

                    opacity:
                      0.68,
                  }}
                >
                  No repository capabilities are available.
                </p>
              )}
        </Section>

        <Section
          title="Findings"
        >
          {model.findings.length >
          0
            ? (
                <div
                  style={{
                    display:
                      "grid",

                    gap:
                      "14px",
                  }}
                >
                  {model.findings.map(
                    (finding) => (
                      <FindingCard
                        key={finding.findingId}
                        finding={finding}
                      />
                    ),
                  )}
                </div>
              )
            : (
                <p
                  style={{
                    margin:
                      0,

                    opacity:
                      0.68,
                  }}
                >
                  No semantic findings are available.
                </p>
              )}
        </Section>

        <Section
          title="Priority Recommendation"
        >
          {model.recommendation
            ? (
                <article>
                  <p
                    style={labelStyle}
                  >
                    Priority {model.recommendation.priority}
                  </p>

                  <h3
                    style={{
                      margin:
                        "8px 0 0",

                      fontSize:
                        "20px",
                    }}
                  >
                    {model.recommendation.title}
                  </h3>

                  <p
                    style={{
                      margin:
                        "14px 0 0",

                      lineHeight:
                        1.6,

                      opacity:
                        0.82,
                    }}
                  >
                    {model.recommendation.description}
                  </p>

                  <p
                    style={{
                      margin:
                        "14px 0 0",

                      fontSize:
                        "13px",

                      opacity:
                        0.68,
                    }}
                  >
                    Automatic execution: disabled. Human authorization required.
                  </p>
                </article>
              )
            : (
                <p
                  style={{
                    margin:
                      0,

                    opacity:
                      0.68,
                  }}
                >
                  No priority recommendation is available.
                </p>
              )}
        </Section>

        <Section
          title="Governance"
        >
          <div
            style={gridStyle}
          >
            <div>
              <p
                style={labelStyle}
              >
                Human authorization
              </p>

              <p
                style={valueStyle}
              >
                {model.governance
                  .humanAuthorizationVerified
                  ? "Verified"
                  : "Not verified"}
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Persistent memory
              </p>

              <p
                style={valueStyle}
              >
                Disabled
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Automatic recall
              </p>

              <p
                style={valueStyle}
              >
                Disabled
              </p>
            </div>

            <div>
              <p
                style={labelStyle}
              >
                Legal certification
              </p>

              <p
                style={valueStyle}
              >
                False
              </p>
            </div>
          </div>
        </Section>

        <footer
          style={{
            padding:
              "12px 4px",

            fontSize:
              "12px",

            opacity:
              0.52,
          }}
        >
          {REPOSITORY_DASHBOARD_RENDERER_REVISION}
        </footer>
      </div>
    </main>
  );
}

export const REPOSITORY_DASHBOARD_RENDERER_BOUNDARY =
  Object.freeze({
    presentationOnly:
      true,

    analysisExecution:
      false,

    filesystemAccess:
      false,

    githubApiAccess:
      false,

    sourceExecution:
      false,

    autonomousMutation:
      false,

    persistentMemory:
      false,

    automaticRecall:
      false,

    humanAuthorizationRequired:
      true,

    legalCertification:
      false,
  });
