import { useRef, useState } from 'react';
import { CardType, SectionKey, SECTION_ACCENT } from '../types';
import { StickyNote, ImageIcon, Link2, Palette, User, Briefcase, ZoomIn, ZoomOut, Maximize2, Trash2, Search, Plus, LayoutGrid, Undo2, Redo2, Group, Pencil, Download, Upload, Menu, X } from 'lucide-react';

interface Props {
  zoom: number; boardTitle: string; onBoardTitleChange: (t: string) => void;
  searchQuery: string; onSearchChange: (q: string) => void;
  onAddCard: (type: CardType) => void;
  onAddSection: (key: SectionKey, name?: string, color?: string) => void;
  onAddGroup: () => void;
  onZoomIn: () => void; onZoomOut: () => void; onFitView: () => void; onClearAll: () => void;
  selectedCount: number; onDeleteSelected: () => void;
  onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean;
  onExport: () => void; onImport: (file: File) => void;
  isMobile: boolean;
}

const BTN: React.CSSProperties = {
  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
  borderRadius:7, cursor:'pointer', color:'rgba(255,255,255,0.55)',
  display:'flex', alignItems:'center', gap:5, padding:'5px 9px',
  fontSize:11, fontFamily:'Outfit, sans-serif', whiteSpace:'nowrap',
};
const DIV = <div style={{ width:1, height:18, background:'rgba(255,255,255,0.08)', flexShrink:0 }} />;

const CARD_BTNS: Array<{ type: CardType; icon: React.ReactNode; label: string }> = [
  { type:'note',    icon:<StickyNote size={13}/>, label:'Note' },
  { type:'image',   icon:<ImageIcon size={13}/>,  label:'Image' },
  { type:'link',    icon:<Link2 size={13}/>,       label:'Link' },
  { type:'swatch',  icon:<Palette size={13}/>,     label:'Swatch' },
  { type:'persona', icon:<User size={13}/>,        label:'Persona' },
  { type:'project', icon:<Briefcase size={13}/>,   label:'Project' },
];
const PRESET_SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key:'services', label:'Services' }, { key:'clients', label:'Clients' },
  { key:'identity', label:'Identity' }, { key:'projects', label:'Projects' }, { key:'notes', label:'Notes' },
];

