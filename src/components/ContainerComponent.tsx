import React, { useRef, useState, useEffect } from 'react';
import update from 'immutability-helper';
import { ContainerComponent as ContainerComponentType, ComponentType } from '../types';
import UniversalCanvas from './UniversalCanvas';
import ComponentToolbar from './ComponentToolbar';

interface ContainerComponentProps {
  component: ContainerComponentType;
  onUpdate: (component: ContainerComponentType) => void;
  onDelete: () => void;
  onComponentMove?: (sourceId: string, targetCanvasId?: string, insertIndex?: number) => void;
  onComponentReorder?: (sourceId: string, targetIndex: number, targetCanvasId?: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  selectedComponentId?: string | null;
  onComponentSelect?: (componentId: string | null) => void;
}

const ContainerComponent: React.FC<ContainerComponentProps> = ({
  component,
  onUpdate,
  onDelete,
  onComponentMove,
  onComponentReorder,
  isSelected = false,
  onSelect,
  selectedComponentId,
  onComponentSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  // 更新toolbar位置
  useEffect(() => {
    if (isSelected && containerRef.current) {
      const updatePosition = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setToolbarPosition({
            top: rect.top - 40, // 在组件上方，使用fixed定位，不需要加scroll
            left: rect.left,
          });
        }
      };

      updatePosition();

      // 监听滚动和resize事件，更新toolbar位置
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isSelected, component.children?.length, component.width, component.height]);

  const handleClick = (e: React.MouseEvent) => {
    // 检查点击的目标是否是容器本身或其直接子元素（标题栏），而不是内部组件
    const target = e.target as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    // 如果点击的是容器本身（不是内部组件），选中容器
    if (target === currentTarget) {
      e.stopPropagation();
      if (onSelect) {
        onSelect();
      }
    }
    // 如果点击的是内部组件，不阻止事件冒泡，让内部组件处理
  };

  // 生成唯一ID
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  // 创建子容器组件（根据行数和列数）
  const handleCreateChildren = (rows: number, cols: number) => {
    const totalCount = rows * cols;
    const newChildren = Array.from({ length: totalCount }, (_, index) => ({
      id: generateId(),
      type: ComponentType.CONTAINER as const,
      x: 0,
      y: 0,
      width: 200,
      height: 150,
      label: `容器 ${component.children?.length ? component.children.length + index + 1 : index + 1}`,
      children: [],
      layout: 'column' as const,
    }));

    const updatedComponent = update(component, {
      children: { $push: newChildren },
      gridRows: { $set: rows },
      gridCols: { $set: cols },
    });
    onUpdate(updatedComponent);
  };

  return (
    <>
      {isSelected && (
        <ComponentToolbar
          component={component}
          onDelete={onDelete}
          position={toolbarPosition}
          onUpdate={comp => onUpdate(comp as ContainerComponentType)}
          onCreateChildren={handleCreateChildren}
        />
      )}
      <div
        ref={containerRef}
        data-component="true"
        style={{
          position: 'relative',
          width: '100%',
          border: isSelected
            ? '2px solid #2196F3'
            : isHovered
              ? '2px dashed #2196F3'
              : '2px solid #ccc',
          borderRadius: '4px',
          padding: '4px',
          backgroundColor: '#f9f9f9',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
          cursor: 'pointer',
          boxShadow: isSelected
            ? '0 0 0 2px rgba(33, 150, 243, 0.3)'
            : isHovered
              ? '0 0 0 2px rgba(33, 150, 243, 0.2)'
              : '0 2px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.2s',
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 内容区域 - 使用UniversalCanvas作为容器内容，可以接收拖放 */}
        <div
          onClick={e => {
            // 阻止事件冒泡到容器，让内部组件处理自己的点击事件
            e.stopPropagation();
          }}
          style={{
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'auto',
            minHeight: '100px', // 确保有足够的拖放区域
          }}
          onMouseEnter={() => setIsHovered(false)} // 子区域 hover 时取消父容器 hover 效果
          onMouseLeave={() => setIsHovered(true)} // 离开子区域恢复容器 hover
        >
          <UniversalCanvas
            canvasId={component.id}
            components={component.children || []}
            onComponentsChange={newChildren => {
              const updatedComponent = update(component, {
                children: { $set: newChildren },
              });
              onUpdate(updatedComponent);
            }}
            onComponentMove={onComponentMove}
            onComponentReorder={onComponentReorder}
            selectedComponentId={selectedComponentId}
            onComponentSelect={onComponentSelect}
            layout={component.layout || 'column'}
            gridRows={component.gridRows}
            gridCols={component.gridCols}
          />
        </div>
      </div>
    </>
  );
};

export default ContainerComponent;
