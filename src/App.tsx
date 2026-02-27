import { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { CardData, SectionData, GroupData, ShapeData, DragState, CardType, SectionKey, GROUP_COLORS, Snapshot, ColorPickerTarget, ElementType } from './types';
import { DEFAULT_CARDS, DEFAULT_SECTIONS } from './data/seed';
import { computeSnap, computeEdgeSnap, snapAngle, SnapGuide } from './utils/snap';
import { exportBoard, importBoard } from './utils/io';
import { getTouchDist, getTouchMid } from './utils/touch';
import { Card } from './components/Card';
import { Section } from './components/Section';
import { Group } from './components/Group';
import { Shape } from './components/Shape';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Minimap } from './components/Minimap';
import { ContextMenu } from './components/ContextMenu';
import { SnapGuides } from './components/SnapGuides';
import { ColorPicker } from './components/ColorPicker';
import { useSync } from './hooks/useSync';
import { isConfigured } from './utils/db';

let idCounter = 100;
const genId = () => `id-${idCounter++}`;
const BOX_THRESHOLD = 5;
const MIN_CARD = 80;
const MIN_SECTION = 200;
const MAX_HISTORY = 80;
const DEG = Math.PI / 180;

const SECTION_DEFAULTS: Record<SectionKey, { label: string; sublabel: string }> = {
  services: { label: '01 — Services & Products', sublabel: 'What we make and offer' },
  clients:  { label: '02 — Buyers & Clients',    sublabel: 'Who we serve and attract' },
  identity: { label: '03 — Brand Identity',       sublabel: 'Aesthetic, palette, type, vision' },
  projects: { label: '04 — Projects',             sublabel: 'Current and planned work' },
  notes:    { label: '05 — Open Notes',           sublabel: 'Overflow, experiments, anything goes' },
  custom:   { label: 'New Section',               sublabel: 'Double-click to rename' },
};

type ContextMenuState =
  | { kind: 'canvas'; sx: number; sy: number; cx: number; cy: number }
  | { kind: 'element'; sx: number; sy: number; targetId: string; targetType: ElementType }
  | null;

function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 768);
  useEffect(() => { const h=()=>setV(window.innerWidth<768); window.addEventListener('resize',h); return ()=>window.removeEventListener('resize',h); }, []);
  return v;
}

