import { identifiers } from '@/src/constants/identifiers';
import { createImportDeclaration } from '@/src/generators/import';

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
 * import type { StoredObject } from "@ronin/compiler";
 * ```
 */
export const importRoninStoredObjectType = createImportDeclaration({
  identifiers: [{ name: identifiers.compiler.storedObject }],
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
