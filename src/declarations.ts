import { identifiers } from '@/src/constants/identifiers';
import {
  createGlobImportDeclaration,
  createImportDeclaration,
} from '@/src/generators/import';

/**
 * ```ts
 * import type { RONIN } from 'ronin';
 * ```
 */
export const importRoninNamespaceType = createImportDeclaration({
  identifiers: [{ name: identifiers.ronin.namespace }],
  module: identifiers.ronin.module.root,
  type: true,
});

/**
 * ```ts
 * import type * as Syntax from '@ronin/syntax/queries';
 * ```
 */
export const globImportSyntaxType = createGlobImportDeclaration({
  identifier: identifiers.syntax.namespace,
  module: identifiers.syntax.module,
  type: true,
});
