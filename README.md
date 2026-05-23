# DateManager

记录食品的生产日期和保质期，临期提醒

## 功能

- 添加食品信息（名称、生产日期、保质期）
- 查看食品列表
- 临期提醒（7天内过期提示）
- 标记食品已消耗/删除

## 技术栈

- uni-app + Vue 3 + TypeScript
- Pinia 状态管理
- uni.getStorageSync 本地存储

## 开发

```bash
# 安装依赖
pnpm install

# 开发
pnpm dev:h5

# 构建
pnpm build:h5
```