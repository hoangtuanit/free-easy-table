import React, { useState, useRef, useEffect } from 'react';
import { Cell } from '../types';

interface EditableCellProps {
    cellData: Cell;
    rowIndex: number;
    colIndex: number;
    isEditing: boolean;
    isActive: boolean;
    isHeader: boolean;
    rowHeight: number;
    numRows: number;
    numCols: number;
    updateCellContent: (rowIndex: number, colIndex: number, content: string) => void;
    setEditingCell: (cell: { row: number; col: number } | null) => void;
    setActiveCell: (cell: { row: number; col: number }) => void;
    onContextMenu: (e: React.MouseEvent, rowIndex: number, colIndex: number) => void;
    onResizeStart: (e: React.MouseEvent, type: 'col' | 'row', index: number) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
    cellData,
    rowIndex,
    colIndex,
    isEditing,
    isActive,
    isHeader,
    rowHeight,
    numRows,
    numCols,
    updateCellContent,
    setEditingCell,
    setActiveCell,
    onContextMenu,
    onResizeStart,
}) => {
    const [inputValue, setInputValue] = useState(cellData.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => setInputValue(cellData.content), [cellData.content]);

    useEffect(() => {
      if (isEditing) {
        textareaRef.current?.focus();
        setTimeout(() => textareaRef.current?.select(), 0);
      }
    }, [isEditing]);

    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [inputValue, isEditing]);

    const commitChanges = () => {
      if (inputValue !== cellData.content) {
        updateCellContent(rowIndex, colIndex, inputValue);
      }
      setEditingCell(null);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setInputValue(cellData.content);
        setEditingCell(null);
        setActiveCell({ row: rowIndex, col: colIndex });
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitChanges();
        const nextRow = Math.min(numRows - 1, rowIndex + 1);
        setActiveCell({ row: nextRow, col: colIndex });
        setTimeout(() => {
          const nextCell = document.querySelector(`[data-row='${nextRow}'][data-col='${colIndex}']`) as HTMLElement;
          if (nextCell) nextCell.focus();
        }, 0)
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitChanges();
        let currentIdx = rowIndex * numCols + colIndex;
        if (e.shiftKey) {
          currentIdx = (currentIdx - 1 + numCols * numRows) % (numCols * numRows);
        } else {
          currentIdx = (currentIdx + 1) % (numCols * numRows);
        }
        const nextActiveCell = { row: Math.floor(currentIdx / numCols), col: currentIdx % numCols };
        setActiveCell(nextActiveCell);
        setEditingCell(nextActiveCell);
      }
    };

    const cellStyle: React.CSSProperties = {
      backgroundColor: cellData.backgroundColor,
      height: `${rowHeight}px`,
    };

    const contentStyle: React.CSSProperties = {
      color: cellData.color,
      fontWeight: isHeader ? 'bold' : cellData.fontWeight,
      fontSize: `${cellData.fontSize}px`,
    };

    return (
      <td
        className={`table-cell ${isActive ? 'active' : ''}`}
        style={cellStyle}
        data-row={rowIndex}
        data-col={colIndex}
        onClick={() => {
          if (isEditing) return;
          setEditingCell({ row: rowIndex, col: colIndex });
        }}
        onDoubleClick={() => setEditingCell({ row: rowIndex, col: colIndex })}
        onContextMenu={(e) => onContextMenu(e, rowIndex, colIndex)}
      >
        {!isEditing ? (
          <div className="cell-content" style={contentStyle}>
            {cellData.content || ' '}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={commitChanges}
            onKeyDown={handleKeyDown}
            className="cell-textarea"
            style={{ ...contentStyle, height: 'auto' }}
          />
        )}

        <div className="resize-handle resize-handle-col" onMouseDown={(e) => onResizeStart(e, 'col', colIndex)} />
        <div className="resize-handle resize-handle-row" onMouseDown={(e) => onResizeStart(e, 'row', rowIndex)} />
      </td>
    );
}
export default EditableCell;
