const SUBJECTS = {
  durant: { name: "杜兰特", eyebrow: "KEVIN DURANT", deck: "比赛、伤病、交易与场外动态，由 AI 每小时整理。", filters: ["all", "重点", "比赛", "交易"] },
  chenze: { name: "陈泽", eyebrow: "CHEN ZE", deck: "直播、节目、合作与全网讨论，过滤同名信息后呈现。", filters: ["all", "重点", "直播", "节目"] },
  dagu: { name: "大咕咕咕咕鸡", eyebrow: "DAGUGUGUJI", deck: "作品、公开发言与相关讨论，兼顾常用笔名和历史内容。", filters: ["all", "重点", "作品", "场外"] }
};
const state = { news: [], works: [], worksNotice: "", subject: "durant", filter: "all", workFilter: "全部", workQuery: "", updatedAt: null };
const FALLBACK_IMAGES = { durant: "assets/og.png", chenze: "assets/chenze-cover.png", dagu: "assets/dagu-cover.png" };
const reader = document.querySelector("#story-reader");
const home = document.querySelector(".page-shell");

const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[char]));

const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch { return "#"; }
};

const safeImageUrl = (value) => {
  if (/^assets\/[a-z0-9._/-]+$/i.test(value || "")) return value;
  return safeUrl(value);
};

const cleanText = (value = "") => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value);
  const template = document.createElement("template");
  template.innerHTML = textarea.value;
  return (template.content.textContent || "").replace(/\s+/g, " ").trim();
};

const storyImage = (item) => safeImageUrl(item.image || FALLBACK_IMAGES[item.subject || "durant"]);

const formatDate = (iso, withTime = false) => {
  if (!iso) return "刚刚";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit", day: "2-digit", ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
  }).format(date).replaceAll("/", ".");
};

