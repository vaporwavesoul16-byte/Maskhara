import { useRef, useState } from 'react';
import { SectionData, SECTION_ACCENT, SECTION_BG } from '../types';

interface Props {
  section: SectionData;
  isSelected: boolean;
  zoom: number;
  onSelect: (e: React.MouseEvent) => void;
  onStartMove: (e: React.MouseEvent) => void;
  onStartResize: (e: React.MouseEvent, edge: string) => void;
  onUpdate: (patch: Partial<SectionData>) => void;
  onDelete: () => void;
}

const EDGES = [
  { id: 'n',  style: { top: 0, left: 12, right: 12, height: 10, cursor: 'n-resize' } },
  { id: 's',  style: { bottom: 0, left: 12, right: 12, height: 10, cursor: 's-resize' } },
  { id: 'e',  style: { right: 0, top: 12, bottom: 12, width: 10, cursor: 'e-resize' } },
  { id: 'w',  style: { left: 0, top: 12, bottom: 12, width: 10, cursor: 'w-resize' } },
  { id: 'ne', style: { top: 0, right: 0, width: 12, height: 12, cursor: 'ne-resize' } },
  { id: 'nw', style: { top: 0, left: 0, width: 12, height: 12, cursor: 'nw-resize' } },
  { id: 'se', style: { bottom: 0, right: 0, width: 12, height: 12, cursor: 'se-resize' } },
  { id: 'sw', style: { bottom: 0, left: 0, width: 12, height: 12, cursor: 'sw-resize' } },
];

export function Section({ section, isSelected, onSelect, onStartMove, onStartResize, onUpdate, onDelete }: Props) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingSublabel, setEditingSublabel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accent = section.customColor ?? SECTION_ACCENT[section.key];
  const bg = section.customColor
    ? `${section.customColor}08`
    : SECTION_BG[section.key];

  return (
    <div
      style={{
        position: 'absolute', left: section.x, top: section.y,
        width: section.width, height: section.height,
        background: bg,
        border: `1.5px solid ${isSelected ? accent : `${accent}30`}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 14,
        boxShadow: isSelected ? `0 0 0 2px ${accent}18` : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseDown={e => { onSelect(e); onStartMove(e); }}
    >
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '10px 14px 8px',
        display: 'flex', alignItems: 'baseline', gap: 10,
        pointerEvents: 'none',
      }}>
        {/* Label — double click to rename */}
        {editingLabel
          ? <input ref={inputRef} autoFocus value={section.label}
              onChange={e => onUpdate({ label: e.target.value })}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingLabel(false); }}
              onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, fontWeight: 700, color: accent,
                fontFamily: 'Syne, sans-serif', letterSpacing: '-0.01em',
                pointerEvents: 'all', minWidth: 80,
              }} />
          : <span
              onDoubleClick={e => { e.stopPropagation(); setEditingLabel(true); }}
              style={{
                fontSize: 13, fontWeight: 700, color: accent,
                fontFamily: 'Syne, sans-serif', letterSpacing: '-0.01em',
                cursor: 'text', pointerEvents: 'all',
              }}
              title="Double-click to rename"
            >
              {section.label}
            </span>
        }

        {/* Sublabel */}
        {editingSublabel
          ? <input autoFocus value={section.sublabel}
              onChange={e => onUpdate({ sublabel: e.target.value })}
              onBlur={() => setEditingSublabel(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingSublabel(false); }}
              onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 11, color: 'rgba(255,255,255,0.3)',
                fontFamily: 'Outfit, sans-serif', pointerEvents: 'all', minWidth: 60,
              }} />
          : <span onDoubleClick={e => { e.stopPropagation(); setEditingSublabel(true); }}
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontFamily: 'Outfit, sans-serif', cursor: 'text', pointerEvents: 'all' }}
              title="Double-click to edit subtitle">
              {section.sublabel}
            </span>
        }
      </div>

      {/* Controls when selected */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 8, right: 10,
          display: 'flex', gap: 6, alignItems: 'center', pointerEvents: 'all',
        }}>
          {/* Color picker */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: accent, border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
              <input type="color" value={accent}
                onChange={e => onUpdate({ customColor: e.target.value })}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none' }} />
            </div>
          </div>
          <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 5, cursor: 'pointer', color: 'rgba(255,255,255,0.35)',
              fontSize: 10, padding: '2px 7px', fontFamily: 'Outfit, sans-serif',
            }}>
            Remove
          </button>
        </div>
      )}

      {/* Resize handles */}
      {EDGES.map(({ id, style }) => (
        <div key={id} style={{ position: 'absolute', ...style, zIndex: 10 }}
          onMouseDown={e => { e.stopPropagation(); onStartResize(e, id); }} />
      ))}
    </div>
  );
}
