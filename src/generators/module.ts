import { DDL_QUERY_TYPES, DML_QUERY_TYPES } from '@ronin/compiler';
import { NodeFlags, SyntaxKind, addSyntheticLeadingComment, factory } from 'typescript';

import { identifiers } from '@/src/constants/identifiers';
import { generateQueryTypeComment } from '@/src/generators/comment';
import { convertToPascalCase } from '@/src/utils/slug';

import type {
  InterfaceDeclaration,
  ModuleDeclaration,
  Statement,
  TypeAliasDeclaration,
  TypeElement,
} from 'typescript';

import type { Model } from '@/src/types/model';

/**
 * Generate a module augmentation for the `ronin` module to override the
 * standard filter interfaces with ones that are correctly typed specific to
 * this space.
 *
 * @param models - An array of RONIN models to generate type definitions for.
 * @param schemas - An array of type declarations for the models.
 *
 * @returns A module augmentation declaration to be added to `index.d.ts`.
 */
export const generateModule = (
  models: Array<Model>,
  schemas: Array<InterfaceDeclaration | TypeAliasDeclaration>,
): ModuleDeclaration => {
  const moduleBodyStatements = new Array<Statement>();

  for (const schemaTypeDec of schemas) {
    moduleBodyStatements.push(schemaTypeDec);
  }

  const mappedQueryTypeVariableDeclarations = DML_QUERY_TYPES.map((queryType) => {
    const declarationProperties = new Array<TypeElement>();

    for (const model of models) {
      const comment = generateQueryTypeComment(model, queryType);
      const singularModelIdentifier = factory.createTypeReferenceNode(
        convertToPascalCase(model.slug),
      );
      const pluralSchemaIdentifier = factory.createTypeReferenceNode(
        convertToPascalCase(model.pluralSlug),
      );

      /**
       * ```ts
       * GetQuery[keyof GetQuery]
       * ```
       */
      const queryTypeValue = factory.createIndexedAccessTypeNode(
        factory.createTypeReferenceNode(
          identifiers.compiler.dmlQueryType[queryType],
          undefined,
        ),
        factory.createTypeOperatorNode(
          SyntaxKind.KeyOfKeyword,
          factory.createTypeReferenceNode(identifiers.compiler.dmlQueryType[queryType]),
        ),
      );

      /**
       * ```ts
       * account: DeepCallable<GetQuery[keyof GetQuery], Account | null>;
       * ```
       */
      const singularProperty = factory.createPropertySignature(
        undefined,
        model.slug,
        undefined,
        factory.createTypeReferenceNode(identifiers.syntax.deepCallable, [
          queryTypeValue,
          factory.createUnionTypeNode(
            queryType === 'count'
              ? [factory.createKeywordTypeNode(SyntaxKind.NumberKeyword)]
              : [
                  singularModelIdentifier,
                  factory.createLiteralTypeNode(factory.createNull()),
                ],
          ),
        ]),
      );

      // There is no value in supporting `count` queries for singular
      // records, so we skip adding the comment for those.
      if (queryType !== 'count')
        declarationProperties.push(
          addSyntheticLeadingComment(
            singularProperty,
            SyntaxKind.MultiLineCommentTrivia,
            comment.singular,
            true,
          ),
        );

      // TODO(@nurodev): Remove once RONIN officially supports
      // creating multiple records at once.
      if (queryType === 'add') continue;

      /**
       * ```ts
       * accounts: DeepCallable<GetQuery[keyof GetQuery], Array<Account>>;
       * ```
       */
      const pluralProperty = factory.createPropertySignature(
        undefined,
        model.pluralSlug,
        undefined,
        factory.createTypeReferenceNode(identifiers.syntax.deepCallable, [
          queryTypeValue,
          queryType === 'count'
            ? factory.createKeywordTypeNode(SyntaxKind.NumberKeyword)
            : pluralSchemaIdentifier,
        ]),
      );
      declarationProperties.push(
        addSyntheticLeadingComment(
          pluralProperty,
          SyntaxKind.MultiLineCommentTrivia,
          comment.plural,
          true,
        ),
      );
    }

    return {
      properties: declarationProperties,
      queryType,
    };
  });

  /**
   * ```ts
   * declare const add: { ... };
   * declare const count: { ... };
   * declare const get: { ... };
   * declare const remove: { ... };
   * declare const set: { ... };
   * ```
   */
  for (const { properties, queryType } of mappedQueryTypeVariableDeclarations) {
    const queryDeclaration = factory.createVariableStatement(
      [factory.createModifier(SyntaxKind.DeclareKeyword)],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            queryType,
            undefined,
            factory.createTypeLiteralNode(properties),
          ),
        ],
        NodeFlags.Const,
      ),
    );

    moduleBodyStatements.push(queryDeclaration);
  }

  /**
   * ```ts
   * models: DeepCallable<ListQuery[keyof ListQuery], Array<Model>>;
   * ```
   */
  const listModelsQueryPropertyDeclaration = addSyntheticLeadingComment(
    factory.createPropertySignature(
      undefined,
      'models',
      undefined,
      factory.createTypeReferenceNode(identifiers.syntax.deepCallable, [
        factory.createIndexedAccessTypeNode(
          factory.createTypeReferenceNode(
            identifiers.compiler.ddlQueryType.list,
            undefined,
          ),
          factory.createTypeOperatorNode(
            SyntaxKind.KeyOfKeyword,
            factory.createTypeReferenceNode(identifiers.compiler.ddlQueryType.list),
          ),
        ),
        factory.createTypeReferenceNode(identifiers.primitive.array, [
          factory.createTypeReferenceNode(identifiers.compiler.model),
        ]),
      ]),
    ),
    SyntaxKind.MultiLineCommentTrivia,
    ' List all model definitions ',
    true,
  );

  /**
   * ```ts
   * declare const list: { ... };
   * ```
   */
  const listModelsQueryDeclaration = factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.DeclareKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          'list',
          undefined,
          factory.createTypeLiteralNode([listModelsQueryPropertyDeclaration]),
        ),
      ],
      NodeFlags.Const,
    ),
  );

  moduleBodyStatements.push(listModelsQueryDeclaration);

  // Note: `csf` prefix stands for `createSyntaxFactory`.

  /**
   * ```ts
   * (options: QueryHandlerOptions | (() => QueryHandlerOptions))
   * ```
   */
  const csfParameterTypeDec = factory.createParameterDeclaration(
    undefined,
    undefined,
    'options',
    undefined,
    factory.createUnionTypeNode([
      factory.createTypeReferenceNode(identifiers.ronin.queryHandlerOptions),
      factory.createFunctionTypeNode(
        undefined,
        [],
        factory.createTypeReferenceNode(identifiers.ronin.queryHandlerOptions),
      ),
    ]),
  );

  /**
   * ```ts
   * (...) => {
   *  add: typeof add,
   *  count: typeof count,
   *  get: typeof get,
   *  remove: typeof remove,
   *  set: typeof set,
   *  list: typeof list,
   *  alter: typeof alter,
   *  batch: typeof batch,
   *  create: typeof create,
   *  drop: typeof drop,
   *  sql: typeof sql,
   *  sqlBatch: typeof sqlBatch,
   * }
   * ```
   */
  const csfReturnTypeDec = factory.createTypeLiteralNode(
    [...DML_QUERY_TYPES, ...DDL_QUERY_TYPES, 'batch', 'sql', 'sqlBatch'].map(
      (queryType) =>
        factory.createPropertySignature(
          undefined,
          factory.createIdentifier(queryType),
          undefined,
          factory.createTypeQueryNode(factory.createIdentifier(queryType)),
        ),
    ),
  );

  moduleBodyStatements.push(
    /**
     * ```ts
     * declare const createSyntaxFactory: (
     *  options: QueryHandlerOptions | (() => QueryHandlerOptions)
     * ) => { ... }
     * ```
     */
    factory.createVariableStatement(
      [factory.createModifier(SyntaxKind.DeclareKeyword)],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            identifiers.ronin.createSyntaxFactory,
            undefined,
            factory.createFunctionTypeNode(
              undefined,
              [csfParameterTypeDec],
              csfReturnTypeDec,
            ),
          ),
        ],
        NodeFlags.Const,
      ),
    ),

    /**
     * ```ts
     * export default function (
     *  options: QueryHandlerOptions | (() => QueryHandlerOptions)
     * ) => { ... }
     * ```
     */
    factory.createFunctionDeclaration(
      [
        factory.createModifier(SyntaxKind.ExportKeyword),
        factory.createModifier(SyntaxKind.DefaultKeyword),
      ],
      undefined,
      undefined,
      undefined,
      [csfParameterTypeDec],
      csfReturnTypeDec,
      undefined,
    ),
  );

  return factory.createModuleDeclaration(
    [factory.createModifier(SyntaxKind.DeclareKeyword)],
    identifiers.ronin.module.root,
    factory.createModuleBlock(moduleBodyStatements),
  );
};