function render() {
  const subjectNews = state.news.filter((item) => (item.subject || "durant") === state.subject);
  const filtered = state.filter === "all"
    ? subjectNews
    : subjectNews.filter((item) => item.category === state.filter || (state.filter === "重点" && item.importance >= 4));
  const [lead, ...rest] = filtered;
  const leadNode = document.querySelector("#lead-story");
  const grid = document.querySelector("#news-grid");
  const empty = document.querySelector("#empty-state");

  if (!lead) {
    leadNode.innerHTML = "";
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  leadNode.innerHTML = `
    <button class="lead-link story-trigger" type="button" data-story-id="${esc(lead.id)}">
      <img class="lead-image" src="${esc(storyImage(lead))}" data-fallback="${esc(FALLBACK_IMAGES[lead.subject || "durant"])}" alt="" loading="eager" />
      <div><p class="lead-kicker"><strong>TOP STORY</strong>${esc(lead.source)} · ${formatDate(lead.publishedAt, true)}</p></div>
      <div><h3 class="lead-title">${esc(cleanText(lead.titleZh || lead.title))}</h3><p class="lead-summary">${esc(cleanText(lead.summaryZh))}</p></div>
      <span class="lead-arrow" aria-hidden="true">阅读</span>
    </button>`;
  grid.innerHTML = rest.map((item) => `
    <button class="news-card story-trigger" type="button" data-story-id="${esc(item.id)}">
      <img class="card-image" src="${esc(storyImage(item))}" data-fallback="${esc(FALLBACK_IMAGES[item.subject || "durant"])}" alt="" loading="lazy" />
      <div class="card-top"><span class="card-meta card-tag">${esc(item.category || "动态")}</span><time class="card-meta">${formatDate(item.publishedAt)}</time></div>
      <h3 class="card-title">${esc(cleanText(item.titleZh || item.title))}</h3>
      <p class="card-summary">${esc(cleanText(item.summaryZh))}</p>
      <div class="card-bottom"><span class="card-source">${esc(item.source)}</span><span class="card-arrow" aria-hidden="true">阅读全文 →</span></div>
    </button>`).join("");
}

function renderFilters() {
  const filters = SUBJECTS[state.subject].filters;
  document.querySelector("#filters").innerHTML = filters.map((filter) => `<button class="filter${filter === state.filter ? " is-active" : ""}" type="button" data-filter="${esc(filter)}">${filter === "all" ? "全部" : filter === "重点" ? "AI 精选" : esc(filter)}</button>`).join("");
}

function renderWorks() {
  const section = document.querySelector("#works");
  section.hidden = state.subject !== "dagu";
  if (section.hidden) return;

  const categories = ["全部", ...new Set(state.works.map((work) => work.category))];
  document.querySelector("#works-filters").innerHTML = categories.map((category) => `
    <button class="work-filter${category === state.workFilter ? " is-active" : ""}" type="button" data-work-filter="${esc(category)}">${esc(category)}</button>`).join("");

  const query = state.workQuery.trim().toLocaleLowerCase("zh-CN");
  const filtered = state.works.filter((work) =>
    (state.workFilter === "全部" || work.category === state.workFilter) &&
    (!query || work.title.toLocaleLowerCase("zh-CN").includes(query))
  );
  document.querySelector("#works-count").textContent = state.works.length || "—";
  document.querySelector("#works-notice").textContent = state.worksNotice;
  document.querySelector("#works-list").innerHTML = filtered.length ? filtered.map((work, index) => `
    <button class="work-row work-trigger" type="button" data-work-id="${esc(work.id)}">
      <span class="work-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="work-title">${esc(work.title)}</span>
      <span class="work-category">${esc(work.category)}</span>
      <span class="work-arrow" aria-hidden="true">→</span>
    </button>`).join("") : '<div class="empty-state">没有找到匹配的作品。</div>';
}

function selectSubject(subject) {
  if (!SUBJECTS[subject]) return;
  state.subject = subject;
  state.filter = "all";
  document.querySelectorAll(".person-tab").forEach((tab) => {
    const active = tab.dataset.subject === subject;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  const profile = SUBJECTS[subject];
  document.querySelector("#subject-eyebrow").textContent = profile.eyebrow;
  document.querySelector("#hero-title").textContent = profile.name;
  document.querySelector("#subject-deck").textContent = profile.deck;
  const primaryAction = document.querySelector(".primary-button");
  if (subject === "dagu") {
    primaryAction.href = "#works";
    primaryAction.innerHTML = "查看作品文库 <span>↘</span>";
  } else {
    primaryAction.href = "#latest";
    primaryAction.innerHTML = "查看最新动态 <span>↘</span>";
  }
  const subjectNews = state.news.filter((item) => (item.subject || "durant") === subject);
  document.querySelector("#source-count").textContent = new Set(subjectNews.map((item) => item.source)).size || "—";
  renderFilters();
  render();
  renderWorks();
}

function openStory(id, updateHistory = true) {
  const item = state.news.find((story) => String(story.id) === String(id));
  if (!item) return;
  document.querySelector("#reader-meta").innerHTML = `<strong>${esc(item.category || "动态")}</strong>${esc(item.source)} · ${formatDate(item.publishedAt, true)}`;
  document.querySelector("#reader-title").textContent = cleanText(item.titleZh || item.title);
  const image = document.querySelector("#reader-image");
  image.src = storyImage(item);
  image.dataset.fallback = FALLBACK_IMAGES[item.subject || "durant"];
  image.alt = `${SUBJECTS[item.subject || "durant"]?.name || "资讯"}主题配图`;
  document.querySelector("#reader-summary").textContent = cleanText(item.summaryZh || "");
  document.querySelector("#reader-body").textContent = cleanText(item.detailsZh || item.summaryZh || "AI 暂未生成更多内容。");
  const points = Array.isArray(item.keyPoints) && item.keyPoints.length
    ? item.keyPoints
    : [item.summaryZh || "点击下方链接查看原始报道。"];
  document.querySelector("#reader-points").innerHTML = points.slice(0, 5).map((point) => `<li>${esc(cleanText(point))}</li>`).join("");
  const source = document.querySelector("#reader-source");
  source.href = safeUrl(item.url);
  source.innerHTML = `查看 ${esc(item.source)} 原始报道 <span>↗</span>`;
  home.hidden = true;
  reader.hidden = false;
  window.scrollTo({ top: 0, behavior: "auto" });
  if (updateHistory) history.pushState({ storyId: String(id) }, "", `#story=${encodeURIComponent(id)}`);
}

function openWork(id, updateHistory = true) {
  const work = state.works.find((item) => String(item.id) === String(id));
  if (!work) return;
  document.querySelector("#reader-meta").innerHTML = `<strong>${esc(work.category)}</strong>${esc(work.source)}`;
  document.querySelector("#reader-title").textContent = work.title;
  const image = document.querySelector("#reader-image");
  image.src = FALLBACK_IMAGES.dagu;
  image.dataset.fallback = FALLBACK_IMAGES.dagu;
  image.alt = "大咕咕咕咕鸡作品文库主题配图";
  document.querySelector("#reader-summary").textContent = "作品目录卡片";
  document.querySelector("#reader-body").textContent = work.note || "该条目收录于公开整理文集。本站仅提供索引，不转载受版权保护的正文。";
  document.querySelector("#reader-points").innerHTML = [
    `分类：${work.category}`,
    "来源为公开整理文集，并非作者官方出版目录。",
    "点击下方入口可前往原页面阅读。"
  ].map((point) => `<li>${esc(point)}</li>`).join("");
  const source = document.querySelector("#reader-source");
  source.href = safeUrl(work.url);
  source.innerHTML = `前往公开文集阅读原文 <span>↗</span>`;
  home.hidden = true;
  reader.hidden = false;
  window.scrollTo({ top: 0, behavior: "auto" });
  if (updateHistory) history.pushState({ workId: String(id) }, "", `#work=${encodeURIComponent(id)}`);
}

function closeStory(updateHistory = true) {
  reader.hidden = true;
  home.hidden = false;
  if (updateHistory && (location.hash.startsWith("#story=") || location.hash.startsWith("#work="))) {
    const target = location.hash.startsWith("#work=") ? "works" : "latest";
    history.pushState({}, "", `${location.pathname}${location.search}#${target}`);
    requestAnimationFrame(() => document.querySelector(`#${target}`)?.scrollIntoView());
  }
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".story-trigger");
  if (trigger) openStory(trigger.dataset.storyId);
  const workTrigger = event.target.closest(".work-trigger");
  if (workTrigger) openWork(workTrigger.dataset.workId);
  const workFilter = event.target.closest(".work-filter");
  if (workFilter) {
    state.workFilter = workFilter.dataset.workFilter;
    renderWorks();
  }
});

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.fallback || image.src.endsWith(image.dataset.fallback)) return;
  image.src = image.dataset.fallback;
}, true);

