import React, { useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import update from 'immutability-helper';
import { ComponentData, ComponentType } from '../types';
import ContainerComponent from './ContainerComponent';
import SimpleComponent from './SimpleComponent';

interface UniversalCanvasProps {
  components: ComponentData[];
  onComponentsChange: (components: ComponentData[]) => void;
  canvasId?: string; // 容器的唯一ID，画布不需要
  style?: React.CSSProperties;
  onComponentMove?: (sourceId: string, targetCanvasId?: string, insertIndex?: number) => void; // 处理组件移动
  onComponentReorder?: (sourceId: string, targetIndex: number, targetCanvasId?: string) => void; // 处理组件排序
  selectedComponentId?: string | null; // 当前选中的组件ID
  onComponentSelect?: (componentId: string | null) => void; // 选中组件回调
  layout?: 'row' | 'column'; // 布局方向，默认为 column
  gridRows?: number; // 网格行数
  gridCols?: number; // 网格列数
}

const UniversalCanvas: React.FC<UniversalCanvasProps> = ({
  components,
  onComponentsChange,
  canvasId,
  style = {},
  onComponentMove,
  onComponentReorder,
  selectedComponentId,
  onComponentSelect,
  layout = 'column',
  gridRows,
  gridCols,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [insertInfo, setInsertInfo] = useState<{
    position: number;
    targetComponentId: string | null;
    isAbove: boolean;
  } | null>(null);

  // 生成唯一ID
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  // 计算插入位置和预览位置信息
  const calculateInsertPosition = (
    clientOffset: { x: number; y: number } | null,
    sourceId?: string
  ): { position: number; targetComponentId: string | null; isAbove: boolean } | null => {
    if (!clientOffset || !canvasRef.current) {
      return null;
    }

    const mouseY = clientOffset.y;
    const childElements = Array.from(canvasRef.current.children) as HTMLElement[];

    // 只获取当前画布层级的直接子组件，不包括嵌套组件
    // 按照components数组的顺序，找到对应的DOM元素
    const componentElements: HTMLElement[] = [];
    const processedElements = new Set<HTMLElement>();

    // 按照components数组的顺序，找到对应的DOM元素
    for (let i = 0; i < components.length; i++) {
      // 如果是移动组件，跳过源组件本身
      if (sourceId && components[i].id === sourceId) {
        continue;
      }

      // 在childElements中查找对应的元素
      for (const el of childElements) {
        if (processedElements.has(el)) {
          continue;
        }

        // 排除插入线/虚线框
        if (el.getAttribute('data-insert-preview') === 'true') {
          continue;
        }
        // 排除空提示文字
        if (el.textContent === '拖放组件到这里') {
          continue;
        }

        // 只获取直接子元素
        if (
          el.parentElement === canvasRef.current &&
          el.getAttribute('data-component') === 'true'
        ) {
          componentElements.push(el);
          processedElements.add(el);
          break; // 找到后跳出，继续下一个组件
        }
      }
    }

    // 如果没有任何组件，插入到位置0
    if (components.length === 0) {
      return { position: 0, targetComponentId: null, isAbove: true };
    }

    // 建立componentElements索引到components数组索引的映射
    const indexMapping: number[] = [];
    for (let i = 0; i < components.length; i++) {
      if (sourceId && components[i].id === sourceId) {
        continue; // 跳过源组件
      }
      indexMapping.push(i);
    }

    // 检查是否在第一个组件之前
    if (componentElements.length > 0 && indexMapping.length > 0) {
      const firstRect = componentElements[0].getBoundingClientRect();
      if (mouseY < firstRect.top) {
        const firstComponentIndex = indexMapping[0];
        return {
          position: 0,
          targetComponentId: components[firstComponentIndex]?.id || null,
          isAbove: true,
        };
      }
    }

    // 遍历componentElements，找到hover的组件
    for (let i = 0; i < componentElements.length; i++) {
      const childRect = componentElements[i].getBoundingClientRect();
      const childTop = childRect.top;
      const childBottom = childRect.bottom;
      const childMiddle = (childTop + childBottom) / 2;

      // 检查鼠标是否在这个组件范围内
      if (mouseY >= childTop && mouseY <= childBottom) {
        // 判断是在上半部分还是下半部分
        const isAbove = mouseY < childMiddle;
        const componentIndex = indexMapping[i];
        const targetComponentId = components[componentIndex]?.id || null;

        if (isAbove) {
          // 在上半部分，插入到该组件之前
          return { position: componentIndex, targetComponentId, isAbove: true };
        } else {
          // 在下半部分，插入到该组件之后
          return { position: componentIndex + 1, targetComponentId, isAbove: false };
        }
      }

      // 如果鼠标在组件顶部之上，插入到该组件之前
      if (mouseY < childTop) {
        const componentIndex = indexMapping[i];
        const targetComponentId = components[componentIndex]?.id || null;
        return { position: componentIndex, targetComponentId, isAbove: true };
      }
    }

    // 如果鼠标在所有组件之下，插入到末尾
    if (componentElements.length > 0) {
      const lastIndex = indexMapping[indexMapping.length - 1];
      const lastComponentId = components[lastIndex]?.id || null;
      return { position: components.length, targetComponentId: lastComponentId, isAbove: false };
    }

    return { position: components.length, targetComponentId: null, isAbove: false };
  };

  // 处理拖放
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ['COMPONENT', 'CANVAS_COMPONENT'], // 接受左侧组件和画布组件
      drop: (
        item: {
          type: ComponentType;
          label: string;
          width?: number;
          height?: number;
          isCanvasComponent?: boolean;
          sourceId?: string;
        },
        monitor
      ) => {
        // 检查是否有子级 drop target 已经处理了这个事件
        // 如果有嵌套的 drop targets，子级会先处理，这里应该被忽略
        if (monitor.didDrop()) {
          return undefined; // 明确返回 undefined，表示不处理
        }

        // 检查是否真的在当前 drop target 上（而不是子级）
        // 使用 shallow: true 确保只检查当前层级
        const isOverCurrent = monitor.isOver({ shallow: true });
        if (!isOverCurrent) {
          return undefined;
        }

        // 如果是已存在画布组件的拖拽，执行移动或排序逻辑
        if (item.isCanvasComponent && item.sourceId) {
          const sourceIndex = components.findIndex(comp => comp.id === item.sourceId);

          // 如果是在同一个画布内移动，执行排序
          if (sourceIndex !== -1) {
            // 计算目标位置（通过鼠标位置和组件实际位置）
            const clientOffset = monitor.getClientOffset();
            const targetRect = canvasRef.current?.getBoundingClientRect();

            if (clientOffset && targetRect && canvasRef.current) {
              // 计算鼠标在画布中的相对位置
              const mouseY = clientOffset.y;

              // 找到所有子元素（组件）
              const childElements = Array.from(canvasRef.current.children) as HTMLElement[];

              // 找到应该插入的位置
              let targetIndex = components.length;

              // 遍历所有组件，找到插入位置
              for (let i = 0; i < components.length; i++) {
                if (i === sourceIndex) {
                  // 跳过源组件本身
                  continue;
                }

                // 找到对应的 DOM 元素
                // 由于组件是按顺序渲染的，我们可以通过索引找到对应的 DOM
                // 但需要考虑源组件可能还在 DOM 中（拖拽时）
                let domIndex = i;
                if (i > sourceIndex) {
                  // 如果当前组件在源组件之后，DOM 索引需要+1（因为源组件还在 DOM 中）
                  domIndex = i + 1;
                }

                if (domIndex < childElements.length) {
                  const childRect = childElements[domIndex].getBoundingClientRect();
                  const childMiddle = (childRect.top + childRect.bottom) / 2;

                  // 如果鼠标在组件中间位置之上，插入到该组件之前
                  if (mouseY < childMiddle) {
                    targetIndex = i;
                    break;
                  }
                }
              }

              // 如果位置没有变化，不执行排序
              if (targetIndex === sourceIndex) {
                return { dropped: true, canvasId };
              }

              // 执行排序
              if (onComponentReorder) {
                onComponentReorder(item.sourceId, targetIndex, canvasId);
              } else {
                // 如果没有提供排序回调，直接在这里处理，使用 immutability-helper
                const itemToMove = components[sourceIndex];
                let updated: ComponentData[];

                if (sourceIndex < targetIndex) {
                  // 向后移动：先删除，再插入（注意删除后 targetIndex 需要减1）
                  updated = update(components, {
                    $splice: [
                      [sourceIndex, 1],
                      [targetIndex - 1, 0, itemToMove],
                    ],
                  });
                } else {
                  // 向前移动：先插入，再删除（注意插入后 sourceIndex 需要加1）
                  updated = update(components, {
                    $splice: [
                      [targetIndex, 0, itemToMove],
                      [sourceIndex + 1, 1],
                    ],
                  });
                }
                onComponentsChange(updated);
              }

              // 排序后取消选中状态，隐藏toolbar
              if (onComponentSelect) {
                onComponentSelect(null);
              }

              return { dropped: true, canvasId, reordered: true };
            }

            return { dropped: true, canvasId };
          }

          // 如果是跨画布移动
          console.log('移动组件:', item.sourceId, '到', canvasId || '画布');
          if (onComponentMove) {
            // 使用计算好的插入位置，如果没有则使用末尾
            const insertIndex = insertInfo !== null ? insertInfo.position : undefined;
            onComponentMove(item.sourceId, canvasId, insertIndex);
          }
          // 清除插入位置
          setInsertInfo(null);
          // 移动后取消选中状态，隐藏toolbar
          if (onComponentSelect) {
            onComponentSelect(null);
          }
          return { dropped: true, canvasId }; // 返回一个值，表示已处理
        }

        // 新组件的创建逻辑
        let newComponent: ComponentData;
        const componentId = generateId();

        if (item.type === ComponentType.CONTAINER) {
          newComponent = {
            id: componentId,
            type: ComponentType.CONTAINER,
            x: 0,
            y: 0,
            width: item.width || 200,
            height: item.height, // 如果未提供高度，则使用 undefined，容器将自适应内容高度
            label: item.label,
            children: [],
            layout: 'column', // 默认纵向布局
          };
        } else {
          newComponent = {
            id: componentId,
            type: item.type,
            x: 0,
            y: 0,
            width: item.width || 120,
            height: item.height, // 如果未提供高度，则使用 undefined，组件将自适应内容高度
            label: item.label,
          };
        }

        // 使用计算好的插入位置，如果没有则使用末尾
        const insertIndex = insertInfo !== null ? insertInfo.position : components.length;

        // 插入到指定位置，使用 immutability-helper
        const updated = update(components, {
          $splice: [[insertIndex, 0, newComponent]],
        });
        onComponentsChange(updated);

        // 清除插入位置
        setInsertInfo(null);

        // 放置后取消选中状态，隐藏toolbar
        if (onComponentSelect) {
          onComponentSelect(null);
        }

        // 返回一个值，表示已处理，防止外层 drop target 再次处理
        return { dropped: true, canvasId };
      },
      hover: (
        item: {
          type: ComponentType;
          label: string;
          width?: number;
          height?: number;
          isCanvasComponent?: boolean;
          sourceId?: string;
        },
        monitor
      ) => {
        // 在hover时计算插入位置并更新
        if (monitor.isOver({ shallow: true })) {
          const clientOffset = monitor.getClientOffset();
          const sourceId = item.isCanvasComponent ? item.sourceId : undefined;
          const info = calculateInsertPosition(clientOffset, sourceId);
          setInsertInfo(info);
        } else {
          setInsertInfo(null);
        }
      },
      collect: monitor => ({
        isOver: monitor.isOver({ shallow: true }), // 只检查当前层级的 isOver
        canDrop: monitor.canDrop(),
      }),
    }),
    [
      onComponentsChange,
      canvasId,
      components,
      onComponentMove,
      onComponentReorder,
      onComponentSelect,
      insertInfo,
      layout,
    ]
  );

  // 当拖拽结束时清除插入位置
  React.useEffect(() => {
    if (!isOver) {
      setInsertInfo(null);
    }
  }, [isOver]);

  // 渲染组件
  const renderComponent = (component: ComponentData, index: number) => {
    const componentId = component.id;
    const isSelected = selectedComponentId === componentId;

    // 检查是否需要在该组件前或后显示虚线框
    const showPreviewAbove =
      insertInfo !== null &&
      insertInfo.targetComponentId === componentId &&
      insertInfo.isAbove &&
      insertInfo.position === index;
    const showPreviewBelow =
      insertInfo !== null &&
      insertInfo.targetComponentId === componentId &&
      !insertInfo.isAbove &&
      insertInfo.position === index + 1;

    const handleSelect = () => {
      if (onComponentSelect) {
        // 如果点击的是已选中的组件，取消选中；否则选中新组件
        onComponentSelect(isSelected ? null : componentId);
      }
    };

    const renderPreviewBox = () => {
      const isRowLayout = layout === 'row';
      return (
        <div
          key={`preview-${componentId}`}
          data-insert-preview="true"
          style={{
            width: isRowLayout ? '20px' : '100%',
            height: isRowLayout ? '100%' : '20px',
            minWidth: isRowLayout ? '20px' : undefined,
            minHeight: isRowLayout ? undefined : '20px',
            border: '1px dashed #222',
            borderRadius: '4px',
            backgroundColor: 'rgba(34, 34, 34, 0.05)',
            marginBottom: isRowLayout ? '0' : '12px',
            marginRight: isRowLayout ? '12px' : '0',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            boxShadow: '0 0 2px rgba(34, 34, 34, 0.2)',
            animation: 'fadeIn 0.2s ease-in',
            flexShrink: 0,
          }}
        />
      );
    };

    if (component.type === ComponentType.CONTAINER) {
      return (
        <React.Fragment key={componentId}>
          {showPreviewAbove && renderPreviewBox()}
          <ContainerComponent
            component={component}
            isSelected={isSelected}
            onSelect={handleSelect}
            onUpdate={updatedComponent => {
              const componentIndex = components.findIndex(comp => comp.id === updatedComponent.id);
              if (componentIndex !== -1) {
                const updated = update(components, {
                  [componentIndex]: { $set: updatedComponent },
                });
                onComponentsChange(updated);
              }
            }}
            onDelete={() => {
              const componentIndex = components.findIndex(comp => comp.id === componentId);
              if (componentIndex !== -1) {
                const updated = update(components, {
                  $splice: [[componentIndex, 1]],
                });
                onComponentsChange(updated);
              }
              // 删除后取消选中
              if (onComponentSelect) {
                onComponentSelect(null);
              }
            }}
            onComponentMove={onComponentMove}
            onComponentReorder={onComponentReorder}
            selectedComponentId={selectedComponentId}
            onComponentSelect={onComponentSelect}
          />
          {showPreviewBelow && renderPreviewBox()}
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment key={componentId}>
          {showPreviewAbove && renderPreviewBox()}
          <SimpleComponent
            component={component}
            isSelected={isSelected}
            onSelect={handleSelect}
            onDelete={() => {
              const componentIndex = components.findIndex(comp => comp.id === componentId);
              if (componentIndex !== -1) {
                const updated = update(components, {
                  $splice: [[componentIndex, 1]],
                });
                onComponentsChange(updated);
              }
              // 删除后取消选中
              if (onComponentSelect) {
                onComponentSelect(null);
              }
            }}
          />
          {showPreviewBelow && renderPreviewBox()}
        </React.Fragment>
      );
    }
  };

  // 检查是否有网格布局
  const hasGridLayout =
    gridRows !== undefined && gridCols !== undefined && gridRows > 0 && gridCols > 0;

  const defaultStyle: React.CSSProperties = {
    width: '100%',
    minHeight: canvasId ? '120px' : '200px', // 容器最小高度小一些
    padding: canvasId ? '0' : '20px', // 容器内不需要 padding，边框已经定义了边界
    border: canvasId ? '2px dashed #ddd' : '2px dashed #ccc',
    backgroundColor: canvasId ? '#fafafa' : '#fff',
    borderColor: canvasId ? '#ddd' : '#ccc',
    borderRadius: canvasId ? '4px' : '0',
    display: hasGridLayout ? 'grid' : 'flex',
    gridTemplateRows: hasGridLayout ? `repeat(${gridRows}, 1fr)` : undefined,
    gridTemplateColumns: hasGridLayout ? `repeat(${gridCols}, 1fr)` : undefined,
    flexDirection: hasGridLayout ? undefined : layout,
    gap: hasGridLayout ? '0' : '12px', // 网格布局不使用gap，flex布局使用12px
    boxSizing: 'border-box',
    overflow: 'auto',
    ...style,
  };

  const dropStyle: React.CSSProperties = {
    border:
      isOver && canDrop
        ? canvasId
          ? '2px dashed #2196F3'
          : '2px dashed #61dafb'
        : canvasId
          ? '2px dashed #ddd'
          : '2px dashed #ccc',
    backgroundColor:
      isOver && canDrop
        ? canvasId
          ? 'rgba(33, 150, 243, 0.1)'
          : '#f0f8ff'
        : canvasId
          ? '#fafafa'
          : '#fff',
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // 如果点击的是画布本身（不是组件），取消选中
    if (e.target === e.currentTarget && onComponentSelect) {
      onComponentSelect(null);
    }
  };

  return (
    <div
      ref={node => {
        if (node) {
          canvasRef.current = node;
        }
        drop(node);
      }}
      style={{ ...defaultStyle, ...dropStyle }}
      onClick={handleCanvasClick}
    >
      {/* 插入位置预览框 - 在第一个组件之前或最后一个组件之后 */}
      {isOver &&
        canDrop &&
        insertInfo !== null &&
        insertInfo.targetComponentId === null &&
        (() => {
          const isRowLayout = layout === 'row';
          return (
            <div
              key="preview-first-or-last"
              data-insert-preview="true"
              style={{
                width: isRowLayout ? '20px' : '100%',
                height: isRowLayout ? '100%' : '20px',
                minWidth: isRowLayout ? '20px' : undefined,
                minHeight: isRowLayout ? undefined : '20px',
                border: '1px dashed #222',
                borderRadius: '4px',
                backgroundColor: 'rgba(34, 34, 34, 0.05)',
                marginBottom: isRowLayout ? '0' : insertInfo.position === 0 ? '12px' : '0',
                marginTop: isRowLayout ? '0' : insertInfo.position === 0 ? '0' : '12px',
                marginRight: isRowLayout ? (insertInfo.position === 0 ? '12px' : '0') : '0',
                marginLeft: isRowLayout ? (insertInfo.position === 0 ? '0' : '12px') : '0',
                boxSizing: 'border-box',
                pointerEvents: 'none',
                boxShadow: '0 0 2px rgba(34, 34, 34, 0.2)',
                animation: 'fadeIn 0.2s ease-in',
                flexShrink: 0,
              }}
            />
          );
        })()}

      {components.length === 0 && !canvasId ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#999',
            fontSize: '16px',
          }}
        >
          拖放组件到这里
        </div>
      ) : (
        components.map((component, index) => renderComponent(component, index))
      )}
    </div>
  );
};

export default UniversalCanvas;
