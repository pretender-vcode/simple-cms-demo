import React, { useState, useRef, useEffect } from 'react';

interface GridSelectorProps {
  onSelect: (rows: number, cols: number) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

const GRID_SIZE = 10; // 10x10 = 100个小格子
const CELL_SIZE = 10; // 每个格子的像素大小

const GridSelector: React.FC<GridSelectorProps> = ({ onSelect, onClose, position }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null);
  const [endCell, setEndCell] = useState<{ row: number; col: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const endCellRef = useRef<{ row: number; col: number } | null>(null);

  // 计算选中的行数和列数
  const getSelectedDimensions = () => {
    if (!startCell || !endCell) return { rows: 0, cols: 0 };
    const minRow = Math.min(startCell.row, endCell.row);
    const maxRow = Math.max(startCell.row, endCell.row);
    const minCol = Math.min(startCell.col, endCell.col);
    const maxCol = Math.max(startCell.col, endCell.col);
    return {
      rows: maxRow - minRow + 1,
      cols: maxCol - minCol + 1,
    };
  };

  // 将鼠标坐标转换为格子坐标
  const getCellFromPoint = (x: number, y: number): { row: number; col: number } | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    const col = Math.floor(relativeX / CELL_SIZE);
    const row = Math.floor(relativeY / CELL_SIZE);

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      return { row, col };
    }
    return null;
  };

  // 处理鼠标按下
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) {
      setIsDragging(true);
      setStartCell(cell);
      setEndCell(cell);
    }
  };

  // 添加全局事件监听
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell) {
        endCellRef.current = cell;
        setEndCell(cell);
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      if (startCell && endCellRef.current) {
        const minRow = Math.min(startCell.row, endCellRef.current.row);
        const maxRow = Math.max(startCell.row, endCellRef.current.row);
        const minCol = Math.min(startCell.col, endCellRef.current.col);
        const maxCol = Math.max(startCell.col, endCellRef.current.col);
        const rows = maxRow - minRow + 1;
        const cols = maxCol - minCol + 1;
        if (rows > 0 && cols > 0) {
          onSelect(rows, cols);
        }
      }
      onClose();
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, startCell, onSelect, onClose]);

  // 判断格子是否被选中
  const isCellSelected = (row: number, col: number): boolean => {
    if (!startCell || !endCell) return false;
    const minRow = Math.min(startCell.row, endCell.row);
    const maxRow = Math.max(startCell.row, endCell.row);
    const minCol = Math.min(startCell.col, endCell.col);
    const maxCol = Math.max(startCell.col, endCell.col);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  // 渲染网格
  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const isSelected = isCellSelected(row, col);
        cells.push(
          <div
            key={`${row}-${col}`}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              border: '1px solid #ddd',
              backgroundColor: isSelected ? '#2196F3' : '#fff',
              boxSizing: 'border-box',
              transition: 'background-color 0.1s',
            }}
          />
        );
      }
    }
    return cells;
  };

  const { rows, cols } = getSelectedDimensions();
  const selectedCount = rows * cols;

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 2000,
        backgroundColor: '#fff',
        border: '2px solid #2196F3',
        borderRadius: '4px',
        padding: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: '0',
          border: '1px solid #ccc',
          backgroundColor: '#f5f5f5',
        }}
      >
        {renderGrid()}
      </div>
      {selectedCount > 0 && (
        <div
          style={{
            marginTop: '8px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#666',
            fontWeight: 'bold',
          }}
        >
          已选择: {rows} 行 × {cols} 列 ({selectedCount} 个格子)
        </div>
      )}
      <div
        style={{
          marginTop: '8px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#999',
        }}
      >
        拖拽选择区域
      </div>
    </div>
  );
};

export default GridSelector;
