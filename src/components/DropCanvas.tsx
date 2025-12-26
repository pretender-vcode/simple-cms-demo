import React from 'react';
import UniversalCanvas from './UniversalCanvas';
import { ComponentData } from '../types';

interface DropCanvasProps {
  components: ComponentData[];
  onComponentsChange: (components: ComponentData[]) => void;
  onComponentMove?: (sourceId: string, targetCanvasId?: string, insertIndex?: number) => void;
  onComponentReorder?: (sourceId: string, targetIndex: number, targetCanvasId?: string) => void;
  selectedComponentId?: string | null;
  onComponentSelect?: (componentId: string | null) => void;
}

const DropCanvas: React.FC<DropCanvasProps> = ({
  components,
  onComponentsChange,
  onComponentMove,
  onComponentReorder,
  selectedComponentId,
  onComponentSelect,
}) => {
  return (
    <div style={{ width: '100%' }}>
      <UniversalCanvas
        components={components}
        onComponentsChange={onComponentsChange}
        onComponentMove={onComponentMove}
        onComponentReorder={onComponentReorder}
        selectedComponentId={selectedComponentId}
        onComponentSelect={onComponentSelect}
        style={{
          minHeight: '800px',
          padding: '20px',
          border: '2px dashed #ccc',
          backgroundColor: '#fff',
          borderColor: '#ccc',
        }}
      />
    </div>
  );
};

export default DropCanvas;
