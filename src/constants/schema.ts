import { SyntaxKind, factory } from 'typescript';

import { identifiers } from '@/src/constants/identifiers';

import type { TypeNode } from 'typescript';

import type { ModelField } from '@/src/types/model';

/**
 * A list of all model field types & their TypeScript type mapping.
 */
export const MODEL_TYPE_TO_SYNTAX_KIND_KEYWORD = {
  blob: factory.createTypeReferenceNode(identifiers.compiler.storedObject),
  boolean: factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
  date: factory.createTypeReferenceNode(identifiers.primitive.date),
  json: factory.createUnionTypeNode([
    factory.createTypeReferenceNode(identifiers.utils.jsonObject),
    factory.createTypeReferenceNode(identifiers.utils.jsonArray),
  ]),
  link: factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
  number: factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
  string: factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
} satisfies Record<ModelField['type'], TypeNode>;

/**
 * An array of all possible query types as human readable strings.
 */
export const QUERY_TYPE_NAMES = ['add', 'count', 'get', 'remove', 'set'] as const;

/**
 * A simple object mapping all query types to their human readable string.
 */
export const READABLE_QUERY_TYPE_NAMES = {
  add: 'Add',
  count: 'Count',
  get: 'Get',
  remove: 'Remove',
  set: 'Set',
} satisfies Record<(typeof QUERY_TYPE_NAMES)[number], string>;
