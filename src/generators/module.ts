import { NodeFlags, SyntaxKind, addSyntheticLeadingComment, factory } from 'typescript';

import { identifiers } from '@/src/constants/identifiers';
import { QUERY_TYPE_NAMES } from '@/src/constants/schema';
import { generateAccessors } from '@/src/generators/accessors';
import { generateQueryTypeComment } from '@/src/generators/comment';

import type { ModuleDeclaration, PropertySignature, Statement } from 'typescript';

import type { GenerateAccessorsResult } from '@/src/generators/accessors';
import type { Model } from '@/src/types/model';

/**
 * Generate a module augmentation for the `ronin` module to override the
 * standard filter interfaces with ones that are correctly typed specific to
 * this space.
 *
 * @param models - An array of RONIN models to generate type definitions for.
 *
 * @returns A module augmentation declaration to be added to `index.d.ts`.
 */
export const generateModule = (models: Array<Model>): ModuleDeclaration => {
  const accessorTypeDeclarations = new Map<string, GenerateAccessorsResult>();

  const sortedModels = models.sort((a, b) => a.slug.localeCompare(b.slug));
  for (const model of sortedModels) {
    const propertyGetter = generateAccessors({
      slug: model.slug,
      pluralSlug: model.pluralSlug,
    });

    accessorTypeDeclarations.set(model.slug, propertyGetter);
  }

  /**
   * ```ts
   * export interface ExtendedCounter {
   *  account: AccountCounter;
   *  accounts: AccountsCounter;
   * }
   * export interface ExtendedAdder {
   *  account: AccountAdder;
   *  accounts: AccountsAdder;
   *  }
   * export interface ExtendedRemover {
   *  account: AccountRemover;
   *  accounts: AccountsRemover;
   *  }
   * export interface ExtendedGetter {
   *  account: AccountGetter;
   *  accounts: AccountsGetter;
   *  }
   * export interface ExtendedSetter {
   *  account: AccountSetter;
   *  accounts: AccountsSetter;
   *  }
   * ```
   */
  const mappedQueryInterfaceDecs = QUERY_TYPE_NAMES.map((queryName) =>
    factory.createInterfaceDeclaration(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      queryName,
      undefined,
      undefined,
      sortedModels.flatMap((model) => {
        // TODO(@nurodev): Either add nullish check or update `accessorTypeDeclarations`
        // to explcitly type the map key as a keyof `models`.
        const specialDec = accessorTypeDeclarations.get(
          model.slug,
        ) as GenerateAccessorsResult;
        const comment = generateQueryTypeComment(model.name, queryName);

        const types = new Array<PropertySignature>();

        /** SINGULAR */
        types.push(
          addSyntheticLeadingComment(
            factory.createPropertySignature(
              undefined,
              model.slug,
              undefined,
              factory.createTypeReferenceNode(specialDec.singular[queryName].name, []),
            ),
            SyntaxKind.MultiLineCommentTrivia,
            comment.singular,
            true,
          ),
        );

        /** PLURAL */
        // TODO(@nurodev): Remove this condition check after `ronin` has
        // been updated to support creating multiple records at once.
        if (queryName !== 'ExtendedAdder')
          types.push(
            addSyntheticLeadingComment(
              factory.createPropertySignature(
                undefined,
                model.pluralSlug,
                undefined,
                factory.createTypeReferenceNode(specialDec.plural[queryName].name, []),
              ),
              SyntaxKind.MultiLineCommentTrivia,
              comment.plural,
              true,
            ),
          );

        return types;
      }),
    ),
  );

  /**
   * Combine all accessor type declarations for each model field:
   *
   * ```ts
   * interface AccountGetterReducedFunction { ... }
   * interface AccountWhereFunction { ... }
   *
   * type AccountWhere = { ... }
   *
   * interface AccountAdder { ... }
   * interface AccountCounter { ... }
   * interface AccountGetter { ... }
   * interface AccountRemover { ... }
   * interface AccountsAdder { ... }
   * interface AccountsCounter { ... }
   * interface AccountSetter { ... }
   * interface AccountsGetter { ... }
   * interface AccountsRemover { ... }
   * interface AccountsSetter { ... }
   * ```
   */
  const accessorTypeValues = accessorTypeDeclarations.values().flatMap(
    (dec): Array<Statement> =>
      // TODO(@nurodev): Remove object spread
      dec ? [...Object.values(dec.singular), ...Object.values(dec.plural)] : [],
  );

  /**
   * ```ts
   * export namespace RONIN { ... }
   * ```
   */
  const namespaceModuleDec = factory.createModuleDeclaration(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    identifiers.ronin.namespace,
    factory.createModuleBlock(mappedQueryInterfaceDecs),
    NodeFlags.Namespace,
  );

  const moduleBodyStatements = new Array<Statement>();
  for (const value of accessorTypeValues) moduleBodyStatements.push(value);
  moduleBodyStatements.push(namespaceModuleDec);

  return factory.createModuleDeclaration(
    [factory.createModifier(SyntaxKind.DeclareKeyword)],
    identifiers.ronin.module.root,
    factory.createModuleBlock(moduleBodyStatements),
  );
};
