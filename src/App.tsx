import { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { CardData, SectionData, GroupData, DragState, CardType, SectionKey, SECTION_ACCENT, GROUP_COLORS, Snapshot } from './types';
import { DEFAULT_CARDS, DEFAULT_SECTIONS } from './data/seed';
import { Card } from './components/Card';
import { Section } from './components/Section';
import { Group } from './components/Group';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Minimap } from './components/Minimap';
import { ContextMenu } from './components/ContextMenu';

let idCounter = 100;
const genId = () => `id-${idCounter++}`;
const BOX_THRESHOLD = 5;
const MIN_CARD = 80;
const MIN_SECTION = 200;

const SECTION_DEFAULTS: Record<SectionKey, { label: string; sublabel: string }> = {
  services: { label: '01 — Services & Products', sublabel: 'What we make and offer' },
  clients:  { label: '02 — Buyers & Clients',    sublabel: 'Who we serve and attract' },
  identity: { label: '03 — Brand Identity',       sublabel: 'Aesthetic, palette, type, vision' },
  projects: { label: '04 — Projects',             sublabel: 'Current and planned work' },
  notes:    { label: '05 — Open Notes',           sublabel: 'Overflow, experiments, anything goes' },
  custom:   { label: 'New Section',               sublabel: 'Double-click to rename' },
};

