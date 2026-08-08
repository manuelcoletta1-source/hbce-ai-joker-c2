import {
  buildRuntimeOperationsProjection,
  classifyRuntimeOperationTone,
  collectRuntimeOperationSignals,
} from "./runtime-operations-projection";

describe("runtime operations projection", () => {
  describe("classifyRuntimeOperationTone", () => {
    it("classifies PASS states", () => {
      expect(
        classifyRuntimeOperationTone("PASS"),
      ).toBe("PASS");

      expect(
        classifyRuntimeOperationTone("VERIFIED"),
      ).toBe("PASS");
    });

    it("classifies ACTIVE states", () => {
      expect(
        classifyRuntimeOperationTone("ACTIVE"),
      ).toBe("ACTIVE");
    });

    it("classifies EXECUTED states", () => {
      expect(
        classifyRuntimeOperationTone("EXECUTED"),
      ).toBe("EXECUTED");
    });

    it("classifies READY states", () => {
      expect(
        classifyRuntimeOperationTone("READY"),
      ).toBe("READY");

      expect(
        classifyRuntimeOperationTone("COMPLETED"),
      ).toBe("READY");
    });

    it("classifies DUE states", () => {
      expect(
        classifyRuntimeOperationTone("DUE"),
      ).toBe("DUE");
    });

    it("classifies REVIEW states", () => {
      expect(
        classifyRuntimeOperationTone(
          "REVIEW_REQUIRED",
        ),
      ).toBe("REVIEW");

      expect(
        classifyRuntimeOperationTone(
          "MANUAL_REQUEST",
        ),
      ).toBe("REVIEW");

      expect(
        classifyRuntimeOperationTone(
          "HUMAN_AUTHORIZATION_REQUIRED",
        ),
      ).toBe("REVIEW");
    });

    it("classifies BLOCKED states", () => {
      expect(
        classifyRuntimeOperationTone("BLOCKED"),
      ).toBe("BLOCKED");

      expect(
        classifyRuntimeOperationTone(
          "NO_ACTION",
        ),
      ).toBe("BLOCKED");

      expect(
        classifyRuntimeOperationTone("DENIED"),
      ).toBe("BLOCKED");
    });

    it("classifies FAIL states", () => {
      expect(
        classifyRuntimeOperationTone("FAIL"),
      ).toBe("FAIL");

      expect(
        classifyRuntimeOperationTone("ERROR"),
      ).toBe("FAIL");

      expect(
        classifyRuntimeOperationTone(
          "REJECTED",
        ),
      ).toBe("FAIL");
    });

    it("falls back to UNKNOWN", () => {
      expect(
        classifyRuntimeOperationTone(
          "SOMETHING_UNCLASSIFIED",
        ),
      ).toBe("UNKNOWN");
    });
  });

  describe("collectRuntimeOperationSignals", () => {
    it("extracts operational signals recursively", () => {
      const input = {
        runtime: {
          status: "ACTIVE",
          scheduler: {
            state: "READY",
            decision: "REVIEW_REQUIRED",
          },
        },
      };

      const signals =
        collectRuntimeOperationSignals(
          input,
          "Runtime Brain",
        );

      expect(signals.length).toBeGreaterThan(0);

      expect(signals).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "runtime.status",
            value: "ACTIVE",
            tone: "ACTIVE",
            source: "Runtime Brain",
          }),

          expect.objectContaining({
            key: "runtime.scheduler.state",
            value: "READY",
            tone: "READY",
            source: "Runtime Brain",
          }),

          expect.objectContaining({
            key:
              "runtime.scheduler.decision",
            value: "REVIEW_REQUIRED",
            tone: "REVIEW",
            source: "Runtime Brain",
          }),
        ]),
      );
    });

    it("ignores unrelated scalar values", () => {
      const input = {
        name: "AI JOKER-C2",
        description:
          "non operational metadata",
        versionNumber: 123,
      };

      const signals =
        collectRuntimeOperationSignals(
          input,
          "Runtime Brain",
        );

      expect(signals).toEqual([]);
    });
  });

  describe("buildRuntimeOperationsProjection", () => {
    it("returns PASS when all sources are available and no blocking conditions exist", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: {
            operationalStatus: "PASS",
            runtimeState: "ACTIVE",
          },

          scheduler: {
            operationalStatus: "PASS",
            schedulerState: "READY",
          },

          sourcesAvailable: {
            brain: true,
            scheduler: true,
          },
        });

      expect(
        projection.operationalStatus,
      ).toBe("PASS");

      expect(
        projection.governance.failClosed,
      ).toBe(false);

      expect(
        projection.governance
          .humanAuthorizationRequired,
      ).toBe(true);

      expect(
        projection.governance
          .autonomousAuthorization,
      ).toBe(false);

      expect(
        projection.governance
          .legalCertification,
      ).toBe(false);
    });

    it("returns REVIEW_REQUIRED when human review is required", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: {
            decision:
              "REVIEW_REQUIRED",
          },

          scheduler: {
            operationalStatus: "PASS",
          },

          sourcesAvailable: {
            brain: true,
            scheduler: true,
          },
        });

      expect(
        projection.operationalStatus,
      ).toBe("REVIEW_REQUIRED");

      expect(
        projection.summary.review,
      ).toBeGreaterThan(0);
    });

    it("returns REVIEW_REQUIRED when work is due", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: {
            operationalStatus: "PASS",
          },

          scheduler: {
            schedulerState: "DUE",
          },

          sourcesAvailable: {
            brain: true,
            scheduler: true,
          },
        });

      expect(
        projection.operationalStatus,
      ).toBe("REVIEW_REQUIRED");

      expect(
        projection.summary.due,
      ).toBeGreaterThan(0);
    });

    it("returns BLOCKED when a governance block exists", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: {
            decision: "BLOCKED",
          },

          scheduler: {
            operationalStatus: "PASS",
          },

          sourcesAvailable: {
            brain: true,
            scheduler: true,
          },
        });

      expect(
        projection.operationalStatus,
      ).toBe("BLOCKED");

      expect(
        projection.governance.failClosed,
      ).toBe(true);

      expect(
        projection.summary.blocked,
      ).toBeGreaterThan(0);
    });

    it("returns FAIL_CLOSED when a failure signal exists", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: {
            operationalStatus: "FAIL",
          },

          scheduler: {
            operationalStatus: "PASS",
          },

          sourcesAvailable: {
            brain: true,
            scheduler: true,
          },
        });

      expect(
        projection.operationalStatus,
      ).toBe("FAIL_CLOSED");

      expect(
        projection.governance.failClosed,
      ).toBe(true);

      expect(
        projection.summary.failed,
      ).toBeGreaterThan(0);
    });

    it("returns FAIL_CLOSED when Brain is unavailable", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: null,

          scheduler: {
            operationalStatus: "PASS",
          },

          sourcesAvailable: {
            brain: false,
            scheduler: true,
          },
        });

      expect(
        projection.operationalStatus,
      ).toBe("FAIL_CLOSED");

      expect(
        projection.governance.failClosed,
      ).toBe(true);
    });

    it("returns FAIL_CLOSED when Scheduler is unavailable", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: {
            operationalStatus: "PASS",
          },

          scheduler: null,

          sourcesAvailable: {
            brain: true,
            scheduler: false,
          },
        });

      expect(
        projection.operationalStatus,
      ).toBe("FAIL_CLOSED");

      expect(
        projection.governance.failClosed,
      ).toBe(true);
    });

    it("preserves non-autonomous governance invariants", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: {
            status: "ACTIVE",
          },

          scheduler: {
            status: "READY",
          },

          sourcesAvailable: {
            brain: true,
            scheduler: true,
          },
        });

      expect(
        projection.governance,
      ).toEqual({
        failClosed: false,
        humanAuthorizationRequired: true,
        autonomousAuthorization: false,
        legalCertification: false,
      });
    });

    it("uses the canonical projection revision", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: {},
          scheduler: {},
          sourcesAvailable: {
            brain: true,
            scheduler: true,
          },
        });

      expect(projection.revision).toBe(
        "HBCE-RUNTIME-OPERATIONS-PROJECTION-v1_0",
      );
    });

    it("does not silently convert unknown signals into execution authority", () => {
      const projection =
        buildRuntimeOperationsProjection({
          brain: {
            runtimeState:
              "UNCLASSIFIED_FUTURE_STATE",
          },

          scheduler: {
            schedulerState:
              "UNCLASSIFIED_FUTURE_STATE",
          },

          sourcesAvailable: {
            brain: true,
            scheduler: true,
          },
        });

      expect(
        projection.governance
          .humanAuthorizationRequired,
      ).toBe(true);

      expect(
        projection.governance
          .autonomousAuthorization,
      ).toBe(false);

      expect(
        projection.governance
          .legalCertification,
      ).toBe(false);
    });
  });
});
