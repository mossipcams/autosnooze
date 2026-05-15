# AutoSnooze Architecture

AutoSnooze is a modular monolith. Code should stay in a small number of explicit layers, with feature slices owning orchestration and components/services staying thin enough to reason about.

## Frontend layer direction

Preferred dependency flow:

`components -> features -> services/state -> utils/constants/types`

- `components/` owns Lit rendering, DOM events, and view state binding. Components may call feature modules, but should not reach directly into service or state runtime modules.
- `features/` owns user workflow orchestration such as pause, resume, scheduled snooze, card shell state, and automation-list derivation. Feature slices must not import other feature slices directly.
- `services/` owns Home Assistant service calls, websocket calls, and browser persistence adapters.
- `state/` owns pure state projection and store helpers.
- `utils/`, `constants/`, and `types/` are lower-level support modules and must not depend on runtime layers.

## Backend layer direction

Preferred dependency flow:

`services -> application -> runtime/infrastructure/domain/models`

- `services.py` owns Home Assistant service registration, schema entrypoints, and adapter glue.
- `application/` owns service use cases and validation flow.
- `runtime/` owns timers, restore flow, and mutable integration state helpers.
- `infrastructure/` owns persistence and external IO helpers.
- `domain/` and `models.py` own data shapes and domain-only helpers.

No upward imports: lower layers must not import higher-level orchestration modules to complete a workflow. If a lower layer needs behavior from a higher layer, pass a callable into it from the higher layer instead of importing upward.

## Boundary Exceptions

Any intentional exception to these directions must be temporary, covered by a focused contract test or remediation plan, and called out in the change that introduces it. Prefer deleting exceptions from `.dependency-cruiser.cjs` and backend architecture contracts as refactors land.
