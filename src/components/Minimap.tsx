import { CardData, SectionData, GroupData, SECTION_ACCENT } from '../types';

interface Props {
  cards: CardData[];
  sections: SectionData[];
  groups: GroupData[];
  panX: number; panY: number; zoom: number;
  viewportWidth: number; viewportHeight: number;
  onNavigate: (px: number, py: number) => void;
}

const MAP_W = 176, MAP_H = 110;
const CANVAS_W = 5000, CANVAS_H = 5000;

export function Minimap({ cards, sections, groups, panX, panY, zoom, viewportWidth, viewportHeight, onNavigate }: Props) {
  const sx = MAP_W / CANVAS_W, sy = MAP_H / CANVAS_H;
  const vpW = (viewportWidth / zoom) * sx;
  const vpH = (viewportHeight / zoom) * sy;
  const vpX = (-panX / zoom) * sx;
  const vpY = (-panY / zoom) * sy;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / MAP_W;
    const my = (e.clientY - rect.top) / MAP_H;
    onNavigate(viewportWidth / 2 - mx * CANVAS_W * zoom, viewportHeight / 2 - my * CANVAS_H * zoom);
  };

  return (
    <div onClick={handleClick} style={{
      position: 'fixed', bottom: 16, right: 16,
      width: MAP_W, height: MAP_H,
      background: 'rgba(12,12,12,0.88)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8, overflow: 'hidden', cursor: 'crosshair', zIndex: 90,
      backdropFilter: 'blur(8px)',
    }}>
      {sections.map(s => {
        const accent = s.customColor ?? SECTION_ACCENT[s.key];
        return <div key={s.id} style={{ position: 'absolute', left: s.x * sx, top: s.y * sy, width: s.width * sx, height: s.height * sy, background: `${accent}15`, border: `1px solid ${accent}40`, borderRadius: 2 }} />;
      })}
      {groups.map(g => (
        <div key={g.id} style={{ position: 'absolute', left: g.x * sx, top: g.y * sy, width: g.width * sx, height: g.height * sy, border: `1px dashed ${g.color}50`, borderRadius: 1 }} />
      ))}
      {cards.map(c => (
        <div key={c.id} style={{ position: 'absolute', left: c.x * sx, top: c.y * sy, width: Math.max(c.width * sx, 3), height: Math.max(c.height * sy, 2), background: 'rgba(255,255,255,0.18)', borderRadius: 1 }} />
      ))}
      <div style={{
        position: 'absolute', left: Math.max(0, vpX), top: Math.max(0, vpY),
        width: Math.min(vpW, MAP_W), height: Math.min(vpH, MAP_H),
        border: '1.5px solid rgba(212,168,67,0.6)', background: 'rgba(212,168,67,0.06)',
        borderRadius: 2, pointerEvents: 'none',
      }} />
    </div>
  );
}
