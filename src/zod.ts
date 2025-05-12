import { convertToPascalCase } from '@/src/utils/slug';

import type { ModelField } from '@ronin/compiler';

import type { Model } from '@/src/types/model';

type ModelFieldType = Required<ModelField>['type'];

const ZOD_FIELD_TYPES = {
  blob: 'any',
  boolean: 'boolean',
  date: 'date',
  json: 'any',
  link: 'any',
  number: 'number',
  string: 'string',
} satisfies Record<ModelFieldType, string>;

/**
 * Generates the complete `index.ts` Zod schema file for a list of RONIN models.
 *
 * @param models - A list of models to generate the the types for.
 *
 * @returns A string of the complete `index.ts` file.
 */
export const generateZodSchema = (models: Array<Model>): string => {
  const lines = new Array<string | null>('import { z } from "zod";\n');

  // If no models are provided, an empty export is needed to avoid errors.
  if (models.length <= 0) lines.push('export {};');

  for (const model of models) {
    const modelName = convertToPascalCase(model.slug);

    const entries = new Array<string>();
    for (const [fieldSlug, field] of Object.entries(model.fields)) {
      const fieldType = field.type as ModelFieldType;
      const zodType = ZOD_FIELD_TYPES[fieldType];
      if (!zodType) continue;

      const methods = [zodType];
      if (field.required !== true) methods.push('optional');
      const stringMethods = methods.map((method) => `${method}()`).join('.');

      const normalizedFieldSlug = fieldSlug.includes('.')
        ? JSON.stringify(fieldSlug)
        : fieldSlug;

      entries.push(`\t${normalizedFieldSlug}: z.${stringMethods},`);
    }

    lines.push(
      `export const ${modelName}Schema = z.object({\n${entries.join('\n')}\n});`,
    );
  }

  return lines.join('\n');
};
