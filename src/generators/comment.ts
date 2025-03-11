import { READABLE_QUERY_TYPE_NAMES } from '@/src/constants/schema';

import type { QUERY_TYPE_NAMES } from '@/src/constants/schema';

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
  modelName: string,
  queryType: (typeof QUERY_TYPE_NAMES)[number],
): GenerateQueryTypeCommentResult => ({
  singular: ` ${READABLE_QUERY_TYPE_NAMES[queryType]} a single record of the ${modelName} model `,
  plural: ` ${READABLE_QUERY_TYPE_NAMES[queryType]} multiple records of the ${modelName} model `,
});