export default function App() {
  const [cards, setCards]       = useState<CardData[]>(DEFAULT_CARDS);
  const [sections, setSections] = useState<SectionData[]>(DEFAULT_SECTIONS);
  const [groups, setGroups]     = useState<GroupData[]>([]);
  const [shapes, setShapes]     = useState<ShapeData[]>([]);
  const [panX, setPanX]         = useState(-120);
  const [panY, setPanY]         = useState(-100);
  const [zoom, setZoom]         = useState(0.55);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dragState, setDragState]     = useState<DragState>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<ColorPickerTarget|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver]   = useState(false);
  const [snapGuides, setSnapGuides]   = useState<SnapGuide[]>([]);
  const [boardTitle, setBoardTitle]   = useState(() => localStorage.getItem('maskhara-title') || 'Maskhara');
  const [importError, setImportError] = useState<string|null>(null);
  const [drawMode, setDrawMode]       = useState(false);
  // Shape fill/stroke defaults persisted across draws
  const [defaultFill, setDefaultFill]     = useState('rgba(212,168,67,0.12)');
  const [defaultStroke, setDefaultStroke] = useState('#D4A843');
  const isMobile = useIsMobile();

  // Sync — live snapshot for auto-save
  const liveSnap = useCallback((): Snapshot => ({
    cards: cardsRef.current, sections: sectionsRef.current,
    groups: groupsRef.current, shapes: shapesRef.current,
  }), []);

  const { status: syncStatus, markDirty, saveNow: syncSaveNow } = useSync({
    boardTitle,
    onLoad: (snapshot, title) => {
      setCards(snapshot.cards);
      setSections(snapshot.sections);
      setGroups(snapshot.groups ?? []);
      setShapes((snapshot as any).shapes ?? []);
      if (title) { setBoardTitle(title); localStorage.setItem('maskhara-title', title); }
    },
    onRemoteUpdate: (snapshot, title) => {
      setCards(snapshot.cards);
      setSections(snapshot.sections);
      setGroups(snapshot.groups ?? []);
      setShapes((snapshot as any).shapes ?? []);
      if (title) { setBoardTitle(title); localStorage.setItem('maskhara-title', title); }
    },
  });

  // History
  const past     = useRef<Snapshot[]>([]);
  const future   = useRef<Snapshot[]>([]);
  const debTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const debSnap  = useRef<Snapshot|null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Refs
  const outerRef    = useRef<HTMLDivElement>(null);
  const dragRef     = useRef<DragState>(null);
  const zoomRef     = useRef(zoom);
  const panRef      = useRef({ x: panX, y: panY });
  const cardsRef    = useRef(cards);
  const sectionsRef = useRef(sections);
  const groupsRef   = useRef(groups);
  const shapesRef   = useRef(shapes);
  const drawModeRef = useRef(drawMode);
  const touchRef    = useRef<any>(null);

  dragRef.current     = dragState;
  zoomRef.current     = zoom;
  panRef.current      = { x: panX, y: panY };
  cardsRef.current    = cards;
  sectionsRef.current = sections;
  groupsRef.current   = groups;
  shapesRef.current   = shapes;
  drawModeRef.current = drawMode;

  const snap = useCallback((): Snapshot => ({
    cards: cardsRef.current, sections: sectionsRef.current,
    groups: groupsRef.current, shapes: shapesRef.current,
  }), []);

  const pushHistory = useCallback((s: Snapshot) => {
    past.current.push(s);
    if (past.current.length > MAX_HISTORY) past.current.shift();
    future.current = []; setCanUndo(true); setCanRedo(false);
    setTimeout(() => markDirty(liveSnap()), 0);
  }, [markDirty, liveSnap]);

  const saveNow = useCallback(() => {
    if (debTimer.current) { clearTimeout(debTimer.current); debTimer.current=null; debSnap.current=null; }
    pushHistory(snap());
  }, [pushHistory, snap]);

  const saveDebounced = useCallback(() => {
    if (!debSnap.current) debSnap.current = snap();
    future.current=[]; setCanRedo(false);
    if (debTimer.current) clearTimeout(debTimer.current);
    debTimer.current = setTimeout(() => {
      if (debSnap.current) { pushHistory(debSnap.current); debSnap.current=null; }
      debTimer.current=null;
    }, 600);
  }, [snap, pushHistory]);

  const flushDebounce = useCallback(() => {
    if (debTimer.current) { clearTimeout(debTimer.current); debTimer.current=null; }
    if (debSnap.current) { pushHistory(debSnap.current); debSnap.current=null; }
  }, [pushHistory]);

  const undo = useCallback(() => {
    flushDebounce();
    if (!past.current.length) return;
    future.current.push(snap());
    const s = past.current.pop()!;
    setCards(s.cards); setSections(s.sections); setGroups(s.groups); setShapes(s.shapes ?? []);
    setCanUndo(past.current.length>0); setCanRedo(true);
  }, [snap, flushDebounce]);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    past.current.push(snap());
    const s = future.current.pop()!;
    setCards(s.cards); setSections(s.sections); setGroups(s.groups); setShapes(s.shapes ?? []);
    setCanUndo(true); setCanRedo(future.current.length>0);
  }, [snap]);

  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const rect = outerRef.current?.getBoundingClientRect();
    if (!rect) return { x:sx, y:sy };
    return { x:(sx-rect.left-panRef.current.x)/zoomRef.current, y:(sy-rect.top-panRef.current.y)/zoomRef.current };
  }, []);

  const centerPos = useCallback(() => ({
    x:(window.innerWidth/2-panRef.current.x)/zoomRef.current,
    y:(window.innerHeight/2-panRef.current.y)/zoomRef.current,
  }), []);

  // Export/Import
  const handleExport = useCallback(() => {
    exportBoard(boardTitle, cardsRef.current, sectionsRef.current, groupsRef.current, shapesRef.current);
  }, [boardTitle]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const data = await importBoard(file);
      saveNow();
      setCards(data.cards); setSections(data.sections);
      setGroups(data.groups ?? []); setShapes((data as any).shapes ?? []);
      if (data.boardTitle) { setBoardTitle(data.boardTitle); localStorage.setItem('maskhara-title', data.boardTitle); }
      setImportError(null);
    } catch (e: any) {
      setImportError(e.message); setTimeout(()=>setImportError(null), 4000);
    }
  }, [saveNow]);

  // Add helpers
  const addCard = useCallback((type: CardType, cx?: number, cy?: number) => {
    const pos={x:cx??centerPos().x, y:cy??centerPos().y};
    const sizes: Record<CardType,[number,number]> = { note:[210,165],image:[200,170],link:[260,100],swatch:[320,200],persona:[260,320],project:[300,280] };
    const [w,h]=sizes[type];
    const card: CardData = {id:genId(),x:pos.x-w/2,y:pos.y-h/2,width:w,height:h,type,title:`New ${type.charAt(0).toUpperCase()+type.slice(1)}`,content:''};
    if(type==='swatch') card.swatches=[{hex:'',label:'Primary'},{hex:'',label:'Secondary'},{hex:'',label:'Accent'},{hex:'',label:'Neutral'},{hex:'',label:'Dark'},{hex:'',label:'Light'}];
    if(type==='persona') card.personaFields={archetype:'',goals:'',painPoints:'',notes:''};
    if(type==='project') card.projectFields={status:'planned',description:'',notes:''};
    saveNow(); setCards(prev=>[...prev,card]); setSelectedIds(new Set([card.id]));
  }, [centerPos, saveNow]);

  const addSection = useCallback((key: SectionKey, customName?: string, customColor?: string) => {
    const pos=centerPos();
    const def=SECTION_DEFAULTS[key];
    const s: SectionData = {id:genId(),x:pos.x-400,y:pos.y-300,width:800,height:600,key,label:customName??def.label,sublabel:def.sublabel,customColor:customColor??(key==='custom'?'#888888':undefined)};
    saveNow(); setSections(prev=>[...prev,s]); setSelectedIds(new Set([s.id]));
  }, [centerPos, saveNow]);

  const addGroup = useCallback((cx?: number, cy?: number) => {
    const pos={x:cx??centerPos().x,y:cy??centerPos().y};
    const g: GroupData = {id:genId(),x:pos.x-200,y:pos.y-120,width:400,height:240,label:'New Group',color:GROUP_COLORS[groupsRef.current.length%GROUP_COLORS.length]};
    saveNow(); setGroups(prev=>[...prev,g]); setSelectedIds(new Set([g.id]));
  }, [centerPos, saveNow]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.size) return;
    saveNow();
    setCards(prev=>prev.filter(c=>!selectedIds.has(c.id)));
    setSections(prev=>prev.filter(s=>!selectedIds.has(s.id)));
    setGroups(prev=>prev.filter(g=>!selectedIds.has(g.id)));
    setShapes(prev=>prev.filter(s=>!selectedIds.has(s.id)));
    setSelectedIds(new Set());
  }, [selectedIds, saveNow]);

  // Lock toggle
  const toggleLock = useCallback((id: string, type: ElementType) => {
    saveNow();
    if(type==='card')    setCards(prev=>prev.map(c=>c.id===id?{...c,locked:!c.locked}:c));
    if(type==='section') setSections(prev=>prev.map(s=>s.id===id?{...s,locked:!s.locked}:s));
    if(type==='group')   setGroups(prev=>prev.map(g=>g.id===id?{...g,locked:!g.locked}:g));
    if(type==='shape')   setShapes(prev=>prev.map(s=>s.id===id?{...s,locked:!s.locked}:s));
  }, [saveNow]);

  // Get current color of element for color picker
  const getElementColor = useCallback((id: string, type: ElementType): string => {
    if(type==='card')    { const c=cardsRef.current.find(c=>c.id===id); return c?.accentColor ?? '#D4A843'; }
    if(type==='section') { const s=sectionsRef.current.find(s=>s.id===id); return s?.customColor ?? '#D4A843'; }
    if(type==='group')   { const g=groupsRef.current.find(g=>g.id===id); return g?.color ?? '#D4A843'; }
    if(type==='shape')   { const s=shapesRef.current.find(s=>s.id===id); return s?.fill === 'transparent' ? s?.stroke : s?.fill; }
    return '#D4A843';
  }, []);

  // Apply color from picker (live)
  const applyColor = useCallback((id: string, type: ElementType, color: string) => {
    if(type==='card')    setCards(prev=>prev.map(c=>c.id===id?{...c,accentColor:color}:c));
    if(type==='section') setSections(prev=>prev.map(s=>s.id===id?{...s,customColor:color}:s));
    if(type==='group')   setGroups(prev=>prev.map(g=>g.id===id?{...g,color}:g));
    if(type==='shape')   setShapes(prev=>prev.map(s=>s.id===id?{...s,fill:color==='transparent'?'transparent':color,stroke:color}:s));
  }, []);

  const updateBoardTitle = (t: string) => {
    setBoardTitle(t); localStorage.setItem('maskhara-title',t); document.title=`${t} — Maskhara`;
  };

  // Wheel zoom
  useEffect(() => {
    const el=outerRef.current; if(!el) return;
    const onWheel=(e:WheelEvent)=>{
      e.preventDefault();
      const factor=e.ctrlKey?(e.deltaY>0?0.92:1.08):(e.deltaY>0?0.9:1.1);
      const nz=Math.min(Math.max(zoomRef.current*factor,0.08),4);
      const rect=el.getBoundingClientRect();
      const mx=e.clientX-rect.left, my=e.clientY-rect.top;
      setPanX(mx-(mx-panRef.current.x)*(nz/zoomRef.current));
      setPanY(my-(my-panRef.current.y)*(nz/zoomRef.current));
      setZoom(nz);
    };
    el.addEventListener('wheel',onWheel,{passive:false});
    return ()=>el.removeEventListener('wheel',onWheel);
  }, []);

  // Touch
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el=outerRef.current!;
    if(e.touches.length===1){const t=e.touches[0]; touchRef.current={kind:'pan',sx:t.clientX,sy:t.clientY,px:panRef.current.x,py:panRef.current.y};}
    else if(e.touches.length===2){
      const t1=e.touches[0],t2=e.touches[1];
      const dist=getTouchDist(t1 as any,t2 as any), mid=getTouchMid(t1 as any,t2 as any);
      const rect=el.getBoundingClientRect();
      touchRef.current={kind:'pinch',dist,zoom:zoomRef.current,midX:mid.x-rect.left,midY:mid.y-rect.top,px:panRef.current.x,py:panRef.current.y};
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); const tc=touchRef.current; if(!tc) return;
    if(tc.kind==='pan'&&e.touches.length===1){const t=e.touches[0]; setPanX(tc.px+t.clientX-tc.sx); setPanY(tc.py+t.clientY-tc.sy);}
    else if(tc.kind==='pinch'&&e.touches.length===2){
      const t1=e.touches[0],t2=e.touches[1];
      const newDist=getTouchDist(t1 as any,t2 as any);
      const nz=Math.min(Math.max(tc.zoom*(newDist/tc.dist),0.08),4);
      const mid=getTouchMid(t1 as any,t2 as any);
      const el=outerRef.current!.getBoundingClientRect();
      const mx=mid.x-el.left, my=mid.y-el.top;
      setPanX(mx-(tc.midX-tc.px)*(nz/tc.zoom)); setPanY(my-(tc.midY-tc.py)*(nz/tc.zoom)); setZoom(nz);
    }
  }, []);
  const onTouchEnd = useCallback(()=>{ touchRef.current=null; }, []);

  // Global mouse move/up
  useEffect(() => {
    const onMove=(e:MouseEvent)=>{
      const drag=dragRef.current; if(!drag) return;
      const z=zoomRef.current;
      const allRects=[...cardsRef.current,...sectionsRef.current,...groupsRef.current,...shapesRef.current];

      if(drag.kind==='pan'){
        setPanX(drag.startPX+e.clientX-drag.startMX); setPanY(drag.startPY+e.clientY-drag.startMY);

      } else if(drag.kind==='rotate'){
        // Compute angle from element center to mouse
        const rect=outerRef.current!.getBoundingClientRect();
        // Element center in screen coords
        const cx = drag.centerX * z + panRef.current.x + rect.left;
        const cy = drag.centerY * z + panRef.current.y + rect.top;
        const rawAngle = Math.atan2(e.clientY-cy, e.clientX-cx) / DEG + 90;
        const delta = rawAngle - drag.startAngle;
        let newRot = drag.startRotation + delta;
        const { snapped, didSnap } = snapAngle(((newRot % 360) + 360) % 360);
        const finalRot = didSnap ? snapped : newRot;
        // Show angle guide
        if(didSnap){
          setSnapGuides([{ type:'angle', cx:drag.centerX, cy:drag.centerY, angleDeg:finalRot-90, length:600 }]);
        } else { setSnapGuides([]); }
        if(drag.elType==='card')    setCards(prev=>prev.map(c=>c.id===drag.id?{...c,rotation:finalRot}:c));
        if(drag.elType==='section') setSections(prev=>prev.map(s=>s.id===drag.id?{...s,rotation:finalRot}:s));
        if(drag.elType==='group')   setGroups(prev=>prev.map(g=>g.id===drag.id?{...g,rotation:finalRot}:g));
        if(drag.elType==='shape')   setShapes(prev=>prev.map(s=>s.id===drag.id?{...s,rotation:finalRot}:s));

      } else if(drag.kind==='draw-shape'){
        const pos=screenToCanvas(e.clientX,e.clientY);
        setDragState({...drag, currentCanvasX:pos.x, currentCanvasY:pos.y, shiftKey:e.shiftKey});

      } else if(drag.kind==='move-card'){
        const dx=(e.clientX-drag.startMX)/z, dy=(e.clientY-drag.startMY)/z;
        const card=cardsRef.current.find(c=>c.id===drag.id);
        if(card){
          const proposed={id:drag.id,x:drag.startX+dx,y:drag.startY+dy,width:card.width,height:card.height};
          const {x,y,guides}=computeSnap(proposed,allRects.filter(r=>r.id!==drag.id),z);
          setSnapGuides(guides); setCards(prev=>prev.map(c=>c.id===drag.id?{...c,x,y}:c));
        }
      } else if(drag.kind==='resize-card'){
        const dx=(e.clientX-drag.startMX)/z, dy=(e.clientY-drag.startMY)/z;
        let{startX:x,startY:y,startW:w,startH:h}=drag;
        if(drag.edge.includes('e')) w=Math.max(MIN_CARD,drag.startW+dx);
        if(drag.edge.includes('s')) h=Math.max(MIN_CARD,drag.startH+dy);
        if(drag.edge.includes('w')){w=Math.max(MIN_CARD,drag.startW-dx);x=drag.startX+drag.startW-w;}
        if(drag.edge.includes('n')){h=Math.max(MIN_CARD,drag.startH-dy);y=drag.startY+drag.startH-h;}
        const snapped=computeEdgeSnap(drag.edge,{x,y,width:w,height:h},allRects.filter(r=>r.id!==drag.id),z,drag.id);
        setSnapGuides(snapped.guides); setCards(prev=>prev.map(c=>c.id===drag.id?{...c,x:snapped.x,y:snapped.y,width:Math.max(MIN_CARD,snapped.width),height:Math.max(MIN_CARD,snapped.height)}:c));

      } else if(drag.kind==='move-section'){
        const dx=(e.clientX-drag.startMX)/z, dy=(e.clientY-drag.startMY)/z;
        const sec=sectionsRef.current.find(s=>s.id===drag.id);
        if(sec){
          const proposed={id:drag.id,x:drag.startX+dx,y:drag.startY+dy,width:sec.width,height:sec.height};
          const{x,y,guides}=computeSnap(proposed,allRects.filter(r=>r.id!==drag.id),z);
          setSnapGuides(guides); setSections(prev=>prev.map(s=>s.id===drag.id?{...s,x,y}:s));
        }
      } else if(drag.kind==='resize-section'){
        const dx=(e.clientX-drag.startMX)/z, dy=(e.clientY-drag.startMY)/z;
        let{startX:x,startY:y,startW:w,startH:h}=drag;
        if(drag.edge.includes('e')) w=Math.max(MIN_SECTION,drag.startW+dx);
        if(drag.edge.includes('s')) h=Math.max(MIN_SECTION,drag.startH+dy);
        if(drag.edge.includes('w')){w=Math.max(MIN_SECTION,drag.startW-dx);x=drag.startX+drag.startW-w;}
        if(drag.edge.includes('n')){h=Math.max(MIN_SECTION,drag.startH-dy);y=drag.startY+drag.startH-h;}
        setSections(prev=>prev.map(s=>s.id===drag.id?{...s,x,y,width:w,height:h}:s));

      } else if(drag.kind==='move-group'){
        const dx=(e.clientX-drag.startMX)/z, dy=(e.clientY-drag.startMY)/z;
        const grp=groupsRef.current.find(g=>g.id===drag.id);
        if(grp){
          const proposed={id:drag.id,x:drag.startX+dx,y:drag.startY+dy,width:grp.width,height:grp.height};
          const{x,y,guides}=computeSnap(proposed,allRects.filter(r=>r.id!==drag.id),z);
          setSnapGuides(guides); setGroups(prev=>prev.map(g=>g.id===drag.id?{...g,x,y}:g));
        }
      } else if(drag.kind==='resize-group'){
        const dx=(e.clientX-drag.startMX)/z, dy=(e.clientY-drag.startMY)/z;
        let{startX:x,startY:y,startW:w,startH:h}=drag;
        if(drag.edge.includes('e')) w=Math.max(100,drag.startW+dx);
        if(drag.edge.includes('s')) h=Math.max(60,drag.startH+dy);
        if(drag.edge.includes('w')){w=Math.max(100,drag.startW-dx);x=drag.startX+drag.startW-w;}
        if(drag.edge.includes('n')){h=Math.max(60,drag.startH-dy);y=drag.startY+drag.startH-h;}
        setGroups(prev=>prev.map(g=>g.id===drag.id?{...g,x,y,width:w,height:h}:g));

      } else if(drag.kind==='move-shape'){
        const dx=(e.clientX-drag.startMX)/z, dy=(e.clientY-drag.startMY)/z;
        const sh=shapesRef.current.find(s=>s.id===drag.id);
        if(sh){
          const proposed={id:drag.id,x:drag.startX+dx,y:drag.startY+dy,width:sh.width,height:sh.height};
          const{x,y,guides}=computeSnap(proposed,allRects.filter(r=>r.id!==drag.id),z);
          setSnapGuides(guides); setShapes(prev=>prev.map(s=>s.id===drag.id?{...s,x,y}:s));
        }
      } else if(drag.kind==='resize-shape'){
        const dx=(e.clientX-drag.startMX)/z, dy=(e.clientY-drag.startMY)/z;
        let{startX:x,startY:y,startW:w,startH:h}=drag;
        if(drag.edge.includes('e')) w=Math.max(10,drag.startW+dx);
        if(drag.edge.includes('s')) h=Math.max(10,drag.startH+dy);
        if(drag.edge.includes('w')){w=Math.max(10,drag.startW-dx);x=drag.startX+drag.startW-w;}
        if(drag.edge.includes('n')){h=Math.max(10,drag.startH-dy);y=drag.startY+drag.startH-h;}
        setShapes(prev=>prev.map(s=>s.id===drag.id?{...s,x,y,width:w,height:h}:s));

      } else if(drag.kind==='box-select'){
        const pos=screenToCanvas(e.clientX,e.clientY);
        setDragState({...drag,currentCanvasX:pos.x,currentCanvasY:pos.y});
      }
    };

    const onUp=(e:MouseEvent)=>{
      const drag=dragRef.current;
      setSnapGuides([]);

      if(drag?.kind==='draw-shape'){
        const x1=Math.min(drag.startCanvasX,drag.currentCanvasX);
        const y1=Math.min(drag.startCanvasY,drag.currentCanvasY);
        let w=Math.abs(drag.currentCanvasX-drag.startCanvasX);
        let h=Math.abs(drag.currentCanvasY-drag.startCanvasY);
        if(drag.shiftKey) { const side=Math.max(w,h); w=side; h=side; }
        if(w>10&&h>10){
          const sh: ShapeData={id:genId(),x:x1,y:y1,width:w,height:h,fill:defaultFill,stroke:defaultStroke,strokeWidth:1.5};
          pushHistory(snap());
          setShapes(prev=>[...prev,sh]);
          setSelectedIds(new Set([sh.id]));
        }
        setDrawMode(false); setDragState(null); return;
      }

      if(drag?.kind==='box-select'){
        const x1=Math.min(drag.startCanvasX,drag.currentCanvasX),y1=Math.min(drag.startCanvasY,drag.currentCanvasY);
        const x2=Math.max(drag.startCanvasX,drag.currentCanvasX),y2=Math.max(drag.startCanvasY,drag.currentCanvasY);
        flushSync(()=>{
          if(x2-x1>BOX_THRESHOLD/zoomRef.current||y2-y1>BOX_THRESHOLD/zoomRef.current){
            const ids=new Set<string>();
            cardsRef.current.forEach(c=>{if(c.x+c.width>x1&&c.x<x2&&c.y+c.height>y1&&c.y<y2) ids.add(c.id);});
            sectionsRef.current.forEach(s=>{if(s.x+s.width>x1&&s.x<x2&&s.y+s.height>y1&&s.y<y2) ids.add(s.id);});
            groupsRef.current.forEach(g=>{if(g.x+g.width>x1&&g.x<x2&&g.y+g.height>y1&&g.y<y2) ids.add(g.id);});
            shapesRef.current.forEach(s=>{if(s.x+s.width>x1&&s.x<x2&&s.y+s.height>y1&&s.y<y2) ids.add(s.id);});
            setSelectedIds(ids);
          } else { setSelectedIds(new Set()); }
          setDragState(null);
        });
        return;
      }

      if(drag&&(drag.kind==='move-card'||drag.kind==='resize-card'||drag.kind==='move-section'||drag.kind==='resize-section'||drag.kind==='move-group'||drag.kind==='resize-group'||drag.kind==='move-shape'||drag.kind==='resize-shape')){
        pushHistory(snap());
      }
      if(drag?.kind==='rotate') { pushHistory(snap()); }
      if(drag) setDragState(null);
    };

    window.addEventListener('mousemove',onMove);
    window.addEventListener('mouseup',onUp);
    return()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
  }, [screenToCanvas, pushHistory, snap, defaultFill, defaultStroke]);

  // Keyboard
  useEffect(() => {
    const onKey=(e:KeyboardEvent)=>{
      const t=e.target as HTMLElement;
      const inField=t.tagName==='INPUT'||t.tagName==='TEXTAREA';
      if((e.key==='Delete'||e.key==='Backspace')&&selectedIds.size>0&&!inField) deleteSelected();
      if(e.key==='Escape'){setSelectedIds(new Set());setContextMenu(null);setColorPickerTarget(null);setDrawMode(false);}
      if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!inField){e.preventDefault();undo();}
      if((e.ctrlKey||e.metaKey)&&e.key==='y'&&!inField){e.preventDefault();redo();}
      if(e.key==='r'&&!inField&&!e.ctrlKey&&!e.metaKey) setDrawMode(v=>!v);
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  }, [selectedIds, deleteSelected, undo, redo]);

  // File drop
  const onDragOver=(e:React.DragEvent)=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();setIsDragOver(true);}};
  const onDragLeave=(e:React.DragEvent)=>{if(!outerRef.current?.contains(e.relatedTarget as Node)) setIsDragOver(false);};
  const onDrop=(e:React.DragEvent)=>{
    e.preventDefault();setIsDragOver(false);
    const files=Array.from(e.dataTransfer.files);
    const jsonFile=files.find(f=>f.name.endsWith('.json'));
    if(jsonFile){handleImport(jsonFile);return;}
    const imgFiles=files.filter(f=>f.type.startsWith('image/'));
    if(!imgFiles.length) return;
    const pos=screenToCanvas(e.clientX,e.clientY);
    saveNow();
    imgFiles.forEach((file,i)=>{
      const reader=new FileReader();
      reader.onload=ev=>{
        const dataUrl=ev.target?.result as string;
        const img=new Image();
        img.onload=()=>{
          const maxW=400,maxH=360;let w=img.naturalWidth,h=img.naturalHeight;
          if(w>maxW){h=Math.round(h*maxW/w);w=maxW;}if(h>maxH){w=Math.round(w*maxH/h);h=maxH;}
          setCards(prev=>[...prev,{id:genId(),x:pos.x-w/2+i*20,y:pos.y-h/2+i*20,width:Math.max(w,120),height:Math.max(h+34,80),type:'image',title:file.name.replace(/\.[^.]+$/,''),content:dataUrl}]);
        };
        img.src=dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // Canvas mouse
  const onCanvasDown=(e:React.MouseEvent)=>{
    setContextMenu(null); setColorPickerTarget(null);
    if(e.button===1){e.preventDefault();setDragState({kind:'pan',startMX:e.clientX,startMY:e.clientY,startPX:panX,startPY:panY});return;}
    if(e.button===0){
      if(drawModeRef.current){
        const pos=screenToCanvas(e.clientX,e.clientY);
        setDragState({kind:'draw-shape',startCanvasX:pos.x,startCanvasY:pos.y,currentCanvasX:pos.x,currentCanvasY:pos.y,shiftKey:e.shiftKey});
        return;
      }
      const pos=screenToCanvas(e.clientX,e.clientY);
      setDragState({kind:'box-select',startMX:e.clientX,startMY:e.clientY,startCanvasX:pos.x,startCanvasY:pos.y,currentCanvasX:pos.x,currentCanvasY:pos.y});
    }
  };

  const onCanvasContextMenu=(e:React.MouseEvent)=>{
    e.preventDefault();
    const c=screenToCanvas(e.clientX,e.clientY);
    setContextMenu({kind:'canvas',sx:e.clientX,sy:e.clientY,cx:c.x,cy:c.y});
  };

  const onElementContextMenu=(e:React.MouseEvent,id:string,type:ElementType)=>{
    e.preventDefault();e.stopPropagation();
    setContextMenu({kind:'element',sx:e.clientX,sy:e.clientY,targetId:id,targetType:type});
  };

  // Rotation start helper
  const startRotate=(e:React.MouseEvent,id:string,elType:ElementType,el:{x:number;y:number;width:number;height:number;rotation?:number})=>{
    e.stopPropagation();e.preventDefault();
    const cx=el.x+el.width/2, cy=el.y+el.height/2;
    const rect=outerRef.current!.getBoundingClientRect();
    const scx=cx*zoomRef.current+panRef.current.x+rect.left;
    const scy=cy*zoomRef.current+panRef.current.y+rect.top;
    const startAngle=Math.atan2(e.clientY-scy,e.clientX-scx)/DEG+90;
    setDragState({kind:'rotate',id,elType,centerX:cx,centerY:cy,startAngle,startRotation:el.rotation??0});
  };

  const zoomTo=(nz:number)=>{
    const cx=window.innerWidth/2,cy=window.innerHeight/2;
    setPanX(cx-(cx-panX)*(nz/zoom));setPanY(cy-(cy-panY)*(nz/zoom));setZoom(nz);
  };
  const fitView=()=>{setZoom(0.55);setPanX(-120);setPanY(-100);};

  const navigateTo=useCallback((item:{x:number;y:number;width:number;height:number})=>{
    setPanX(window.innerWidth/2-(item.x+item.width/2)*zoom);
    setPanY(window.innerHeight/2-(item.y+item.height/2)*zoom);
  },[zoom]);

  const updateCard    =(id:string,patch:Partial<CardData>)    =>{saveDebounced();setCards(prev=>{const n=prev.map(c=>c.id===id?{...c,...patch}:c);setTimeout(()=>markDirty(liveSnap()),0);return n;});};
  const updateCardNow =(id:string,patch:Partial<CardData>)    =>{saveNow();setCards(prev=>{const n=prev.map(c=>c.id===id?{...c,...patch}:c);setTimeout(()=>markDirty(liveSnap()),0);return n;});};
  const updateSection =(id:string,patch:Partial<SectionData>,imm=false)=>{imm?saveNow():saveDebounced();setSections(prev=>{const n=prev.map(s=>s.id===id?{...s,...patch}:s);setTimeout(()=>markDirty(liveSnap()),0);return n;});};
  const updateGroup   =(id:string,patch:Partial<GroupData>,imm=false)  =>{imm?saveNow():saveDebounced();setGroups(prev=>{const n=prev.map(g=>g.id===id?{...g,...patch}:g);setTimeout(()=>markDirty(liveSnap()),0);return n;});};

  // Draw shape preview
  const drawPreview = dragState?.kind==='draw-shape' ? (()=>{
    const x1=Math.min(dragState.startCanvasX,dragState.currentCanvasX);
    const y1=Math.min(dragState.startCanvasY,dragState.currentCanvasY);
    let w=Math.abs(dragState.currentCanvasX-dragState.startCanvasX);
    let h=Math.abs(dragState.currentCanvasY-dragState.startCanvasY);
    if(dragState.shiftKey){const s=Math.max(w,h);w=s;h=s;}
    return {x:x1,y:y1,width:w,height:h};
  })() : null;

  // Box select rect
  const boxRect=dragState?.kind==='box-select' ? (()=>{
    const x1=Math.min(dragState.startCanvasX,dragState.currentCanvasX);
    const y1=Math.min(dragState.startCanvasY,dragState.currentCanvasY);
    const x2=Math.max(dragState.startCanvasX,dragState.currentCanvasX);
    const y2=Math.max(dragState.startCanvasY,dragState.currentCanvasY);
    const w=x2-x1,h=y2-y1;
    if(w<BOX_THRESHOLD/zoom&&h<BOX_THRESHOLD/zoom) return null;
    return{x:x1,y:y1,width:w,height:h};
  })():null;

  const cursor=dragState?.kind==='pan'?'grabbing':dragState?.kind==='rotate'?'grabbing':drawMode?'crosshair':dragState?.kind==='box-select'?'crosshair':'default';
  const topOffset=isMobile?52:48;

  const ctxTarget=contextMenu?.kind==='element' ? {
    id:contextMenu.targetId, type:contextMenu.targetType,
    locked: contextMenu.targetType==='card'?cardsRef.current.find(c=>c.id===contextMenu.targetId)?.locked
      :contextMenu.targetType==='section'?sectionsRef.current.find(s=>s.id===contextMenu.targetId)?.locked
      :contextMenu.targetType==='group'?groupsRef.current.find(g=>g.id===contextMenu.targetId)?.locked
      :shapesRef.current.find(s=>s.id===contextMenu.targetId)?.locked,
  } : null;

  return (
    <div ref={outerRef}
      style={{ position:'fixed',inset:0,overflow:'hidden',background:'#141414',
        backgroundImage:`radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)`,
        backgroundSize:`${24*zoom}px ${24*zoom}px`,backgroundPosition:`${panX}px ${panY}px`,
        cursor,fontFamily:'Outfit, sans-serif',paddingTop:topOffset,
      }}
      onMouseDown={onCanvasDown} onContextMenu={onCanvasContextMenu}
      onClick={()=>setContextMenu(null)}
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      onTouchStart={isMobile?onTouchStart:undefined}
      onTouchMove={isMobile?onTouchMove:undefined}
      onTouchEnd={isMobile?onTouchEnd:undefined}
    >
      {/* Canvas */}
      <div style={{ position:'absolute',top:0,left:0,transformOrigin:'0 0',transform:`translate(${panX}px,${panY}px) scale(${zoom})`,width:5000,height:5000 }}>

        {sections.map(s=>(
          <Section key={s.id} section={s} isSelected={selectedIds.has(s.id)} zoom={zoom}
            onSelect={e=>{e.stopPropagation();setSelectedIds(new Set([s.id]));}}
            onStartMove={e=>setDragState({kind:'move-section',id:s.id,startMX:e.clientX,startMY:e.clientY,startX:s.x,startY:s.y})}
            onStartResize={(e,edge)=>{e.stopPropagation();setDragState({kind:'resize-section',id:s.id,edge,startMX:e.clientX,startMY:e.clientY,startX:s.x,startY:s.y,startW:s.width,startH:s.height});}}
            onStartRotate={e=>startRotate(e,s.id,'section',s)}
            onUpdate={patch=>updateSection(s.id,patch,'customColor' in patch)}
            onDelete={()=>{saveNow();setSections(prev=>prev.filter(sec=>sec.id!==s.id));setSelectedIds(new Set());}}
            onContextMenu={e=>onElementContextMenu(e,s.id,'section')}
          />
        ))}

        {groups.map(g=>(
          <Group key={g.id} group={g} isSelected={selectedIds.has(g.id)}
            onSelect={e=>{e.stopPropagation();setSelectedIds(new Set([g.id]));}}
            onStartMove={e=>setDragState({kind:'move-group',id:g.id,startMX:e.clientX,startMY:e.clientY,startX:g.x,startY:g.y})}
            onStartResize={(e,edge)=>{e.stopPropagation();setDragState({kind:'resize-group',id:g.id,edge,startMX:e.clientX,startMY:e.clientY,startX:g.x,startY:g.y,startW:g.width,startH:g.height});}}
            onStartRotate={e=>startRotate(e,g.id,'group',g)}
            onUpdate={patch=>updateGroup(g.id,patch,'color' in patch)}
            onDelete={()=>{saveNow();setGroups(prev=>prev.filter(gr=>gr.id!==g.id));setSelectedIds(new Set());}}
            onContextMenu={e=>onElementContextMenu(e,g.id,'group')}
          />
        ))}

        {shapes.map(sh=>(
          <Shape key={sh.id} shape={sh} isSelected={selectedIds.has(sh.id)}
            onSelect={e=>{e.stopPropagation();setSelectedIds(new Set([sh.id]));}}
            onStartMove={e=>setDragState({kind:'move-shape',id:sh.id,startMX:e.clientX,startMY:e.clientY,startX:sh.x,startY:sh.y})}
            onStartResize={(e,edge)=>{e.stopPropagation();setDragState({kind:'resize-shape',id:sh.id,edge,startMX:e.clientX,startMY:e.clientY,startX:sh.x,startY:sh.y,startW:sh.width,startH:sh.height});}}
            onStartRotate={e=>startRotate(e,sh.id,'shape',sh)}
            onDelete={()=>{saveNow();setShapes(prev=>prev.filter(s=>s.id!==sh.id));setSelectedIds(new Set());}}
            onContextMenu={e=>onElementContextMenu(e,sh.id,'shape')}
          />
        ))}

        {cards.map(card=>(
          <Card key={card.id} card={card} isSelected={selectedIds.has(card.id)}
            onSelect={e=>{e.stopPropagation();setSelectedIds(new Set([card.id]));}}
            onStartMove={e=>setDragState({kind:'move-card',id:card.id,startMX:e.clientX,startMY:e.clientY,startX:card.x,startY:card.y})}
            onStartResize={(e,edge)=>{e.stopPropagation();setDragState({kind:'resize-card',id:card.id,edge,startMX:e.clientX,startMY:e.clientY,startX:card.x,startY:card.y,startW:card.width,startH:card.height});}}
            onStartRotate={e=>startRotate(e,card.id,'card',card)}
            onUpdate={patch=>updateCard(card.id,patch)}
            onUpdateImmediate={patch=>updateCardNow(card.id,patch)}
            onDelete={()=>{saveNow();setCards(prev=>prev.filter(c=>c.id!==card.id));setSelectedIds(new Set());}}
            onContextMenu={e=>onElementContextMenu(e,card.id,'card')}
          />
        ))}

        <SnapGuides guides={snapGuides} />

        {/* Draw preview */}
        {drawPreview && drawPreview.width>2 && drawPreview.height>2 && (
          <div style={{ position:'absolute',left:drawPreview.x,top:drawPreview.y,width:drawPreview.width,height:drawPreview.height,
            border:`1.5px dashed ${defaultStroke}`,background:`${defaultFill}`,borderRadius:3,pointerEvents:'none',opacity:0.7 }} />
        )}

        {boxRect && (
          <div style={{ position:'absolute',left:boxRect.x,top:boxRect.y,width:boxRect.width,height:boxRect.height,border:'1.5px solid #D4A843',background:'rgba(212,168,67,0.05)',borderRadius:4,pointerEvents:'none' }} />
        )}
      </div>

      {/* Chrome */}
      <Toolbar
        zoom={zoom} boardTitle={boardTitle} onBoardTitleChange={updateBoardTitle}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        onAddCard={addCard} onAddSection={addSection} onAddGroup={()=>addGroup()}
        onZoomIn={()=>zoomTo(Math.min(zoom*1.25,4))} onZoomOut={()=>zoomTo(Math.max(zoom*0.8,0.08))}
        onFitView={fitView}
        onClearAll={()=>{if(window.confirm('Clear the entire board?')){saveNow();setCards([]);setSections([]);setGroups([]);setShapes([]);setSelectedIds(new Set());}}}
        selectedCount={selectedIds.size} onDeleteSelected={deleteSelected}
        onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo}
        onExport={handleExport} onImport={handleImport}
        isMobile={isMobile} drawMode={drawMode} onToggleDrawMode={()=>setDrawMode(v=>!v)}
        syncStatus={syncStatus}
      />

      <Sidebar sections={sections} groups={groups} onNavigate={navigateTo} isMobile={isMobile} />
      <Minimap cards={cards} sections={sections} groups={groups} panX={panX} panY={panY} zoom={zoom}
        viewportWidth={window.innerWidth} viewportHeight={window.innerHeight}
        onNavigate={(nx,ny)=>{setPanX(nx);setPanY(ny);}} />

      {/* Context menus */}
      {contextMenu?.kind==='canvas' && (
        <ContextMenu x={contextMenu.sx} y={contextMenu.sy}
          onAddCard={type=>addCard(type,contextMenu.cx,contextMenu.cy)}
          onAddSection={key=>addSection(key)}
          onAddGroup={()=>addGroup(contextMenu.cx,contextMenu.cy)}
          onClose={()=>setContextMenu(null)} />
      )}
      {contextMenu?.kind==='element' && ctxTarget && (
        <ContextMenu x={contextMenu.sx} y={contextMenu.sy}
          onAddCard={type=>addCard(type)} onAddSection={key=>addSection(key)} onAddGroup={()=>addGroup()}
          targetId={ctxTarget.id} targetLocked={!!ctxTarget.locked}
          targetColor={getElementColor(ctxTarget.id,ctxTarget.type)}
          onToggleLock={()=>toggleLock(ctxTarget.id,ctxTarget.type)}
          onChangeColor={()=>{
            setColorPickerTarget({id:ctxTarget.id,elType:ctxTarget.type,currentColor:getElementColor(ctxTarget.id,ctxTarget.type),x:contextMenu.sx,y:contextMenu.sy});
          }}
          onDeleteTarget={()=>{
            saveNow();
            if(ctxTarget.type==='card')    setCards(prev=>prev.filter(c=>c.id!==ctxTarget.id));
            if(ctxTarget.type==='section') setSections(prev=>prev.filter(s=>s.id!==ctxTarget.id));
            if(ctxTarget.type==='group')   setGroups(prev=>prev.filter(g=>g.id!==ctxTarget.id));
            if(ctxTarget.type==='shape')   setShapes(prev=>prev.filter(s=>s.id!==ctxTarget.id));
          }}
          onClose={()=>setContextMenu(null)} />
      )}

      {/* Color picker */}
      {colorPickerTarget && (
        <ColorPicker
          color={colorPickerTarget.currentColor}
          x={colorPickerTarget.x} y={colorPickerTarget.y}
          onApply={color=>{ applyColor(colorPickerTarget.id,colorPickerTarget.elType,color); }}
          onClose={()=>{ saveNow(); setColorPickerTarget(null); }}
        />
      )}

      {/* Draw mode banner */}
      {drawMode && (
        <div style={{ position:'fixed',top:topOffset+8,left:'50%',transform:'translateX(-50%)',zIndex:150,background:'rgba(212,168,67,0.12)',border:'1px solid rgba(212,168,67,0.4)',borderRadius:8,padding:'6px 16px',fontSize:11,color:'#D4A843',fontFamily:'Syne, sans-serif',fontWeight:700,backdropFilter:'blur(8px)',display:'flex',gap:12,alignItems:'center' }}>
          <span>Draw mode — click &amp; drag to draw a rectangle</span>
          <span style={{ opacity:0.5 }}>Hold Shift for square · Press R or Esc to exit</span>
        </div>
      )}

      {importError && (
        <div style={{ position:'fixed',bottom:60,left:'50%',transform:'translateX(-50%)',background:'#C23B22',color:'white',padding:'10px 18px',borderRadius:8,fontSize:12,fontFamily:'Outfit, sans-serif',zIndex:400,boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
          {importError}
        </div>
      )}

      {isDragOver && (
        <div style={{ position:'fixed',inset:0,zIndex:300,background:'rgba(212,168,67,0.04)',border:'2px dashed rgba(212,168,67,0.35)',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none' }}>
          <div style={{ background:'rgba(14,14,14,0.92)',border:'1px solid rgba(212,168,67,0.3)',borderRadius:12,padding:'18px 30px',backdropFilter:'blur(12px)' }}>
            <div style={{ fontSize:13,color:'#D4A843',fontFamily:'Syne, sans-serif',fontWeight:700 }}>Drop image or board JSON</div>
          </div>
        </div>
      )}

      <div style={{ position:'fixed',bottom:16,left:'50%',transform:'translateX(-50%)',display:'flex',gap:10,padding:'5px 14px',background:'rgba(14,14,14,0.82)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:20,backdropFilter:'blur(8px)',fontSize:10,color:'rgba(255,255,255,0.18)',fontFamily:'Outfit, sans-serif',userSelect:'none',pointerEvents:'none',whiteSpace:'nowrap' }}>
        {isMobile
          ? <><span>Drag to pan</span><span style={{opacity:.3}}>·</span><span>Pinch to zoom</span></>
          : <><span>Right-click to add or change colour</span><span style={{opacity:.3}}>·</span><span>R = rectangle tool</span><span style={{opacity:.3}}>·</span><span>Ctrl+Z/Y undo/redo</span><span style={{opacity:.3}}>·</span><span style={{opacity:.5}}>{cards.length}c · {sections.length}s · {shapes.length} shapes</span></>
        }
      </div>
    </div>
  );
}
