import { describe, expect, test } from 'bun:test';
import { link, model, string } from 'ronin/schema';

import { generateTypes } from '@/src/generators/types';
import { printNodes } from '@/src/utils/print';

describe('types', () => {
  test('a basic model', () => {
    const AccountModel = model({
      slug: 'account',
      fields: {
        name: string(),
        email: string({ required: true }),
      },
    });

    // TODO(@nurodev): Refactor the `Model` type to be more based on current schema models.
    // @ts-expect-error Codegen models types differ from the schema model types.
    const typesResult = generateTypes([AccountModel], AccountModel);

    expect(typesResult).toHaveLength(3);

    const typesResultStr = printNodes(typesResult);

    expect(typesResultStr).toMatchSnapshot();
  });

  test('a model with a summary', () => {
    const AccountModel = model({
      slug: 'account',
      fields: {
        name: string(),
        email: string({ required: true }),
      },
      // @ts-expect-error This property is not native to RONIN models.
      summary: 'A user account.',
    });

    // TODO(@nurodev): Refactor the `Model` type to be more based on current schema models.
    // @ts-expect-error Codegen models types differ from the schema model types.
    const typesResult = generateTypes([AccountModel], AccountModel);

    expect(typesResult).toHaveLength(3);

    const typesResultStr = printNodes(typesResult);

    expect(typesResultStr).toMatchSnapshot();
  });

  test('a model with a link field', () => {
    const AccountModel = model({
      slug: 'account',
      fields: {
        name: string(),
        email: string({ required: true }),
      },
    });

    const PostModel = model({
      slug: 'post',
      fields: {
        title: string(),
        author: link({ target: 'account' }),
      },
    });

    // TODO(@nurodev): Refactor the `Model` type to be more based on current schema models.
    // @ts-expect-error Codegen models types differ from the schema model types.
    const typesResult = generateTypes([AccountModel, PostModel], PostModel);

    expect(typesResult).toHaveLength(3);

    const typesResultStr = printNodes(typesResult);

    expect(typesResultStr).toMatchSnapshot();
  });

  test('a model with a link field that does not exist', () => {
    const AccountModel = model({
      slug: 'account',
      fields: {
        name: string(),
        email: string({ required: true }),
        latestPost: link({ target: 'does_not_exist' }),
      },
    });

    // TODO(@nurodev): Refactor the `Model` type to be more based on current schema models.
    // @ts-expect-error Codegen models types differ from the schema model types.
    const typesResult = generateTypes([AccountModel], AccountModel);

    expect(typesResult).toHaveLength(3);

    const typesResultStr = printNodes(typesResult);

    expect(typesResultStr).toMatchSnapshot();
  });
});
