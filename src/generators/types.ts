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

        switch (field.type) {
          case 'link': {
            const targetModel = models.find((model) => model.slug === field.target);
            propertyUnionTypes.push(
              targetModel
                ? factory.createTypeReferenceNode(
                    convertToPascalCase(`${targetModel.slug}Schema`),
                  )
                : factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
            );
            break;
          }
          case 'blob':
          case 'boolean':
          case 'date':
          case 'json':
          case 'number':
          case 'string': {
            propertyUnionTypes.push(MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD[field.type]);
            break;
          }
          default: {
            throw new Error('Unsupported field type found', {
              cause: field,
            });
          }
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
     * export type SchemaPluralSlug = Array<SchemaSlug>;
     * ```
     */
    const pluralModelTypeDec = factory.createTypeAliasDeclaration(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      pluralSchemaIdentifier,
      undefined,
      factory.createTypeReferenceNode(identifiers.primitive.array, [modelSchemaName]),
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
