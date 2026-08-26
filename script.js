const state = { news: [], filter: "all", updatedAt: null };

const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[char]));

const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch { return "#"; }
};

const formatDate = (iso, withTime = false) => {
  if (!iso) return "刚刚";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit", day: "2-digit", ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
  }).format(date).replaceAll("/", ".");
};

function render() {
  const filtered = state.filter === "all"
    ? state.news
    : state.news.filter((item) => item.category === state.filter || (state.filter === "重点" && item.importance >= 4));
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
    <a class="lead-link" href="${safeUrl(lead.url)}" target="_blank" rel="noopener noreferrer">
      <div><p class="lead-kicker"><strong>TOP STORY</strong>${esc(lead.source)} · ${formatDate(lead.publishedAt, true)}</p></div>
      <div><h3 class="lead-title">${esc(lead.titleZh || lead.title)}</h3><p class="lead-summary">${esc(lead.summaryZh)}</p></div>
      <span class="lead-arrow" aria-hidden="true">↗</span>
    </a>`;
  grid.innerHTML = rest.map((item) => `
    <a class="news-card" href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">
      <div class="card-top"><span class="card-meta card-tag">${esc(item.category || "动态")}</span><time class="card-meta">${formatDate(item.publishedAt)}</time></div>
      <h3 class="card-title">${esc(item.titleZh || item.title)}</h3>
      <p class="card-summary">${esc(item.summaryZh)}</p>
      <div class="card-bottom"><span class="card-source">${esc(item.source)}</span><span class="card-arrow" aria-hidden="true">↘</span></div>
    </a>`).join("");
}

function updateClock() {
  const updated = state.updatedAt ? new Date(state.updatedAt) : new Date();
  document.querySelector("#header-time").textContent = `更新于 ${formatDate(updated.toISOString(), true)}`;
  const next = new Date(updated.getTime() + 60 * 60 * 1000);
  document.querySelector("#next-update").textContent = next < new Date() ? "即将更新" : new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(next);
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.filter = button.dataset.filter;
    render();
  });
});

fetch(`data/news.json?v=${Date.now()}`)
  .then((response) => {
    if (!response.ok) throw new Error("news feed unavailable");
    return response.json();
  })
  .then((data) => {
    state.news = Array.isArray(data.items) ? data.items : [];
    state.updatedAt = data.updatedAt;
    document.querySelector("#source-count").textContent = new Set(state.news.map((item) => item.source)).size || "—";
    updateClock();
    render();
  })
  .catch(() => {
    document.querySelector("#lead-story").innerHTML = '<div class="story-loading">暂时无法读取新闻，请稍后刷新。</div>';
    updateClock();
  });
