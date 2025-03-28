import { factory } from 'typescript';

import type { Identifier } from 'typescript';

/**
 * An identifier is the name of any type, interface, namespace, function, variable, etc.
 *
 * This can include any native utility types offered by TypeScript like `Partial`, `Record`, etc.
 *
 * Here we simply store a list of all identifiers used in the code generation package.
 */
export const identifiers = {
  compiler: {
    queryType: {
      add: factory.createIdentifier('AddQuery'),
      count: factory.createIdentifier('CountQuery'),
      get: factory.createIdentifier('GetQuery'),
      remove: factory.createIdentifier('RemoveQuery'),
      set: factory.createIdentifier('SetQuery'),
    },
    module: {
      root: factory.createIdentifier(JSON.stringify('@ronin/compiler')),
    },
    storedObject: factory.createIdentifier('StoredObject'),
  },
  primitive: {
    array: factory.createIdentifier('Array'),
    date: factory.createIdentifier('Date'),
  },
  ronin: {
    createSyntaxFactory: factory.createIdentifier('createSyntaxFactory'),
    queryHandlerOptions: factory.createIdentifier('QueryHandlerOptions'),
    module: {
      root: factory.createIdentifier(JSON.stringify('ronin')),
      types: factory.createIdentifier(JSON.stringify('ronin/types')),
    },
  },
  syntax: {
    deepCallable: factory.createIdentifier('DeepCallable'),
    module: {
      queries: factory.createIdentifier(JSON.stringify('@ronin/syntax/queries')),
    },
    resultRecord: factory.createIdentifier('ResultRecord'),
  },
  utils: {
    all: factory.createIdentifier('all'),
    resolveSchema: factory.createIdentifier('ResolveSchema'),
  },
} satisfies Record<string, Record<string, Identifier | Record<string, Identifier>>>;

/**
 * A list of all generic names used in the `@ronin/codegen` package.
 *
 * Similar to `identifiers` but designed specifically for use as generic names.
 */
export const genericIdentifiers = {
  key: factory.createIdentifier('TKey'),
  schema: factory.createIdentifier('TSchema'),
  using: factory.createIdentifier('TUsing'),
} satisfies Record<string, Identifier>;
