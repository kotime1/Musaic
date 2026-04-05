// ─── useMusaic ────────────────────────────────────────────────────────────────
// Central state for the wallpaper builder.

import { useState, useCallback } from 'react';
import { getTopAlbums, getTopArtists } from '../lib/spotify.js';
import { sampleBlendedColor } from '../lib/colorSampler.js';

export const DEVICE_PRESETS = {
  'Pixel 8 Pro':      { width: 1344, height: 2992 },
  'iPhone 15 Pro':    { width: 1179, height: 2556 },
  'Custom':           { width: 1080, height: 1920 },
};

export const TIME_RANGES = {
  'Last 4 weeks':  'short_term',
  '6 months':      'medium_term',
  'All time':      'long_term',
};

const DEFAULT_CONFIG = {
  // Data
  source: 'albums',         // 'albums' | 'artists'
  timeRange: 'medium_term',

  // Canvas
  device: 'iPhone 15 Pro',
  customWidth: 1080,
  customHeight: 1920,

  // Layout
  cellCount: 9,
  theme: 'grid',            // 'grid' | 'brick'
  gap: 12,
  padding: 24,
  borderRadius: 8,

  // Background
  backgroundColor: 'rgb(15, 15, 20)',
  backgroundImageUrl: null,
  backgroundDim: 0.3,
};

export function useMusaic() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [cells, setCells] = useState([]);       // [{ id, name, imageUrl, custom }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canvasSize = config.device === 'Custom'
    ? { width: config.customWidth, height: config.customHeight }
    : DEVICE_PRESETS[config.device];

  // ── Update a single config value ──────────────────────────────────────────
  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Fetch data from Spotify and populate cells ────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = config.source === 'albums'
        ? await getTopAlbums(config.timeRange, 50)
        : await getTopArtists(config.timeRange, 50);

      const sliced = items.slice(0, config.cellCount);
      const newCells = sliced.map(item => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        custom: false,
      }));

      // Pad with empty cells if fewer results than requested
      while (newCells.length < config.cellCount) {
        newCells.push({ id: `empty-${newCells.length}`, name: '', imageUrl: null, custom: false });
      }

      setCells(newCells);

      // Auto-sample background color from artwork
      const imageUrls = newCells.map(c => c.imageUrl).filter(Boolean);
      const sampled = await sampleBlendedColor(imageUrls);
      updateConfig('backgroundColor', sampled);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [config.source, config.timeRange, config.cellCount, updateConfig]);

  // ── Swap a single cell ────────────────────────────────────────────────────
  const swapCell = useCallback((index, newCell) => {
    setCells(prev => {
      const next = [...prev];
      next[index] = { ...newCell, custom: true };
      return next;
    });
  }, []);

  return {
    config,
    updateConfig,
    cells,
    setCells,
    swapCell,
    canvasSize,
    loading,
    error,
    fetchData,
  };
}
