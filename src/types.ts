export type CardType = 'note' | 'image' | 'link' | 'swatch' | 'persona' | 'project';
export type SectionKey = 'services' | 'clients' | 'identity' | 'projects' | 'notes' | 'custom';

export interface SwatchEntry { hex: string; label: string; }

export interface PersonaFields {
  archetype: string; goals: string; painPoints: string; notes: string;
}

export interface ProjectFields {
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  description: string; notes: string;
}

export interface CardData {
  id: string; x: number; y: number; width: number; height: number;
  type: CardType; title: string; content: string;
  locked?: boolean;
  swatches?: SwatchEntry[];
  personaFields?: PersonaFields;
  projectFields?: ProjectFields;
}

export interface SectionData {
  id: string; x: number; y: number; width: number; height: number;
  label: string; sublabel: string; key: SectionKey;
  locked?: boolean;
  customColor?: string;
}

export interface GroupData {
  id: string; x: number; y: number; width: number; height: number;
  label: string; color: string;
  locked?: boolean;
}

export type DragState =
  | { kind: 'pan'; startMX: number; startMY: number; startPX: number; startPY: number }
  | { kind: 'move-card'; id: string; startMX: number; startMY: number; startX: number; startY: number }
  | { kind: 'move-section'; id: string; startMX: number; startMY: number; startX: number; startY: number }
  | { kind: 'move-group'; id: string; startMX: number; startMY: number; startX: number; startY: number }
  | { kind: 'resize-section'; id: string; edge: string; startMX: number; startMY: number; startX: number; startY: number; startW: number; startH: number }
  | { kind: 'resize-group'; id: string; edge: string; startMX: number; startMY: number; startX: number; startY: number; startW: number; startH: number }
  | { kind: 'resize-card'; id: string; edge: string; startMX: number; startMY: number; startX: number; startY: number; startW: number; startH: number }
  | { kind: 'box-select'; startMX: number; startMY: number; startCanvasX: number; startCanvasY: number; currentCanvasX: number; currentCanvasY: number }
  | null;

export const SECTION_ACCENT: Record<SectionKey, string> = {
  services: '#3B7BFF', clients: '#2CB87A', identity: '#D4A843',
  projects: '#C23B22', notes: '#8B5CF6', custom: '#888888',
};

export const SECTION_BG: Record<SectionKey, string> = {
  services: 'rgba(59,123,255,0.04)', clients: 'rgba(44,184,122,0.04)',
  identity: 'rgba(212,168,67,0.04)', projects: 'rgba(194,59,34,0.04)',
  notes: 'rgba(139,92,246,0.04)', custom: 'rgba(255,255,255,0.02)',
};

export const GROUP_COLORS = [
  '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F8A5C2','#F7DC6F',
];

export type Snapshot = {
  cards: CardData[]; sections: SectionData[]; groups: GroupData[];
};
