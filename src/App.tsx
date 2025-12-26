import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import DropCanvas from './components/DropCanvas';
import DraggableItem from './components/DraggableItem';
import { ComponentData, ComponentType } from './types';
import './App.css';

function App() {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // 点击画布外部时取消选中
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 如果点击的不是组件或toolbar，取消选中
      const target = e.target as HTMLElement;
      if (!target.closest('[data-component]') && !target.closest('[data-toolbar]')) {
        setSelectedComponentId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleExport = () => {
    const json = JSON.stringify(components, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'components.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 处理组件在同一画布内的排序
  const handleComponentReorder = (
    sourceId: string,
    targetIndex: number,
    targetCanvasId?: string
  ) => {
    // 递归更新组件数组
    const reorderInArray = (
      comps: ComponentData[],
      sourceId: string,
      targetIndex: number,
      currentPath: (string | number)[] = []
    ): ComponentData[] | null => {
      const sourceIndex = comps.findIndex(comp => comp.id === sourceId);
      if (sourceIndex !== -1) {
        // 在当前数组中找到，执行排序
        if (sourceIndex === targetIndex) {
          return comps; // 位置没有变化
        }

        // 使用 immutability-helper 进行排序
        // 需要先保存要移动的元素
        const itemToMove = comps[sourceIndex];
        let updated: ComponentData[];

        if (sourceIndex < targetIndex) {
          // 向后移动：先删除，再插入（注意删除后 targetIndex 需要减1）
          updated = update(comps, {
            $splice: [
              [sourceIndex, 1],
              [targetIndex - 1, 0, itemToMove],
            ],
          });
        } else {
          // 向前移动：先插入，再删除（注意插入后 sourceIndex 需要加1）
          updated = update(comps, {
            $splice: [
              [targetIndex, 0, itemToMove],
              [sourceIndex + 1, 1],
            ],
          });
        }
        return updated;
      }

      // 如果不在当前数组，递归查找子组件
      for (let i = 0; i < comps.length; i++) {
        const comp = comps[i];
        if (comp.type === ComponentType.CONTAINER) {
          const containerComp = comp as import('./types').ContainerComponent;
          if (containerComp.children) {
            const updated = reorderInArray(containerComp.children, sourceId, targetIndex, [
              ...currentPath,
              i,
              'children',
            ]);
            if (updated) {
              return update(comps, { [i]: { children: { $set: updated } } });
            }
          }
        }
      }
      return null;
    };

    if (!targetCanvasId) {
      // 在主画布中排序
      const updated = reorderInArray(components, sourceId, targetIndex);
      if (updated) {
        setComponents(updated);
      }
    } else {
      // 在容器中排序
      const updateContainerChildren = (comps: ComponentData[]): ComponentData[] | null => {
        for (let i = 0; i < comps.length; i++) {
          const comp = comps[i];
          if (comp.id === targetCanvasId && comp.type === ComponentType.CONTAINER) {
            const containerComp = comp as import('./types').ContainerComponent;
            const updated = reorderInArray(containerComp.children || [], sourceId, targetIndex);
            if (updated) {
              return update(comps, { [i]: { children: { $set: updated } } });
            }
          }
          if (comp.type === ComponentType.CONTAINER) {
            const containerComp = comp as import('./types').ContainerComponent;
            if (containerComp.children) {
              const updated = updateContainerChildren(containerComp.children);
              if (updated) {
                return update(comps, { [i]: { children: { $set: updated } } });
              }
            }
          }
        }
        return null;
      };
      const updated = updateContainerChildren(components);
      if (updated) {
        setComponents(updated);
      }
    }
  };

  // 递归查找和移动组件（包含子组件）
  const handleComponentMove = (sourceId: string, targetCanvasId?: string, insertIndex?: number) => {
    // 递归查找组件及其所有子组件
    const findComponentWithChildren = (
      comps: ComponentData[],
      id: string
    ): ComponentData | null => {
      for (const comp of comps) {
        if (comp.id === id) {
          return comp;
        }
        if (comp.type === ComponentType.CONTAINER && comp.children) {
          const found = findComponentWithChildren(comp.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    // 递归移除组件（包含所有子组件），使用 immutability-helper
    const findAndRemoveComponent = (
      comps: ComponentData[]
    ): [ComponentData | null, ComponentData[]] => {
      for (let i = 0; i < comps.length; i++) {
        const component = comps[i];
        if (component.id === sourceId) {
          // 找到组件，移除它并返回（包含所有子组件）
          const updated = update(comps, { $splice: [[i, 1]] });
          return [component, updated];
        }
        if (component.type === ComponentType.CONTAINER && component.children) {
          const [removed, updatedChildren] = findAndRemoveComponent(component.children);
          if (removed) {
            // 在子组件中找到了，更新父组件
            const updated = update(comps, { [i]: { children: { $set: updatedChildren } } });
            return [removed, updated];
          }
        }
      }
      return [null, comps];
    };

    // 检查目标是否是源组件的子组件（防止循环嵌套）
    const isDescendant = (comps: ComponentData[], targetId: string, sourceId: string): boolean => {
      const sourceComponent = findComponentWithChildren(comps, sourceId);
      if (!sourceComponent || sourceComponent.type !== ComponentType.CONTAINER) {
        return false;
      }
      return findComponentWithChildren(sourceComponent.children || [], targetId) !== null;
    };

    // 使用 immutability-helper 添加组件到目标位置
    const addComponentToTarget = (
      comps: ComponentData[],
      componentToAdd: ComponentData,
      targetId?: string,
      insertIndex?: number
    ): ComponentData[] => {
      if (!targetId) {
        // 添加到画布
        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= comps.length) {
          return update(comps, { $splice: [[insertIndex, 0, componentToAdd]] });
        }
        return update(comps, { $push: [componentToAdd] });
      }

      // 添加到指定容器
      for (let i = 0; i < comps.length; i++) {
        const comp = comps[i];
        if (comp.id === targetId && comp.type === ComponentType.CONTAINER) {
          const containerComp = comp as import('./types').ContainerComponent;
          if (containerComp.children !== undefined) {
            const children = containerComp.children;
            if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= children.length) {
              return update(comps, {
                [i]: { children: { $splice: [[insertIndex, 0, componentToAdd]] } },
              });
            }
            return update(comps, { [i]: { children: { $push: [componentToAdd] } } });
          }
        }
        if (comp.type === ComponentType.CONTAINER) {
          const containerComp = comp as import('./types').ContainerComponent;
          if (containerComp.children) {
            const updated = addComponentToTarget(
              containerComp.children,
              componentToAdd,
              targetId,
              insertIndex
            );
            if (updated !== containerComp.children) {
              return update(comps, { [i]: { children: { $set: updated } } });
            }
          }
        }
      }
      return comps;
    };

    // 1. 找到并移除组件（包含所有子组件）
    const [removedComponent, updatedComponents] = findAndRemoveComponent(components);

    if (removedComponent) {
      // 2. 检查是否会导致循环嵌套
      if (targetCanvasId && isDescendant(updatedComponents, targetCanvasId, sourceId)) {
        console.warn('不能将组件移动到其子组件中');
        return;
      }

      // 3. 将组件添加到目标位置（包含所有子组件）
      const finalComponents = addComponentToTarget(
        updatedComponents,
        removedComponent,
        targetCanvasId,
        insertIndex
      );
      setComponents(finalComponents);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <header className="app-header">
          <h1>通用画布应用</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExport} className="export-button">
              导出JSON数据
            </button>
          </div>
        </header>

        <div className="main-content">
          <aside className="sidebar">
            <h2>组件库</h2>
            <DraggableItem
              type={ComponentType.CONTAINER}
              label="容器组件"
              width={200}
              height={150}
            />
            <DraggableItem type={ComponentType.SIMPLE} label="简单组件" width={120} height={80} />
            <DraggableItem type={ComponentType.TEXT} label="文本组件" width={120} height={60} />
            <DraggableItem type={ComponentType.BUTTON} label="按钮组件" width={100} height={40} />
          </aside>

          <main className="canvas-container">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2>画布区域</h2>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {components.length > 0 && `当前组件数: ${components.length}`}
              </div>
            </div>
            <DropCanvas
              components={components}
              onComponentsChange={setComponents}
              onComponentMove={handleComponentMove}
              onComponentReorder={handleComponentReorder}
              selectedComponentId={selectedComponentId}
              onComponentSelect={setSelectedComponentId}
            />
          </main>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
