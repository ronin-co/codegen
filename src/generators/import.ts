import { factory } from 'typescript';

import type { Expression, Identifier, ImportDeclaration } from 'typescript';

interface CreateImportDeclarationOptions {
  /**
   * A list of all the identifiers that should be imported.
   */
  identifiers: Array<{
    /**
     * The name of the identifier to import.
     */
    name: Identifier;
    /**
     * Whether the identifier should be marked as a type import.
     */
    type?: boolean;
  }>;
  /**
   * The name of the module or package or path to import from.
   */
  module: Expression;
  /**
   * Whether the import should be marked as a type import.
   */
  type?: boolean;
}

/**
 * Generates an `import {} from 'foobar';` declaration using a provided list of
 * identifiers.
 *
 * @param options - The options to use when generating the import declaration.
 *
 * @returns The generated import declaration.
 *
 * @example
 * ```ts
 * import { factory } from 'typescript';
 *
 * const declaration = createImportDeclaration({
 *  identifiers: [{ name: factory.createIdentifier('RONIN') }],
 *  module: factory.createIdentifier('ronin'),
 *  type: true,
 * });
 * // import type { RONIN } from 'ronin';
 * ```
 */
export const createImportDeclaration = (
  options: CreateImportDeclarationOptions,
): ImportDeclaration => {
  const namedBindings = factory.createNamedImports(
    options.identifiers.map((identifier) =>
      factory.createImportSpecifier(identifier.type ?? false, undefined, identifier.name),
    ),
  );

  const importClause = factory.createImportClause(
    options.type ?? false,
    undefined,
    namedBindings,
  );

  return factory.createImportDeclaration(undefined, importClause, options.module);
};

interface CreateGlobImportDeclarationOptions {
  /**
   * The identifier name to use for the glob import.
   */
  identifier: Identifier;
  /**
   * The name of the module or package or path to import from.
   */
  module: Expression;
  /**
   * Whether the import should be marked as a type import.
   */
  type?: boolean;
}

/**
 * Generates a glob `import * as X from 'foobar';` declaration using a provided
 * identifier.
 *
 * @param options - The options to use when generating the import declaration.
 *
 * @returns The generated import declaration.
 *
 * @example
 * ```ts
 * import { factory } from 'typescript';
 *
 * const declaration = createGlobImportDeclaration({
 *  identifier: factory.createIdentifier('Syntax'),
 *  module: factory.createIdentifier('@ronin/syntax'),
 *  type: true,
 * });
 * // import type * as Syntax from '@ronin/syntax';
 * ```
 */
export const createGlobImportDeclaration = (
  options: CreateGlobImportDeclarationOptions,
): ImportDeclaration => {
  const namedBinding = factory.createNamespaceImport(options.identifier);

  const importClause = factory.createImportClause(
    options.type ?? false,
    undefined,
    namedBinding,
  );

  return factory.createImportDeclaration(undefined, importClause, options.module);
};
