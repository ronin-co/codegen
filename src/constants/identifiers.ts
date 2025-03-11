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
  primitive: {
    date: factory.createIdentifier('Date'),
    partial: factory.createIdentifier('Partial'),
    record: factory.createIdentifier('Record'),
  },
  ronin: {
    accessor: {
      adder: factory.createIdentifier('IAdder'),
      counter: factory.createIdentifier('ICounter'),
      getterPlural: factory.createIdentifier('IGetterPlural'),
      getterSingular: factory.createIdentifier('IGetterSingular'),
      remover: factory.createIdentifier('IRemover'),
      setter: factory.createIdentifier('ISetter'),
    },
    blob: factory.createIdentifier('Blob'),
    module: {
      root: factory.createIdentifier(JSON.stringify('ronin')),
      schema: factory.createIdentifier(JSON.stringify('ronin/schema')),
    },
    namespace: factory.createIdentifier('RONIN'),
    record: factory.createIdentifier('RoninRecord'),
    records: factory.createIdentifier('RoninRecords'),
  },
  syntax: {
    module: factory.createIdentifier(JSON.stringify('@ronin/syntax/queries')),
    namespace: factory.createIdentifier('Syntax'),
    record: factory.createIdentifier('ResultRecord'),
  },
  util: {
    including: factory.createIdentifier('Including'),
    prettify: factory.createIdentifier('Prettify'),
    returnBasedOnIncluding: factory.createIdentifier('ReturnBasedOnIncluding'),
  },
} satisfies Record<string, Record<string, Identifier | Record<string, Identifier>>>;

/**
 * A list of all generic names used in the `@ronin/codegen` package.
 *
 * Similar to `identifiers` but designed specifically for use as generic names.
 */
export const genericIdentifiers = {
  including: factory.createIdentifier('TIncluding'),
  key: factory.createIdentifier('TKey'),
  schema: factory.createIdentifier('TSchema'),
  slug: factory.createIdentifier('TSlug'),
} satisfies Record<string, Identifier>;
