import React, { useState, useCallback, useRef } from 'react';
import { TableData, Column, Cell, CellStyle } from './types';
import Table from './components/Table';
import { SaveIcon, LoadIcon } from './components/icons';
import { DEFAULT_CELL_STYLE } from './constants';
import './styles.css';

const DEFAULT_COL_WIDTH = 200;
const DEFAULT_ROW_HEIGHT = 40;

const createNewCell = (): Cell => ({
  id: crypto.randomUUID(),
  content: '',
  ...DEFAULT_CELL_STYLE,
});

const createInitialTable = (rows: number, cols: number): [TableData, Column[], number[]] => {
  const tableData: TableData = Array.from({ length: rows }, () => 
    Array.from({ length: cols }, createNewCell)
  );
  const columns: Column[] = Array.from({ length: cols }, () => ({
    id: crypto.randomUUID(),
    isHeader: false,
    width: DEFAULT_COL_WIDTH,
  }));
  columns[0].isHeader = true; // Default first column as header
  const rowHeights: number[] = Array.from({ length: rows }, () => DEFAULT_ROW_HEIGHT);
  return [tableData, columns, rowHeights];
};

const App: React.FC = () => {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [columns, setColumns] = useState<Column[] | null>(null);
  const [rowHeights, setRowHeights] = useState<number[] | null>(null);
  const [copiedStyle, setCopiedStyle] = useState<CellStyle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initializeTable = () => {
    const [initialData, initialColumns, initialRowHeights] = createInitialTable(3, 3);
    setTableData(initialData);
    setColumns(initialColumns);
    setRowHeights(initialRowHeights);
  };

  const updateCellContent = useCallback((rowIndex: number, colIndex: number, content: string) => {
    setTableData(prevData => {
      if (!prevData) return null;
      const newData = [...prevData];
      newData[rowIndex] = [...newData[rowIndex]];
      newData[rowIndex][colIndex] = { ...newData[rowIndex][colIndex], content };
      return newData;
    });
  }, []);

  const updateCellStyles = useCallback((rowIndex: number, colIndex: number, styles: Partial<CellStyle>) => {
    setTableData(prevData => {
      if (!prevData) return null;
      const newData = [...prevData];
      newData[rowIndex] = [...newData[rowIndex]];
      newData[rowIndex][colIndex] = { ...newData[rowIndex][colIndex], ...styles };
      return newData;
    })
  }, []);

  const addRow = useCallback(() => {
    setTableData(prevData => {
      if (!prevData || !columns) return prevData;
      const newRow = Array.from({ length: columns.length }, createNewCell);
      return [...prevData, newRow];
    });
    setRowHeights(prevHeights => prevHeights ? [...prevHeights, DEFAULT_ROW_HEIGHT] : null);
  }, [columns]);

  const addColumn = useCallback((direction: 'left' | 'right', colIndex: number) => {
    const insertIndex = direction === 'right' ? colIndex + 1 : colIndex;
    
    setColumns(prevCols => {
        if (!prevCols) return null;
        const newCols = [...prevCols];
        newCols.splice(insertIndex, 0, { id: crypto.randomUUID(), isHeader: false, width: DEFAULT_COL_WIDTH });
        return newCols;
    });

    setTableData(prevData => {
        if (!prevData) return null;
        return prevData.map(row => {
            const newRow = [...row];
            newRow.splice(insertIndex, 0, createNewCell());
            return newRow;
        });
    });
  }, []);

  const deleteColumn = useCallback((colIndex: number) => {
    if (columns && columns.length <= 1) return;
    setColumns(prevCols => prevCols ? prevCols.filter((_, i) => i !== colIndex) : null);
    setTableData(prevData => prevData ? prevData.map(row => row.filter((_, i) => i !== colIndex)) : null);
  }, [columns]);

  const clearColumnContent = useCallback((colIndex: number) => {
    setTableData(prevData => {
        if (!prevData) return null;
        return prevData.map(row => {
            const newRow = [...row];
            newRow[colIndex] = { ...newRow[colIndex], content: '' };
            return newRow;
        });
    });
  }, []);

  const duplicateColumn = useCallback((colIndex: number) => {
      setColumns(prevCols => {
          if (!prevCols) return null;
          const columnToDuplicate = prevCols[colIndex];
          const newCols = [...prevCols];
          newCols.splice(colIndex + 1, 0, { ...columnToDuplicate, id: crypto.randomUUID() });
          return newCols;
      });

      setTableData(prevData => {
          if (!prevData) return null;
          return prevData.map(row => {
              const newRow = [...row];
              newRow.splice(colIndex + 1, 0, { ...row[colIndex], id: crypto.randomUUID() });
              return newRow;
          });
      });
  }, []);

  const toggleHeaderColumn = useCallback((colIndex: number) => {
    setColumns(prevCols => {
        if (!prevCols) return null;
        const newCols = [...prevCols];
        newCols[colIndex] = { ...newCols[colIndex], isHeader: !newCols[colIndex].isHeader };
        return newCols;
    });
  }, []);

  const setColumnColor = useCallback((colIndex: number, type: 'text' | 'background', value: string) => {
      const propToUpdate = type === 'text' ? 'color' : 'backgroundColor';
      setTableData(prevData => {
          if (!prevData) return null;
          return prevData.map(row => {
              const newRow = [...row];
              newRow[colIndex] = { ...newRow[colIndex], [propToUpdate]: value };
              return newRow;
          });
      });
  }, []);

  const updateColumnWidth = useCallback((colIndex: number, width: number) => {
    setColumns(prevCols => {
      if (!prevCols) return null;
      const newCols = [...prevCols];
      newCols[colIndex] = { ...newCols[colIndex], width };
      return newCols;
    });
  }, []);

  const updateRowHeight = useCallback((rowIndex: number, height: number) => {
    setRowHeights(prevHeights => {
      if (!prevHeights) return null;
      const newHeights = [...prevHeights];
      newHeights[rowIndex] = height;
      return newHeights;
    });
  }, []);

  const handleSaveState = () => {
    if (!tableData || !columns || !rowHeights) return;
    const state = { tableData, columns, rowHeights };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-state.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        const state = JSON.parse(text);
        if (state.tableData && state.columns && state.rowHeights) {
          setTableData(state.tableData);
          setColumns(state.columns);
          setRowHeights(state.rowHeights);
        } else {
          alert('Invalid state file.');
        }
      } catch (error) {
        alert('Error loading state file.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="header">
            <div className="header-top">
              <h1 className="title">Notion-like Table</h1>
              {tableData && (
                <div className="button-container">
                   <button 
                      onClick={handleSaveState} 
                      className="button save-button"
                   >
                      <SaveIcon/> Save State
                   </button>
                    <input type="file" ref={fileInputRef} onChange={handleLoadState} accept=".json" style={{ display: 'none' }} />
                   <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="button load-button"
                    >
                      <LoadIcon/> Load State
                   </button>
                </div>
              )}
            </div>
          <p className="subtitle">A fully interactive and customizable table component built with React.</p>
        </header>
        
        {tableData && columns && rowHeights ? (
          <Table 
            tableData={tableData}
            columns={columns}
            rowHeights={rowHeights}
            updateCellContent={updateCellContent}
            updateCellStyles={updateCellStyles}
            addRow={addRow}
            addColumn={addColumn}
            deleteColumn={deleteColumn}
            clearColumnContent={clearColumnContent}
            duplicateColumn={duplicateColumn}
            toggleHeaderColumn={toggleHeaderColumn}
            setColumnColor={setColumnColor}
            updateColumnWidth={updateColumnWidth}
            updateRowHeight={updateRowHeight}
            copiedStyle={copiedStyle}
            setCopiedStyle={setCopiedStyle}
          />
        ) : (
          <div className="create-container">
            <button
              onClick={initializeTable}
              className="button create-button"
            >
              Create a Table
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;