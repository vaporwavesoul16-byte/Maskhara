import { useRef, useState } from 'react';
import { CardData, CardType, SwatchEntry } from '../types';
import { ImageIcon, Link2, StickyNote, Palette, User, Briefcase, X } from 'lucide-react';

interface Props {
  card: CardData;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onStartMove: (e: React.MouseEvent) => void;
  onStartResize: (e: React.MouseEvent, edge: string) => void;
  onUpdate: (patch: Partial<CardData>) => void;
  onDelete: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  'planned':     '#8B5CF6',
  'in-progress': '#D4A843',
  'completed':   '#2CB87A',
  'on-hold':     '#C23B22',
};

const TYPE_ICON: Record<CardType, React.ReactNode> = {
  note:    <StickyNote size={11} />,
  image:   <ImageIcon size={11} />,
  link:    <Link2 size={11} />,
  swatch:  <Palette size={11} />,
  persona: <User size={11} />,
  project: <Briefcase size={11} />,
};

const F = 'Outfit, sans-serif';

function EditableText({ value, onChange, placeholder, multiline, style, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  multiline?: boolean; style?: React.CSSProperties; className?: string;
}) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <Tag value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
      rows={multiline ? 4 : undefined}
      style={{ background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: F, color: 'inherit', width: '100%', ...style }}
      className={className} />
  );
}

// Resize handle positions
const HANDLES = [
  { edge: 'nw', style: { top: -4, left: -4, cursor: 'nw-resize' } },
  { edge: 'n',  style: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
  { edge: 'ne', style: { top: -4, right: -4, cursor: 'ne-resize' } },
  { edge: 'e',  style: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize' } },
  { edge: 'se', style: { bottom: -4, right: -4, cursor: 'se-resize' } },
  { edge: 's',  style: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
  { edge: 'sw', style: { bottom: -4, left: -4, cursor: 'sw-resize' } },
  { edge: 'w',  style: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize' } },
];

// ── Image Card ──────────────────────────────────────────────
function ImageCard({ card, onUpdate }: { card: CardData; onUpdate: (p: Partial<CardData>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = 480, maxH = 400;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        // Add header height (~34px)
        onUpdate({ content: dataUrl, width: Math.max(w, 120), height: Math.max(h + 34, 80) });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{
          flex: 1, borderRadius: 6,
          border: card.content ? 'none' : '1.5px dashed rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', cursor: 'pointer',
          background: card.content ? 'transparent' : 'rgba(255,255,255,0.02)',
          minHeight: 60,
        }}
      >
        {card.content
          ? <img src={card.content} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 12, fontFamily: F }}>
              <ImageIcon size={22} style={{ marginBottom: 5, opacity: 0.4 }} />
              <div>Click or drop image</div>
            </div>
        }
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

function LinkCard({ card, onUpdate }: { card: CardData; onUpdate: (p: Partial<CardData>) => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <EditableText value={card.content} onChange={v => onUpdate({ content: v })} placeholder="https://..."
        style={{ fontSize: 12, color: '#5B9BFF', fontFamily: F, wordBreak: 'break-all' }} />
      {card.content.startsWith('http') && (
        <a href={card.content} target="_blank" rel="noreferrer"
          onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
          style={{ fontSize: 11, color: 'rgba(91,155,255,0.5)', textDecoration: 'underline', cursor: 'pointer', fontFamily: F }}>
          Open link →
        </a>
      )}
    </div>
  );
}

function SwatchCard({ card, onUpdate }: { card: CardData; onUpdate: (p: Partial<CardData>) => void }) {
  const swatches: SwatchEntry[] = card.swatches ?? [];
  const update = (idx: number, patch: Partial<SwatchEntry>) =>
    onUpdate({ swatches: swatches.map((s, i) => i === idx ? { ...s, ...patch } : s) });
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, alignContent: 'start' }}>
      {swatches.map((sw, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 32, borderRadius: 5, background: sw.hex || 'rgba(255,255,255,0.06)',
            border: '1.5px dashed rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <input type="color" value={sw.hex || '#000000'} onChange={e => update(i, { hex: e.target.value })}
              onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none' }} />
          </div>
          <input value={sw.hex} onChange={e => update(i, { hex: e.target.value })}
            onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
            placeholder="#hex"
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', width: '100%' }} />
          <input value={sw.label} onChange={e => update(i, { label: e.target.value })}
            onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
            placeholder="Name"
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: F, width: '100%' }} />
        </div>
      ))}
    </div>
  );
}

