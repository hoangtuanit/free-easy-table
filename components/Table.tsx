import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TableData, Column, ContextMenuData, CellContextMenuData, CellStyle, MenuItem } from '../types';
import {
  PlusIcon, MenuIcon, HeaderColumnIcon, ColorIcon, InsertLeftIcon, InsertRightIcon,
  DuplicateIcon, ClearIcon, DeleteIcon
} from './icons';
import ContextMenu from './ContextMenu';
import EditableCell from './EditableCell';
import { createColorSubMenu, createClipboardMenuItems, createCopyPasteStyleMenuItems, createCellStyleSubMenu } from './menuItemsFactory';

const MIN_COL_WIDTH = 50;
const MIN_ROW_HEIGHT = 28;

interface TableProps {
  tableData: TableData;
  columns: Column[];
  rowHeights: number[];
  updateCellContent: (rowIndex: number, colIndex: number, content: string) => void;
  updateCellStyles: (rowIndex: number, colIndex: number, styles: Partial<CellStyle>) => void;
  addRow: () => void;
  addColumn: (direction: 'left' | 'right', colIndex: number) => void;
  deleteColumn: (colIndex: number) => void;
  clearColumnContent: (colIndex: number) => void;
  duplicateColumn: (colIndex: number) => void;
  toggleHeaderColumn: (colIndex: number) => void;
  setColumnColor: (colIndex: number, type: 'text' | 'background', color: string) => void;
  updateColumnWidth: (colIndex: number, width: number) => void;
  updateRowHeight: (rowIndex: number, height: number) => void;
  copiedStyle: CellStyle | null;
  setCopiedStyle: (style: CellStyle | null) => void;
}

