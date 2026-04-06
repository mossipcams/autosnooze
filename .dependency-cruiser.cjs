/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make the frontend state flow harder to reason about.',
      from: {
        path: '^src',
      },
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      comment: 'Every frontend source file should be reachable from the main entry point.',
      from: {
        orphan: true,
        path: '^src',
        pathNot: '^src/index\\.ts$',
      },
      to: {},
    },
    {
      name: 'no-unresolvable',
      severity: 'error',
      comment: 'Broken import paths should fail validation immediately.',
      from: {},
      to: {
        couldNotResolve: true,
      },
    },
    {
      name: 'no-runtime-utils-barrel-imports',
      severity: 'error',
      comment: 'Production code should import utility modules directly instead of going through the utils barrel.',
      from: {
        path: '^src/(components|state)/',
      },
      to: {
        path: '^src/utils/index\\.ts$',
      },
    },
    {
      name: 'no-runtime-services-barrel-imports',
      severity: 'error',
      comment: 'Production code should import service modules directly instead of going through the services barrel.',
      from: {
        path: '^src/components/',
        pathNot: '^src/components/autosnooze-actions-controller\\.ts$',
      },
      to: {
        path: '^src/services/index\\.ts$',
      },
    },
    {
      name: 'no-cross-feature-imports',
      severity: 'error',
      comment: 'Feature slices should not depend directly on one another.',
      from: {
        path: '^src/features/',
      },
      to: {
        path: '^src/features/',
      },
    },
    {
      name: 'components-no-direct-services-or-state',
      severity: 'warn',
      comment: 'Components should prefer feature modules over direct service/state imports as slices are extracted.',
      from: {
        path: '^src/components/',
        pathNot: '^src/components/autosnooze-(card|automation-list|duration-selector|active-pauses)\\.ts$',
      },
      to: {
        path: '^src/(services|state)/',
      },
    },
    {
      name: 'state-no-ui-or-service-dependencies',
      severity: 'error',
      comment: 'State helpers should remain framework-agnostic and not depend on UI, styles, localization, or services.',
      from: {
        path: '^src/state/',
      },
      to: {
        path: '^src/(components|services|styles|localization|registration|index)\\.',
      },
    },
    {
      name: 'services-no-ui-or-state-dependencies',
      severity: 'error',
      comment: 'Service helpers should not depend on UI or state modules.',
      from: {
        path: '^src/services/',
      },
      to: {
        path: '^src/(components|state|styles|localization|registration|index)\\.',
      },
    },
    {
      name: 'utils-no-runtime-dependencies',
      severity: 'error',
      comment: 'Utility modules should stay independent from services, state, and UI layers.',
      from: {
        path: '^src/utils/',
      },
      to: {
        path: '^src/(components|services|state|styles|localization|registration|index)\\.',
      },
    },
    {
      name: 'styles-no-runtime-dependencies',
      severity: 'error',
      comment: 'Style modules should not depend on runtime logic layers.',
      from: {
        path: '^src/styles/',
      },
      to: {
        path: '^src/(components|services|state|utils|localization|registration|index|constants|types)\\.',
      },
    },
    {
      name: 'types-no-runtime-dependencies',
      severity: 'error',
      comment: 'Type declarations should not depend on runtime modules.',
      from: {
        path: '^src/types/',
      },
      to: {
        path: '^src/(components|services|state|styles|utils|localization|constants|registration|index)\\.',
      },
    },
    {
      name: 'constants-no-runtime-dependencies',
      severity: 'error',
      comment: 'Constants should only depend on static type information.',
      from: {
        path: '^src/constants/',
      },
      to: {
        path: '^src/(components|services|state|styles|utils|localization|registration|index)\\.',
      },
    },
    {
      name: 'localization-no-runtime-dependencies',
      severity: 'error',
      comment: 'Localization helpers should not depend on runtime layers outside translations and types.',
      from: {
        path: '^src/localization/',
      },
      to: {
        path: '^src/(components|services|state|styles|utils|constants|registration|index)\\.',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: '(^|/)(node_modules|dist|coverage|custom_components|tests|e2e|ci_contracts)/',
    moduleSystems: ['es6', 'cjs'],
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: ['.ts', '.js', '.json'],
      conditionNames: ['import', 'require', 'node', 'default'],
      exportsFields: ['exports'],
      mainFields: ['module', 'main', 'types'],
    },
  },
};
