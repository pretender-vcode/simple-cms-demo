# Simple CMS Demo

一个基于 React + TypeScript + react-dnd 的拖拽组件CMS画布应用。

## 功能特性

- ✅ 左侧组件库拖拽到右侧画布
- ✅ 组件唯一 ID 管理
- ✅ 组件在画布内拖拽移动和排序
- ✅ 容器组件嵌套支持
- ✅ 组件 hover 高亮效果
- ✅ 组件选中和工具栏操作
- ✅ 网格布局创建容器组件
- ✅ 组件数据导出

## 技术栈

- React 18
- TypeScript
- react-dnd
- immutability-helper
- Vite

## 开发工具

- ESLint - 代码检查
- Prettier - 代码格式化
- Stylelint - CSS 代码检查
- Husky - Git hooks
- lint-staged - 提交前代码检查

## 安装

```bash
npm install
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 代码检查

```bash
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# Prettier 格式化
npm run format

# Prettier 检查
npm run format:check

# Stylelint 检查
npm run stylelint

# Stylelint 自动修复
npm run stylelint:fix
```

## Git Hooks

项目配置了 Husky，在提交代码前会自动运行：
- ESLint 检查并修复
- Prettier 格式化
- Stylelint 检查并修复

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── ComponentToolbar.tsx    # 组件工具栏
│   ├── ContainerComponent.tsx  # 容器组件
│   ├── DraggableItem.tsx      # 可拖拽组件项
│   ├── DropCanvas.tsx         # 画布组件
│   ├── GridSelector.tsx       # 网格选择器
│   ├── SimpleComponent.tsx    # 简单组件
│   └── UniversalCanvas.tsx    # 通用画布
├── App.tsx             # 主应用组件
├── types.ts            # 类型定义
└── main.tsx            # 入口文件
```