export function Toolbar({ zoom, boardTitle, onBoardTitleChange, searchQuery, onSearchChange, onAddCard, onAddSection, onAddGroup, onZoomIn, onZoomOut, onFitView, onClearAll, selectedCount, onDeleteSelected, onUndo, onRedo, canUndo, canRedo, onExport, onImport, isMobile }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [customName, setCustomName] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const titleEl = editingTitle
    ? <input autoFocus value={boardTitle} onChange={e=>onBoardTitleChange(e.target.value)}
        onBlur={()=>setEditingTitle(false)} onKeyDown={e=>{ if(e.key==='Enter') setEditingTitle(false); }}
        style={{ background:'transparent', border:'none', outline:'none', fontSize:14, fontWeight:800, color:'#D4A843', fontFamily:'Syne, sans-serif', letterSpacing:'-0.02em', minWidth:80 }} />
    : <span onDoubleClick={()=>setEditingTitle(true)}
        style={{ fontSize:14, fontWeight:800, color:'#D4A843', fontFamily:'Syne, sans-serif', letterSpacing:'-0.02em', cursor:'text' }}>
        {boardTitle}
      </span>;

  // Mobile toolbar — minimal
  if (isMobile) {
    return (
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(14,14,14,0.96)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', padding:'8px 14px', gap:10, height:52 }}>
        {titleEl}
        <div style={{ flex:1 }} />
        <button style={BTN} onClick={onZoomOut}><ZoomOut size={14}/></button>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'Outfit, sans-serif', minWidth:36, textAlign:'center' }}>{Math.round(zoom*100)}%</span>
        <button style={BTN} onClick={onZoomIn}><ZoomIn size={14}/></button>
        <button style={BTN} onClick={onFitView}><Maximize2 size={14}/></button>
        <button style={{ ...BTN, padding:'5px' }} onClick={()=>setShowMobileMenu(v=>!v)}>
          {showMobileMenu ? <X size={16}/> : <Menu size={16}/>}
        </button>
        {showMobileMenu && (
          <>
            <div style={{ position:'fixed', inset:0, zIndex:149 }} onClick={()=>setShowMobileMenu(false)} />
            <div style={{ position:'fixed', top:52, right:0, zIndex:150, background:'#0E0E0E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0 0 0 10px', minWidth:220, boxShadow:'0 12px 40px rgba(0,0,0,0.8)', padding:'8px 0' }}>
              {CARD_BTNS.map(({type,icon,label}) => (
                <button key={type} onClick={()=>{ onAddCard(type); setShowMobileMenu(false); }}
                  style={{ ...BTN, width:'100%', borderRadius:0, border:'none', padding:'10px 16px', justifyContent:'flex-start' }}>
                  {icon}<span>{label}</span>
                </button>
              ))}
              <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'4px 0' }} />
              <button onClick={()=>{ onUndo(); setShowMobileMenu(false); }} style={{ ...BTN, width:'100%', borderRadius:0, border:'none', padding:'10px 16px', justifyContent:'flex-start', opacity:canUndo?1:0.35 }}>
                <Undo2 size={13}/> Undo
              </button>
              <button onClick={()=>{ onRedo(); setShowMobileMenu(false); }} style={{ ...BTN, width:'100%', borderRadius:0, border:'none', padding:'10px 16px', justifyContent:'flex-start', opacity:canRedo?1:0.35 }}>
                <Redo2 size={13}/> Redo
              </button>
              <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'4px 0' }} />
              <button onClick={()=>{ onExport(); setShowMobileMenu(false); }} style={{ ...BTN, width:'100%', borderRadius:0, border:'none', padding:'10px 16px', justifyContent:'flex-start' }}>
                <Download size={13}/> Export board
              </button>
              <button onClick={()=>{ importRef.current?.click(); setShowMobileMenu(false); }} style={{ ...BTN, width:'100%', borderRadius:0, border:'none', padding:'10px 16px', justifyContent:'flex-start' }}>
                <Upload size={13}/> Import board
              </button>
            </div>
          </>
        )}
        <input ref={importRef} type="file" accept=".json" style={{ display:'none' }}
          onChange={e=>{ const f=e.target.files?.[0]; if(f) onImport(f); e.target.value=''; }} />
      </div>
    );
  }

  // Desktop toolbar
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(14,14,14,0.94)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:7, padding:'7px 14px', height:48, overflowX:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginRight:8, flexShrink:0 }}>
        {titleEl}
        <Pencil size={10} style={{ color:'rgba(255,255,255,0.15)', cursor:'pointer' }} onClick={()=>setEditingTitle(true)} />
      </div>
      {DIV}
      <button style={{ ...BTN, opacity:canUndo?1:0.35 }} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"><Undo2 size={13}/></button>
      <button style={{ ...BTN, opacity:canRedo?1:0.35 }} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"><Redo2 size={13}/></button>
      {DIV}
      {CARD_BTNS.map(({type,icon,label}) => (
        <button key={type} style={BTN} onClick={()=>onAddCard(type)}>
          {icon}<span style={{ color:'rgba(255,255,255,0.35)', fontSize:10 }}>{label}</span>
        </button>
      ))}
      {DIV}
      {/* Section dropdown */}
      <div style={{ position:'relative' }}>
        <button style={BTN} onClick={()=>setShowSectionMenu(v=>!v)}>
          <LayoutGrid size={13}/><span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Section</span><span style={{ fontSize:9, opacity:0.4 }}>▾</span>
        </button>
        {showSectionMenu && (
          <>
            <div style={{ position:'fixed', inset:0, zIndex:199 }} onClick={()=>setShowSectionMenu(false)} />
            <div style={{ position:'absolute', top:'100%', left:0, marginTop:6, background:'#111111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, minWidth:200, zIndex:200, boxShadow:'0 12px 40px rgba(0,0,0,0.7)', overflow:'hidden' }}>
              {PRESET_SECTIONS.map(({key,label}) => (
                <button key={key} onClick={()=>{ onAddSection(key); setShowSectionMenu(false); }}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', fontFamily:'Outfit, sans-serif', fontSize:12, color:SECTION_ACCENT[key] }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:SECTION_ACCENT[key] }} />{label}
                </button>
              ))}
              <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'4px 0' }} />
              <div style={{ padding:'8px 14px', display:'flex', gap:6 }} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
                <input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="Custom section name..."
                  style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'5px 8px', outline:'none', fontSize:11, color:'rgba(255,255,255,0.7)', fontFamily:'Outfit, sans-serif' }} />
                <button onClick={()=>{ if(customName.trim()){ onAddSection('custom', customName.trim()); setCustomName(''); setShowSectionMenu(false); } }}
                  style={{ ...BTN, padding:'5px 10px', fontSize:11, background:'rgba(255,255,255,0.08)' }}>
                  <Plus size={12}/>Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <button style={BTN} onClick={onAddGroup}><Group size={13}/><span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Group</span></button>
      <div style={{ flex:1 }} />
      {/* Export / Import */}
      <button style={BTN} onClick={onExport} title="Export board as JSON"><Download size={13}/><span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Export</span></button>
      <button style={BTN} onClick={()=>importRef.current?.click()} title="Import board from JSON"><Upload size={13}/><span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Import</span></button>
      <input ref={importRef} type="file" accept=".json" style={{ display:'none' }}
        onChange={e=>{ const f=e.target.files?.[0]; if(f) onImport(f); e.target.value=''; }} />
      {DIV}
      {/* Search */}
      <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, padding:'4px 9px' }}>
        <Search size={12} style={{ color:'rgba(255,255,255,0.28)', flexShrink:0 }} />
        <input value={searchQuery} onChange={e=>onSearchChange(e.target.value)} placeholder="Search..."
          style={{ background:'transparent', border:'none', outline:'none', fontSize:12, color:'rgba(255,255,255,0.75)', fontFamily:'Outfit, sans-serif', width:120 }} />
      </div>
      {/* Zoom */}
      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
        <button style={BTN} onClick={onZoomOut}><ZoomOut size={13}/></button>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'Outfit, sans-serif', minWidth:36, textAlign:'center' }}>{Math.round(zoom*100)}%</span>
        <button style={BTN} onClick={onZoomIn}><ZoomIn size={13}/></button>
        <button style={BTN} onClick={onFitView} title="Fit view"><Maximize2 size={13}/></button>
      </div>
      {selectedCount>0 && (
        <button onClick={onDeleteSelected} style={{ ...BTN, borderColor:'#C23B2255', color:'#C23B22' }}>
          <Trash2 size={13}/><span>Delete ({selectedCount})</span>
        </button>
      )}
    </div>
  );
}
