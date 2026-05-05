const DEFINE_PATCHED_KEY = Symbol.for('autosnooze.customElements.define.patched');
const REGISTERED_CTORS_KEY = Symbol.for('autosnooze.customElements.registeredCtors');

interface AutoSnoozeCustomElementRegistry extends CustomElementRegistry {
  [DEFINE_PATCHED_KEY]?: boolean;
  [REGISTERED_CTORS_KEY]?: WeakSet<CustomElementConstructor>;
}

function isDuplicateConstructorError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('constructor has already been registered')
  );
}

function getRegisteredCtors(): WeakSet<CustomElementConstructor> {
  const registry = customElements as AutoSnoozeCustomElementRegistry;
  registry[REGISTERED_CTORS_KEY] ??= new WeakSet<CustomElementConstructor>();
  return registry[REGISTERED_CTORS_KEY];
}

function isJsdomRegistry(): boolean {
  return navigator.userAgent.toLowerCase().includes('jsdom');
}

function patchDefineForDuplicateConstructors(): void {
  if (!isJsdomRegistry()) {
    return;
  }

  const registry = customElements as AutoSnoozeCustomElementRegistry;
  if (registry[DEFINE_PATCHED_KEY]) {
    return;
  }

  const define = registry.define.bind(registry);
  registry.define = (
    tag: string,
    ctor: CustomElementConstructor,
    options?: ElementDefinitionOptions
  ): void => {
    const registeredCtors = getRegisteredCtors();
    if (registeredCtors.has(ctor) && !registry.get(tag)) {
      const DuplicateTagElement = class extends ctor {};
      define(tag, DuplicateTagElement, options);
      registeredCtors.add(DuplicateTagElement);
      return;
    }

    try {
      define(tag, ctor, options);
      registeredCtors.add(ctor);
    } catch (error) {
      if (!isDuplicateConstructorError(error)) {
        throw error;
      }

      const DuplicateTagElement = class extends ctor {};
      define(tag, DuplicateTagElement, options);
      registeredCtors.add(DuplicateTagElement);
    }
  };
  registry[DEFINE_PATCHED_KEY] = true;
}

export function defineAutoSnoozeElement(
  tag: string,
  ctor: CustomElementConstructor
): void {
  if (isJsdomRegistry()) {
    patchDefineForDuplicateConstructors();
  }

  if (customElements.get(tag)) {
    return;
  }

  customElements.define(tag, ctor);
}
