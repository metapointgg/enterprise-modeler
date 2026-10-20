type OrganisationRecordType = 'person' | 'position' | 'role';

interface OrganisationRecordTarget {
  type: OrganisationRecordType;
  id: string;
}

function findButtonByDataset(
  selector: string,
  datasetKey: string,
  id: string,
): HTMLButtonElement | null {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(selector))
    .find((button) => button.dataset[datasetKey] === id) ?? null;
}

function openRecord(
  tabId: string,
  recordSelector: string,
  datasetKey: string,
  recordId: string,
  recordLabel: string,
): void {
  window.setTimeout(() => {
    const tab = findButtonByDataset('[data-tab]', 'tab', tabId);

    if (!tab) {
      console.warn(`Unable to locate the Organisation ${tabId} tab.`);
      return;
    }

    tab.click();

    window.setTimeout(() => {
      const recordButton = findButtonByDataset(
        recordSelector,
        datasetKey,
        recordId,
      );

      if (!recordButton) {
        console.warn(`Unable to locate organisation ${recordLabel} ${recordId}.`);
        return;
      }

      recordButton.click();
    }, 0);
  }, 0);
}

function openPerson(personId: string): void {
  openRecord('people', '[data-edit-person]', 'editPerson', personId, 'person');
}

function openPosition(positionId: string): void {
  openRecord('positions', '[data-edit-position]', 'editPosition', positionId, 'position');
}

function openRole(roleId: string): void {
  openRecord('roles', '[data-edit-role]', 'editRole', roleId, 'role');
}

function getOrganisationTarget(target: EventTarget | null): OrganisationRecordTarget | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const personCard = target.closest<HTMLElement>('[data-org-person]');
  if (personCard?.dataset.orgPerson) {
    return {
      type: 'person',
      id: personCard.dataset.orgPerson,
    };
  }

  const positionCard = target.closest<HTMLElement>('[data-org-position]');
  if (positionCard?.dataset.orgPosition) {
    return {
      type: 'position',
      id: positionCard.dataset.orgPosition,
    };
  }

  const roleCard = target.closest<HTMLElement>('[data-org-role]');
  if (roleCard?.dataset.orgRole) {
    return {
      type: 'role',
      id: roleCard.dataset.orgRole,
    };
  }

  return null;
}

function handleOrgChartNavigation(event: MouseEvent): void {
  const target = getOrganisationTarget(event.target);
  if (!target) {
    return;
  }

  if (target.type === 'person') {
    openPerson(target.id);
    return;
  }

  if (target.type === 'position') {
    openPosition(target.id);
    return;
  }

  openRole(target.id);
}

document.addEventListener('click', handleOrgChartNavigation, true);
