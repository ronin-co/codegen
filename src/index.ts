import {
  importQueryHandlerOptionsType,
  importRoninQueryTypesType,
  importRoninStoredObjectType,
  importSyntaxUtiltypesType,
  jsonArrayType,
  jsonObjectType,
  jsonPrimitiveType,
  resolveSchemaType,
} from '@/src/declarations';
import { generateModule } from '@/src/generators/module';
import { generateTypes } from '@/src/generators/types';
import { printNodes } from '@/src/utils/print';

import type { Node } from 'typescript';

import type { Model } from '@/src/types/model';
import { convertToPascalCase } from '@/src/utils/slug';
import type { ModelField } from '@ronin/compiler';

/**
 * Generates the complete `index.d.ts` file for a list of RONIN models.
 *
 * @param models - A list of models to generate the the types for.
 *
 * @returns A string of the complete `index.d.ts` file.
 */
export const generate = (models: Array<Model>): string => {
  // If there is any models that have a `blob()` field, we need to import the
  // `StoredObject` type from the `@ronin/compiler` package.
  const hasStoredObjectFields = models.some((model) =>
    Object.values(model.fields).some((field) => field.type === 'blob'),
  );

  // Each node represents any kind of "block" like
  // an import statement, interface, namespace, etc.
  const nodes = new Array<Node>(
    importRoninQueryTypesType,
    ...(hasStoredObjectFields ? [importRoninStoredObjectType] : []),
    importSyntaxUtiltypesType,
    importQueryHandlerOptionsType,
  );

  // If there is any models that have a `link()` field, we need to add the
  // `ResolveSchemaType` type.
  const hasLinkFields = models.some((model) =>
    Object.values(model.fields).some((field) => field.type === 'link'),
  );
  if (hasLinkFields) nodes.push(resolveSchemaType);

  const hasJsonFields = models.some((model) =>
    Object.values(model.fields).some((field) => field.type === 'json'),
  );
  if (hasJsonFields) nodes.push(jsonArrayType, jsonObjectType, jsonPrimitiveType);

  // Generate and add the type declarations for each model.
  const typeDeclarations = generateTypes(models);

  // Generate and add the `ronin` module augmentation..
  const moduleAugmentation = generateModule(models, typeDeclarations);
  nodes.push(moduleAugmentation);

  return printNodes(nodes);
};

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
      const stringMethods = methods.map(method => `${method}()`).join('.');

      lines.push(`  ${fieldSlug}: z.${stringMethods},`);
    }

    lines.push('});\n');
  }

  return lines.join('\n');
};
