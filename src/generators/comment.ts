import { READABLE_QUERY_TYPE_NAMES } from '@/src/constants/schema';

import type { QUERY_TYPE_NAMES } from '@/src/constants/schema';
import type { Model } from '@/src/types/model';

interface GenerateQueryTypeCommentResult {
  singular: string;
  plural: string;
}

/**
 * Generate a text comment for a provided model & a given query type.
 *
 * @param modelName - The name of the model to generate a comment for.
 * @param queryType - The query type to generate a comment for.
 *
 * @returns An object containing both the singular and plural comment strings.
 */
export const generateQueryTypeComment = (
  model: Model,
  queryType: (typeof QUERY_TYPE_NAMES)[number],
): GenerateQueryTypeCommentResult => ({
  singular: ` ${READABLE_QUERY_TYPE_NAMES[queryType]} a single ${model.name ?? model.slug} record `,
  plural: ` ${READABLE_QUERY_TYPE_NAMES[queryType]} multiple ${model.name ?? model.slug} records `,
});
