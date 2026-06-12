# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# 新加坡轨道交通可视化交互系统

基于 MapLibre GL 的新加坡 MRT/LRT 交互式可视化系统，以数字地图技术呈现全境 6 条地铁干线和 3 条轻轨线路，覆盖 140 余个站点。

## 功能特性

- 🚇 完整线路与站点可视化，色彩编码区分各线路
- 🌐 三语标签自动切换（英语/中文/淡米尔语）
- 📋 站点详情面板（图片轮播、线路轨道、出口导航）
- 🚂 模拟列车沿实际轨道实时运行
- 🔍 站点搜索与线路快捷导航
- 📱 响应式设计，适配不同屏幕尺寸

## 技术栈

- React 18
- MapLibre GL
- Turf.js（地理计算）
- Vite（构建工具）
- GeoJSON（数据格式）

## 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
http://localhost:5173

src/
├── App.jsx          # 主应用组件
├── config.js        # 线路颜色、摄像头预设
├── data.js          # 数据处理与映射
├── utils.js         # 线路拓扑工具函数
└── stationImages.js # 站点图片导入
