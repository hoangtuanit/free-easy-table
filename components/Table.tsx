import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TableData, Column, ContextMenuData, CellContextMenuData, CellStyle } from '../types';
import { COLORS } from '../constants';
import {
  PlusIcon, MenuIcon, HeaderColumnIcon, ColorIcon, InsertLeftIcon, InsertRightIcon,
  DuplicateIcon, ClearIcon, DeleteIcon, ChevronRightIcon, ChevronLeftIcon,
  CutIcon, CopyIcon, PasteIcon, StyleIcon, FontSizeIcon, FontWeightIcon
} from './icons';

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
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const cellContextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;

      if (!activeCell && e.key.startsWith('Arrow')) {
         setActiveCell({ row: 0, col: 0});
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
            if(e.shiftKey) {
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
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
      if (cellContextMenuRef.current && !cellContextMenuRef.current.contains(event.target as Node)) {
        setCellContextMenu(null);
      }
       if (!(event.target as HTMLElement).closest('td, th')) {
           setActiveCell(null);
       }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [contextMenu, cellContextMenu]);


  const handleOpenContextMenu = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    setCellContextMenu(null);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + 5, colIndex });
  };
  
  const handleOpenCellContextMenu = (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
      e.preventDefault();
      setContextMenu(null);
      setCellContextMenu({x: e.clientX, y: e.clientY, rowIndex, colIndex});
  }

  const EditableCell: React.FC<{ rowIndex: number; colIndex: number }> = ({ rowIndex, colIndex }) => {
    const cellData = props.tableData[rowIndex][colIndex];
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
    const isActive = !isEditing && activeCell?.row === rowIndex && activeCell?.col === colIndex;
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
        props.updateCellContent(rowIndex, colIndex, inputValue);
      }
      setEditingCell(null);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setInputValue(cellData.content);
        setEditingCell(null);
        setActiveCell({row: rowIndex, col: colIndex});
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitChanges();
        const nextRow = Math.min(props.tableData.length - 1, rowIndex + 1);
        setActiveCell({ row: nextRow, col: colIndex });
        setTimeout(() => {
            const nextCell = document.querySelector(`[data-row='${nextRow}'][data-col='${colIndex}']`) as HTMLElement;
            if (nextCell) nextCell.focus();
        },0)
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitChanges();
        const numCols = props.columns.length;
        const numRows = props.tableData.length;
        let currentIdx = rowIndex * numCols + colIndex;
        if(e.shiftKey) {
            currentIdx = (currentIdx - 1 + numCols * numRows) % (numCols * numRows);
        } else {
            currentIdx = (currentIdx + 1) % (numCols * numRows);
        }
        const nextActiveCell = { row: Math.floor(currentIdx / numCols), col: currentIdx % numCols };
        setActiveCell(nextActiveCell);
        setEditingCell(nextActiveCell);
      }
    };
    
    const isHeader = props.columns[colIndex].isHeader;

    const cellStyle: React.CSSProperties = {
        backgroundColor: cellData.backgroundColor,
        height: `${props.rowHeights[rowIndex]}px`,
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
            if (editingCell?.row === rowIndex && editingCell?.col === colIndex) return;
            setActiveCell({ row: rowIndex, col: colIndex });
        }}
        onDoubleClick={() => setEditingCell({ row: rowIndex, col: colIndex })}
        onContextMenu={(e) => handleOpenCellContextMenu(e, rowIndex, colIndex)}
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
          
        <div className="resize-handle resize-handle-col" onMouseDown={(e) => handleResizeStart(e, 'col', colIndex)} />
        <div className="resize-handle resize-handle-row" onMouseDown={(e) => handleResizeStart(e, 'row', rowIndex)} />
      </td>
    );
  };
  
  const CellContextMenu: React.FC<{ menuData: NonNullable<CellContextMenuData> }> = ({ menuData }) => {
    const { rowIndex, colIndex, x, y } = menuData;
    const [activeSubMenu, setActiveSubMenu] = useState<'style' | null>(null);

    const handleAction = async (action: 'cut' | 'copy' | 'paste' | 'clear' | 'copyStyle' | 'pasteStyle') => {
        const cell = props.tableData[rowIndex][colIndex];
        setCellContextMenu(null);
        switch (action) {
            case 'cut':
                await navigator.clipboard.writeText(cell.content);
                props.updateCellContent(rowIndex, colIndex, '');
                break;
            case 'copy':
                await navigator.clipboard.writeText(cell.content);
                break;
            case 'paste':
                const text = await navigator.clipboard.readText();
                props.updateCellContent(rowIndex, colIndex, text);
                break;
            case 'clear':
                props.updateCellContent(rowIndex, colIndex, '');
                break;
            case 'copyStyle':
                const { id, content, ...style } = cell;
                props.setCopiedStyle(style);
                break;
            case 'pasteStyle':
                if (props.copiedStyle) props.updateCellStyles(rowIndex, colIndex, props.copiedStyle);
                break;
        }
    }

    const handleStyleChange = (styles: Partial<CellStyle>) => props.updateCellStyles(rowIndex, colIndex, styles);
    
    // FIX: Refactor CellMenuItem to use a proper discriminated union.
    type CellMenuItem =
      | {
          type: 'item';
          icon: React.ReactNode;
          label: string;
          action?: () => void;
          disabled?: boolean;
          subMenu?: 'style';
        }
      | {
          type: 'divider';
        };

    const menuItems: CellMenuItem[] = [
      { type: 'item', icon: <CutIcon />, label: 'Cut', action: () => handleAction('cut') },
      { type: 'item', icon: <CopyIcon />, label: 'Copy', action: () => handleAction('copy') },
      { type: 'item', icon: <PasteIcon />, label: 'Paste', action: () => handleAction('paste') },
      { type: 'divider' },
      { type: 'item', icon: <CopyIcon />, label: 'Copy Style', action: () => handleAction('copyStyle')},
      { type: 'item', icon: <PasteIcon />, label: 'Paste Style', action: () => handleAction('pasteStyle'), disabled: !props.copiedStyle },
      { type: 'item', icon: <StyleIcon />, label: 'Style', subMenu: 'style' },
      { type: 'divider' },
      { type: 'item', icon: <ClearIcon />, label: 'Clear content', action: () => handleAction('clear') },
    ];
    
    const ColorPalette = ({type}: {type: 'text' | 'background'}) => (
        <div className="submenu context-menu context-menu-md">
            {COLORS[type].map((color, idx) => (
                <div key={idx} onClick={() => handleStyleChange(type === 'text' ? {color: color.color} : {backgroundColor: color.backgroundColor})} className="color-swatch-item">
                    <div className="color-swatch" style={{ backgroundColor: type === 'background' ? color.swatchColor : color.color }}></div>
                    <span>{color.name}</span>
                </div>
            ))}
        </div>
    );
    
    const StyleSubMenu = () => {
        const cell = props.tableData[rowIndex][colIndex];
        const [size, setSize] = useState(cell.fontSize);
        const [activePalette, setActivePalette] = useState<'text' | 'background' | null>(null);

        const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newSize = parseInt(e.target.value, 10);
            if (!isNaN(newSize)) {
                setSize(newSize);
                handleStyleChange({ fontSize: newSize });
            }
        };

        const toggleBold = () => handleStyleChange({ fontWeight: cell.fontWeight === 'bold' ? 'normal' : 'bold' });

        return (
            <div className="submenu context-menu context-menu-md" onMouseLeave={() => setActivePalette(null)}>
                <div onMouseEnter={() => setActivePalette('text')} className={`menu-item ${activePalette === 'text' ? 'active' : ''}`}>
                    <div className="menu-item-content"><span>Text color</span></div> <ChevronRightIcon />
                    {activePalette === 'text' && <ColorPalette type="text"/>}
                </div>
                <div onMouseEnter={() => setActivePalette('background')} className={`menu-item ${activePalette === 'background' ? 'active' : ''}`}>
                    <div className="menu-item-content"><span>Background color</span></div> <ChevronRightIcon />
                    {activePalette === 'background' && <ColorPalette type="background"/>}
                </div>
                <div className="menu-item">
                    <div className="menu-item-content"><span className="menu-item-icon"><FontSizeIcon/></span><span>Font Size</span></div>
                    <input type="number" value={size} onChange={handleSizeChange} className="font-size-input" />
                </div>
                <div className="menu-item" onClick={toggleBold}>
                     <div className="menu-item-content"><span className="menu-item-icon"><FontWeightIcon/></span><span>Bold</span></div>
                     <div className={`toggle-switch ${cell.fontWeight === 'bold' ? 'toggled' : ''}`}><div className="toggle-switch-handle"></div></div>
                </div>
            </div>
        )
    };
    
    return (
      <div ref={cellContextMenuRef} className="context-menu context-menu-sm" style={{ top: y, left: x }}>
        {menuItems.map((item, idx) => {
            if (item.type === 'divider') return <div key={idx} className="menu-divider" />;

            const menuItemClasses = `menu-item ${item.disabled ? 'disabled' : ''} ${activeSubMenu === item.subMenu ? 'active' : ''}`;

            if (item.subMenu) {
                return (
                    <div key={idx} onMouseEnter={() => setActiveSubMenu(item.subMenu)} onMouseLeave={() => setActiveSubMenu(null)} className={menuItemClasses}>
                        <div className="menu-item-content"><span className="menu-item-icon">{item.icon}</span><span>{item.label}</span></div>
                        <ChevronRightIcon />
                        {activeSubMenu === 'style' && <StyleSubMenu />}
                    </div>
                );
            }

            return (
             <div key={idx} onClick={item.disabled ? undefined : item.action} className={menuItemClasses}>
               <div className="menu-item-content"><span className="menu-item-icon">{item.icon}</span><span>{item.label}</span></div>
             </div>
            );
        })}
      </div>
    );
  }

  const ColumnContextMenu: React.FC<{ menuData: NonNullable<ContextMenuData> }> = ({ menuData }) => {
    const [activeSubMenu, setActiveSubMenu] = useState<'color' | null>(null);
    const { colIndex, x, y } = menuData;

    const menuItems = [
      { icon: <HeaderColumnIcon />, label: 'Header column', action: () => props.toggleHeaderColumn(colIndex), toggle: props.columns[colIndex].isHeader },
      { icon: <ColorIcon />, label: 'Color', subMenu: 'color' as const },
      { icon: <InsertLeftIcon />, label: 'Insert left', action: () => props.addColumn('left', colIndex) },
      { icon: <InsertRightIcon />, label: 'Insert right', action: () => props.addColumn('right', colIndex) },
      { icon: <DuplicateIcon />, label: 'Duplicate', action: () => props.duplicateColumn(colIndex) },
      { icon: <ClearIcon />, label: 'Clear contents', action: () => props.clearColumnContent(colIndex) },
      { icon: <DeleteIcon />, label: 'Delete', action: () => props.deleteColumn(colIndex) },
    ];
    
    const handleSetColor = (type: 'text' | 'background', color: string) => {
        props.setColumnColor(colIndex, type, color);
        setContextMenu(null);
    }
    
    const ColorPalette = ({ type, onBack }: { type: 'text' | 'background', onBack: () => void }) => (
      <div className="submenu context-menu context-menu-md">
          <div className="submenu-header" onClick={(e) => { e.stopPropagation(); onBack(); }}>
            <ChevronLeftIcon /> <span className="submenu-header-text">Color</span>
          </div>
          <div className="menu-divider"></div>
          <h3 className="submenu-title">{type === 'text' ? 'Text color' : 'Background color'}</h3>
          {COLORS[type].map((color, idx) => (
              <div key={idx} onClick={() => handleSetColor(type, type === 'text' ? color.color : color.backgroundColor)} className="color-swatch-item">
                  <div className="color-swatch" style={{ backgroundColor: type === 'background' ? color.swatchColor : color.color }}></div>
                  <span>{color.name}</span>
              </div>
          ))}
      </div>
    );

    const ColorSubMenu = () => {
      const [activePalette, setActivePalette] = useState<'text' | 'background' | null>(null);
      return (
        <div className="submenu context-menu context-menu-md" onMouseLeave={() => setActivePalette(null)}>
          <div onMouseEnter={() => setActivePalette('text')} className={`menu-item ${activePalette === 'text' ? 'active' : ''}`}>
            <div className="menu-item-content"><span>Text color</span></div> <ChevronRightIcon />
            {activePalette === 'text' && <ColorPalette type="text" onBack={() => setActivePalette(null)} />}
          </div>
          <div onMouseEnter={() => setActivePalette('background')} className={`menu-item ${activePalette === 'background' ? 'active' : ''}`}>
            <div className="menu-item-content"><span>Background color</span></div> <ChevronRightIcon />
            {activePalette === 'background' && <ColorPalette type="background" onBack={() => setActivePalette(null)} />}
          </div>
        </div>
      );
    };

    return (
      <div ref={contextMenuRef} className="context-menu context-menu-md" style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()}>
        {menuItems.map((item, idx) => {
          const menuItemClasses = `menu-item ${activeSubMenu === item.subMenu ? 'active' : ''}`;
          if (item.subMenu) {
            return (
              <div key={idx} onMouseEnter={() => setActiveSubMenu(item.subMenu)} onMouseLeave={() => setActiveSubMenu(null)} className={menuItemClasses}>
                <div className="menu-item-content">
                  <span className="menu-item-icon">{item.icon}</span> <span>{item.label}</span>
                </div>
                <ChevronRightIcon />
                {activeSubMenu === 'color' && <ColorSubMenu />}
              </div>
            );
          }
          return (
            <div key={idx} onClick={() => { if (item.action) { item.action(); setContextMenu(null); } }} className="menu-item">
              <div className="menu-item-content">
                <span className="menu-item-icon">{item.icon}</span> <span>{item.label}</span>
              </div>
              {item.toggle !== undefined && <div className={`toggle-switch ${item.toggle ? 'toggled' : ''}`}><div className="toggle-switch-handle"></div></div>}
            </div>
          );
        })}
      </div>
    );
  };
  
  if (!props.tableData.length || !props.columns.length) return null;
  
  return (
    <div className="table-wrapper">
      <div className="table-container">
        <table className="notion-table">
          <colgroup>
            <col style={{ width: '48px' }} />
            {props.columns.map((col) => (<col key={col.id} style={{ width: `${col.width}px` }}/>))}
            <col />
          </colgroup>
          <thead>
            <tr>
              <th className="table-corner-cell">
                 <div className="table-add-button-wrapper">
                    <button onClick={props.addRow} className="add-button"><PlusIcon/></button>
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
                           <PlusIcon/>
                       </button>
                   </div>
               </th>
            </tr>
          </thead>
          <tbody>
            {props.tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="table-row-header-cell" style={{height: `${props.rowHeights[rowIndex]}px`}}>
                    <div className="table-row-header-content">{rowIndex + 1}</div>
                    <div className="resize-handle resize-handle-row" onMouseDown={(e) => handleResizeStart(e, 'row', rowIndex)} />
                </td>
                {row.map((_, colIndex) => (
                  <EditableCell key={props.tableData[rowIndex][colIndex].id} rowIndex={rowIndex} colIndex={colIndex} />
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
      {contextMenu && <ColumnContextMenu menuData={contextMenu} />}
      {cellContextMenu && <CellContextMenu menuData={cellContextMenu}/>}
    </div>
  );
};

export default Table;
