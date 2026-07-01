const SEARCH_HISTORY_KEY = "homepage-search-history";
const SEARCH_HISTORY_LIMIT = 12;
const CUSTOM_SHORTCUTS_KEY = "homepage-custom-shortcuts";
const CUSTOM_ICON_MAX_BYTES = 512 * 1024;
const THEMES = ["default", "oled-friendly", "blue-night"];
const THEME_LABELS = {
  "default": "Theme: Default",
  "oled-friendly": "Theme: OLED",
  "blue-night": "Theme: Night"
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[character]));
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(value) || /^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(value);
}

function getSearchHistory(storage) {
  try {
    const history = JSON.parse(storage.getItem(SEARCH_HISTORY_KEY) || "[]");
    return Array.isArray(history) ? history.filter((item) => typeof item === "string") : [];
  } catch (error) {
    return [];
  }
}

function saveSearchHistory(storage, query) {
  const clean = query.trim();
  if (!clean) return;

  const lower = clean.toLowerCase();
  const nextHistory = [
    clean,
    ...getSearchHistory(storage).filter((item) => item.toLowerCase() !== lower)
  ].slice(0, SEARCH_HISTORY_LIMIT);

  storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
}

function getCustomShortcuts(storage) {
  try {
    const shortcuts = JSON.parse(storage.getItem(CUSTOM_SHORTCUTS_KEY) || "[]");
    return Array.isArray(shortcuts) ? shortcuts.filter((shortcut) => shortcut && shortcut.name && shortcut.url) : [];
  } catch (error) {
    return [];
  }
}

function saveCustomShortcuts(storage, shortcuts) {
  storage.setItem(CUSTOM_SHORTCUTS_KEY, JSON.stringify(shortcuts));
}

function normalizeUrl(value) {
  const clean = value.trim();
  if (!clean) return "";
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

function getShortcutIconText(shortcut) {
  return (shortcut.iconText || shortcut.name || "?").trim().slice(0, 2).toUpperCase();
}

function readIconFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    if (file.size > CUSTOM_ICON_MAX_BYTES) {
      reject(new Error("Icon image is too large. Use an image under 512 KB."));
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read that icon image.")));
    reader.readAsDataURL(file);
  });
}

function buildSearchTarget(query, type = "default") {
  const clean = query.trim();

  if (type === "youtube") {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}`;
  }

  if (type === "github") {
    return `https://github.com/search?q=${encodeURIComponent(clean)}`;
  }

  if (looksLikeUrl(clean)) {
    return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(clean)}`;
}

function makeSuggestion(kind, title, detail, value, target) {
  return { kind, title, detail, value, target };
}

function getSearchSuggestions(query, storage) {
  const clean = query.trim();
  const history = getSearchHistory(storage);

  if (!clean) {
    return history.slice(0, 5).map((item) => makeSuggestion(
      "history",
      item,
      "Recent search",
      item,
      buildSearchTarget(item)
    ));
  }

  const lower = clean.toLowerCase();
  const historyMatches = history
    .filter((item) => item.toLowerCase().includes(lower) && item.toLowerCase() !== lower)
    .slice(0, 3)
    .map((item) => makeSuggestion(
      "history",
      item,
      "Recent search",
      item,
      buildSearchTarget(item)
    ));

  const primarySuggestion = looksLikeUrl(clean)
    ? makeSuggestion("search", `Open ${clean}`, "Website", clean, buildSearchTarget(clean))
    : makeSuggestion("search", `Search Google for "${clean}"`, "Google", clean, buildSearchTarget(clean));

  return [
    primarySuggestion,
    ...historyMatches,
    makeSuggestion("youtube", `Search YouTube for "${clean}"`, "YouTube", clean, buildSearchTarget(clean, "youtube")),
    makeSuggestion("github", `Search GitHub for "${clean}"`, "GitHub", clean, buildSearchTarget(clean, "github"))
  ].slice(0, 6);
}

function parseNotesLine(line) {
  const heading = line.match(/^#{1,3}\s+(.+)/);
  const check = line.match(/^-\s+\[(x| )\]\s+(.+)/i);
  const bullet = line.match(/^-\s+(.+)/);

  if (!line.trim()) return { type: "blank" };
  if (heading) return { type: "heading", text: heading[1] };
  if (check) return { type: "check", checked: check[1].toLowerCase() === "x", text: check[2] };
  if (bullet) return { type: "bullet", text: bullet[1] };
  return { type: "paragraph", text: line };
}

function renderNotesLine(parsed) {
  if (parsed.type === "blank") return "<br>";
  if (parsed.type === "heading") return `<div class="preview-heading">${escapeHtml(parsed.text)}</div>`;
  if (parsed.type === "check") {
    const checked = parsed.checked ? " checked" : "";
    return `<label class="preview-check"><input type="checkbox" disabled${checked}><span>${escapeHtml(parsed.text)}</span></label>`;
  }
  if (parsed.type === "bullet") return `<ul><li>${escapeHtml(parsed.text)}</li></ul>`;
  return `<p>${escapeHtml(parsed.text)}</p>`;
}

function renderNotesHtml(text) {
  if (!text.trim()) return "<p>No notes yet.</p>";
  return text.split(/\r?\n/).map((line) => renderNotesLine(parseNotesLine(line))).join("");
}

function getNextTheme(currentTheme) {
  return THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length] || "default";
}

function getThemeLabel(theme) {
  return THEME_LABELS[theme] || THEME_LABELS["default"];
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SEARCH_HISTORY_KEY,
    SEARCH_HISTORY_LIMIT,
    CUSTOM_SHORTCUTS_KEY,
    CUSTOM_ICON_MAX_BYTES,
    THEMES,
    THEME_LABELS,
    escapeHtml,
    looksLikeUrl,
    getSearchHistory,
    saveSearchHistory,
    getCustomShortcuts,
    saveCustomShortcuts,
    normalizeUrl,
    getShortcutIconText,
    readIconFile,
    buildSearchTarget,
    makeSuggestion,
    getSearchSuggestions,
    parseNotesLine,
    renderNotesLine,
    renderNotesHtml,
    getNextTheme,
    getThemeLabel,
  };
}
