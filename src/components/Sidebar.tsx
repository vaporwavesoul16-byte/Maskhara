import { SectionData, GroupData, SECTION_ACCENT } from '../types';

interface Props {
  sections: SectionData[];
  groups: GroupData[];
  onNavigate: (item: { x: number; y: number; width: number; height: number }) => void;
}

export function Sidebar({ sections, groups, onNavigate }: Props) {
  return (
    <div style={{
      position: 'fixed', top: 48, left: 0, bottom: 0, width: 196,
      background: 'rgba(12,12,12,0.94)', backdropFilter: 'blur(12px)',
      borderRight: '1px solid rgba(255,255,255,0.06)', zIndex: 90,
      display: 'flex', flexDirection: 'column', padding: '14px 0',
      overflowY: 'auto',
    }}>
      {sections.length > 0 && (
        <>
          <div style={{ padding: '0 14px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', fontFamily: 'Syne, sans-serif' }}>
            Sections
          </div>
          {sections.map(s => {
            const accent = s.customColor ?? SECTION_ACCENT[s.key];
            return (
              <button key={s.id} onClick={() => onNavigate(s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', display: 'flex', alignItems: 'flex-start', gap: 9, textAlign: 'left', width: '100%' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div style={{ width: 3, height: 28, borderRadius: 2, background: accent, opacity: 0.7, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.68)', fontFamily: 'Syne, sans-serif', lineHeight: 1.3 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.24)', fontFamily: 'Outfit, sans-serif', marginTop: 1 }}>{s.sublabel}</div>
                </div>
              </button>
            );
          })}
        </>
      )}

      {groups.length > 0 && (
        <>
          <div style={{ padding: '12px 14px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', fontFamily: 'Syne, sans-serif', borderTop: sections.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', marginTop: sections.length > 0 ? 8 : 0 }}>
            Groups
          </div>
          {groups.map(g => (
            <button key={g.id} onClick={() => onNavigate(g)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', width: '100%' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color, flexShrink: 0, border: `1px solid ${g.color}80` }} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit, sans-serif' }}>{g.label}</div>
            </button>
          ))}
        </>
      )}

      <div style={{ marginTop: 'auto', padding: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)', fontFamily: 'Outfit, sans-serif', lineHeight: 2 }}>
          <div>Middle-click to pan</div>
          <div>Scroll to zoom</div>
          <div>Right-click to add</div>
          <div>Drop images to import</div>
          <div>Ctrl+Z / Ctrl+Y to undo/redo</div>
          <div>Double-click to rename</div>
        </div>
      </div>
    </div>
  );
}
