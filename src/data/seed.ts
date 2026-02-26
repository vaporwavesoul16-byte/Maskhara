import { CardData, SectionData } from '../types';

export const DEFAULT_SECTIONS: SectionData[] = [
  {
    id: 's-services',
    x: 120, y: 120,
    width: 1400, height: 900,
    label: '01 — Services & Products',
    sublabel: 'What we make and offer',
    key: 'services',
  },
  {
    id: 's-clients',
    x: 120, y: 1120,
    width: 1400, height: 900,
    label: '02 — Buyers & Clients',
    sublabel: 'Who we serve and attract',
    key: 'clients',
  },
  {
    id: 's-identity',
    x: 1680, y: 120,
    width: 1500, height: 900,
    label: '03 — Brand Identity',
    sublabel: 'Aesthetic, palette, type, vision',
    key: 'identity',
  },
  {
    id: 's-projects',
    x: 1680, y: 1120,
    width: 1500, height: 900,
    label: '04 — Projects',
    sublabel: 'Current and planned work',
    key: 'projects',
  },
  {
    id: 's-notes',
    x: 120, y: 2120,
    width: 3060, height: 700,
    label: '05 — Open Notes & Expansion',
    sublabel: 'Overflow, experiments, anything goes',
    key: 'notes',
  },
];

