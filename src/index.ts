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

/**
 * Generates the complete `index.d.ts` file for a RONIN package.
 *
 * @param models - A list of models to generate the the types for.
 *
 * @returns A string of the complete `index.d.ts` file.
 */
export const generate = (models: Array<Model>): string => {
  // Each node represents any kind of "block" like
  // an import statement, interface, namespace, etc.
  const nodes = new Array<Node>(
    importRoninQueryTypesType,
    importSyntaxUtiltypesType,
    importQueryHandlerOptionsType,
  );

  // Some types or imports are only needed if certain field types are provided
  for (const model of models) {
    const hasStoredObjectFields = Object.values(model.fields).some(
      (field) => field.type === 'blob',
    );
    if (hasStoredObjectFields) nodes.push(importRoninStoredObjectType);

    const hasLinkFields = Object.values(model.fields).some(
      (field) => field.type === 'link',
    );
    if (hasLinkFields) nodes.push(resolveSchemaType);

    const hasJsonFields = Object.values(model.fields).some(
      (field) => field.type === 'json',
    );
    if (hasJsonFields) nodes.push(jsonArrayType, jsonObjectType, jsonPrimitiveType);
  }

  // Generate and add the type declarations for each model.
  const typeDeclarations = generateTypes(models);

  // Generate and add the `ronin` module augmentation..
  const moduleAugmentation = generateModule(models, typeDeclarations);
  nodes.push(moduleAugmentation);

  return printNodes(nodes);
};
