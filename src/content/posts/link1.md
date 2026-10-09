---
title: 大肥鱼的教程案例
published: 2026-10-09
description: '这一段是摘要内容'
image: './cover.jpg'
tags: [Astro，内容]
category: '技术'
draft: false 
lang: ''
---
## 二级标题

这是普通段落，**加粗**，*斜体*。

- 列表项一
- 列表项二

```javascript
console.log('代码块');

### 4. 插入图片
Fuwari 推荐把图片和文章放在**同一个文件夹**里。比如文章叫 `my-post.md`，就在 `src/content/posts/` 下建一个 `my-post/` 文件夹，把图片 `cover.jpg` 放进去，文章里用 `./cover.jpg` 引用。
也可以放在 `public/` 目录下，引用时用 `/images/xxx.jpg`。

### 5. 删除文章
直接在 `src/content/posts/` 里删掉 `.md` 文件即可。

## 二、修改站点配置

站点标题、副标题、头像、导航栏都在 `src/config.ts` 里改。用编辑器打开它：

```typescript
export const siteConfig: SiteConfig = {
  title: "主人的博客",       // 改这里
  subtitle: "记录代码与生活", // 改这里
  lang: "zh_CN",
  themeColor: {
    hue: 250,                // 主题色相，0-360，换成你喜欢的颜色
    fixed: false,
  },
  banner: {
    enable: false,           // 是否开启首页横幅
    src: "assets/images/demo-banner.png",
    position: "center",
  },
  favicon: [
    {
      src: "/favicon/icon.png",
    }
  ]
}