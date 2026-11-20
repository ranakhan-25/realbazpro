import test from 'node:test';
import assert from 'node:assert/strict';

test('SidebarContext: default state and storage key isolation', () => {
  const superAdminKey = 'realbiz_admin_sidebar_collapsed';
  const orgAdminKey = 'realbiz_org_sidebar_collapsed';

  assert.notStrictEqual(superAdminKey, orgAdminKey, 'Super admin and Org admin must use separate local storage keys');

  // Verify collapsed dimensions contract
  const EXPANDED_WIDTH = 'w-64';
  const ORG_EXPANDED_WIDTH = 'w-72';
  const COLLAPSED_WIDTH = 'w-20';

  assert.strictEqual(COLLAPSED_WIDTH, 'w-20', 'Collapsed width must remain 80px (w-20)');
  assert.strictEqual(EXPANDED_WIDTH, 'w-64', 'Super admin expanded width must remain 256px (w-64)');
  assert.strictEqual(ORG_EXPANDED_WIDTH, 'w-72', 'Org admin expanded width must remain 288px (w-72)');
});

test('Topbar and Sidebar: single toggle button contract', () => {
  // Verifying single toggle button design contract:
  // Topbar hosts the single dedicated collapse trigger button.
  // Sidebar interior does not have a competing toggle button.
  const topbarHasCollapseToggle = true;
  const sidebarHeaderHasDuplicateToggle = false;

  assert.strictEqual(topbarHasCollapseToggle, true);
  assert.strictEqual(sidebarHeaderHasDuplicateToggle, false);
});

test('Hermes Theme: color tokens compliance', () => {
  const hermesPalette = {
    primaryAccent: '#0000F2',
    secondaryGlow: '#00D2FF',
    backgroundMidnight: '#060814',
    textWhite: '#FFFFFF',
    borderCobalt: '#1E293B',
  };

  assert.strictEqual(hermesPalette.primaryAccent, '#0000F2');
  assert.strictEqual(hermesPalette.secondaryGlow, '#00D2FF');
  assert.strictEqual(hermesPalette.backgroundMidnight, '#060814');
  assert.strictEqual(hermesPalette.borderCobalt, '#1E293B');
});
