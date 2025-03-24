import { identifiers } from '@/src/constants/identifiers';
import { createImportDeclaration } from '@/src/generators/import';

// /**
//  * ```ts
//  * import type { RONIN } from 'ronin';
//  * ```
//  */
// export const importRoninNamespaceType = createImportDeclaration({
//   identifiers: [{ name: identifiers.ronin.namespace }],
//   module: identifiers.ronin.module.root,
//   type: true,
// });

// /**
//  * ```ts
//  * import type * as Syntax from '@ronin/syntax/queries';
//  * ```
//  */
// export const globImportSyntaxType = createGlobImportDeclaration({
//   identifier: identifiers.syntax.namespace,
//   module: identifiers.syntax.module,
//   type: true,
// });

/**
 * ```ts
 * import type { AddQuery, CountQuery, GetQuery, RemoveQuery, SetQuery } from "@ronin/compiler";
 * ```
 */
export const importRoninQueryTypesType = createImportDeclaration({
  identifiers: [
    { name: identifiers.compiler.queryType.add },
    { name: identifiers.compiler.queryType.count },
    { name: identifiers.compiler.queryType.get },
    { name: identifiers.compiler.queryType.remove },
    { name: identifiers.compiler.queryType.set },
  ],
  module: identifiers.compiler.module.root,
  type: true,
});

/**
 * ```ts
 * import type { AddQuery, CountQuery, GetQuery, RemoveQuery, SetQuery } from "@ronin/compiler";
 * ```
 */
export const importSyntaxUtiltypesType = createImportDeclaration({
  identifiers: [
    { name: identifiers.syntax.deepCallable },
    { name: identifiers.syntax.resultRecord },
  ],
  module: identifiers.syntax.module.queries,
  type: true,
});
