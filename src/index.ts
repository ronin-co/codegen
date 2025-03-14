import { globImportSyntaxType, importRoninNamespaceType } from '@/src/declarations';
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
  const nodes = new Array<Node>(importRoninNamespaceType, globImportSyntaxType);

  // Generate and add the type declarations for each model.
  for (const model of models) {
    const typeDeclarations = generateTypes(models, model);
    for (const typeDeclaration of typeDeclarations) nodes.push(typeDeclaration);
  }

  // Generate and add the `ronin` module augmentation..
  nodes.push(generateModule(models));

  const codeStr = printNodes(nodes);

  return codeStr;
};
