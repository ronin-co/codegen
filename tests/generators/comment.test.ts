import { describe, expect, test } from 'bun:test';

import { generateQueryTypeComment } from '@/src/generators/comment';

describe('comment', () => {
  const modelName = 'account';

  test('add', () => {
    const comment = generateQueryTypeComment(modelName, 'add');
    expect(comment).toMatchSnapshot();
  });

  test('count', () => {
    const comment = generateQueryTypeComment(modelName, 'count');
    expect(comment).toMatchSnapshot();
  });

  test('get', () => {
    const comment = generateQueryTypeComment(modelName, 'get');
    expect(comment).toMatchSnapshot();
  });

  test('remove', () => {
    const comment = generateQueryTypeComment(modelName, 'remove');
    expect(comment).toMatchSnapshot();
  });

  test('set', () => {
    const comment = generateQueryTypeComment(modelName, 'set');
    expect(comment).toMatchSnapshot();
  });
});
