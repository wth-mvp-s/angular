/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import ts from 'typescript';
import {KnownInputs} from '../input_detection/known_inputs';
import {MigrationResult} from '../result';
import {
  migrateBindingElementInputReference,
  IdentifierOfBindingElement,
} from './migrate_ts_reference/object_expansion_refs';
import {
  migrateStandardTsReference,
  NarrowableTsReferences,
} from './migrate_ts_reference/standard_reference';
import {ProgramInfo} from '../../../../utils/tsurge';
import {ClassFieldUniqueKey} from './references/known_fields';
import {isTsReference} from './references/reference_kinds';

/**
 * Phase that migrates TypeScript input references to be signal compatible.
 *
 * The phase takes care of control flow analysis and generates temporary variables
 * where needed to ensure narrowing continues to work. E.g.
 *
 * ```
 * someMethod() {
 *   if (this.input) {
 *     this.input.charAt(0);
 *   }
 * }
 * ```
 *
 * will be transformed into:
 *
 * ```
 * someMethod() {
 *   const input_1 = this.input();
 *   if (input_1) {
 *     input_1.charAt(0);
 *   }
 * }
 * ```
 */
export function pass5__migrateTypeScriptReferences(
  result: MigrationResult,
  checker: ts.TypeChecker,
  knownInputs: KnownInputs,
  info: ProgramInfo,
) {
  const tsReferencesWithNarrowing = new Map<ClassFieldUniqueKey, NarrowableTsReferences>();
  const tsReferencesInBindingElements = new Set<IdentifierOfBindingElement>();

  const seenIdentifiers = new WeakSet<ts.Identifier>();

  for (const reference of result.references) {
    // This pass only deals with TS references.
    if (!isTsReference(reference)) {
      continue;
    }
    // Skip references to incompatible inputs.
    if (knownInputs.get(reference.target)!.isIncompatible()) {
      continue;
    }
    // Never attempt to migrate write references.
    // Those usually invalidate the target input most of the time, but in
    // best-effort mode they are not.
    if (reference.from.isWrite) {
      continue;
    }
    // Skip duplicate references. E.g. in batching.
    if (seenIdentifiers.has(reference.from.node)) {
      continue;
    }
    seenIdentifiers.add(reference.from.node);

    const targetKey = reference.target.key;

    if (reference.from.isPartOfElementBinding) {
      tsReferencesInBindingElements.add(reference.from.node as IdentifierOfBindingElement);
    } else {
      if (!tsReferencesWithNarrowing.has(targetKey)) {
        tsReferencesWithNarrowing.set(targetKey, {accesses: []});
      }
      tsReferencesWithNarrowing.get(targetKey)!.accesses.push(reference.from.node);
    }
  }

  migrateBindingElementInputReference(tsReferencesInBindingElements, info, result);
  migrateStandardTsReference(tsReferencesWithNarrowing, checker, result, info);
}
