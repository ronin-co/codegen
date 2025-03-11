import { SyntaxKind, factory } from 'typescript';

import { identifiers } from '@/src/constants/identifiers';

import type { TypeNode } from 'typescript';

import type { ModelField } from '@/src/types/model';

/**
 * A list of all model field types & their TypeScript type mapping.
 */
export const MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD = {
  number: factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
  link: factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
  string: factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
  date: factory.createTypeReferenceNode(identifiers.primitive.date),
  boolean: factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
  blob: factory.createExpressionWithTypeArguments(
    factory.createPropertyAccessExpression(
      identifiers.ronin.namespace,
      identifiers.ronin.blob,
    ),
    undefined,
  ),
  json: factory.createKeywordTypeNode(SyntaxKind.ObjectKeyword),
} satisfies Record<ModelField['type'], TypeNode>;

/**
 * An array of all possible query types as human readable strings.
 */
export const QUERY_TYPE_NAMES = [
  'ExtendedAdder',
  'ExtendedCounter',
  'ExtendedGetter',
  'ExtendedRemover',
  'ExtendedSetter',
] as const;

/**
 * A simple object mapping all query types to their human readable string.
 */
export const READABLE_QUERY_TYPE_NAMES = {
  ExtendedAdder: 'Add',
  ExtendedCounter: 'Count',
  ExtendedGetter: 'Get',
  ExtendedRemover: 'Remove',
  ExtendedSetter: 'Set',
} satisfies Record<(typeof QUERY_TYPE_NAMES)[number], string>;
