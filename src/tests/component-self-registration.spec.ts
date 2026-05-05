describe('component self registration', () => {
  function expectRegisteredSubclass(
    baseCtor: CustomElementConstructor,
    tag: string
  ): void {
    const registeredCtor = customElements.get(tag);
    expect(
      registeredCtor === baseCtor ||
        Object.prototype.isPrototypeOf.call(baseCtor, registeredCtor)
    ).toBe(true);
  }

  test('component modules register their shipped custom elements when imported', async () => {
    const [
      cardModule,
      editorModule,
      activePausesModule,
      durationSelectorModule,
      automationListModule,
      adjustModalModule,
    ] = await Promise.all([
      import('../components/autosnooze-card.js'),
      import('../components/autosnooze-card-editor.js'),
      import('../components/autosnooze-active-pauses.js'),
      import('../components/autosnooze-duration-selector.js'),
      import('../components/autosnooze-automation-list.js'),
      import('../components/autosnooze-adjust-modal.js'),
    ]);

    expectRegisteredSubclass(cardModule.AutomationPauseCard, 'autosnooze-card');
    expectRegisteredSubclass(editorModule.AutomationPauseCardEditor, 'autosnooze-card-editor');
    expectRegisteredSubclass(activePausesModule.AutoSnoozeActivePauses, 'autosnooze-active-pauses');
    expectRegisteredSubclass(durationSelectorModule.AutoSnoozeDurationSelector, 'autosnooze-duration-selector');
    expectRegisteredSubclass(automationListModule.AutoSnoozeAutomationList, 'autosnooze-automation-list');
    expectRegisteredSubclass(adjustModalModule.AutoSnoozeAdjustModal, 'autosnooze-adjust-modal');
  });
});