const Table: React.FC<TableProps> = (props) => {
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuData>(null);
  const [cellContextMenu, setCellContextMenu] = useState<CellContextMenuData>(null);
  const [resizing, setResizing] = useState<{ type: 'col' | 'row'; index: number; startPos: number; startSize: number } | null>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;

      if (!activeCell && e.key.startsWith('Arrow')) {
        setActiveCell({ row: 0, col: 0 });
        return;
      }
      if (!activeCell) return;

      let nextRow = activeCell.row;
      let nextCol = activeCell.col;
      let moved = false;

      switch (e.key) {
        case 'ArrowUp':
          nextRow = Math.max(0, activeCell.row - 1);
          moved = true;
          break;
        case 'ArrowDown':
          nextRow = Math.min(props.tableData.length - 1, activeCell.row + 1);
          moved = true;
          break;
        case 'ArrowLeft':
          nextCol = Math.max(0, activeCell.col - 1);
          moved = true;
          break;
        case 'ArrowRight':
          nextCol = Math.min(props.columns.length - 1, activeCell.col + 1);
          moved = true;
          break;
        case 'Enter':
          e.preventDefault();
          setEditingCell(activeCell);
          break;
        case 'Tab':
          e.preventDefault();
          const numCols = props.columns.length;
          const numRows = props.tableData.length;
          let currentIdx = activeCell.row * numCols + activeCell.col;
          if (e.shiftKey) {
            currentIdx = (currentIdx - 1 + numCols * numRows) % (numCols * numRows);
          } else {
            currentIdx = (currentIdx + 1) % (numCols * numRows);
          }
          setActiveCell({ row: Math.floor(currentIdx / numCols), col: currentIdx % numCols });
          break;
      }
      if (moved) {
        e.preventDefault();
        setActiveCell({ row: nextRow, col: nextCol });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, editingCell, props.tableData.length, props.columns.length]);


  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing) return;
    if (resizing.type === 'col') {
      const delta = e.clientX - resizing.startPos;
      const newWidth = Math.max(resizing.startSize + delta, MIN_COL_WIDTH);
      props.updateColumnWidth(resizing.index, newWidth);
    } else {
      const delta = e.clientY - resizing.startPos;
      const newHeight = Math.max(resizing.startSize + delta, MIN_ROW_HEIGHT);
      props.updateRowHeight(resizing.index, newHeight);
    }
  }, [resizing, props.updateColumnWidth, props.updateRowHeight]);

  const handleMouseUp = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (resizing) {
      document.body.style.cursor = resizing.type === 'col' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  const handleResizeStart = (e: React.MouseEvent, type: 'col' | 'row', index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'col') {
      setResizing({ type, index, startPos: e.clientX, startSize: props.columns[index].width });
    } else {
      setResizing({ type, index, startPos: e.clientY, startSize: props.rowHeights[index] });
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('td, th, .context-menu')) {
        setActiveCell(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);


  const handleOpenContextMenu = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    setCellContextMenu(null);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + 5, colIndex });
  };

  const handleOpenCellContextMenu = (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    setContextMenu(null);
    setCellContextMenu({ x: e.clientX, y: e.clientY, rowIndex, colIndex });
  }

  const getColumnMenuItems = (colIndex: number): MenuItem[] => {
    const handleSetColor = (type: 'text' | 'background', color: string) => {
      props.setColumnColor(colIndex, type, color);
    };

    return [
      { type: 'toggle', icon: <HeaderColumnIcon />, label: 'Header column', checked: props.columns[colIndex].isHeader, action: () => props.toggleHeaderColumn(colIndex) },
      {
        type: 'submenu', icon: <ColorIcon />, label: 'Color', subMenu: [
          createColorSubMenu('text', (color) => handleSetColor('text', color)),
          createColorSubMenu('background', (color) => handleSetColor('background', color)),
        ]
      },
      { type: 'divider' },
      { type: 'item', icon: <InsertLeftIcon />, label: 'Insert left', action: () => props.addColumn('left', colIndex) },
      { type: 'item', icon: <InsertRightIcon />, label: 'Insert right', action: () => props.addColumn('right', colIndex) },
      { type: 'item', icon: <DuplicateIcon />, label: 'Duplicate', action: () => props.duplicateColumn(colIndex) },
      { type: 'divider' },
      { type: 'item', icon: <ClearIcon />, label: 'Clear contents', action: () => props.clearColumnContent(colIndex) },
      { type: 'item', icon: <DeleteIcon />, label: 'Delete', action: () => props.deleteColumn(colIndex) },
    ];
  };

  const getCellMenuItems = (rowIndex: number, colIndex: number): MenuItem[] => {
    const cell = props.tableData[rowIndex][colIndex];

    const handleCut = async () => { await navigator.clipboard.writeText(cell.content); props.updateCellContent(rowIndex, colIndex, ''); };
    const handleCopy = async () => { await navigator.clipboard.writeText(cell.content); };
    const handlePaste = async () => { const text = await navigator.clipboard.readText(); props.updateCellContent(rowIndex, colIndex, text); };
    const handleClear = () => { props.updateCellContent(rowIndex, colIndex, ''); };
    const handleCopyStyle = () => { const { id, content, ...style } = cell; props.setCopiedStyle(style); };
    const handlePasteStyle = () => { if (props.copiedStyle) props.updateCellStyles(rowIndex, colIndex, props.copiedStyle); };
    
    const handleStyleChange = (styles: Partial<CellStyle>) => props.updateCellStyles(rowIndex, colIndex, styles);
    
    return [
      ...createClipboardMenuItems(handleCut, handleCopy, handlePaste),
      { type: 'divider' },
      ...createCopyPasteStyleMenuItems(handleCopyStyle, handlePasteStyle, !props.copiedStyle),
      createCellStyleSubMenu(cell, handleStyleChange),
      { type: 'divider' },
      { type: 'item', icon: <ClearIcon />, label: 'Clear content', action: handleClear },
    ];
  };


  if (!props.tableData.length || !props.columns.length) return null;

  return (
    <div className="table-wrapper">
      <div className="table-container">
        <table className="notion-table">
          <colgroup>
            <col style={{ width: '48px' }} />
            {props.columns.map((col) => (<col key={col.id} style={{ width: `${col.width}px` }} />))}
            <col />
          </colgroup>
          <thead>
            <tr>
              <th className="table-corner-cell">
                <div className="table-add-button-wrapper">
                  <button onClick={props.addRow} className="add-button"><PlusIcon /></button>
                </div>
              </th>
              {props.columns.map((_, colIndex) => (
                <th key={props.columns[colIndex].id} className="table-header-cell">
                  <div className="table-header-cell-content">
                    <span>Column {colIndex + 1}</span>
                    <button onClick={(e) => handleOpenContextMenu(e, colIndex)} className="table-header-menu-button">
                      <MenuIcon />
                    </button>
                  </div>
                  <div className="resize-handle resize-handle-col" onMouseDown={(e) => handleResizeStart(e, 'col', colIndex)} />
                </th>
              ))}
              <th className="table-col-add-cell">
                <div className="table-add-button-wrapper">
                  <button onClick={() => props.addColumn('right', props.columns.length - 1)} className="add-button">
                    <PlusIcon />
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {props.tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="table-row-header-cell" style={{ height: `${props.rowHeights[rowIndex]}px` }}>
                  <div className="table-row-header-content">{rowIndex + 1}</div>
                  <div className="resize-handle resize-handle-row" onMouseDown={(e) => handleResizeStart(e, 'row', rowIndex)} />
                </td>
                {row.map((_, colIndex) => (
                  <EditableCell
                    key={props.tableData[rowIndex][colIndex].id}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    cellData={props.tableData[rowIndex][colIndex]}
                    isEditing={editingCell?.row === rowIndex && editingCell?.col === colIndex}
                    isActive={!editingCell && activeCell?.row === rowIndex && activeCell?.col === colIndex}
                    isHeader={props.columns[colIndex].isHeader}
                    rowHeight={props.rowHeights[rowIndex]}
                    numRows={props.tableData.length}
                    numCols={props.columns.length}
                    updateCellContent={props.updateCellContent}
                    setEditingCell={setEditingCell}
                    setActiveCell={setActiveCell}
                    onContextMenu={handleOpenCellContextMenu}
                    onResizeStart={handleResizeStart}
                  />
                ))}
                <td className="table-cell"></td>
              </tr>
            ))}
            <tr>
              <td className="table-footer-cell"></td>
              <td colSpan={props.columns.length + 1} className="table-row-add-cell">
                <button onClick={props.addRow} className="table-footer-add-button">
                  <PlusIcon /> <span>New</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          items={getColumnMenuItems(contextMenu.colIndex)}
          onClose={() => setContextMenu(null)}
          menuClassName="context-menu-md"
        />
      )}
      {cellContextMenu && (
        <ContextMenu
          x={cellContextMenu.x}
          y={cellContextMenu.y}
          items={getCellMenuItems(cellContextMenu.rowIndex, cellContextMenu.colIndex)}
          onClose={() => setCellContextMenu(null)}
          menuClassName="context-menu-sm"
        />
      )}
    </div>
  );
};

export default Table;