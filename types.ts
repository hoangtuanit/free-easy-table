export interface Cell {
  id: string;
  content: string;
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
}

export type Row = Cell[];

export type TableData = Row[];

export interface Column {
  id:string;
  isHeader: boolean;
  width: number;
}

export type ContextMenuData = {
  x: number;
  y: number;
  colIndex: number;
} | null;

export type CellContextMenuData = {
  x: number;
  y: number;
  rowIndex: number;
  colIndex: number;
} | null;

export type CellStyle = Omit<Cell, 'id' | 'content'>;