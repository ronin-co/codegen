import { SyntaxKind, addSyntheticLeadingComment, factory } from 'typescript';

import { identifiers } from '@/src/constants/identifiers';
import { MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD } from '@/src/constants/schema';
import { convertToPascalCase } from '@/src/utils/slug';

import type {
  InterfaceDeclaration,
  PropertySignature,
  TypeAliasDeclaration,
  TypeNode,
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
 * This will generate a shared schema interface that is then used to create type
 * aliases for both the singular and plural model types.
 *
 * The plural model type will be mapped to an array of the singular model type
 * and extend it with the plural model properties.
 *
 * @param models - All RONIN models of the addressed space.
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

    const modelIdentifier = factory.createIdentifier(
      convertToPascalCase(`${model.slug}Schema`),
    );
    const singularModelIdentifier = factory.createIdentifier(
      convertToPascalCase(model.slug),
    );
    const pluralSchemaIdentifier = factory.createIdentifier(
      convertToPascalCase(model.pluralSlug),
    );

    const mappedModelFields = fields
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((field) => {
        const propertyUnionTypes = new Array<TypeNode>();

        if (field.type === 'link') {
          const targetModel = models.find((model) => model.slug === field.target);
          propertyUnionTypes.push(
            targetModel
              ? factory.createTypeReferenceNode(
                  convertToPascalCase(`${targetModel.slug}Schema`),
                )
              : factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
          );
        }

        if (Object.keys(MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD).includes(field.type)) {
          const primitive = MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD[field.type];
          propertyUnionTypes.push(primitive);
        }

        // If the field is not required, we need to mark it as `| null`.
        if (field.required === false)
          propertyUnionTypes.push(factory.createLiteralTypeNode(factory.createNull()));

        return factory.createPropertySignature(
          undefined,
          field.slug,
          undefined,
          factory.createUnionTypeNode(propertyUnionTypes),
        );
      })
      .filter(Boolean) as Array<PropertySignature>;

    /**
     * ```ts
     * interface SchemaSlugSchema extends ResultRecord {
     *    name: string | null;
     *    email: string;
     *    // ...
     * }
     * ```
     */
    const modelInterfaceDec = factory.createInterfaceDeclaration(
      undefined,
      modelIdentifier,
      [],
      [
        // All models should extend the `ResultRecord` interface.
        factory.createHeritageClause(SyntaxKind.ExtendsKeyword, [
          factory.createExpressionWithTypeArguments(
            identifiers.syntax.resultRecord,
            undefined,
          ),
        ]),
      ],
      mappedModelFields,
    );

    const modelSchemaName = factory.createTypeReferenceNode(modelIdentifier, []);

    /**
     * ```ts
     * export type SchemaSlug = SchemaSlugSchema;
     * ```
     */
    const singularModelTypeDec = factory.createTypeAliasDeclaration(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      singularModelIdentifier,
      undefined,
      modelSchemaName,
    );

    /**
     * ```ts
     * Array<SchemaSlug>;
     * ```
     */
    const pluralModelArrayTypeDec = factory.createTypeReferenceNode(
      identifiers.primitive.array,
      [modelSchemaName],
    );

    /**
     * ```ts
     * {
     *  moreBefore?: string;
     *  moreAfter?: string;
     * };
     * ```
     */
    const pluralModelPaginationPropsTypeDec = factory.createTypeLiteralNode([
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier('moreBefore'),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
      ),
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier('moreAfter'),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
      ),
    ]);

    /**
     * ```ts
     * export type SchemaPluralSlug = Array<SchemaSlug>;
     * ```
     */
    const pluralModelTypeDec = factory.createTypeAliasDeclaration(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      pluralSchemaIdentifier,
      undefined,
      factory.createIntersectionTypeNode([
        pluralModelArrayTypeDec,
        pluralModelPaginationPropsTypeDec,
      ]),
    );

    // If the model does not have a summary / description
    // then we can continue to the next iteration & not add any comments.
    if (!model.summary) {
      nodes.push(modelInterfaceDec, singularModelTypeDec, pluralModelTypeDec);
      continue;
    }

    nodes.push(
      addSyntheticLeadingComment(
        modelInterfaceDec,
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
