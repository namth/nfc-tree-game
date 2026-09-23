jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn(() => null)
}));

import { CompendiumRepository } from '../src/storage/repositories/CompendiumRepository';
import { LeafType, LeafPalette, TreeGenetics } from '../src/types';

describe('Botanical Compendium Repository', () => {
  const sampleGenetics: TreeGenetics = {
    leafType: LeafType.MAPLE,
    paletteIndex: LeafPalette.AUTUMN,
    trunkColor: '#4a3b2c',
    branchAngle: 22,
    lengthDecay: 0.75,
    thicknessDecay: 0.55,
    maxDepth: 9,
    dnaSeed: 888888
  };

  it('should record new traits and identify new discoveries', async () => {
    const res = await CompendiumRepository.recordTreeTraits(sampleGenetics);
    expect(res.isNewDiscovery).toBe(true);
    expect(res.newTraits).toContain(`leaf_type_${LeafType.MAPLE}`);
    expect(res.newTraits).toContain(`palette_${LeafPalette.AUTUMN}`);
    expect(res.newTraits).toContain('trunk_#4a3b2c');
    expect(res.newTraits).toContain(`leaf_variety_${LeafType.MAPLE}_${LeafPalette.AUTUMN}`);
  });

  it('should not report new discovery when recording existing traits', async () => {
    const res2 = await CompendiumRepository.recordTreeTraits(sampleGenetics);
    expect(res2.isNewDiscovery).toBe(false);
    expect(res2.newTraits.length).toBe(0);
  });

  it('should return valid compendium statistics', async () => {
    const stats = await CompendiumRepository.getStats();
    expect(stats.totalTraits).toBe(168);
    expect(stats.totalDiscovered).toBeGreaterThanOrEqual(1);
    expect(stats.percent).toBeGreaterThan(0);
    expect(stats.hasUnviewedNew).toBe(true);
  });

  it('should mark all entries as viewed and clear hasUnviewedNew', async () => {
    await CompendiumRepository.markAllAsViewed();
    const statsAfter = await CompendiumRepository.getStats();
    expect(statsAfter.hasUnviewedNew).toBe(false);
  });

  it('should retrieve entries map with O(1) trait lookup', async () => {
    const map = await CompendiumRepository.getEntriesMap();
    const mapleKey = `leaf_type_${LeafType.MAPLE}`;
    expect(map[mapleKey]).toBeDefined();
    expect(map[mapleKey].traitType).toBe('leaf_type');
    expect(map[mapleKey].timesEncountered).toBeGreaterThanOrEqual(2);
  });

  it('should verify all trunk themes are common and correctly normalized', async () => {
    const { ALL_TRUNK_THEMES, findTrunkTheme } = require('../src/config/GeneticsConfig');
    expect(ALL_TRUNK_THEMES.length).toBe(9);
    for (const theme of ALL_TRUNK_THEMES) {
      expect(theme.rarity).toBe('common');
    }

    // Test normalization of legacy/RGB565 colors
    const emerald = findTrunkTheme('#2d2219');
    expect(emerald.id).toBe('emerald');

    const quantizedEmerald = findTrunkTheme('#292418');
    expect(quantizedEmerald.id).toBe('emerald');

    const legacyDefault = findTrunkTheme('#3a2d24');
    expect(legacyDefault).toBeDefined();
    expect(legacyDefault.rarity).toBe('common');

    // Test recording with a legacy color maps to canonical theme in entriesMap
    const legacyGenetics: TreeGenetics = {
      leafType: LeafType.ROUND,
      paletteIndex: LeafPalette.EMERALD,
      trunkColor: '#3a2d24',
      branchAngle: 20,
      lengthDecay: 0.75,
      thicknessDecay: 0.55,
      maxDepth: 9,
      dnaSeed: 12345
    };
    await CompendiumRepository.recordTreeTraits(legacyGenetics);
    const map = await CompendiumRepository.getEntriesMap();
    expect(map[`trunk_${legacyDefault.color}`]).toBeDefined();
    expect(map[`trunk_${legacyDefault.id}`]).toBeDefined();
  });
});
