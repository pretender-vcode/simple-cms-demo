import React, { useState, useRef, useEffect } from 'react';
import { ComponentData, ComponentType } from '../types';
import ComponentToolbar from './ComponentToolbar';

interface SimpleComponentProps {
  component: ComponentData;
  onDelete: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

const SimpleComponent: React.FC<SimpleComponentProps> = ({
  component,
  onDelete,
  isSelected = false,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const componentRef = useRef<HTMLDivElement>(null);

  // 根据组件类型返回不同的样式
  const getComponentStyle = () => {
    switch (component.type) {
      case ComponentType.TEXT:
        return {
          backgroundColor: '#e8f5e9',
          borderColor: '#4caf50',
          color: '#2e7d32',
        };
      case ComponentType.BUTTON:
        return {
          backgroundColor: '#e3f2fd',
          borderColor: '#2196f3',
          color: '#1565c0',
        };
      case ComponentType.SIMPLE:
      default:
        return {
          backgroundColor: '#fff3e0',
          borderColor: '#ff9800',
          color: '#e65100',
        };
    }
  };

  // 根据组件类型返回不同的内容
  const getComponentContent = () => {
    switch (component.type) {
      case ComponentType.TEXT:
        return <span>文本组件</span>;
      case ComponentType.BUTTON:
        return <button style={{ padding: '5px 10px' }}>按钮</button>;
      case ComponentType.SIMPLE:
      default:
        return <span>简单组件</span>;
    }
  };

  const componentStyle = getComponentStyle();

  // 更新toolbar位置
  useEffect(() => {
    if (isSelected && componentRef.current) {
      const updatePosition = () => {
        if (componentRef.current) {
          const rect = componentRef.current.getBoundingClientRect();
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
  }, [isSelected, component.height, component.width]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <>
      {isSelected && (
        <ComponentToolbar component={component} onDelete={onDelete} position={toolbarPosition} />
      )}
      <div
        ref={componentRef}
        data-component="true"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: component.height || 'auto',
          height: component.height ? component.height : 'auto',
          border: isSelected
            ? '2px solid #2196F3'
            : isHovered
              ? '2px dashed #2196F3'
              : `2px solid ${componentStyle.borderColor}`,
          borderRadius: '4px',
          padding: '12px',
          backgroundColor: componentStyle.backgroundColor,
          color: componentStyle.color,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: isSelected
            ? '0 0 0 2px rgba(33, 150, 243, 0.3)'
            : isHovered
              ? '0 0 0 2px rgba(33, 150, 243, 0.2)'
              : '0 2px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.2s',
          overflow: 'visible',
          boxSizing: 'border-box',
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}
        >
          {getComponentContent()}
        </div>
      </div>
    </>
  );
};

export default SimpleComponent;
