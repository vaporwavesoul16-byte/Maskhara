import { Lock, Unlock, Trash2 } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  locked: boolean;
  onLock: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ITEM: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 9,
  padding: '9px 14px', cursor: 'pointer',
  fontSize: 12, fontFamily: 'Outfit, sans-serif',
  color: 'rgba(255,255,255,0.65)',
  border: 'none', background: 'none', width: '100%', textAlign: 'left',
};

export function ElementContextMenu({ x, y, locked, onLock, onDelete, onClose }: Props) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={onClose} />
      <div style={{
        position: 'fixed', left: x, top: y, zIndex: 300,
        background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, minWidth: 180,
        boxShadow: '0 16px 48px rgba(0,0,0,0.85)', overflow: 'hidden',
      }}>
        <button style={ITEM}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          onClick={() => { onLock(); onClose(); }}>
          {locked
            ? <><Unlock size={13} style={{ color: '#2CB87A' }} /><span style={{ color: '#2CB87A' }}>Unlock position & size</span></>
            : <><Lock size={13} style={{ color: '#D4A843' }} /><span style={{ color: '#D4A843' }}>Lock position & size</span></>
          }
        </button>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <button style={{ ...ITEM, color: '#C23B22' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(194,59,34,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          onClick={() => { onDelete(); onClose(); }}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </>
  );
}
