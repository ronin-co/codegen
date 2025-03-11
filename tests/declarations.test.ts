import { describe, expect, test } from 'bun:test';

import { globImportSyntaxType, importRoninNamespaceType } from '@/src/declarations';
import { printNodes } from '@/src/utils/print';

describe('declarations', () => {
  test('import the RONIN namespace type from `ronin`', () => {
    const output = printNodes([importRoninNamespaceType]);
    expect(output).toStrictEqual(`import type { RONIN } from \"ronin\";\n`);
  });

  test('glob import from `@ronin/syntax`', () => {
    const output = printNodes([globImportSyntaxType]);
    expect(output).toStrictEqual(
      `import type * as Syntax from \"@ronin/syntax/queries\";\n`,
    );
  });
});
