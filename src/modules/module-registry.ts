/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Operational Module Registry
 *
 * legalCertification=false
 */

import {
  OperationalModuleDefinition,
  OperationalModulePublicProjection,
  OperationalModuleListOptions,
  assertOperationalModuleDefinition,
  toOperationalModulePublicProjection,
} from "./types";

const registry = new Map<string, OperationalModuleDefinition>();

export function registerModule(
  module: OperationalModuleDefinition,
): void {
  assertOperationalModuleDefinition(module);

  if (registry.has(module.identity.id)) {
    throw new Error(
      `Operational module already registered: ${module.identity.id}`,
    );
  }

  registry.set(module.identity.id, Object.freeze(module));
}

export function getModule(
  moduleId: string,
): OperationalModuleDefinition | undefined {
  return registry.get(moduleId);
}

export function hasModule(
  moduleId: string,
): boolean {
  return registry.has(moduleId);
}

export function listModules(
  options: OperationalModuleListOptions = {},
): OperationalModulePublicProjection[] {
  let modules = Array.from(registry.values());

  if (options.category) {
    modules = modules.filter(
      (m) => m.identity.category === options.category,
    );
  }

  if (options.status) {
    modules = modules.filter(
      (m) => m.identity.status === options.status,
    );
  }

  if (options.enabledOnly) {
    modules = modules.filter(
      (m) => m.capabilities.enabled,
    );
  }

  return modules.map(toOperationalModulePublicProjection);
}

export function unregisterModule(
  moduleId: string,
): boolean {
  return registry.delete(moduleId);
}

export function clearRegistry(): void {
  registry.clear();
}

export function registrySize(): number {
  return registry.size;
}

export function getRegistrySnapshot(): readonly OperationalModuleDefinition[] {
  return Object.freeze(Array.from(registry.values()));
}

export const OperationalModuleRegistry = Object.freeze({
  registerModule,
  getModule,
  hasModule,
  listModules,
  unregisterModule,
  clearRegistry,
  registrySize,
  getRegistrySnapshot,
});
