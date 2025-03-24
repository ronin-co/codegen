import { describe, expect, test } from 'bun:test';
import { model, string } from 'ronin/schema';

import { generateModule } from '@/src/generators/module';
import { printNodes } from '@/src/utils/print';

describe('module', () => {
  test('a basic model', () => {
    const AccountModel = model({
      slug: 'account',
      pluralSlug: 'accounts',
      fields: {
        name: string(),
        email: string({ required: true }),
      },
    });

    // TODO(@nurodev): Refactor the `Model` type to be more based on current schema models.
    // @ts-expect-error Codegen models types differ from the schema model types.
    const moduleDeclaration = generateModule([AccountModel]);

    const moduleDeclarationStr = printNodes([moduleDeclaration]);

    expect(moduleDeclarationStr).toMatchSnapshot();
  });

  test('with no modules', () => {
    const moduleDeclaration = generateModule([]);

    const moduleDeclarationStr = printNodes([moduleDeclaration]);

    expect(moduleDeclarationStr).toMatchSnapshot();
  });

  test('with multiple models', () => {
    const AccountModel = model({
      slug: 'account',
      pluralSlug: 'accounts',
      fields: {
        name: string(),
        email: string({ required: true }),
      },
    });

    const PostModel = model({
      slug: 'post',
      pluralSlug: 'posts',
      fields: {
        title: string({ required: true }),
        description: string(),
      },
    });

    // @ts-expect-error Codegen models types differ from the schema model types.
    const moduleDeclaration = generateModule([AccountModel, PostModel]);
    const moduleDeclarationStr = printNodes([moduleDeclaration]);
    expect(moduleDeclarationStr).toMatchSnapshot();
  });
});
