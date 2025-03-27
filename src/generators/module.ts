import { NodeFlags, SyntaxKind, addSyntheticLeadingComment, factory } from 'typescript';

import { identifiers } from '@/src/constants/identifiers';
import { QUERY_TYPE_NAMES } from '@/src/constants/schema';
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

  /**
   * ```ts
   * declare const add: {};
   * declare const count: {};
   * declare const get: {};
   * declare const remove: {};
   * declare const set: {};
   * ```
   */
  for (const queryType of QUERY_TYPE_NAMES) {
    const declarationProperties = new Array<TypeElement>();
    for (const model of models) {
      const comment = generateQueryTypeComment(model.slug, queryType);
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
          // identifiers.compiler.queryType[queryType],
          identifiers.compiler.queryType[queryType],
          undefined,
        ),
        factory.createTypeOperatorNode(
          SyntaxKind.KeyOfKeyword,
          factory.createTypeReferenceNode(identifiers.compiler.queryType[queryType]),
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
          factory.createUnionTypeNode([
            singularModelIdentifier,
            factory.createLiteralTypeNode(factory.createNull()),
          ]),
        ]),
      );
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
          pluralSchemaIdentifier,
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

    const queryDeclaration = factory.createVariableStatement(
      [factory.createModifier(SyntaxKind.DeclareKeyword)],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            queryType,
            undefined,
            factory.createTypeLiteralNode(declarationProperties),
          ),
        ],
        NodeFlags.Const,
      ),
    );

    moduleBodyStatements.push(queryDeclaration);
  }

  return factory.createModuleDeclaration(
    [factory.createModifier(SyntaxKind.DeclareKeyword)],
    identifiers.ronin.module.root,
    factory.createModuleBlock(moduleBodyStatements),
  );
};
