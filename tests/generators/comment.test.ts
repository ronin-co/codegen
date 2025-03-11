import { describe, expect, test } from 'bun:test';

import { generateQueryTypeComment } from '@/src/generators/comment';

describe('commnent', () => {
  const modelName = 'account';

  test('ExtendedAdder', () => {
    const comment = generateQueryTypeComment(modelName, 'ExtendedAdder');
    expect(comment).toMatchSnapshot();
  });

  test('ExtendedCounter', () => {
    const comment = generateQueryTypeComment(modelName, 'ExtendedCounter');
    expect(comment).toMatchSnapshot();
  });

  test('ExtendedGetter', () => {
    const comment = generateQueryTypeComment(modelName, 'ExtendedGetter');
    expect(comment).toMatchSnapshot();
  });

  test('ExtendedRemover', () => {
    const comment = generateQueryTypeComment(modelName, 'ExtendedRemover');
    expect(comment).toMatchSnapshot();
  });

  test('ExtendedSetter', () => {
    const comment = generateQueryTypeComment(modelName, 'ExtendedSetter');
    expect(comment).toMatchSnapshot();
  });
});
