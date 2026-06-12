# AutoSnooze Architecture

AutoSnooze is a modular monolith. Code should stay in a small number of explicit layers, with feature slices owning orchestration and components/services staying thin enough to reason about.

## Frontend layer direction

Preferred dependency flow:

`components -> features -> services/state -> utils/constants/types`

Components own rendering, events, and local UI state. They should not import runtime services or shared state helpers directly. When a component needs orchestration or runtime data, expose that through a feature slice facade.

Feature slices own user-facing workflows such as pause, resume, scheduled snooze, automation list behavior, and card shell data access. A feature may depend on lower runtime layers, but feature slices should not depend on UI components.
Feature APIs use one public name per use case; duplicate action aliases are prohibited.

Services own Home Assistant API calls, browser storage access, countdown synchronization, and registry reads. Services should not depend on UI components or shared frontend state.

State helpers own framework-agnostic snapshots, stores, and derived state. State should not depend on UI components, services, styles, localization, registration, or the frontend entry point.

Utilities, constants, and types sit at the bottom. They may be imported broadly but should not import higher layers.

Focused UI components own UI-specific lifecycle behavior such as toast timers and scheduled-list rendering. The main card composes those components and routes events. The card-shell controller owns registry loading, retry scheduling, automation caching, and teardown.

## Backend layer direction

Preferred dependency flow:

`services -> application -> runtime/infrastructure/domain/models`

`services.py` is the Home Assistant service registration adapter. It should validate service calls and delegate orchestration to application modules.

Application modules own workflows such as pause, resume, adjust, schedule, and setup. They must not import `services.py`; that would couple orchestration back to the registration layer.

Runtime modules own restore, timers, and in-memory runtime helpers. Infrastructure modules own storage and other external persistence concerns. Models define serializable domain data and should remain low-level.

No upward imports: lower layers must not import higher-level orchestration modules to complete a workflow. If a lower layer needs behavior from a higher layer, pass a callable into it from the higher layer instead of importing upward.

`__init__.py` is the lifecycle composition root. It supplies explicit callbacks to runtime timers and restore operations. Runtime modules must not store higher-layer behavior in mutable callback registries.

Each workflow family has one application module: pause, resume, scheduled snooze, adjust, and notifications. `services.py` registers Home Assistant services and delegates to those owners; it does not duplicate their workflows.

## Enforcement

Frontend boundaries are enforced by `.dependency-cruiser.cjs` through `npm run lint:deps`.

Backend service/application direction and persistence contracts are enforced by `ci_contracts`.

Generated card artifacts are checked by build and artifact contracts. If a boundary exception is unavoidable, document it as temporary and add a follow-up issue or contract update.
