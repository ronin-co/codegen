import { SyntaxKind, addSyntheticLeadingComment, factory } from 'typescript';

import { genericIdentifiers, identifiers } from '@/src/constants/identifiers';
import { MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD } from '@/src/constants/schema';
import { convertToPascalCase } from '@/src/utils/slug';

import type {
  InterfaceDeclaration,
  PropertySignature,
  TypeAliasDeclaration,
  TypeNode,
  TypeParameterDeclaration,
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

    const singularModelIdentifier = factory.createIdentifier(
      convertToPascalCase(model.slug),
    );
    const pluralSchemaIdentifier = factory.createIdentifier(
      convertToPascalCase(model.pluralSlug),
    );

    const hasLinkFields = fields.some(
      (field) =>
        field.type === 'link' && models.some((model) => model.slug === field.target),
    );
    const mappedModelFields = fields
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((field) => {
        const propertyUnionTypes = new Array<TypeNode>();

        switch (field.type) {
          case 'link': {
            // Check to make sure the target model exists. If it doesn't we
            // fall back to using `unknown` as the type.
            const targetModel = models.find((model) => model.slug === field.target);
            if (!targetModel) {
              propertyUnionTypes.push(
                factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
              );
              break;
            }

            // If the field is marked as `many` then we need to wrap the
            // type in an array.
            const schemaTypeRef = factory.createTypeReferenceNode(
              convertToPascalCase(targetModel.slug),
            );
            const resolvedLinkFieldNode = factory.createTypeReferenceNode(
              identifiers.utils.resolveSchema,
              [
                field.kind === 'many'
                  ? factory.createTypeReferenceNode(identifiers.primitive.array, [
                      schemaTypeRef,
                    ])
                  : schemaTypeRef,

                factory.createTypeReferenceNode(genericIdentifiers.using),

                factory.createLiteralTypeNode(factory.createStringLiteral(field.slug)),
              ],
            );

            propertyUnionTypes.push(resolvedLinkFieldNode);
            break;
          }
          case 'blob':
          case 'boolean':
          case 'date':
          case 'json':
          case 'number':
          case 'string': {
            const primitive = MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD[field.type];
            propertyUnionTypes.push(primitive);
            break;
          }
          default: {
            propertyUnionTypes.push(
              factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
            );
            break;
          }
        }

        // We need to mark fields as nullable if they are:
        // - Not required
        // - Not a link field
        // - Not a many-to-many link field
        if (field.required === false && field.type === 'link' && field.kind !== 'many')
          propertyUnionTypes.push(factory.createLiteralTypeNode(factory.createNull()));

        return factory.createPropertySignature(
          undefined,
          field.slug,
          undefined,
          factory.createUnionTypeNode(propertyUnionTypes),
        );
      })
      .filter(Boolean) as Array<PropertySignature>;

    const modelInterfaceTypeParameters = new Array<TypeParameterDeclaration>();
    const linkFieldKeys = fields
      .filter((field) => field.type === 'link')
      .map((field) => {
        const literal = factory.createStringLiteral(field.slug);
        return factory.createLiteralTypeNode(literal);
      });

    /**
     * ```ts
     * <TUsing extends Array<...> | 'all' = []>
     * ```
     */
    const usingGenericDec = factory.createTypeParameterDeclaration(
      undefined,
      genericIdentifiers.using,
      factory.createUnionTypeNode([
        factory.createTypeReferenceNode(identifiers.primitive.array, [
          factory.createUnionTypeNode(linkFieldKeys),
        ]),
        factory.createLiteralTypeNode(factory.createStringLiteral('all')),
      ]),
      factory.createTupleTypeNode([]),
    );

    if (hasLinkFields) modelInterfaceTypeParameters.push(usingGenericDec);

    /**
     * ```ts
     * SchemaSlugSchema<TUsing>
     * ```
     */
    const modelSchemaName = factory.createTypeReferenceNode(
      singularModelIdentifier,
      hasLinkFields ? [factory.createTypeReferenceNode(genericIdentifiers.using)] : [],
    );

    /**
     * ```ts
     * export type SchemaSlug<TUsing extends Array<...> | 'all' = []> = ResultRecord & {
     *  // ...
     * };
     * ```
     */
    const singularModelTypeDec = factory.createTypeAliasDeclaration(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      singularModelIdentifier,
      modelInterfaceTypeParameters,
      factory.createIntersectionTypeNode([
        factory.createExpressionWithTypeArguments(
          identifiers.syntax.resultRecord,
          undefined,
        ),
        factory.createTypeLiteralNode(mappedModelFields),
      ]),
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
     * export type SchemaPluralSlug<TUsing extends Array<...> | 'all' = []> = Array<SchemaSlug> & {
     *  moreBefore?: string;
     *  moreAfter?: string;
     * };
     * ```
     */
    const pluralModelTypeDec = factory.createTypeAliasDeclaration(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      pluralSchemaIdentifier,
      modelInterfaceTypeParameters,
      factory.createIntersectionTypeNode([
        pluralModelArrayTypeDec,
        pluralModelPaginationPropsTypeDec,
      ]),
    );

    // If the model does not have a summary / description
    // then we can continue to the next iteration & not add any comments.
    if (!model.summary) {
      nodes.push(singularModelTypeDec, pluralModelTypeDec);
      continue;
    }

    nodes.push(
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
