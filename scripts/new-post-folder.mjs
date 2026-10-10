import fs from 'node:fs';
import path from 'node:path';

const name = process.argv[2];
if (!name) {
  console.error('请提供文章短名，例如：pnpm new-post-folder my-post');
  process.exit(1);
}

const dir = path.join('src', 'content', 'posts', name);
fs.mkdirSync(dir, { recursive: true });

const date = new Date().toISOString().slice(0, 10);
const content = `---
title: ${name}
published: ${date}
description: 
image: ./cover.jpg
tags: []
category: 
pinned: false
draft: false
---

`;

fs.writeFileSync(path.join(dir, 'index.md'), content, 'utf8');
console.log(`已创建：${dir}/index.md`);