export const DEFAULT_CARDS: CardData[] = [
  // ── SERVICES ──────────────────────────────────────────────
  {
    id: 'srv-ref-1', x: 180, y: 240, width: 200, height: 160,
    type: 'image', title: 'Reference Image',
    content: '',
  },
  {
    id: 'srv-ref-2', x: 400, y: 240, width: 200, height: 160,
    type: 'image', title: 'Reference Image',
    content: '',
  },
  {
    id: 'srv-ref-3', x: 620, y: 240, width: 200, height: 160,
    type: 'image', title: 'Reference Image',
    content: '',
  },
  {
    id: 'srv-ref-4', x: 180, y: 420, width: 200, height: 160,
    type: 'image', title: 'Reference Image',
    content: '',
  },
  {
    id: 'srv-ref-5', x: 400, y: 420, width: 200, height: 160,
    type: 'image', title: 'Reference Image',
    content: '',
  },
  {
    id: 'srv-ref-6', x: 620, y: 420, width: 200, height: 160,
    type: 'image', title: 'Reference Image',
    content: '',
  },
  {
    id: 'srv-desc', x: 870, y: 240, width: 300, height: 200,
    type: 'note', title: 'Service Description',
    content: 'Describe the service or product here.\n\nWhat is it? What does it do? What makes it valuable?',
  },
  {
    id: 'srv-bs-1', x: 870, y: 460, width: 180, height: 120,
    type: 'note', title: 'Brainstorm',
    content: 'Add idea here...',
  },
  {
    id: 'srv-bs-2', x: 1065, y: 460, width: 180, height: 120,
    type: 'note', title: 'Brainstorm',
    content: 'Add idea here...',
  },
  {
    id: 'srv-bs-3', x: 1260, y: 460, width: 180, height: 120,
    type: 'note', title: 'Brainstorm',
    content: 'Add idea here...',
  },
  {
    id: 'srv-link', x: 1190, y: 240, width: 280, height: 100,
    type: 'link', title: 'Inspiration Link',
    content: 'https://example.com',
  },

  // ── CLIENTS ───────────────────────────────────────────────
  {
    id: 'cli-persona-1', x: 180, y: 1240, width: 260, height: 320,
    type: 'persona', title: 'Client Persona A',
    content: '',
    personaFields: { archetype: '', goals: '', painPoints: '', notes: '' },
  },
  {
    id: 'cli-persona-2', x: 460, y: 1240, width: 260, height: 320,
    type: 'persona', title: 'Client Persona B',
    content: '',
    personaFields: { archetype: '', goals: '', painPoints: '', notes: '' },
  },
  {
    id: 'cli-persona-3', x: 740, y: 1240, width: 260, height: 320,
    type: 'persona', title: 'Client Persona C',
    content: '',
    personaFields: { archetype: '', goals: '', painPoints: '', notes: '' },
  },
  {
    id: 'cli-audience', x: 1020, y: 1240, width: 300, height: 160,
    type: 'note', title: 'Target Audience',
    content: 'Describe who we are trying to reach.\n\nIndustry, company size, role, geography, mindset...',
  },
  {
    id: 'cli-fb-1', x: 1020, y: 1420, width: 300, height: 130,
    type: 'note', title: 'Client Feedback',
    content: '"Add a quote or feedback here."\n\n— Client name / context',
  },
  {
    id: 'cli-fb-2', x: 1340, y: 1240, width: 120, height: 130,
    type: 'note', title: 'Tag',
    content: 'Add audience tag or keyword...',
  },
  {
    id: 'cli-fb-3', x: 1340, y: 1390, width: 120, height: 130,
    type: 'note', title: 'Tag',
    content: 'Add audience tag or keyword...',
  },

  // ── BRAND IDENTITY ────────────────────────────────────────
  {
    id: 'id-ref-1', x: 1740, y: 240, width: 180, height: 140,
    type: 'image', title: 'Aesthetic Ref',
    content: '',
  },
  {
    id: 'id-ref-2', x: 1930, y: 240, width: 180, height: 140,
    type: 'image', title: 'Aesthetic Ref',
    content: '',
  },
  {
    id: 'id-ref-3', x: 2120, y: 240, width: 180, height: 140,
    type: 'image', title: 'Aesthetic Ref',
    content: '',
  },
  {
    id: 'id-ref-4', x: 1740, y: 390, width: 180, height: 140,
    type: 'image', title: 'Aesthetic Ref',
    content: '',
  },
  {
    id: 'id-ref-5', x: 1930, y: 390, width: 180, height: 140,
    type: 'image', title: 'Aesthetic Ref',
    content: '',
  },
  {
    id: 'id-ref-6', x: 2120, y: 390, width: 180, height: 140,
    type: 'image', title: 'Aesthetic Ref',
    content: '',
  },
  {
    id: 'id-swatches', x: 2360, y: 240, width: 320, height: 200,
    type: 'swatch', title: 'Colour Palette',
    content: '',
    swatches: [
      { hex: '', label: 'Primary' },
      { hex: '', label: 'Secondary' },
      { hex: '', label: 'Accent' },
      { hex: '', label: 'Neutral' },
      { hex: '', label: 'Dark' },
      { hex: '', label: 'Light' },
    ],
  },
  {
    id: 'id-font-1', x: 2360, y: 460, width: 300, height: 130,
    type: 'note', title: 'Display Font',
    content: 'Font name:\n\nUsage: Headlines, hero text, logos\n\nSample: The quick brown fox...',
  },
  {
    id: 'id-font-2', x: 2360, y: 610, width: 300, height: 130,
    type: 'note', title: 'Body Font',
    content: 'Font name:\n\nUsage: Paragraphs, UI, captions\n\nSample: The quick brown fox...',
  },
  {
    id: 'id-ethos', x: 1740, y: 560, width: 560, height: 160,
    type: 'note', title: 'Vision & Ethos',
    content: 'Write the brand manifesto here.\n\nWhat does Maskhara stand for? What is it against? What does it believe?',
  },
  {
    id: 'id-bs-1', x: 2720, y: 240, width: 160, height: 120,
    type: 'note', title: 'Brainstorm',
    content: 'Idea...',
  },
  {
    id: 'id-bs-2', x: 2720, y: 370, width: 160, height: 120,
    type: 'note', title: 'Brainstorm',
    content: 'Idea...',
  },

  // ── PROJECTS ──────────────────────────────────────────────
  {
    id: 'proj-1', x: 1740, y: 1240, width: 300, height: 280,
    type: 'project', title: 'Project Alpha',
    content: '',
    projectFields: { status: 'in-progress', description: '', notes: '' },
  },
  {
    id: 'proj-2', x: 2060, y: 1240, width: 300, height: 280,
    type: 'project', title: 'Project Beta',
    content: '',
    projectFields: { status: 'planned', description: '', notes: '' },
  },
  {
    id: 'proj-3', x: 2380, y: 1240, width: 300, height: 280,
    type: 'project', title: 'Project Gamma',
    content: '',
    projectFields: { status: 'planned', description: '', notes: '' },
  },
  {
    id: 'proj-ref-1', x: 2700, y: 1240, width: 180, height: 130,
    type: 'image', title: 'Project Ref',
    content: '',
  },
  {
    id: 'proj-ref-2', x: 2700, y: 1380, width: 180, height: 130,
    type: 'image', title: 'Project Ref',
    content: '',
  },
  {
    id: 'proj-note', x: 2700, y: 1520, width: 300, height: 120,
    type: 'note', title: 'Project Notes',
    content: 'General notes about the pipeline, timelines, or priorities...',
  },

  // ── OPEN NOTES ────────────────────────────────────────────
  {
    id: 'open-1', x: 200, y: 2240, width: 220, height: 140,
    type: 'note', title: 'Note',
    content: 'Add anything here...',
  },
  {
    id: 'open-2', x: 440, y: 2240, width: 220, height: 140,
    type: 'note', title: 'Note',
    content: 'Add anything here...',
  },
  {
    id: 'open-3', x: 680, y: 2260, width: 220, height: 140,
    type: 'note', title: 'Note',
    content: 'Add anything here...',
  },
  {
    id: 'open-4', x: 920, y: 2230, width: 220, height: 140,
    type: 'note', title: 'Note',
    content: 'Add anything here...',
  },
];
