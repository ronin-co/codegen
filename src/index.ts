import {
  importRoninQueryTypesType,
  importRoninStoredObjectType,
  importSyntaxUtiltypesType,
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
  const nodes = new Array<Node>(importRoninQueryTypesType, importSyntaxUtiltypesType);

  // If there is any models that have a `blob()` field, we need to import the
  // `StoredObject` type from the `@ronin/compiler` package.
  const hasStoredObjectField = models.some((model) =>
    Object.values(model.fields).some((field) => field.type === 'blob'),
  );
  if (hasStoredObjectField) nodes.push(importRoninStoredObjectType);

  // Generate and add the type declarations for each model.
  const typeDeclarations = generateTypes(models);

  // Generate and add the `ronin` module augmentation..
  const moduleAugmentation = generateModule(models, typeDeclarations);
  nodes.push(moduleAugmentation);

  return printNodes(nodes);
};
