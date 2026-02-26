import { useState } from 'react';
import { CardType, SectionKey, SECTION_ACCENT } from '../types';
import { StickyNote, ImageIcon, Link2, Palette, User, Briefcase, ZoomIn, ZoomOut, Maximize2, Trash2, Search, Plus, LayoutGrid, Undo2, Redo2, Group, Pencil } from 'lucide-react';

interface Props {
  zoom: number;
  boardTitle: string;
  onBoardTitleChange: (t: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddCard: (type: CardType) => void;
  onAddSection: (key: SectionKey, customName?: string, customColor?: string) => void;
  onAddGroup: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onClearAll: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const BTN: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 7,
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.55)',
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 9px',
  fontSize: 11,
  fontFamily: 'Outfit, sans-serif',
  whiteSpace: 'nowrap',
  transition: 'background 0.12s, color 0.12s',
};

const DIVIDER = <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />;

const CARD_BTNS: Array<{ type: CardType; icon: React.ReactNode; label: string }> = [
  { type: 'note',    icon: <StickyNote size={13} />,  label: 'Note' },
  { type: 'image',   icon: <ImageIcon size={13} />,   label: 'Image' },
  { type: 'link',    icon: <Link2 size={13} />,        label: 'Link' },
  { type: 'swatch',  icon: <Palette size={13} />,      label: 'Swatch' },
  { type: 'persona', icon: <User size={13} />,         label: 'Persona' },
  { type: 'project', icon: <Briefcase size={13} />,    label: 'Project' },
];

const PRESET_SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key: 'services', label: 'Services' },
  { key: 'clients',  label: 'Clients' },
  { key: 'identity', label: 'Identity' },
  { key: 'projects', label: 'Projects' },
  { key: 'notes',    label: 'Notes' },
];

export function Toolbar({
  zoom, boardTitle, onBoardTitleChange, searchQuery, onSearchChange,
  onAddCard, onAddSection, onAddGroup,
  onZoomIn, onZoomOut, onFitView, onClearAll,
  selectedCount, onDeleteSelected,
  onUndo, onRedo, canUndo, canRedo,
}: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [customName, setCustomName] = useState('');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(14,14,14,0.94)', backdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '7px 14px', height: 48,
    }}>

      {/* Logo / Board Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8, flexShrink: 0 }}>
        {editingTitle
          ? <input autoFocus value={boardTitle}
              onChange={e => onBoardTitleChange(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 14, fontWeight: 800, color: '#D4A843',
                fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', minWidth: 80,
              }} />
          : <span onDoubleClick={() => setEditingTitle(true)}
              style={{ fontSize: 14, fontWeight: 800, color: '#D4A843', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', cursor: 'text' }}
              title="Double-click to rename board">
              {boardTitle}
            </span>
        }
        <Pencil size={10} style={{ color: 'rgba(255,255,255,0.15)', cursor: 'pointer' }} onClick={() => setEditingTitle(true)} />
      </div>

      {DIVIDER}

      {/* Undo / Redo */}
      <button style={{ ...BTN, opacity: canUndo ? 1 : 0.35 }} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2 size={13} />
      </button>
      <button style={{ ...BTN, opacity: canRedo ? 1 : 0.35 }} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        <Redo2 size={13} />
      </button>

      {DIVIDER}

      {/* Add cards */}
      {CARD_BTNS.map(({ type, icon, label }) => (
        <button key={type} style={BTN} onClick={() => onAddCard(type)} title={`Add ${label}`}>
          {icon}
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{label}</span>
        </button>
      ))}

      {DIVIDER}

      {/* Add Section dropdown */}
      <div style={{ position: 'relative' }}>
        <button style={{ ...BTN, color: 'rgba(255,255,255,0.55)' }}
          onClick={() => setShowSectionMenu(v => !v)}>
          <LayoutGrid size={13} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Section</span>
          <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
        </button>

        {showSectionMenu && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowSectionMenu(false)} />
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 6,
              background: '#111111', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, minWidth: 200, zIndex: 200,
              boxShadow: '0 12px 40px rgba(0,0,0,0.7)', overflow: 'hidden',
            }}>
              {PRESET_SECTIONS.map(({ key, label }) => (
                <button key={key}
                  onClick={() => { onAddSection(key); setShowSectionMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif', fontSize: 12,
                    color: SECTION_ACCENT[key],
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: SECTION_ACCENT[key] }} />
                  {label}
                </button>
              ))}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

              {/* Custom section */}
              <div style={{ padding: '8px 14px', display: 'flex', gap: 6 }}
                onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                <input value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="Custom section name..."
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, padding: '5px 8px', outline: 'none', fontSize: 11,
                    color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif',
                  }} />
                <button onClick={() => { if (customName.trim()) { onAddSection('custom', customName.trim()); setCustomName(''); setShowSectionMenu(false); } }}
                  style={{ ...BTN, padding: '5px 10px', fontSize: 11, background: 'rgba(255,255,255,0.08)' }}>
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Group */}
      <button style={BTN} onClick={onAddGroup} title="Add group label to organise cards">
        <Group size={13} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Group</span>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 7, padding: '4px 9px',
      }}>
        <Search size={12} style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} />
        <input value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search..."
          style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Outfit, sans-serif', width: 120 }} />
      </div>

      {/* Zoom */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button style={BTN} onClick={onZoomOut}><ZoomOut size={13} /></button>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit, sans-serif', minWidth: 36, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button style={BTN} onClick={onZoomIn}><ZoomIn size={13} /></button>
        <button style={BTN} onClick={onFitView} title="Fit view"><Maximize2 size={13} /></button>
      </div>

      {/* Delete selected */}
      {selectedCount > 0 && (
        <button onClick={onDeleteSelected}
          style={{ ...BTN, borderColor: '#C23B2255', color: '#C23B22' }}>
          <Trash2 size={13} />
          <span>Delete ({selectedCount})</span>
        </button>
      )}
    </div>
  );
}
