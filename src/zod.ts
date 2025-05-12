import { convertToPascalCase } from '@/src/utils/slug';

import type { ModelField } from '@ronin/compiler';

import type { Model } from '@/src/types/model';

type ModelFieldType = Required<ModelField>['type'];

const ZOD_FIELD_TYPES: Record<ModelFieldType, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  date: 'date',
  json: 'any',
  link: 'any',
  blob: 'any',
};

/**
 * Generates the complete `index.ts` Zod schema file for a list of RONIN models.
 *
 * @param models - A list of models to generate the the types for.
 *
 * @returns A string of the complete `index.ts` file.
 */
export const generateZodSchema = (models: Array<Model>): string => {
  const lines = new Array<string | null>();
  lines.push('import { z } from "zod";\n');

  for (const model of models) {
    const modelName = convertToPascalCase(model.slug);

    lines.push(`export const ${modelName} = z.object({`);

    for (const [fieldSlug, field] of Object.entries(model.fields)) {
      const fieldType = field.type as ModelFieldType;
      const zodType = ZOD_FIELD_TYPES[fieldType];
      if (!zodType) continue;

      const methods = [zodType];
      if (field.required) methods.push('required');
      const stringMethods = methods.map((method) => `${method}()`).join('.');

      lines.push(`  ${fieldSlug}: z.${stringMethods},`);
    }

    lines.push('});\n');
  }

  return lines.join('\n');
};