export default function App() {
  const [cards, setCards]         = useState<CardData[]>(DEFAULT_CARDS);
  const [sections, setSections]   = useState<SectionData[]>(DEFAULT_SECTIONS);
  const [groups, setGroups]       = useState<GroupData[]>([]);
  const [panX, setPanX]           = useState(-120);
  const [panY, setPanY]           = useState(-100);
  const [zoom, setZoom]           = useState(0.55);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dragState, setDragState]     = useState<DragState>(null);
  const [contextMenu, setContextMenu] = useState<{ sx: number; sy: number; cx: number; cy: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver]   = useState(false);
  const [boardTitle, setBoardTitle]   = useState(() => localStorage.getItem('maskhara-title') || 'Maskhara');

  // Undo / Redo stacks
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Refs for closures
  const outerRef      = useRef<HTMLDivElement>(null);
  const dragRef       = useRef<DragState>(null);
  const zoomRef       = useRef(zoom);
  const panRef        = useRef({ x: panX, y: panY });
  const cardsRef      = useRef(cards);
  const sectionsRef   = useRef(sections);
  const groupsRef     = useRef(groups);
  const boxDoneRef    = useRef(false);

  dragRef.current     = dragState;
  zoomRef.current     = zoom;
  panRef.current      = { x: panX, y: panY };
  cardsRef.current    = cards;
  sectionsRef.current = sections;
  groupsRef.current   = groups;

  // ── History ───────────────────────────────────────────────
  const saveSnapshot = useCallback(() => {
    undoStack.current.push({
      cards: cardsRef.current,
      sections: sectionsRef.current,
      groups: groupsRef.current,
    });
    redoStack.current = [];
    if (undoStack.current.length > 60) undoStack.current.shift();
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (!undoStack.current.length) return;
    redoStack.current.push({ cards: cardsRef.current, sections: sectionsRef.current, groups: groupsRef.current });
    const snap = undoStack.current.pop()!;
    setCards(snap.cards);
    setSections(snap.sections);
    setGroups(snap.groups);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    if (!redoStack.current.length) return;
    undoStack.current.push({ cards: cardsRef.current, sections: sectionsRef.current, groups: groupsRef.current });
    const snap = redoStack.current.pop()!;
    setCards(snap.cards);
    setSections(snap.sections);
    setGroups(snap.groups);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  // ── Helpers ───────────────────────────────────────────────
  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const rect = outerRef.current?.getBoundingClientRect();
    if (!rect) return { x: sx, y: sy };
    return {
      x: (sx - rect.left - panRef.current.x) / zoomRef.current,
      y: (sy - rect.top  - panRef.current.y) / zoomRef.current,
    };
  }, []);

  const centerPos = () => ({
    x: (window.innerWidth  / 2 - panRef.current.x) / zoomRef.current,
    y: (window.innerHeight / 2 - panRef.current.y) / zoomRef.current,
  });

  // ── Add card ──────────────────────────────────────────────
  const addCard = useCallback((type: CardType, cx?: number, cy?: number) => {
    const pos = { x: cx ?? centerPos().x, y: cy ?? centerPos().y };
    const sizeMap: Record<CardType, [number, number]> = {
      note: [210, 165], image: [200, 170], link: [260, 100],
      swatch: [320, 200], persona: [260, 320], project: [300, 280],
    };
    const [w, h] = sizeMap[type];
    const card: CardData = {
      id: genId(), x: pos.x - w / 2, y: pos.y - h / 2, width: w, height: h,
      type, title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`, content: '',
    };
    if (type === 'swatch') card.swatches = [
      { hex: '', label: 'Primary' }, { hex: '', label: 'Secondary' },
      { hex: '', label: 'Accent' },  { hex: '', label: 'Neutral' },
      { hex: '', label: 'Dark' },    { hex: '', label: 'Light' },
    ];
    if (type === 'persona') card.personaFields = { archetype: '', goals: '', painPoints: '', notes: '' };
    if (type === 'project') card.projectFields = { status: 'planned', description: '', notes: '' };
    saveSnapshot();
    setCards(prev => [...prev, card]);
    setSelectedIds(new Set([card.id]));
  }, [saveSnapshot]);

  // ── Add section ───────────────────────────────────────────
  const addSection = useCallback((key: SectionKey, customName?: string, customColor?: string) => {
    const pos = centerPos();
    const defaults = SECTION_DEFAULTS[key];
    const s: SectionData = {
      id: genId(), x: pos.x - 400, y: pos.y - 300, width: 800, height: 600,
      key, label: customName ?? defaults.label, sublabel: defaults.sublabel,
      customColor: customColor ?? (key === 'custom' ? '#888888' : undefined),
    };
    saveSnapshot();
    setSections(prev => [...prev, s]);
    setSelectedIds(new Set([s.id]));
  }, [saveSnapshot]);

  // ── Add group ─────────────────────────────────────────────
  const addGroup = useCallback((cx?: number, cy?: number) => {
    const pos = { x: cx ?? centerPos().x, y: cy ?? centerPos().y };
    const color = GROUP_COLORS[groupsRef.current.length % GROUP_COLORS.length];
    const g: GroupData = {
      id: genId(), x: pos.x - 200, y: pos.y - 120, width: 400, height: 240,
      label: 'New Group', color,
    };
    saveSnapshot();
    setGroups(prev => [...prev, g]);
    setSelectedIds(new Set([g.id]));
  }, [saveSnapshot]);

  // ── Delete selected ───────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selectedIds.size) return;
    saveSnapshot();
    setCards(prev => prev.filter(c => !selectedIds.has(c.id)));
    setSections(prev => prev.filter(s => !selectedIds.has(s.id)));
    setGroups(prev => prev.filter(g => !selectedIds.has(g.id)));
    setSelectedIds(new Set());
  }, [selectedIds, saveSnapshot]);

  // ── Board title ───────────────────────────────────────────
  const updateBoardTitle = (t: string) => {
    setBoardTitle(t);
    localStorage.setItem('maskhara-title', t);
    document.title = `${t} — Living Brand Document`;
  };

  // ── Wheel zoom ────────────────────────────────────────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.ctrlKey ? (e.deltaY > 0 ? 0.92 : 1.08) : (e.deltaY > 0 ? 0.9 : 1.1);
      const nz = Math.min(Math.max(zoomRef.current * factor, 0.08), 4);
      const rect = el.getBoundingClientRect();
      setPanX(e.clientX - rect.left - (e.clientX - rect.left - panRef.current.x) * (nz / zoomRef.current));
      setPanY(e.clientY - rect.top  - (e.clientY - rect.top  - panRef.current.y) * (nz / zoomRef.current));
      setZoom(nz);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Global mouse ──────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const z = zoomRef.current;

      if (drag.kind === 'pan') {
        setPanX(drag.startPX + e.clientX - drag.startMX);
        setPanY(drag.startPY + e.clientY - drag.startMY);

      } else if (drag.kind === 'move-card') {
        const dx = (e.clientX - drag.startMX) / z, dy = (e.clientY - drag.startMY) / z;
        setCards(prev => prev.map(c => c.id === drag.id ? { ...c, x: drag.startX + dx, y: drag.startY + dy } : c));

      } else if (drag.kind === 'resize-card') {
        const dx = (e.clientX - drag.startMX) / z, dy = (e.clientY - drag.startMY) / z;
        let { startX: x, startY: y, startW: w, startH: h } = drag;
        if (drag.edge.includes('e')) w = Math.max(MIN_CARD, drag.startW + dx);
        if (drag.edge.includes('s')) h = Math.max(MIN_CARD, drag.startH + dy);
        if (drag.edge.includes('w')) { w = Math.max(MIN_CARD, drag.startW - dx); x = drag.startX + drag.startW - w; }
        if (drag.edge.includes('n')) { h = Math.max(MIN_CARD, drag.startH - dy); y = drag.startY + drag.startH - h; }
        setCards(prev => prev.map(c => c.id === drag.id ? { ...c, x, y, width: w, height: h } : c));

      } else if (drag.kind === 'move-section') {
        const dx = (e.clientX - drag.startMX) / z, dy = (e.clientY - drag.startMY) / z;
        setSections(prev => prev.map(s => s.id === drag.id ? { ...s, x: drag.startX + dx, y: drag.startY + dy } : s));

      } else if (drag.kind === 'resize-section') {
        const dx = (e.clientX - drag.startMX) / z, dy = (e.clientY - drag.startMY) / z;
        let { startX: x, startY: y, startW: w, startH: h } = drag;
        if (drag.edge.includes('e')) w = Math.max(MIN_SECTION, drag.startW + dx);
        if (drag.edge.includes('s')) h = Math.max(MIN_SECTION, drag.startH + dy);
        if (drag.edge.includes('w')) { w = Math.max(MIN_SECTION, drag.startW - dx); x = drag.startX + drag.startW - w; }
        if (drag.edge.includes('n')) { h = Math.max(MIN_SECTION, drag.startH - dy); y = drag.startY + drag.startH - h; }
        setSections(prev => prev.map(s => s.id === drag.id ? { ...s, x, y, width: w, height: h } : s));

      } else if (drag.kind === 'move-group') {
        const dx = (e.clientX - drag.startMX) / z, dy = (e.clientY - drag.startMY) / z;
        setGroups(prev => prev.map(g => g.id === drag.id ? { ...g, x: drag.startX + dx, y: drag.startY + dy } : g));

      } else if (drag.kind === 'resize-group') {
        const dx = (e.clientX - drag.startMX) / z, dy = (e.clientY - drag.startMY) / z;
        let { startX: x, startY: y, startW: w, startH: h } = drag;
        if (drag.edge.includes('e')) w = Math.max(100, drag.startW + dx);
        if (drag.edge.includes('s')) h = Math.max(60,  drag.startH + dy);
        if (drag.edge.includes('w')) { w = Math.max(100, drag.startW - dx); x = drag.startX + drag.startW - w; }
        if (drag.edge.includes('n')) { h = Math.max(60,  drag.startH - dy); y = drag.startY + drag.startH - h; }
        setGroups(prev => prev.map(g => g.id === drag.id ? { ...g, x, y, width: w, height: h } : g));

      } else if (drag.kind === 'box-select') {
        const pos = screenToCanvas(e.clientX, e.clientY);
        setDragState({ ...drag, currentCanvasX: pos.x, currentCanvasY: pos.y });
      }
    };

    const onUp = () => {
      const drag = dragRef.current;
      if (drag?.kind === 'box-select') {
        const x1 = Math.min(drag.startCanvasX, drag.currentCanvasX);
        const y1 = Math.min(drag.startCanvasY, drag.currentCanvasY);
        const x2 = Math.max(drag.startCanvasX, drag.currentCanvasX);
        const y2 = Math.max(drag.startCanvasY, drag.currentCanvasY);
        flushSync(() => {
          if (x2 - x1 > BOX_THRESHOLD || y2 - y1 > BOX_THRESHOLD) {
            const ids = new Set<string>();
            cardsRef.current.forEach(c => { if (c.x + c.width > x1 && c.x < x2 && c.y + c.height > y1 && c.y < y2) ids.add(c.id); });
            sectionsRef.current.forEach(s => { if (s.x + s.width > x1 && s.x < x2 && s.y + s.height > y1 && s.y < y2) ids.add(s.id); });
            groupsRef.current.forEach(g => { if (g.x + g.width > x1 && g.x < x2 && g.y + g.height > y1 && g.y < y2) ids.add(g.id); });
            setSelectedIds(ids);
          } else {
            setSelectedIds(new Set());
          }
          setDragState(null);
        });
        boxDoneRef.current = true;
        return;
      }
      // Save snapshot on complete of a move/resize
      if (drag && (drag.kind === 'move-card' || drag.kind === 'resize-card' ||
          drag.kind === 'move-section' || drag.kind === 'resize-section' ||
          drag.kind === 'move-group' || drag.kind === 'resize-group')) {
        saveSnapshot();
      }
      if (drag) setDragState(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [screenToCanvas, saveSnapshot]);

  // ── Keyboard ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inField = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA';

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0 && !inField) {
        deleteSelected();
      }
      if (e.key === 'Escape') { setSelectedIds(new Set()); setContextMenu(null); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !inField) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y' && !inField) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, deleteSelected, undo, redo]);

  // ── File drop ─────────────────────────────────────────────
  const onDragOver  = (e: React.DragEvent) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setIsDragOver(true); } };
  const onDragLeave = (e: React.DragEvent) => { if (!outerRef.current?.contains(e.relatedTarget as Node)) setIsDragOver(false); };
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const pos = screenToCanvas(e.clientX, e.clientY);
    saveSnapshot();
    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxW = 400, maxH = 360;
          let w = img.naturalWidth, h = img.naturalHeight;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
          const card: CardData = {
            id: genId(), x: pos.x - w / 2 + i * 20, y: pos.y - h / 2 + i * 20,
            width: Math.max(w, 120), height: Math.max(h + 34, 80),
            type: 'image', title: file.name.replace(/\.[^.]+$/, ''), content: dataUrl,
          };
          setCards(prev => [...prev, card]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Canvas mouse ──────────────────────────────────────────
  const onCanvasDown = (e: React.MouseEvent) => {
    setContextMenu(null);
    if (e.button === 1) {
      e.preventDefault();
      setDragState({ kind: 'pan', startMX: e.clientX, startMY: e.clientY, startPX: panX, startPY: panY });
      return;
    }
    if (e.button === 0) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setDragState({ kind: 'box-select', startMX: e.clientX, startMY: e.clientY, startCanvasX: pos.x, startCanvasY: pos.y, currentCanvasX: pos.x, currentCanvasY: pos.y });
    }
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const c = screenToCanvas(e.clientX, e.clientY);
    setContextMenu({ sx: e.clientX, sy: e.clientY, cx: c.x, cy: c.y });
  };

  // ── Zoom ──────────────────────────────────────────────────
  const zoomTo = (nz: number) => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    setPanX(cx - (cx - panX) * (nz / zoom));
    setPanY(cy - (cy - panY) * (nz / zoom));
    setZoom(nz);
  };
  const fitView = () => { setZoom(0.55); setPanX(-120); setPanY(-100); };

  // ── Navigate ──────────────────────────────────────────────
  const navigateTo = useCallback((item: { x: number; y: number; width: number; height: number }) => {
    setPanX(window.innerWidth  / 2 - (item.x + item.width  / 2) * zoom);
    setPanY(window.innerHeight / 2 - (item.y + item.height / 2) * zoom);
  }, [zoom]);

  // ── Search ────────────────────────────────────────────────
  const hasSearch = searchQuery.trim().length > 0;
  const matches = (c: CardData) => {
    if (!hasSearch) return true;
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q);
  };

  // ── Box select rect ───────────────────────────────────────
  const boxRect = dragState?.kind === 'box-select' ? (() => {
    const x1 = Math.min(dragState.startCanvasX, dragState.currentCanvasX);
    const y1 = Math.min(dragState.startCanvasY, dragState.currentCanvasY);
    const x2 = Math.max(dragState.startCanvasX, dragState.currentCanvasX);
    const y2 = Math.max(dragState.startCanvasY, dragState.currentCanvasY);
    const w = x2 - x1, h = y2 - y1;
    if (w < BOX_THRESHOLD / zoom && h < BOX_THRESHOLD / zoom) return null;
    return { x: x1, y: y1, width: w, height: h };
  })() : null;

  const cursor = dragState?.kind === 'pan' ? 'grabbing' : dragState?.kind === 'box-select' ? 'crosshair' : 'default';

  return (
    <div ref={outerRef}
      style={{
        position: 'fixed', inset: 0, overflow: 'hidden',
        background: '#141414',
        backgroundImage: `radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panX}px ${panY}px`,
        cursor, fontFamily: 'Outfit, sans-serif',
      }}
      onMouseDown={onCanvasDown}
      onContextMenu={onContextMenu}
      onClick={() => setContextMenu(null)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Canvas transform layer */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        transformOrigin: '0 0',
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        width: 5000, height: 5000,
      }}>
        {/* Sections */}
        {sections.map(s => (
          <Section key={s.id} section={s} isSelected={selectedIds.has(s.id)} zoom={zoom}
            onSelect={e => { e.stopPropagation(); setSelectedIds(new Set([s.id])); }}
            onStartMove={e => setDragState({ kind: 'move-section', id: s.id, startMX: e.clientX, startMY: e.clientY, startX: s.x, startY: s.y })}
            onStartResize={(e, edge) => { e.stopPropagation(); setDragState({ kind: 'resize-section', id: s.id, edge, startMX: e.clientX, startMY: e.clientY, startX: s.x, startY: s.y, startW: s.width, startH: s.height }); }}
            onUpdate={patch => setSections(prev => prev.map(sec => sec.id === s.id ? { ...sec, ...patch } : sec))}
            onDelete={() => { saveSnapshot(); setSections(prev => prev.filter(sec => sec.id !== s.id)); setSelectedIds(new Set()); }}
          />
        ))}

        {/* Groups */}
        {groups.map(g => (
          <Group key={g.id} group={g} isSelected={selectedIds.has(g.id)}
            onSelect={e => { e.stopPropagation(); setSelectedIds(new Set([g.id])); }}
            onStartMove={e => setDragState({ kind: 'move-group', id: g.id, startMX: e.clientX, startMY: e.clientY, startX: g.x, startY: g.y })}
            onStartResize={(e, edge) => { e.stopPropagation(); setDragState({ kind: 'resize-group', id: g.id, edge, startMX: e.clientX, startMY: e.clientY, startX: g.x, startY: g.y, startW: g.width, startH: g.height }); }}
            onUpdate={patch => setGroups(prev => prev.map(gr => gr.id === g.id ? { ...gr, ...patch } : gr))}
            onDelete={() => { saveSnapshot(); setGroups(prev => prev.filter(gr => gr.id !== g.id)); setSelectedIds(new Set()); }}
          />
        ))}

        {/* Cards */}
        {cards.map(card => (
          <Card key={card.id} card={card} isSelected={selectedIds.has(card.id)}
            onSelect={e => { e.stopPropagation(); setSelectedIds(new Set([card.id])); }}
            onStartMove={e => setDragState({ kind: 'move-card', id: card.id, startMX: e.clientX, startMY: e.clientY, startX: card.x, startY: card.y })}
            onStartResize={(e, edge) => { e.stopPropagation(); setDragState({ kind: 'resize-card', id: card.id, edge, startMX: e.clientX, startMY: e.clientY, startX: card.x, startY: card.y, startW: card.width, startH: card.height }); }}
            onUpdate={patch => setCards(prev => prev.map(c => c.id === card.id ? { ...c, ...patch } : c))}
            onDelete={() => { saveSnapshot(); setCards(prev => prev.filter(c => c.id !== card.id)); setSelectedIds(new Set()); }}
          />
        ))}

        {/* Box select */}
        {boxRect && (
          <div style={{
            position: 'absolute', left: boxRect.x, top: boxRect.y,
            width: boxRect.width, height: boxRect.height,
            border: '1.5px solid #D4A843', background: 'rgba(212,168,67,0.05)',
            borderRadius: 4, pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* ── UI Chrome ── */}
      <Toolbar
        zoom={zoom}
        boardTitle={boardTitle}
        onBoardTitleChange={updateBoardTitle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddCard={addCard}
        onAddSection={addSection}
        onAddGroup={() => addGroup()}
        onZoomIn={() => zoomTo(Math.min(zoom * 1.25, 4))}
        onZoomOut={() => zoomTo(Math.max(zoom * 0.8, 0.08))}
        onFitView={fitView}
        onClearAll={() => { if (window.confirm('Clear the entire board?')) { saveSnapshot(); setCards([]); setSections([]); setGroups([]); setSelectedIds(new Set()); } }}
        selectedCount={selectedIds.size}
        onDeleteSelected={deleteSelected}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <Sidebar sections={sections} groups={groups} onNavigate={navigateTo} />

      <Minimap cards={cards} sections={sections} groups={groups}
        panX={panX} panY={panY} zoom={zoom}
        viewportWidth={window.innerWidth} viewportHeight={window.innerHeight}
        onNavigate={(nx, ny) => { setPanX(nx); setPanY(ny); }}
      />

      {contextMenu && (
        <ContextMenu x={contextMenu.sx} y={contextMenu.sy}
          onAddCard={(type) => addCard(type, contextMenu.cx, contextMenu.cy)}
          onAddSection={(key) => addSection(key, undefined, undefined)}
          onAddGroup={() => addGroup(contextMenu.cx, contextMenu.cy)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {isDragOver && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(212,168,67,0.04)', border: '2px dashed rgba(212,168,67,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{ background: 'rgba(14,14,14,0.92)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 12, padding: '18px 30px', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontSize: 13, color: '#D4A843', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Drop images to add</div>
          </div>
        </div>
      )}

      {/* Hints */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 10, padding: '5px 14px',
        background: 'rgba(14,14,14,0.82)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20, backdropFilter: 'blur(8px)',
        fontSize: 10, color: 'rgba(255,255,255,0.18)', fontFamily: 'Outfit, sans-serif',
        userSelect: 'none', pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        <span>Drag to move</span><span style={{ opacity: 0.3 }}>·</span>
        <span>Middle-click pan</span><span style={{ opacity: 0.3 }}>·</span>
        <span>Scroll zoom</span><span style={{ opacity: 0.3 }}>·</span>
        <span>Right-click add</span><span style={{ opacity: 0.3 }}>·</span>
        <span>Ctrl+Z undo · Ctrl+Y redo</span><span style={{ opacity: 0.3 }}>·</span>
        <span style={{ opacity: 0.5 }}>{cards.length} cards · {sections.length} sections · {groups.length} groups</span>
      </div>
    </div>
  );
}
