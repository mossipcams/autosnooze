# AutoSnooze Architecture

AutoSnooze is a modular monolith. The integration ships as one Home Assistant custom component and one bundled Lovelace card, but implementation should stay organized around small slices with clear dependency direction.

## Frontend Layers

Preferred dependency flow:

```text
src/components -> src/features -> src/services | src/state | src/utils | src/constants | src/types
```

Components own rendering, events, and local UI state. They should not import runtime services or shared state helpers directly. When a component needs orchestration or runtime data, expose that through a feature slice facade.

Feature slices own user-facing workflows such as pause, resume, scheduled snooze, automation list behavior, and card shell data access. A feature may depend on lower runtime layers, but feature slices should not depend on UI components.

Services own Home Assistant API calls, browser storage access, countdown synchronization, and registry reads. Services should not depend on UI components or shared frontend state.

State helpers own framework-agnostic snapshots, stores, and derived state. State should not depend on UI components, services, styles, localization, registration, or the frontend entry point.

Utilities, constants, and types sit at the bottom. They may be imported broadly but should not import higher layers.

## Backend Layers

Preferred dependency flow:

```text
services.py -> application -> runtime | infrastructure | models | const | logging_utils
sensor.py -> runtime | models | const
```

`services.py` is the Home Assistant service registration adapter. It should validate service calls and delegate orchestration to application modules.

Application modules own workflows such as pause, resume, adjust, schedule, and setup. They must not import `services.py`; that would couple orchestration back to the registration layer.

Runtime modules own restore, timers, and in-memory runtime helpers. Infrastructure modules own storage and other external persistence concerns. Models define serializable domain data and should remain low-level.

## Enforcement

Frontend boundaries are enforced by `.dependency-cruiser.cjs` through `npm run lint:deps`.

Backend service/application direction and persistence contracts are enforced by `ci_contracts`.

Generated card artifacts are checked by build and artifact contracts. If a boundary exception is unavoidable, document it as temporary and add a follow-up issue or contract update.