document.querySelectorAll(".reader-close, .reader-home").forEach((control) => control.addEventListener("click", () => closeStory()));
window.addEventListener("popstate", () => {
  const id = location.hash.startsWith("#story=") ? decodeURIComponent(location.hash.slice(7)) : null;
  const workId = location.hash.startsWith("#work=") ? decodeURIComponent(location.hash.slice(6)) : null;
  if (id) openStory(id, false); else if (workId) openWork(workId, false); else closeStory(false);
});

document.querySelector("#works-search").addEventListener("input", (event) => {
  state.workQuery = event.target.value;
  renderWorks();
});

function updateClock() {
  const updated = state.updatedAt ? new Date(state.updatedAt) : new Date();
  document.querySelector("#header-time").textContent = `更新于 ${formatDate(updated.toISOString(), true)}`;
  const next = new Date(updated.getTime() + 60 * 60 * 1000);
  document.querySelector("#next-update").textContent = next < new Date() ? "即将更新" : new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(next);
}

document.querySelector("#filters").addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (!button) return;
  state.filter = button.dataset.filter;
  renderFilters();
  render();
});

document.querySelectorAll(".person-tab").forEach((tab) => tab.addEventListener("click", () => selectSubject(tab.dataset.subject)));

Promise.all([
  fetch(`data/news.json?v=${Date.now()}`).then((response) => {
    if (!response.ok) throw new Error("news feed unavailable");
    return response.json();
  }),
  fetch(`data/dagu-works.json?v=${Date.now()}`).then((response) => response.ok ? response.json() : ({ items: [] }))
])
  .then(([data, worksData]) => {
    state.news = Array.isArray(data.items) ? data.items : [];
    state.works = Array.isArray(worksData.items) ? worksData.items : [];
    state.worksNotice = worksData.notice || "";
    state.updatedAt = data.updatedAt;
    updateClock();
    selectSubject(state.subject);
    const linkedStory = location.hash.startsWith("#story=") ? decodeURIComponent(location.hash.slice(7)) : null;
    const linkedWork = location.hash.startsWith("#work=") ? decodeURIComponent(location.hash.slice(6)) : null;
    if (linkedStory) openStory(linkedStory, false);
    if (linkedWork) openWork(linkedWork, false);
  })
  .catch(() => {
    document.querySelector("#lead-story").innerHTML = '<div class="story-loading">暂时无法读取新闻，请稍后刷新。</div>';
    updateClock();
  });
