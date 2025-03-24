import { importRoninQueryTypesType, importSyntaxUtiltypesType } from '@/src/declarations';
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

  // Generate and add the type declarations for each model.
  const typeDeclarations = generateTypes(models);
  for (const typeDeclaration of typeDeclarations) nodes.push(typeDeclaration);

  // Generate and add the `ronin` module augmentation..
  const moduleAugmentation = generateModule(models);
  nodes.push(moduleAugmentation);

  return printNodes(nodes);
};
