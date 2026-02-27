import { CardData, SectionData, GroupData } from '../types';

export interface BoardExport {
  version: 2;
  exportedAt: string;
  title: string;
  cards: CardData[];
  sections: SectionData[];
  groups: GroupData[];
}

export function exportBoard(title: string, cards: CardData[], sections: SectionData[], groups: GroupData[]) {
  const data: BoardExport = {
    version: 2,
    exportedAt: new Date().toISOString(),
    title,
    cards,
    sections,
    groups,
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href     = url;
  a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBoard(file: File): Promise<BoardExport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string) as BoardExport;
        if (!data.cards || !data.sections) throw new Error('Invalid board file');
        // Backfill groups if missing (v1 files)
        if (!data.groups) data.groups = [];
        resolve(data);
      } catch (err) {
        reject(new Error('Could not read file — make sure it\'s a Maskhara board export.'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
