import { CardType, SectionKey, SECTION_ACCENT } from '../types';
import { StickyNote, ImageIcon, Link2, Palette, User, Briefcase, LayoutGrid, Group } from 'lucide-react';

interface Props {
  x: number; y: number;
  onAddCard: (type: CardType) => void;
  onAddSection: (key: SectionKey) => void;
  onAddGroup: () => void;
  onClose: () => void;
}

const ITEM: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 9,
  padding: '8px 14px', cursor: 'pointer',
  fontSize: 12, fontFamily: 'Outfit, sans-serif',
  color: 'rgba(255,255,255,0.65)',
  border: 'none', background: 'none', width: '100%', textAlign: 'left',
};

const LABEL: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.18)', fontFamily: 'Syne, sans-serif',
  padding: '9px 14px 4px',
};

const SEP = <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '3px 0' }} />;

const CARDS: Array<{ type: CardType; icon: React.ReactNode; label: string }> = [
  { type: 'note',    icon: <StickyNote size={13} />,  label: 'Note' },
  { type: 'image',   icon: <ImageIcon size={13} />,   label: 'Image' },
  { type: 'link',    icon: <Link2 size={13} />,        label: 'Link' },
  { type: 'swatch',  icon: <Palette size={13} />,      label: 'Colour Swatch' },
  { type: 'persona', icon: <User size={13} />,         label: 'Client Persona' },
  { type: 'project', icon: <Briefcase size={13} />,    label: 'Project Card' },
];

const SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key: 'services', label: 'Services & Products' },
  { key: 'clients',  label: 'Buyers & Clients' },
  { key: 'identity', label: 'Brand Identity' },
  { key: 'projects', label: 'Projects' },
  { key: 'notes',    label: 'Open Notes' },
];

export function ContextMenu({ x, y, onAddCard, onAddSection, onAddGroup, onClose }: Props) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={onClose} />
      <div style={{
        position: 'fixed', left: x, top: y, zIndex: 200,
        background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, minWidth: 210,
        boxShadow: '0 16px 48px rgba(0,0,0,0.85)', overflow: 'hidden',
      }}>
        <div style={LABEL}>Add Card</div>
        {CARDS.map(({ type, icon, label }) => (
          <button key={type} style={ITEM}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => { onAddCard(type); onClose(); }}>
            <span style={{ color: 'rgba(255,255,255,0.28)' }}>{icon}</span>
            {label}
          </button>
        ))}
        {SEP}
        <div style={LABEL}>Add Section</div>
        {SECTIONS.map(({ key, label }) => (
          <button key={key}
            style={{ ...ITEM, color: SECTION_ACCENT[key], opacity: 0.85 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.opacity = '0.85'; }}
            onClick={() => { onAddSection(key); onClose(); }}>
            <LayoutGrid size={13} />
            {label}
          </button>
        ))}
        {SEP}
        <button style={ITEM}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          onClick={() => { onAddGroup(); onClose(); }}>
          <span style={{ color: 'rgba(255,255,255,0.28)' }}><Group size={13} /></span>
          Add Group Label
        </button>
      </div>
    </>
  );
}
