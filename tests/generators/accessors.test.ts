import { describe, expect, test } from 'bun:test';

import { generateAccessors } from '@/src/generators/accessors';

describe('accessors', () => {
  test('a basic model', () => {
    const accessors = generateAccessors({
      slug: 'account',
      pluralSlug: 'accounts',
    });

    expect(accessors).toMatchSnapshot();
  });

  test('a model with empty slug / plural slug', () => {
    const accessors = generateAccessors({
      slug: '',
      pluralSlug: '',
    });

    expect(accessors).toMatchSnapshot();
  });
});
