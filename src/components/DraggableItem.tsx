import React from 'react';
import { useDrag } from 'react-dnd';
import { ComponentType, DragItem } from '../types';

interface DraggableItemProps {
  type: ComponentType;
  label: string;
  width?: number;
  height?: number;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  type,
  label,
  width = 100,
  height = 100,
}) => {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: 'COMPONENT',
    item: { type, label, width, height },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        padding: '10px',
        margin: '5px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: '#fff',
      }}
    >
      {label}
    </div>
  );
};

export default DraggableItem;
