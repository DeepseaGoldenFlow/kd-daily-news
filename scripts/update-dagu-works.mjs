import { writeFile } from "node:fs/promises";

const INDEX_URL = "https://mindfucking.gitbook.io/daguguguji/~gitbook/site-index";
const SITE_ORIGIN = "https://mindfucking.gitbook.io";

const categoryMap = new Map([
  ["Part I 小说与散文", "小说与散文"],
  ["Part II 诗歌", "诗歌"],
  ["PART III 段子与微评", "段子与微评"],
  ["PART VII 补录", "补录"]
]);

const response = await fetch(INDEX_URL, {
  headers: { "user-agent": "Follow Daily archive indexer/1.0" }
});
if (!response.ok) throw new Error(`Dagu archive index failed: ${response.status}`);

const index = await response.json();
const works = (index.pages || []).flatMap((page) => {
  const label = page.breadcrumbs?.[0]?.label;
  const category = categoryMap.get(label);
  if (!category) return [];
  return [{
    id: `dagu-${page.id}`,
    title: page.title,
    category,
    source: "《特师文集》公开整理本",
    url: new URL(page.pathname, SITE_ORIGIN).href,
    note: page.description || "该条目收录于公开整理文集，站内仅展示目录与索引信息。"
  }];
});

const output = {
  updatedAt: new Date().toISOString(),
  source: INDEX_URL,
  notice: "目前公开可追溯的作品目录。整理本并非作者官方出版物，目录可能仍有遗漏；本站不转载正文。",
  items: works
};

await writeFile(new URL("../data/dagu-works.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Synced ${works.length} Dagu works.`);
