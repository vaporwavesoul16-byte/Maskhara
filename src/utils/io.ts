import { BoardExport, CardData, SectionData, GroupData, ShapeData } from '../types';

export function exportBoard(boardTitle: string, cards: CardData[], sections: SectionData[], groups: GroupData[], shapes: ShapeData[] = []): void {
  const data: BoardExport = { version: 1, exportedAt: new Date().toISOString(), boardTitle, cards, sections, groups, shapes };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${boardTitle.replace(/\s+/g,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function importBoard(file: File): Promise<BoardExport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string) as BoardExport;
        if (!data.cards || !data.sections) throw new Error('Invalid board file');
        resolve(data);
      } catch { reject(new Error('Could not read board file — make sure it is a valid Maskhara export.')); }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
