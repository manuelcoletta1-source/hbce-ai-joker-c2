import {
  ARCHITECTURE_VERSION,
  RUNTIME_ARCHITECTURE,
  getRuntimeModule,
  validateArchitecture,
  type RuntimeModuleId,
} from "./architecture";

describe("HBCE canonical runtime architecture", () => {
  it("uses the expected architecture version", () => {
    expect(ARCHITECTURE_VERSION).toBe("1.0.0");
  });

  it("contains every canonical module", () => {
    const expectedModules: RuntimeModuleId[] = [
      "MATRIX_FRAMEWORK",
      "IPR",
      "AUTHORITY",
      "UNEBDO_CONTEXT",
      "IOSPACE",
      "MISSION",
      "CLAIM_EVIDENCE",
      "MATRIX_ENGINE",
      "SRSC",
      "QIV",
      "DIABLO",
      "CYBERGLOBAL_PRE_GATE",
      "JOKER_C2_RUNTIME",
      "CYBERGLOBAL_MONITOR",
      "EVT",
      "UNEBDO_ANCHOR",
      "MEMORY",
      "METAEXCHANGE",
      "OPC",
      "AUDIT_REPLAY",
      "NEUROLOOP",
      "HUMAN_OVERSIGHT",
    ];

    expect(Object.keys(RUNTIME_ARCHITECTURE).sort()).toEqual(
      [...expectedModules].sort(),
    );
  });

  it("has no structural validation errors", () => {
    expect(validateArchitecture()).toEqual([]);
  });

  it("resolves every declared dependency", () => {
    const knownModules = new Set(Object.keys(RUNTIME_ARCHITECTURE));

    for (const module of Object.values(RUNTIME_ARCHITECTURE)) {
      for (const dependency of module.dependencies) {
        expect(knownModules.has(dependency)).toBe(true);
      }
    }
  });

  it("does not allow self dependencies", () => {
    for (const module of Object.values(RUNTIME_ARCHITECTURE)) {
      expect(module.dependencies).not.toContain(module.id);
    }
  });

  it("requires fail-closed behavior for identity and authority", () => {
    expect(getRuntimeModule("IPR").failurePolicy).toBe("FAIL_CLOSED");
    expect(getRuntimeModule("AUTHORITY").failurePolicy).toBe("FAIL_CLOSED");
  });

  it("separates UNEBDO context from event anchoring", () => {
    const context = getRuntimeModule("UNEBDO_CONTEXT");
    const anchor = getRuntimeModule("UNEBDO_ANCHOR");

    expect(context.layer).toBe("CONTEXT");
    expect(anchor.layer).toBe("CONTINUITY_PROOF");
    expect(anchor.dependencies).toContain("UNEBDO_CONTEXT");
    expect(anchor.dependencies).toContain("EVT");
  });

  it("separates MATRIX framework from causal execution", () => {
    const framework = getRuntimeModule("MATRIX_FRAMEWORK");
    const engine = getRuntimeModule("MATRIX_ENGINE");

    expect(framework.mode).toBe("FRAMEWORK");
    expect(framework.dependencies).toEqual([]);

    expect(engine.mode).toBe("ENGINE");
    expect(engine.dependencies).toContain("CLAIM_EVIDENCE");
  });

  it("keeps the quantum domain inside QIV constraints", () => {
    const qiv = getRuntimeModule("QIV");

    expect(qiv.responsibility).toContain("quantistico");
    expect(qiv.responsibility).toContain("classico-stocastico");
    expect(qiv.responsibility).toContain("digitale");
    expect(qiv.responsibility).toContain("probatorio");

    expect(qiv.mustNotClaim).toContain(
      "quantistico come metafora tecnica",
    );
  });

  it("does not treat OPC as legal certification or truth proof", () => {
    const opc = getRuntimeModule("OPC");

    expect(opc.mustNotClaim).toContain("certificazione legale");
    expect(opc.mustNotClaim).toContain(
      "verità automatica del contenuto",
    );
  });

  it("requires human approval for NeuroLoop changes", () => {
    const neuroLoop = getRuntimeModule("NEUROLOOP");
    const humanOversight = getRuntimeModule("HUMAN_OVERSIGHT");

    expect(neuroLoop.failurePolicy).toBe("REQUIRE_HUMAN");
    expect(humanOversight.dependencies).toContain("NEUROLOOP");
    expect(humanOversight.failurePolicy).toBe("FAIL_CLOSED");
  });

  it("places runtime execution behind policy and cyber gates", () => {
    const runtime = getRuntimeModule("JOKER_C2_RUNTIME");

    expect(runtime.dependencies).toContain("MISSION");
    expect(runtime.dependencies).toContain("QIV");
    expect(runtime.dependencies).toContain("DIABLO");
    expect(runtime.dependencies).toContain("CYBERGLOBAL_PRE_GATE");
  });

  it("keeps MetaExchange optional but fail-closed", () => {
    const metaExchange = getRuntimeModule("METAEXCHANGE");

    expect(metaExchange.required).toBe(false);
    expect(metaExchange.failurePolicy).toBe("FAIL_CLOSED");
    expect(metaExchange.dependencies).toContain("AUTHORITY");
    expect(metaExchange.dependencies).toContain("MEMORY");
  });
});
