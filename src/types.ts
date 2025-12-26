// 组件类型枚举
export enum ComponentType {
  CONTAINER = 'container',
  SIMPLE = 'simple',
  TEXT = 'text',
  BUTTON = 'button',
}

// 基础组件接口
export interface ComponentBase {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height?: number; // 高度变为可选，支持动态高度
  label: string;
}

// 容器组件接口
export interface ContainerComponent extends ComponentBase {
  type: ComponentType.CONTAINER;
  children: ComponentData[];
  layout?: 'row' | 'column'; // 布局方向：横向或纵向，默认为 column
  gridRows?: number; // 网格行数
  gridCols?: number; // 网格列数
}

// 最终组件接口
export interface SimpleComponent extends ComponentBase {
  type: ComponentType.SIMPLE | ComponentType.TEXT | ComponentType.BUTTON;
}

// 组件数据联合类型
export type ComponentData = ContainerComponent | SimpleComponent;

// 拖放项接口
export interface DragItem {
  type: ComponentType;
  label: string;
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ComponentData[];
}

// 拖放目标类型
export enum TargetType {
  CANVAS = 'canvas',
  CONTAINER = 'container',
}

// 拖放位置接口
export interface DropPosition {
  x: number;
  y: number;
  containerId?: string;
}
