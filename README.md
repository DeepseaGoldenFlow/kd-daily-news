# KD Daily · 杜兰特动态

一个由百炼 AI 每小时整理的 Kevin Durant 中文资讯站。系统聚合中英文 RSS，使用 Qwen 去重、翻译、分类并生成简短摘要，再自动发布到 GitHub Pages。

## 自动更新

GitHub Actions 每小时运行一次：

1. 抓取最近 7 天的杜兰特新闻；
2. 调用百炼 `qwen-plus` 生成中文标题、摘要、分类和重要性；
3. 更新 `data/news.json`；
4. 重新发布 GitHub Pages。

仓库 Secret：`BAILIAN_API_KEY`。可选变量：`BAILIAN_BASE_URL`（默认北京地域共享地址）、`BAILIAN_MODEL`（默认 `qwen-plus`）。密钥缺失或模型临时不可用时，任务会使用非 AI 摘要继续发布，不会导致网站下线。

## 本地运行

```bash
npm run update
python3 -m http.server 8000
```

打开 `http://localhost:8000`。

## 图片许可

人物照片由 All-Pro Reels 拍摄，来源于 [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Kevin_Durant_Warriors_2019.jpg)，许可为 [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0)。

本站为非官方球迷资讯站，与 Kevin Durant、NBA 或任何球队无隶属关系。AI 摘要仅供快速了解，请以原始报道为准。