function PersonaCard({ card, onUpdate }: { card: CardData; onUpdate: (p: Partial<CardData>) => void }) {
  const f = card.personaFields ?? { archetype: '', goals: '', painPoints: '', notes: '' };
  const upd = (key: keyof typeof f, val: string) => onUpdate({ personaFields: { ...f, [key]: val } });
  const label: React.CSSProperties = { fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif', marginBottom: 3 };
  const field: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: F, lineHeight: 1.5 };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
      {([
        { key: 'archetype',  label: 'Archetype / Role', placeholder: 'e.g. Studio Founder, Art Director...' },
        { key: 'goals',      label: 'Goals',            placeholder: 'What do they want?' },
        { key: 'painPoints', label: 'Pain Points',      placeholder: 'What frustrates them?' },
        { key: 'notes',      label: 'Notes',            placeholder: 'Additional context...' },
      ] as const).map(({ key, label: lbl, placeholder }) => (
        <div key={key}>
          <div style={label}>{lbl}</div>
          <EditableText value={f[key]} onChange={v => upd(key, v)} placeholder={placeholder} multiline style={field} />
        </div>
      ))}
    </div>
  );
}

function ProjectCard({ card, onUpdate }: { card: CardData; onUpdate: (p: Partial<CardData>) => void }) {
  const f = card.projectFields ?? { status: 'planned', description: '', notes: '' };
  const upd = (key: keyof typeof f, val: string) => onUpdate({ projectFields: { ...f, [key]: val } as typeof f });
  const label: React.CSSProperties = { fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif', marginBottom: 3 };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
      <div>
        <div style={label}>Status</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}
          onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          {(['planned','in-progress','completed','on-hold'] as const).map(s => (
            <button key={s} onClick={() => upd('status', s)}
              style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20,
                border: `1px solid ${f.status === s ? STATUS_COLORS[s] : 'rgba(255,255,255,0.1)'}`,
                background: f.status === s ? `${STATUS_COLORS[s]}22` : 'transparent',
                color: f.status === s ? STATUS_COLORS[s] : 'rgba(255,255,255,0.3)',
                cursor: 'pointer', fontFamily: F, textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={label}>Description</div>
        <EditableText value={f.description} onChange={v => upd('description', v)} placeholder="Describe the project..." multiline
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: F, lineHeight: 1.5 }} />
      </div>
      <div>
        <div style={label}>Notes</div>
        <EditableText value={f.notes} onChange={v => upd('notes', v)} placeholder="Timeline, links..." multiline
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: F, lineHeight: 1.5 }} />
      </div>
    </div>
  );
}

function NoteCard({ card, onUpdate }: { card: CardData; onUpdate: (p: Partial<CardData>) => void }) {
  return (
    <EditableText value={card.content} onChange={v => onUpdate({ content: v })}
      placeholder="Write here..." multiline
      style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: F, lineHeight: 1.7, flex: 1, display: 'block' }} />
  );
}

// ── Main Card ────────────────────────────────────────────────
export function Card({ card, isSelected, onSelect, onStartMove, onStartResize, onUpdate, onDelete }: Props) {
  const [titleEdit, setTitleEdit] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    onSelect(e);
    onStartMove(e);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute', left: card.x, top: card.y,
        width: card.width, height: card.height,
        background: '#181C22',
        border: `1.5px solid ${isSelected ? 'rgba(212,168,67,0.7)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 9,
        boxShadow: isSelected ? '0 0 0 3px rgba(212,168,67,0.12), 0 6px 24px rgba(0,0,0,0.5)' : '0 3px 12px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', userSelect: 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'rgba(255,255,255,0.02)', flexShrink: 0,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center' }}>{TYPE_ICON[card.type]}</span>
        {titleEdit
          ? <input autoFocus value={card.title} onChange={e => onUpdate({ title: e.target.value })}
              onBlur={() => setTitleEdit(false)} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)', fontFamily: 'Syne, sans-serif' }} />
          : <span onDoubleClick={e => { e.stopPropagation(); setTitleEdit(true); }}
              style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.78)', fontFamily: 'Syne, sans-serif', cursor: 'text', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {card.title}
            </span>
        }
        <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center' }}>
          <X size={11} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {card.type === 'note'    && <NoteCard    card={card} onUpdate={onUpdate} />}
        {card.type === 'image'   && <ImageCard   card={card} onUpdate={onUpdate} />}
        {card.type === 'link'    && <LinkCard    card={card} onUpdate={onUpdate} />}
        {card.type === 'swatch'  && <SwatchCard  card={card} onUpdate={onUpdate} />}
        {card.type === 'persona' && <PersonaCard card={card} onUpdate={onUpdate} />}
        {card.type === 'project' && <ProjectCard card={card} onUpdate={onUpdate} />}
      </div>

      {/* Resize handles — only when selected */}
      {isSelected && HANDLES.map(({ edge, style }) => (
        <div key={edge}
          onMouseDown={e => { e.stopPropagation(); onStartResize(e, edge); }}
          style={{
            position: 'absolute', width: 8, height: 8,
            background: '#D4A843', border: '1.5px solid #0A0A0A',
            borderRadius: 2, zIndex: 10, ...style,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
