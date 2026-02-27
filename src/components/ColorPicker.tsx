import { useState, useEffect, useRef } from 'react';

interface Props {
  color: string;
  x: number; y: number;
  onApply: (color: string) => void;
  onClose: () => void;
}

const PRESETS = [
  '#FFFFFF','#D4A843','#3B7BFF','#2CB87A','#C23B22','#8B5CF6',
  '#FF6B6B','#4ECDC4','#F97316','#EC4899','#000000','#888888',
  '#1A1A2E','#16213E','#0F3460','#533483',
];

function isValidHex(h: string) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(h);
}

export function ColorPicker({ color, x, y, onApply, onClose }: Props) {
  const [hex, setHex] = useState(color);
  const [inputVal, setInputVal] = useState(color);
  const ref = useRef<HTMLDivElement>(null);

  // Keep in viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    if (r.right > vw) el.style.left = `${vw - r.width - 10}px`;
    if (r.bottom > vh) el.style.top = `${y - r.height - 10}px`;
  }, []);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => window.addEventListener('mousedown', h), 0);
    return () => window.removeEventListener('mousedown', h);
  }, [onClose]);

  const applyHex = (h: string) => {
    if (isValidHex(h)) { setHex(h); onApply(h); }
  };

  const handleInput = (val: string) => {
    setInputVal(val);
    const withHash = val.startsWith('#') ? val : `#${val}`;
    if (isValidHex(withHash)) { setHex(withHash); onApply(withHash); }
  };

  return (
    <div ref={ref} onMouseDown={e=>e.stopPropagation()}
      style={{ position:'fixed', left:x, top:y, zIndex:300, background:'#111111', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:14, width:220, boxShadow:'0 16px 48px rgba(0,0,0,0.85)', fontFamily:'Outfit, sans-serif' }}>

      {/* Big swatch + native picker */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
        <div style={{ position:'relative', width:44, height:44, borderRadius:8, background:isValidHex(hex)?hex:'#888', border:'2px solid rgba(255,255,255,0.15)', overflow:'hidden', flexShrink:0 }}>
          <input type="color" value={isValidHex(hex)?hex:'#888888'}
            onChange={e=>{ setHex(e.target.value); setInputVal(e.target.value); onApply(e.target.value); }}
            style={{ position:'absolute', inset:-8, width:'calc(100% + 16px)', height:'calc(100% + 16px)', opacity:0, cursor:'pointer', border:'none' }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Hex Code</div>
          <input value={inputVal} onChange={e=>handleInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') { applyHex(inputVal.startsWith('#')?inputVal:`#${inputVal}`); onClose(); } if(e.key==='Escape') onClose(); }}
            placeholder="#000000"
            style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, padding:'5px 8px', outline:'none', fontSize:12, color:'rgba(255,255,255,0.8)', fontFamily:'monospace', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* Presets */}
      <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Presets</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:5 }}>
        {PRESETS.map(p => (
          <div key={p} onClick={()=>{ setHex(p); setInputVal(p); onApply(p); }}
            style={{ width:'100%', paddingBottom:'100%', borderRadius:4, background:p, cursor:'pointer', border: hex===p ? '2px solid #D4A843' : '1.5px solid rgba(255,255,255,0.08)', boxSizing:'border-box' }} />
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginTop:12 }}>
        <button onClick={onClose}
          style={{ flex:1, padding:'6px 0', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, cursor:'pointer', fontSize:11, color:'rgba(255,255,255,0.5)', fontFamily:'Outfit, sans-serif' }}>
          Done
        </button>
      </div>
    </div>
  );
}
