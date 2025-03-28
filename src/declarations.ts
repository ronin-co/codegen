import { SyntaxKind, factory } from 'typescript';

import { genericIdentifiers, identifiers } from '@/src/constants/identifiers';
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
 * import type { DeepCallable, ResultRecord } from "@ronin/syntax/queries";
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

/**
 * ```ts
 * import type { QueryHandlerOptions } from "ronin/types";
 * ```
 */
export const importQueryHandlerOptionsType = createImportDeclaration({
  identifiers: [{ name: identifiers.ronin.queryHandlerOptions }],
  module: identifiers.ronin.module.types,
  type: true,
});

/**
 * ```ts
 * type ResolveSchema<
 *  TSchema,
 *  TUsing extends Array<string> | 'all',
 *  TKey extends string
 * > = TUsing extends 'all'
 *  ? TSchema
 *  : TKey extends TUsing[number]
 *    ? TSchema
 *    : TSchema extends Array<any>
 *      ? Array<string>
 *      : string;
 * ```
 */
export const resolveSchemaType = factory.createTypeAliasDeclaration(
  undefined,
  identifiers.utils.resolveSchema,
  [
    /**
     * ```ts
     * TSchema
     * ```
     */
    factory.createTypeParameterDeclaration(undefined, genericIdentifiers.schema),

    /**
     * ```ts
     * TUsing extends Array<string> | 'all'
     * ```
     */
    factory.createTypeParameterDeclaration(
      undefined,
      genericIdentifiers.using,
      factory.createUnionTypeNode([
        factory.createTypeReferenceNode(identifiers.primitive.array, [
          factory.createUnionTypeNode([
            factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
          ]),
        ]),
        factory.createLiteralTypeNode(
          factory.createStringLiteral(identifiers.utils.all.text),
        ),
      ]),
    ),

    /**
     * ```ts
     * TKey extends string
     * ```
     */
    factory.createTypeParameterDeclaration(
      undefined,
      genericIdentifiers.key,
      factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
    ),
  ],
  factory.createConditionalTypeNode(
    factory.createTypeReferenceNode(genericIdentifiers.using),
    factory.createLiteralTypeNode(
      factory.createStringLiteral(identifiers.utils.all.text),
    ),
    factory.createTypeReferenceNode(genericIdentifiers.schema),

    factory.createConditionalTypeNode(
      factory.createTypeReferenceNode(genericIdentifiers.key),
      factory.createIndexedAccessTypeNode(
        factory.createTypeReferenceNode(genericIdentifiers.using),
        factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
      ),
      factory.createTypeReferenceNode(genericIdentifiers.schema),

      factory.createConditionalTypeNode(
        factory.createTypeReferenceNode(genericIdentifiers.schema),
        factory.createTypeReferenceNode(identifiers.primitive.array, [
          factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
        ]),
        factory.createTypeReferenceNode(identifiers.primitive.array, [
          factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
        ]),
        factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
      ),
    ),
  ),
);
