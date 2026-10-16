import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SYSTEM_MENUS, MenuItem } from '../index.js';

describe('System Menu Configuration Suite (docs/MENU_NAMES.md)', () => {
  it('should have exactly 15 top-level menus in the precise canonical order', () => {
    assert.equal(SYSTEM_MENUS.length, 15, 'Expected exactly 15 top-level menus');

    const expectedKeys = [
      'dashboard',
      'tasks',
      'sell',
      'counter-sale',
      'buy',
      'stock',
      'production',
      'customers',
      'leads',
      'jobs',
      'money',
      'staff',
      'reports',
      'import-export',
      'settings',
    ];

    const actualKeys = SYSTEM_MENUS.map((m) => m.key);
    assert.deepEqual(actualKeys, expectedKeys, 'Menu keys must match exact expected order');

    const expectedPaths = [
      '/dashboard',
      '/tasks',
      '/sell',
      '/counter-sale',
      '/buy',
      '/stock',
      '/production',
      '/customers',
      '/leads',
      '/jobs',
      '/money',
      '/staff',
      '/reports',
      '/import-export',
      '/settings',
    ];

    const actualPaths = SYSTEM_MENUS.map((m) => m.path);
    assert.deepEqual(actualPaths, expectedPaths, 'Top-level paths must match exact canonical URLs');
  });

  it('menu #1 must be Dashboard / ড্যাশবোর্ড at path /dashboard', () => {
    const firstMenu = SYSTEM_MENUS[0];
    assert.equal(firstMenu.key, 'dashboard');
    assert.equal(firstMenu.labelEn, 'Dashboard');
    assert.equal(firstMenu.labelBn, 'ড্যাশবোর্ড');
    assert.equal(firstMenu.path, '/dashboard');
    assert.equal(firstMenu.status, 'READY');
    assert.ok(firstMenu.children && firstMenu.children.length > 0);
    assert.equal(firstMenu.children[0].labelEn, 'Business Summary');
    assert.equal(firstMenu.children[0].labelBn, 'ব্যবসার সারসংক্ষেপ');
  });

  it('every top-level and sub-menu item must have non-empty English and Bengali labels', () => {
    function validateItemLabels(item: MenuItem, parentKey?: string) {
      assert.ok(
        typeof item.labelEn === 'string' && item.labelEn.trim().length > 0,
        `Item ${item.key} (parent: ${parentKey || 'root'}) must have non-empty labelEn`
      );
      assert.ok(
        typeof item.labelBn === 'string' && item.labelBn.trim().length > 0,
        `Item ${item.key} (parent: ${parentKey || 'root'}) must have non-empty labelBn`
      );
      assert.ok(
        typeof item.path === 'string' && item.path.startsWith('/'),
        `Item ${item.key} must have valid path starting with /`
      );

      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          validateItemLabels(child, item.key);
        }
      }
    }

    for (const menu of SYSTEM_MENUS) {
      validateItemLabels(menu);
    }
  });

  it('all menu paths across the entire navigation tree must be strictly unique', () => {
    const allPaths: string[] = [];

    function collectPaths(item: MenuItem) {
      allPaths.push(item.path);
      if (item.children) {
        for (const child of item.children) {
          collectPaths(child);
        }
      }
    }

    for (const menu of SYSTEM_MENUS) {
      collectPaths(menu);
    }

    const uniquePaths = new Set(allPaths);
    assert.equal(
      allPaths.length,
      uniquePaths.size,
      `Detected duplicate paths: ${allPaths.filter((p, i) => allPaths.indexOf(p) !== i).join(', ')}`
    );
  });

  it('all locked (🔒) menus must have HIDDEN_UNTIL_ENABLED status and a valid requiredModule', () => {
    const lockedKeys = ['counter-sale', 'production', 'leads', 'jobs', 'staff'];
    const expectedModules: Record<string, string> = {
      'counter-sale': 'counter-sale',
      production: 'production',
      leads: 'crm',
      jobs: 'projects',
      staff: 'hr',
    };

    for (const menu of SYSTEM_MENUS) {
      if (lockedKeys.includes(menu.key)) {
        assert.equal(
          menu.status,
          'HIDDEN_UNTIL_ENABLED',
          `Menu ${menu.key} must have status HIDDEN_UNTIL_ENABLED`
        );
        assert.equal(
          menu.requiredModule,
          expectedModules[menu.key],
          `Menu ${menu.key} must require module ${expectedModules[menu.key]}`
        );

        if (menu.children) {
          for (const child of menu.children) {
            assert.equal(
              child.status,
              'HIDDEN_UNTIL_ENABLED',
              `Sub-menu ${child.key} of locked menu ${menu.key} must also be HIDDEN_UNTIL_ENABLED`
            );
            assert.equal(
              child.requiredModule,
              expectedModules[menu.key],
              `Sub-menu ${child.key} must inherit requiredModule ${expectedModules[menu.key]}`
            );
          }
        }
      } else {
        assert.equal(
          menu.status,
          'READY',
          `Standard menu ${menu.key} must have status READY`
        );
      }
    }
  });

  it('every path in menu.ts must have a corresponding page.tsx file in apps/web', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const allPaths: string[] = [];
    function collectPaths(item: MenuItem) {
      allPaths.push(item.path);
      if (item.children) {
        for (const child of item.children) {
          collectPaths(child);
        }
      }
    }

    for (const menu of SYSTEM_MENUS) {
      collectPaths(menu);
    }

    const findRepoRoot = (dir: string): string => {
      if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
      const parent = path.dirname(dir);
      if (parent === dir) return dir;
      return findRepoRoot(parent);
    };
    const repoRoot = findRepoRoot(process.cwd());
    const webAppStoreDir = path.join(repoRoot, 'apps/web/src/app/[storeSlug]');

    const missingPaths: string[] = [];
    for (const menuPath of allPaths) {
      const relPath = menuPath.replace(/^\//, '');
      const expectedPageFile = path.join(webAppStoreDir, relPath, 'page.tsx');
      if (!fs.existsSync(expectedPageFile)) {
        missingPaths.push(menuPath);
      }
    }

    assert.equal(
      missingPaths.length,
      0,
      `The following menu paths are missing page.tsx files: ${missingPaths.join(', ')}`
    );
  });
});

