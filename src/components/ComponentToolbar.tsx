import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { ComponentData, ComponentType } from '../types';
import GridSelector from './GridSelector';

interface ComponentToolbarProps {
  component: ComponentData;
  onDelete: () => void;
  position: { top: number; left: number };
  onUpdate?: (component: ComponentData) => void;
  onCreateChildren?: (rows: number, cols: number) => void; // 创建子容器组件
}

const ComponentToolbar: React.FC<ComponentToolbarProps> = ({
  component,
  onDelete,
  position,
  onCreateChildren,
}) => {
  const [showGridSelector, setShowGridSelector] = useState(false);

  // 拖拽功能通过toolbar按钮
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CANVAS_COMPONENT',
    item: () => ({
      ...component,
      isCanvasComponent: true,
      sourceId: component.id,
    }),
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
    options: {
      dropEffect: 'move',
    },
  }));

  // 判断是否为容器组件
  const isContainer = component.type === ComponentType.CONTAINER;

  // 处理网格选择
  const handleGridSelect = (rows: number, cols: number) => {
    if (onCreateChildren && rows > 0 && cols > 0) {
      onCreateChildren(rows, cols);
    }
    setShowGridSelector(false);
  };

  // 显示网格选择器
  const handleShowGrid = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGridSelector(true);
  };

  return (
    <div
      data-toolbar="true"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        display: 'flex',
        gap: '4px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* 拖拽按钮 */}
      <button
        ref={drag}
        onClick={e => {
          e.stopPropagation();
        }}
        style={{
          padding: '4px 8px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'move',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '60px',
        }}
        title="拖拽移动"
      >
        <span style={{ marginRight: '4px' }}>⋮⋮</span>
        拖拽
      </button>

      {/* 表格按钮 - 仅容器组件显示 */}
      {isContainer && (
        <div
          style={{ position: 'relative' }}
          onMouseEnter={handleShowGrid}
          onMouseLeave={() => {
            // 延迟关闭，给用户时间移动到网格选择器
            setTimeout(() => {
              if (!document.querySelector('[data-grid-selector]')) {
                setShowGridSelector(false);
              }
            }, 100);
          }}
        >
          <button
            style={{
              padding: '4px 8px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '60px',
            }}
            title="hover显示网格选择器，拖拽选择区域创建子容器"
          >
            <span style={{ marginRight: '4px' }}>⊞</span>
            表格
          </button>
          {showGridSelector && (
            <div
              data-grid-selector
              onMouseEnter={() => setShowGridSelector(true)}
              onMouseLeave={() => setShowGridSelector(false)}
            >
              <GridSelector
                onSelect={handleGridSelect}
                onClose={() => setShowGridSelector(false)}
                position={{
                  top: position.top + 40,
                  left: position.left,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* 删除按钮 */}
      <button
        onClick={e => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          padding: '4px 8px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '60px',
        }}
        title="删除组件"
      >
        <span style={{ marginRight: '4px' }}>×</span>
        删除
      </button>
    </div>
  );
};

export default ComponentToolbar;
