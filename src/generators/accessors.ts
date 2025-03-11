import { SyntaxKind, factory } from 'typescript';

import { identifiers } from '@/src/constants/identifiers';
import { convertToPascalCase } from '@/src/utils/slug';

import type { InterfaceDeclaration } from 'typescript';

import type { QUERY_TYPE_NAMES } from '@/src/constants/schema';

export const FUNCTION_PROPERTIES = [
  'apply',
  'arguments',
  'bind',
  'call',
  'caller',
  'length',
  'name',
  'prototype',
  'toString',
] satisfies Array<string>;

interface GenerateAccessorsOptions {
  slug: string;
  pluralSlug: string;
}

export interface GenerateAccessorsResult {
  singular: Record<(typeof QUERY_TYPE_NAMES)[number], InterfaceDeclaration>;
  plural: Record<(typeof QUERY_TYPE_NAMES)[number], InterfaceDeclaration>;
}

/**
 * Generates the accessors interface declarations for a given model.
 *
 * @param options - The options to generate accessors for.
 * @param options.slug - The singular slug of the model.
 * @param options.pluralSlug - The plural slug of the model.
 *
 * @returns The generated accessors interface declarations.
 */
export const generateAccessors = (
  options: GenerateAccessorsOptions,
): GenerateAccessorsResult => {
  const modelIdentifier = convertToPascalCase(`${options.slug}Schema`);
  const capitalizedSlug = convertToPascalCase(options.slug);
  const capitalizedPluralSlug = convertToPascalCase(options.pluralSlug);

  /**
   * ```ts
   * interface AccountAdder extends RONIN.IAdder<Account> {}
   * interface AccountsAdder extends RONIN.IAdder<Account> {}
   * ```
   */
  const createAdderInterface = (plural: boolean): InterfaceDeclaration => {
    const interfaceName = `${plural ? capitalizedPluralSlug : capitalizedSlug}Adder`;

    return factory.createInterfaceDeclaration(
      undefined,
      interfaceName,
      undefined,
      [
        factory.createHeritageClause(SyntaxKind.ExtendsKeyword, [
          factory.createExpressionWithTypeArguments(
            factory.createPropertyAccessExpression(
              identifiers.ronin.namespace,
              identifiers.ronin.accessor.adder,
            ),
            [factory.createTypeReferenceNode(modelIdentifier, [])],
          ),
        ]),
      ],
      [],
    );
  };

  /**
   * ```ts
   * interface AccountCounter extends RONIN.ICounter<Account> {}
   * interface AccountsCounter extends RONIN.ICounter<Account> {}
   * ```
   */
  const createCounterInterface = (plural: boolean): InterfaceDeclaration => {
    const interfaceName = `${plural ? capitalizedPluralSlug : capitalizedSlug}Counter`;

    return factory.createInterfaceDeclaration(
      undefined,
      interfaceName,
      undefined,
      [
        factory.createHeritageClause(SyntaxKind.ExtendsKeyword, [
          factory.createExpressionWithTypeArguments(
            factory.createPropertyAccessExpression(
              identifiers.ronin.namespace,
              identifiers.ronin.accessor.counter,
            ),
            [factory.createTypeReferenceNode(modelIdentifier, [])],
          ),
        ]),
      ],
      [],
    );
  };

  /**
   * ```ts
   * interface AccountGetter extends RONIN.IGetterSingular<Account> {}
   * interface AccountsGetter extends RONIN.IGetterPlural<Account> {}
   * ```
   */
  const createGetterInterface = (plural: boolean): InterfaceDeclaration => {
    const interfaceName = `${plural ? capitalizedPluralSlug : capitalizedSlug}Getter`;
    const accessorName = plural
      ? identifiers.ronin.accessor.getterPlural
      : identifiers.ronin.accessor.getterSingular;

    return factory.createInterfaceDeclaration(
      undefined,
      interfaceName,
      undefined,
      [
        factory.createHeritageClause(SyntaxKind.ExtendsKeyword, [
          factory.createExpressionWithTypeArguments(
            factory.createPropertyAccessExpression(
              identifiers.ronin.namespace,
              accessorName,
            ),
            [factory.createTypeReferenceNode(modelIdentifier, [])],
          ),
        ]),
      ],
      [],
    );
  };

  /**
   * ```ts
   * interface AccountRemover extends RONIN.IRemover<Account> {}
   * interface AccountsRemover extends RONIN.IRemover<Account> {}
   * ```
   */
  const createRemoverInterface = (plural: boolean): InterfaceDeclaration => {
    const interfaceName = `${plural ? capitalizedPluralSlug : capitalizedSlug}Remover`;

    return factory.createInterfaceDeclaration(
      undefined,
      interfaceName,
      undefined,
      [
        factory.createHeritageClause(SyntaxKind.ExtendsKeyword, [
          factory.createExpressionWithTypeArguments(
            factory.createPropertyAccessExpression(
              identifiers.ronin.namespace,
              identifiers.ronin.accessor.remover,
            ),
            [factory.createTypeReferenceNode(modelIdentifier, [])],
          ),
        ]),
      ],
      [],
    );
  };

  /**
   * ```ts
   * interface AccountSetter extends RONIN.ISetter<Account> {}
   * interface AccountsSetter extends RONIN.ISetter<Account> {}
   * ```
   */
  const createSetterInterface = (plural: boolean): InterfaceDeclaration => {
    const interfaceName = `${plural ? capitalizedPluralSlug : capitalizedSlug}Setter`;

    return factory.createInterfaceDeclaration(
      undefined,
      interfaceName,
      undefined,
      [
        factory.createHeritageClause(SyntaxKind.ExtendsKeyword, [
          factory.createExpressionWithTypeArguments(
            factory.createPropertyAccessExpression(
              identifiers.ronin.namespace,
              identifiers.ronin.accessor.setter,
            ),
            [factory.createTypeReferenceNode(modelIdentifier, [])],
          ),
        ]),
      ],
      [],
    );
  };

  return {
    singular: {
      ExtendedAdder: createAdderInterface(false),
      ExtendedCounter: createCounterInterface(false),
      ExtendedGetter: createGetterInterface(false),
      ExtendedRemover: createRemoverInterface(false),
      ExtendedSetter: createSetterInterface(false),
    },
    plural: {
      ExtendedAdder: createAdderInterface(true),
      ExtendedCounter: createCounterInterface(true),
      ExtendedGetter: createGetterInterface(true),
      ExtendedRemover: createRemoverInterface(true),
      ExtendedSetter: createSetterInterface(true),
    },
  };
};
