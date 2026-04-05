import { useEffect, useRef, useState } from 'react';
import { useMusaic, DEVICE_PRESETS, TIME_RANGES } from '../hooks/useMusaic.js';
import { renderWallpaper, exportAsPNG } from '../lib/renderer.js';
import { clearTokens } from '../lib/spotify.js';
import styles from './Builder.module.css';

export default function Builder() {
  const { config, updateConfig, cells, swapCell, canvasSize, loading, error, fetchData } = useMusaic();
  const canvasRef = useRef(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!canvasRef.current || cells.length === 0) return;
    setRendering(true);
    renderWallpaper(canvasRef.current, {
      backgroundColor: config.backgroundColor,
      backgroundImageUrl: config.backgroundImageUrl,
      backgroundDim: config.backgroundDim,
      cells,
      theme: config.theme,
      gap: config.gap,
      padding: config.padding,
      borderRadius: config.borderRadius,
      cellSizeOverride: config.cellSizeOverride,
      columns: config.columns,
    }).finally(() => setRendering(false));
  }, [config, cells]);

  function handleExport() {
    if (!canvasRef.current) return;
    exportAsPNG(canvasRef.current, 'musaic-wallpaper.png');
  }

  function handleLogout() {
    clearTokens();
    window.location.href = '/';
  }

  function handleBgImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateConfig('backgroundImageUrl', url);
  }

  // Radius label: 0 = Square, 100 = Circle
  const radiusLabel = config.borderRadius === 0
    ? 'Square'
    : config.borderRadius === 100
      ? 'Circle'
      : `${config.borderRadius}%`;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.wordmark}>Musaic</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        </div>

        <Section title="Source">
          <SegmentedControl
            options={['albums', 'artists']}
            labels={['Top Albums', 'Top Artists']}
            value={config.source}
            onChange={v => updateConfig('source', v)}
          />
          <Select
            label="Time range"
            options={Object.keys(TIME_RANGES)}
            value={Object.keys(TIME_RANGES).find(k => TIME_RANGES[k] === config.timeRange)}
            onChange={v => updateConfig('timeRange', TIME_RANGES[v])}
          />
          <button className={styles.fetchBtn} onClick={fetchData} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </Section>

        <Section title="Canvas">
          <Select
            label="Device"
            options={Object.keys(DEVICE_PRESETS)}
            value={config.device}
            onChange={v => updateConfig('device', v)}
          />
          {config.device === 'Custom' && (
            <div className={styles.row}>
              <NumberInput label="W" value={config.customWidth} onChange={v => updateConfig('customWidth', v)} min={360} max={4000} />
              <NumberInput label="H" value={config.customHeight} onChange={v => updateConfig('customHeight', v)} min={640} max={8000} />
            </div>
          )}
        </Section>

        <Section title="Layout">
          <SegmentedControl
            options={['grid', 'brick']}
            labels={['Grid', 'Brick']}
            value={config.theme}
            onChange={v => updateConfig('theme', v)}
          />
          <Slider
            label={`Cells: ${config.cellCount}`}
            min={1} max={50}
            value={config.cellCount}
            onChange={v => updateConfig('cellCount', v)}
          />
          <Slider
            label={`Columns: ${config.columns}`}
            min={1} max={Math.min(config.cellCount, 10)}
            value={Math.min(config.columns, config.cellCount)}
            onChange={v => updateConfig('columns', v)}
          />
          <Slider
            label={`Spacing: ${config.gap}px`}
            min={0} max={40}
            value={config.gap}
            onChange={v => updateConfig('gap', v)}
          />
          <Slider
            label={`Margin: ${config.padding}px`}
            min={0} max={80}
            value={config.padding}
            onChange={v => updateConfig('padding', v)}
          />
        </Section>

        <Section title="Cell Style">
          <Slider
            label={`Roundness: ${radiusLabel}`}
            min={0} max={100}
            value={config.borderRadius}
            onChange={v => updateConfig('borderRadius', v)}
          />
          <div className={styles.cellSizeRow}>
            <Slider
              label={`Cell size${config.cellSizeOverride ? `: ${config.cellSizeOverride}px` : ': Auto'}`}
              min={40} max={400}
              value={config.cellSizeOverride ?? 120}
              onChange={v => updateConfig('cellSizeOverride', v)}
              disabled={!config.cellSizeOverride}
            />
            <button
              className={`${styles.toggleBtn} ${config.cellSizeOverride ? styles.toggleBtnActive : ''}`}
              onClick={() => updateConfig('cellSizeOverride', config.cellSizeOverride ? null : 120)}
              title={config.cellSizeOverride ? 'Switch to auto' : 'Set manually'}
            >
              {config.cellSizeOverride ? 'Manual' : 'Auto'}
            </button>
          </div>
        </Section>

        <Section title="Background">
          <ColorInput
            label="Color"
            value={config.backgroundColor}
            onChange={v => updateConfig('backgroundColor', v)}
          />
          <label className={styles.fileLabel}>
            {config.backgroundImageUrl ? '↺ Replace image' : 'Import image'}
            <input type="file" accept="image/*" onChange={handleBgImport} hidden />
          </label>
          {config.backgroundImageUrl && (
            <button className={styles.clearBtn} onClick={() => updateConfig('backgroundImageUrl', null)}>
              Remove background image
            </button>
          )}
          <Slider
            label={`Dim: ${Math.round(config.backgroundDim * 100)}%`}
            min={0} max={100}
            value={Math.round(config.backgroundDim * 100)}
            onChange={v => updateConfig('backgroundDim', v / 100)}
          />
        </Section>

        <button className={styles.exportBtn} onClick={handleExport} disabled={rendering}>
          {rendering ? 'Rendering…' : 'Export PNG'}
        </button>
      </aside>

      <main className={styles.preview}>
        <div className={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className={styles.canvas}
          />
        </div>
      </main>
    </div>
  );
}

// ── UI Components ─────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function SegmentedControl({ options, labels, value, onChange }) {
  return (
    <div className={styles.segmented}>
      {options.map((opt, i) => (
        <button
          key={opt}
          className={`${styles.segment} ${value === opt ? styles.segmentActive : ''}`}
          onClick={() => onChange(opt)}
        >
          {labels?.[i] ?? opt}
        </button>
      ))}
    </div>
  );
}

function Select({ label, options, value, onChange }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select className={styles.select} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Slider({ label, min, max, value, onChange, disabled = false }) {
  return (
    <label className={`${styles.field} ${disabled ? styles.fieldDisabled : ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type="range"
        min={min} max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={styles.slider}
        disabled={disabled}
      />
    </label>
  );
}

function NumberInput({ label, value, onChange, min, max }) {
  return (
    <label className={styles.numberField}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type="number"
        className={styles.numberInput}
        value={value}
        min={min} max={max}
        onChange={e => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function ColorInput({ label, value, onChange }) {
  const toHex = (rgb) => {
    const m = rgb.match(/\d+/g);
    if (!m) return '#000000';
    return '#' + m.map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
  };
  const fromHex = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type="color"
        className={styles.colorPicker}
        value={toHex(value)}
        onChange={e => onChange(fromHex(e.target.value))}
      />
    </label>
  );
}
