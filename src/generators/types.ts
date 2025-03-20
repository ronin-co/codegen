import { SyntaxKind, addSyntheticLeadingComment, factory } from 'typescript';

import { genericIdentifiers, identifiers } from '@/src/constants/identifiers';
import { MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD } from '@/src/constants/schema';
import { convertToPascalCase } from '@/src/utils/slug';

import type {
  InterfaceDeclaration,
  PropertySignature,
  TypeAliasDeclaration,
} from 'typescript';

import type { Model, ModelField } from '@/src/types/model';

const DEFAULT_FIELD_SLUGS = [
  'id',
  'ronin.createdAt',
  'ronin.createdBy',
  'ronin.locked',
  'ronin.updatedAt',
  'ronin.updatedBy',
] satisfies Array<string>;

/**
 * Generate all required type definitions for a provided RONIN model.
 *
 * This will generate an interface for the singular model type and a type alias
 * for the plural model type.
 *
 * The plural model type will be mapped to an array of the singular model type
 * and extend it with the plural model properties.
 *
 * @param models - All RONIN models of the addressed space.
 * @param model - A RONIN model to generate type definitions for.
 *
 * @returns - An array of type nodes to be added to the `index.d.ts` file.
 */
export const generateTypes = (
  models: Array<Model>,
): Array<InterfaceDeclaration | TypeAliasDeclaration> => {
  const nodes = new Array<InterfaceDeclaration | TypeAliasDeclaration>();

  for (const model of models) {
    const fields: Array<ModelField> = Object.entries(model.fields)
      .map(([slug, field]) => ({ ...field, slug }) as ModelField)
      .filter((field) => !DEFAULT_FIELD_SLUGS.includes(field.slug));

    const sortedFields = fields.sort((a, b) => a.slug.localeCompare(b.slug));

    const modelIdentifier = factory.createIdentifier(
      convertToPascalCase(`${model.slug}Schema`),
    );
    const singularModelIdentifier = factory.createIdentifier(
      convertToPascalCase(model.slug),
    );
    const pluralSchemaIdentifier = factory.createIdentifier(
      convertToPascalCase(model.pluralSlug),
    );

    const mappedModelFields = sortedFields
      .map((field) => {
        if (field.type === 'link') {
          const targetModel = models.find((model) => model.slug === field.target);

          // If the target model cannot be found, we still add the property
          // but instead map it to `unknown`.
          if (!targetModel)
            return factory.createPropertySignature(
              undefined,
              field.slug,
              undefined,
              factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
            );

          return factory.createPropertySignature(
            undefined,
            field.slug,
            undefined,
            factory.createTypeReferenceNode(
              convertToPascalCase(`${targetModel.slug}Schema`),
            ),
          );
        }

        return factory.createPropertySignature(
          undefined,
          field.slug,
          undefined,
          MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD[field.type],
        );
      })
      .filter(Boolean) as Array<PropertySignature>;

    /**
     * ```ts
     * interface SchemaSlugSchema extends Syntax.ResultRecord {
     *    name: string;
     *    // ...
     * }
     * ```
     */
    const modelnterfaceDec = factory.createInterfaceDeclaration(
      undefined,
      modelIdentifier,
      [],
      [
        // All models should extend the `Syntax.ResultRecord` interface.
        factory.createHeritageClause(SyntaxKind.ExtendsKeyword, [
          factory.createExpressionWithTypeArguments(
            factory.createPropertyAccessExpression(
              identifiers.syntax.namespace,
              identifiers.syntax.record,
            ),
            undefined,
          ),
        ]),
      ],
      mappedModelFields,
    );

    /**
     * ```ts
     * TIncluding extends RONIN.Including<SchemaInterface> = []
     * ```
     */
    const includingTypeParameter = factory.createTypeParameterDeclaration(
      undefined,
      genericIdentifiers.including,
      factory.createTypeReferenceNode(
        factory.createQualifiedName(
          identifiers.ronin.namespace,
          identifiers.util.including,
        ),
        [factory.createTypeReferenceNode(modelIdentifier, [])],
      ),
      factory.createTupleTypeNode([]),
    );

    /**
     * ```ts
     * RONIN.ReturnBasedOnIncluding<SchemaInterface, TIncluding>
     * ```
     */
    const modifiedReturnType = factory.createTypeReferenceNode(
      factory.createQualifiedName(
        identifiers.ronin.namespace,
        identifiers.util.returnBasedOnIncluding,
      ),
      [
        factory.createTypeReferenceNode(modelIdentifier, []),
        factory.createTypeReferenceNode(genericIdentifiers.including, []),
      ],
    );

    /**
     * ```ts
     * export type SingularSchemaSlug<
     *    TIncluding extends RONIN.Including<SchemaInterface> = []
     * > = RONIN.ReturnBasedOnIncluding<SchemaInterface, TIncluding>;
     * ```
     */
    const singularModelTypeDec = factory.createTypeAliasDeclaration(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      singularModelIdentifier,
      [includingTypeParameter],
      modifiedReturnType,
    );

    /**
     * ```ts
     * export type PluralSchemaSlug<
     *    TIncluding extends RONIN.Including<SchemaInterface> = []
     * > = Records<RONIN.ReturnBasedOnIncluding<SchemaInterface, TIncluding>>;
     * ```
     */
    const pluralModelTypeDec = factory.createTypeAliasDeclaration(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      pluralSchemaIdentifier,
      [includingTypeParameter],

      factory.createExpressionWithTypeArguments(
        factory.createPropertyAccessExpression(
          identifiers.ronin.namespace,
          identifiers.ronin.records,
        ),
        [modifiedReturnType],
      ),
    );

    // If the model does not have a summary / description
    // then we can continue to the next iteration & not add any comments.
    if (!model.summary) {
      nodes.push(modelnterfaceDec, singularModelTypeDec, pluralModelTypeDec);
      continue;
    }

    nodes.push(
      addSyntheticLeadingComment(
        modelnterfaceDec,
        SyntaxKind.MultiLineCommentTrivia,
        `*\n * ${model.summary}\n `,
        true,
      ),
      addSyntheticLeadingComment(
        singularModelTypeDec,
        SyntaxKind.MultiLineCommentTrivia,
        `*\n * ${model.summary}\n `,
        true,
      ),
      addSyntheticLeadingComment(
        pluralModelTypeDec,
        SyntaxKind.MultiLineCommentTrivia,
        `*\n * ${model.summary}\n `,
        true,
      ),
    );
  }

  return nodes;
};
