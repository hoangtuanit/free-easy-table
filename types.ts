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

export type MenuItem =
  | {
      type: 'item';
      label: string;
      icon?: React.ReactNode;
      action?: () => void;
      disabled?: boolean;
    }
  | {
      type: 'submenu';
      label: string;
      icon?: React.ReactNode;
      subMenu: MenuItem[];
    }
  | {
      type: 'toggle';
      label: string;
      icon?: React.ReactNode;
      checked: boolean;
      action: () => void;
    }
  | {
      type: 'custom';
      content: React.ReactNode;
  }
  | {
      type: 'divider';
    };
