import { SnapGuide } from '../utils/snap';

interface Props {
  guides: SnapGuide[];
}

export function SnapGuides({ guides }: Props) {
  if (!guides.length) return null;
  return (
    <>
      {guides.map((g, i) => {
        if (g.type === 'v') {
          return (
            <div key={i} style={{
              position: 'absolute',
              left: g.pos,
              top: g.start,
              width: 1,
              height: g.end - g.start,
              background: 'rgba(212,168,67,0.7)',
              pointerEvents: 'none',
              zIndex: 999,
              boxShadow: '0 0 4px rgba(212,168,67,0.4)',
            }} />
          );
        } else {
          return (
            <div key={i} style={{
              position: 'absolute',
              left: g.start,
              top: g.pos,
              width: g.end - g.start,
              height: 1,
              background: 'rgba(212,168,67,0.7)',
              pointerEvents: 'none',
              zIndex: 999,
              boxShadow: '0 0 4px rgba(212,168,67,0.4)',
            }} />
          );
        }
      })}
    </>
  );
}
