// ===================== Element refs =====================
const startMenu = document.getElementById("startMenu");
const startButton = document.getElementById("startButton");
const notePanel = document.getElementById("notePanel");
const noteToggleButtons = document.querySelectorAll("[data-note-toggle]");
const closeNotesButton = document.getElementById("closeNotes");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchSuggestions = document.getElementById("searchSuggestions");
const clockTime = document.getElementById("clockTime");
const clockDate = document.getElementById("clockDate");
const notesInput = document.getElementById("notes");
const notesPreview = document.getElementById("notesPreview");
const noteModeButtons = document.querySelectorAll("[data-note-mode]");
const noteTabsEl = document.getElementById("noteTabs");
const noteTabAddBtn = document.getElementById("noteTabAdd");
const noteRenameBtn = document.getElementById("noteRename");
const noteDeleteBtn = document.getElementById("noteDelete");
const settingsPanel = document.getElementById("settingsPanel");
const settingsToggleButton = document.querySelector("[data-settings-toggle]");
const closeSettingsButton = document.getElementById("closeSettings");
const shortcutForm = document.getElementById("shortcutForm");
const shortcutName = document.getElementById("shortcutName");
const shortcutUrl = document.getElementById("shortcutUrl");
const shortcutIconText = document.getElementById("shortcutIconText");
const shortcutIconFile = document.getElementById("shortcutIconFile");
const shortcutError = document.getElementById("shortcutError");
const shortcutList = document.getElementById("shortcutList");
const customShortcuts = document.getElementById("customShortcuts");
const customFolders = document.getElementById("customFolders");
const dynamicFolderPanels = document.getElementById("dynamicFolderPanels");
const themeGrid = document.getElementById("themeGrid");
const bgFileInput = document.getElementById("bgFileInput");
const bgResetBtn = document.getElementById("bgResetBtn");
const customBgLayer = document.getElementById("customBgLayer");
const weatherWidget = document.getElementById("weatherWidget");
const weatherIcon = document.getElementById("weatherIcon");
const weatherTemp = document.getElementById("weatherTemp");
const weatherCityInput = document.getElementById("weatherCityInput");
const weatherUseLocationBtn = document.getElementById("weatherUseLocationBtn");
const weatherError = document.getElementById("weatherError");
const folderGroupForm = document.getElementById("folderGroupForm");
const folderGroupName = document.getElementById("folderGroupName");
const folderGroupLinks = document.getElementById("folderGroupLinks");
const folderGroupAddLink = document.getElementById("folderGroupAddLink");
const folderGroupError = document.getElementById("folderGroupError");
const folderGroupList = document.getElementById("folderGroupList");

// ===================== Constants =====================
const SEARCH_HISTORY_KEY = "homepage-search-history";
const SEARCH_HISTORY_LIMIT = 12;
const CUSTOM_SHORTCUTS_KEY = "homepage-custom-shortcuts";
const CUSTOM_ICON_MAX_BYTES = 512 * 1024;
const NOTES_KEY = "homepage-notes-v2";
const LEGACY_NOTES_KEY = "homepage-notes";
const CUSTOM_FOLDERS_KEY = "homepage-custom-folders";
const CUSTOM_BG_KEY = "homepage-custom-bg";
const CUSTOM_BG_MAX_BYTES = 2 * 1024 * 1024;
const WEATHER_CITY_KEY = "homepage-weather-city";
const WEATHER_CACHE_KEY = "homepage-weather-cache";
const WEATHER_CACHE_TTL_MS = 20 * 60 * 1000;

const THEMES = [
  { id: "default", label: "Life / Death", swatch: "preview-default" },
  { id: "oled-friendly", label: "OLED", swatch: "preview-oled-friendly" },
  { id: "blue-night", label: "Blue Night", swatch: "preview-blue-night" },
  { id: "aurora", label: "Aurora Glass", swatch: "preview-aurora" },
  { id: "terminal", label: "Terminal", swatch: "preview-terminal" }
];
const THEME_CLASS_MAP = {
  "default": "",
  "oled-friendly": "theme-oled-friendly",
  "blue-night": "theme-blue-night",
  "aurora": "theme-aurora",
  "terminal": "theme-terminal"
};

const WEATHER_CODES = {
  0: ["☀️", "Clear sky"],
  1: ["🌤️", "Mainly clear"],
  2: ["⛅", "Partly cloudy"],
  3: ["☁️", "Overcast"],
  45: ["🌫️", "Fog"],
  48: ["🌫️", "Fog"],
  51: ["🌦️", "Light drizzle"],
  53: ["🌦️", "Drizzle"],
  55: ["🌧️", "Dense drizzle"],
  56: ["🌧️", "Freezing drizzle"],
  57: ["🌧️", "Freezing drizzle"],
  61: ["🌧️", "Light rain"],
  63: ["🌧️", "Rain"],
  65: ["🌧️", "Heavy rain"],
  66: ["🌧️", "Freezing rain"],
  67: ["🌧️", "Freezing rain"],
  71: ["🌨️", "Light snow"],
  73: ["🌨️", "Snow"],
  75: ["❄️", "Heavy snow"],
  77: ["❄️", "Snow grains"],
  80: ["🌦️", "Rain showers"],
  81: ["🌧️", "Rain showers"],
  82: ["⛈️", "Violent showers"],
  85: ["🌨️", "Snow showers"],
  86: ["❄️", "Snow showers"],
  95: ["⛈️", "Thunderstorm"],
  96: ["⛈️", "Thunderstorm w/ hail"],
  99: ["⛈️", "Thunderstorm w/ hail"]
};

let currentSuggestions = [];
let activeSuggestionIndex = -1;
let currentNoteMode = "write";

// ===================== Helpers =====================
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

function normalizeUrl(value) {
  const clean = value.trim();
  if (!clean) return "";
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage:`, error);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to save ${key} (storage may be full):`, error);
    return false;
  }
}

function readFileAsDataUrl(file, maxBytes) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error(`Image is too large. Use a file under ${Math.round(maxBytes / 1024)} KB.`));
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read that image.")));
    reader.readAsDataURL(file);
  });
}

// ===================== Search history =====================
function getSearchHistory() {
  const history = readJson(SEARCH_HISTORY_KEY, []);
  return Array.isArray(history) ? history.filter((item) => typeof item === "string") : [];
}

function saveSearchHistory(query) {
  const clean = query.trim();
  if (!clean) return;
  const lower = clean.toLowerCase();
  const nextHistory = [
    clean,
    ...getSearchHistory().filter((item) => item.toLowerCase() !== lower)
  ].slice(0, SEARCH_HISTORY_LIMIT);
  writeJson(SEARCH_HISTORY_KEY, nextHistory);
}

// ===================== Custom shortcuts =====================
function getCustomShortcuts() {
  const shortcuts = readJson(CUSTOM_SHORTCUTS_KEY, []);
  return Array.isArray(shortcuts) ? shortcuts.filter((shortcut) => shortcut && shortcut.name && shortcut.url) : [];
}

function saveCustomShortcuts(shortcuts) {
  if (!writeJson(CUSTOM_SHORTCUTS_KEY, shortcuts)) {
    throw new Error("Could not save shortcut — storage is full. Try removing unused shortcuts.");
  }
}

function getShortcutIconText(shortcut) {
  return (shortcut.iconText || shortcut.name || "?").trim().slice(0, 2).toUpperCase();
}

function applyShortcutIcon(element, shortcut) {
  element.textContent = shortcut.iconImage ? "" : getShortcutIconText(shortcut);
  element.style.backgroundImage = shortcut.iconImage ? `url("${shortcut.iconImage}")` : "";
}

function renderCustomShortcuts() {
  const shortcuts = getCustomShortcuts();
  customShortcuts.innerHTML = "";
  shortcutList.innerHTML = "";

  shortcuts.forEach((shortcut) => {
    const dockLink = document.createElement("a");
    dockLink.className = "task-btn custom-shortcut";
    dockLink.href = shortcut.url;
    dockLink.target = "_blank";
    dockLink.rel = "noopener noreferrer";
    dockLink.title = shortcut.name;
    dockLink.setAttribute("aria-label", `Open ${shortcut.name}`);

    const dockIcon = document.createElement("span");
    dockIcon.className = "custom-shortcut-icon";
    applyShortcutIcon(dockIcon, shortcut);
    dockLink.appendChild(dockIcon);
    customShortcuts.appendChild(dockLink);

    const row = document.createElement("div");
    row.className = "shortcut-row";

    const rowIcon = document.createElement("span");
    rowIcon.className = "shortcut-icon";
    applyShortcutIcon(rowIcon, shortcut);

    const meta = document.createElement("span");
    meta.className = "shortcut-meta";
    meta.innerHTML = `<strong>${escapeHtml(shortcut.name)}</strong><small>${escapeHtml(shortcut.url)}</small>`;

    const removeButton = document.createElement("button");
    removeButton.className = "shortcut-remove";
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", `Remove ${shortcut.name}`);
    removeButton.addEventListener("click", () => {
      saveCustomShortcuts(getCustomShortcuts().filter((item) => item.id !== shortcut.id));
      renderCustomShortcuts();
    });

    row.append(rowIcon, meta, removeButton);
    shortcutList.appendChild(row);
  });
}

async function handleShortcutSubmit(event) {
  event.preventDefault();
  shortcutError.textContent = "";

  const name = shortcutName.value.trim();
  const url = normalizeUrl(shortcutUrl.value);
  const iconText = shortcutIconText.value.trim();

  if (!name || !url) {
    shortcutError.textContent = "Name and website are required.";
    return;
  }

  try {
    new URL(url);
  } catch (error) {
    shortcutError.textContent = "Website needs to be a valid URL.";
    return;
  }

  try {
    const iconImage = await readFileAsDataUrl(shortcutIconFile.files[0], CUSTOM_ICON_MAX_BYTES);
    const shortcuts = getCustomShortcuts();
    shortcuts.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      url,
      iconText: iconText || name.slice(0, 1),
      iconImage
    });
    saveCustomShortcuts(shortcuts);
    shortcutForm.reset();
    renderCustomShortcuts();
  } catch (error) {
    shortcutError.textContent = error.message || "Something went wrong while adding the shortcut.";
    console.error("Shortcut creation failed:", error);
  }
}

// ===================== Custom folder groups =====================
function getCustomFolders() {
  const folders = readJson(CUSTOM_FOLDERS_KEY, []);
  return Array.isArray(folders)
    ? folders.filter((folder) => folder && folder.name && Array.isArray(folder.links) && folder.links.length)
    : [];
}

function saveCustomFolders(folders) {
  if (!writeJson(CUSTOM_FOLDERS_KEY, folders)) {
    throw new Error("Could not save folder — storage is full.");
  }
}

function addFolderGroupLinkRow(label = "", url = "") {
  const row = document.createElement("div");
  row.className = "folder-group-link-row";
  row.innerHTML = `
    <input type="text" class="fg-link-label" placeholder="Label" maxlength="24" autocomplete="off" value="${escapeHtml(label)}">
    <input type="text" class="fg-link-url" placeholder="https://example.com" autocomplete="off" value="${escapeHtml(url)}">
    <button type="button" class="folder-group-link-remove" aria-label="Remove link">x</button>
  `;
  row.querySelector(".folder-group-link-remove").addEventListener("click", () => {
    if (folderGroupLinks.children.length > 1) {
      row.remove();
    }
  });
  folderGroupLinks.appendChild(row);
}

function resetFolderGroupForm() {
  folderGroupForm.reset();
  folderGroupLinks.innerHTML = "";
  addFolderGroupLinkRow();
  addFolderGroupLinkRow();
  folderGroupError.textContent = "";
}

function buildDynamicFolderPanel(folder) {
  const section = document.createElement("section");
  section.className = "folder-panel hidden";
  section.dataset.folderPanel = `custom-${folder.id}`;
  section.setAttribute("aria-label", `${folder.name} folder`);

  const linksHtml = folder.links.map((link) => `
    <a class="folder-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
      <span class="folder-icon" aria-hidden="true">${escapeHtml((link.label || "?").trim().slice(0, 1).toUpperCase())}</span>
      <span class="folder-label"><strong>${escapeHtml(link.label || link.url)}</strong><small>${escapeHtml(link.url)}</small></span>
    </a>
  `).join("");

  section.innerHTML = `
    <div class="folder-head">
      <span>${escapeHtml(folder.name)}</span>
      <button class="folder-close" type="button" data-folder-close aria-label="Close ${escapeHtml(folder.name)} folder">x</button>
    </div>
    <div class="folder-grid">${linksHtml}</div>
  `;
  return section;
}

function renderCustomFolders() {
  const folders = getCustomFolders();
  customFolders.innerHTML = "";
  dynamicFolderPanels.innerHTML = "";
  folderGroupList.innerHTML = "";

  folders.forEach((folder) => {
    const dockBtn = document.createElement("button");
    dockBtn.type = "button";
    dockBtn.className = "task-btn custom-folder";
    dockBtn.title = folder.name;
    dockBtn.setAttribute("aria-label", `Open ${folder.name}`);
    dockBtn.setAttribute("data-folder-toggle", "");
    dockBtn.dataset.folder = `custom-${folder.id}`;
    dockBtn.setAttribute("aria-expanded", "false");

    const icon = document.createElement("span");
    icon.className = "custom-folder-icon";
    icon.textContent = folder.name.trim().slice(0, 2).toUpperCase();
    dockBtn.appendChild(icon);
    customFolders.appendChild(dockBtn);

    const panel = buildDynamicFolderPanel(folder);
    dynamicFolderPanels.appendChild(panel);

    const row = document.createElement("div");
    row.className = "shortcut-row";
    row.innerHTML = `
      <span class="folder-group-icon">${escapeHtml(folder.name.trim().slice(0, 2).toUpperCase())}</span>
      <span class="shortcut-meta"><strong>${escapeHtml(folder.name)}</strong><small>${folder.links.length} link${folder.links.length === 1 ? "" : "s"}</small></span>
    `;
    const removeButton = document.createElement("button");
    removeButton.className = "shortcut-remove";
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", `Remove ${folder.name}`);
    removeButton.addEventListener("click", () => {
      saveCustomFolders(getCustomFolders().filter((item) => item.id !== folder.id));
      renderCustomFolders();
      syncActiveStates();
    });
    row.appendChild(removeButton);
    folderGroupList.appendChild(row);
  });
}

function handleFolderGroupSubmit(event) {
  event.preventDefault();
  folderGroupError.textContent = "";

  const name = folderGroupName.value.trim();
  const rows = Array.from(folderGroupLinks.querySelectorAll(".folder-group-link-row"));
  const links = [];

  for (const row of rows) {
    const label = row.querySelector(".fg-link-label").value.trim();
    const rawUrl = row.querySelector(".fg-link-url").value.trim();
    if (!rawUrl) continue;
    const url = normalizeUrl(rawUrl);
    try {
      new URL(url);
    } catch (error) {
      folderGroupError.textContent = `"${rawUrl}" isn't a valid URL.`;
      return;
    }
    links.push({ label: label || url, url });
  }

  if (!name) {
    folderGroupError.textContent = "Folder name is required.";
    return;
  }
  if (!links.length) {
    folderGroupError.textContent = "Add at least one valid link.";
    return;
  }

  try {
    const folders = getCustomFolders();
    folders.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      links
    });
    saveCustomFolders(folders);
    resetFolderGroupForm();
    renderCustomFolders();
  } catch (error) {
    folderGroupError.textContent = error.message || "Something went wrong while adding the folder.";
    console.error("Folder creation failed:", error);
  }
}

// ===================== Search =====================
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

function getSearchSuggestions(query) {
  const clean = query.trim();
  const history = getSearchHistory();

  if (!clean) {
    return history.slice(0, 5).map((item) => makeSuggestion(
      "history", item, "Recent search", item, buildSearchTarget(item)
    ));
  }

  const lower = clean.toLowerCase();
  const historyMatches = history
    .filter((item) => item.toLowerCase().includes(lower) && item.toLowerCase() !== lower)
    .slice(0, 3)
    .map((item) => makeSuggestion("history", item, "Recent search", item, buildSearchTarget(item)));

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

function hideSearchSuggestions() {
  searchSuggestions.hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  activeSuggestionIndex = -1;
}

function setActiveSuggestion(index) {
  activeSuggestionIndex = index;
  searchSuggestions.querySelectorAll(".search-suggestion").forEach((button, buttonIndex) => {
    const isActive = buttonIndex === activeSuggestionIndex;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  if (activeSuggestionIndex >= 0) {
    searchInput.setAttribute("aria-activedescendant", `searchSuggestion${activeSuggestionIndex}`);
  } else {
    searchInput.removeAttribute("aria-activedescendant");
  }
}

function renderSearchSuggestions() {
  currentSuggestions = getSearchSuggestions(searchInput.value);
  searchSuggestions.innerHTML = "";
  activeSuggestionIndex = -1;

  if (!currentSuggestions.length) {
    hideSearchSuggestions();
    return;
  }

  currentSuggestions.forEach((suggestion, index) => {
    const button = document.createElement("button");
    button.className = "search-suggestion";
    button.type = "button";
    button.id = `searchSuggestion${index}`;
    button.role = "option";
    button.setAttribute("aria-selected", "false");
    button.innerHTML = `
      <span class="suggestion-icon ${escapeHtml(suggestion.kind)}" aria-hidden="true"></span>
      <span class="suggestion-copy">
        <span>${escapeHtml(suggestion.title)}</span>
        <small>${escapeHtml(suggestion.detail)}</small>
      </span>
    `;
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => runSuggestion(index));
    searchSuggestions.appendChild(button);
  });

  searchSuggestions.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

function runSearch(query, target = buildSearchTarget(query)) {
  const clean = query.trim();
  if (!clean) return;
  saveSearchHistory(clean);
  hideSearchSuggestions();
  window.open(target, "_blank", "noopener,noreferrer");
}

function runSuggestion(index) {
  const suggestion = currentSuggestions[index];
  if (!suggestion) return;
  searchInput.value = suggestion.value;
  runSearch(suggestion.value, suggestion.target);
}

function handleSearch(event) {
  event.preventDefault();
  const raw = searchInput.value.trim();
  if (!raw) return;
  if (activeSuggestionIndex >= 0) {
    runSuggestion(activeSuggestionIndex);
    return;
  }
  runSearch(raw);
}

// ===================== Clock =====================
function updateClock() {
  const now = new Date();
  clockTime.dateTime = now.toISOString();
  clockTime.textContent = new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" }).format(now);
  clockDate.textContent = new Intl.DateTimeFormat([], { weekday: "short", month: "short", day: "numeric" }).format(now);
}

// ===================== Notes (multi-tab, markdown-ish) =====================
function migrateLegacyNotes() {
  let legacy = "";
  try {
    legacy = localStorage.getItem(LEGACY_NOTES_KEY) || "";
  } catch (error) {
    legacy = "";
  }
  const state = {
    notes: [{ id: "note-1", title: "Notes", content: legacy }],
    activeId: "note-1"
  };
  writeJson(NOTES_KEY, state);
  try {
    localStorage.removeItem(LEGACY_NOTES_KEY);
  } catch (error) {
    // ignore
  }
  return state;
}

function getNotesState() {
  const state = readJson(NOTES_KEY, null);
  if (!state || !Array.isArray(state.notes) || !state.notes.length) {
    return migrateLegacyNotes();
  }
  if (!state.notes.some((note) => note.id === state.activeId)) {
    state.activeId = state.notes[0].id;
  }
  return state;
}

function saveNotesState(state) {
  writeJson(NOTES_KEY, state);
}

function getActiveNote(state) {
  return state.notes.find((note) => note.id === state.activeId) || state.notes[0];
}

function renderMarkdownLine(line) {
  if (!line.trim()) return "<br>";

  const heading = line.match(/^#{1,3}\s+(.+)/);
  if (heading) {
    return `<div class="preview-heading">${inlineMarkdown(heading[1])}</div>`;
  }

  const check = line.match(/^-\s+\[(x| )\]\s+(.+)/i);
  if (check) {
    const checked = check[1].toLowerCase() === "x" ? " checked" : "";
    return `<label class="preview-check"><input type="checkbox" data-check-line="1"${checked}><span>${inlineMarkdown(check[2])}</span></label>`;
  }

  const bullet = line.match(/^-\s+(.+)/);
  if (bullet) {
    return `<ul><li>${inlineMarkdown(bullet[1])}</li></ul>`;
  }

  return `<p>${inlineMarkdown(line)}</p>`;
}

function inlineMarkdown(rawLine) {
  let text = escapeHtml(rawLine);
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  return text;
}

function renderNotesPreview() {
  const state = getNotesState();
  const note = getActiveNote(state);
  const content = note ? note.content : "";
  const lines = content.split(/\r?\n/);

  if (!content.trim()) {
    notesPreview.innerHTML = "<p>No notes yet.</p>";
    return;
  }

  notesPreview.innerHTML = lines.map(renderMarkdownLine).join("");

  notesPreview.querySelectorAll("[data-check-line]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      toggleCheckboxLine(checkbox);
    });
  });
}

function toggleCheckboxLine(checkboxEl) {
  const allChecks = Array.from(notesPreview.querySelectorAll("[data-check-line]"));
  const index = allChecks.indexOf(checkboxEl);
  const state = getNotesState();
  const note = getActiveNote(state);
  const lines = note.content.split(/\r?\n/);
  let seen = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^-\s+\[(x| )\]\s+/i.test(lines[i])) {
      seen += 1;
      if (seen === index) {
        lines[i] = lines[i].replace(/^-\s+\[(x| )\]/i, checkboxEl.checked ? "- [x]" : "- [ ]");
        break;
      }
    }
  }
  note.content = lines.join("\n");
  saveNotesState(state);
  notesInput.value = note.content;
}

function renderNoteTabs() {
  const state = getNotesState();
  noteTabsEl.innerHTML = "";

  state.notes.forEach((note) => {
    const isActive = note.id === state.activeId;
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = `note-tab${isActive ? " active" : ""}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(isActive));
    tab.innerHTML = `<span>${escapeHtml(note.title || "Untitled")}</span>`;
    tab.addEventListener("click", () => {
      const nextState = getNotesState();
      nextState.activeId = note.id;
      saveNotesState(nextState);
      loadActiveNoteIntoEditor();
      renderNoteTabs();
    });
    noteTabsEl.appendChild(tab);
  });
}

function loadActiveNoteIntoEditor() {
  const state = getNotesState();
  const note = getActiveNote(state);
  notesInput.value = note ? note.content : "";
  renderNotesPreview();
}

function addNewNote() {
  const state = getNotesState();
  const id = `note-${Date.now()}`;
  state.notes.push({ id, title: `Note ${state.notes.length + 1}`, content: "" });
  state.activeId = id;
  saveNotesState(state);
  renderNoteTabs();
  loadActiveNoteIntoEditor();
  setNoteMode("write");
  notesInput.focus();
}

function renameActiveNote() {
  const state = getNotesState();
  const note = getActiveNote(state);
  if (!note) return;
  const nextTitle = window.prompt("Rename note:", note.title || "");
  if (nextTitle === null) return;
  const clean = nextTitle.trim().slice(0, 40);
  if (!clean) return;
  note.title = clean;
  saveNotesState(state);
  renderNoteTabs();
}

function deleteActiveNote() {
  const state = getNotesState();
  if (state.notes.length <= 1) {
    window.alert("You need at least one note.");
    return;
  }
  const note = getActiveNote(state);
  if (!window.confirm(`Delete "${note.title || "this note"}"?`)) return;
  state.notes = state.notes.filter((item) => item.id !== note.id);
  state.activeId = state.notes[0].id;
  saveNotesState(state);
  renderNoteTabs();
  loadActiveNoteIntoEditor();
}

function setNoteMode(mode) {
  currentNoteMode = mode;
  const isPreview = mode === "preview";
  notesInput.hidden = isPreview;
  notesPreview.classList.toggle("hidden", !isPreview);

  noteModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.noteMode === mode);
  });

  if (isPreview) {
    renderNotesPreview();
  } else {
    notesInput.focus();
  }
}

function loadNotes() {
  renderNoteTabs();
  loadActiveNoteIntoEditor();

  notesInput.addEventListener("input", () => {
    const state = getNotesState();
    const note = getActiveNote(state);
    note.content = notesInput.value;
    saveNotesState(state);
    renderNotesPreview();
  });
}

// ===================== Themes =====================
function getStoredTheme() {
  try {
    return localStorage.getItem("homepage-theme") || "default";
  } catch (error) {
    return "default";
  }
}

function applyTheme(themeId) {
  Object.values(THEME_CLASS_MAP).forEach((className) => {
    if (className) document.body.classList.remove(className);
  });
  const className = THEME_CLASS_MAP[themeId];
  if (className) document.body.classList.add(className);
}

function renderThemeGrid() {
  if (!themeGrid) return;
  const current = getStoredTheme();
  themeGrid.innerHTML = "";

  THEMES.forEach((theme) => {
    const isActive = theme.id === current;
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = `theme-swatch${isActive ? " active" : ""}`;
    swatch.setAttribute("aria-pressed", String(isActive));
    swatch.innerHTML = `
      <span class="theme-swatch-preview ${theme.swatch}" aria-hidden="true"></span>
      <span>${escapeHtml(theme.label)}</span>
    `;
    swatch.addEventListener("click", () => {
      try {
        localStorage.setItem("homepage-theme", theme.id);
      } catch (error) {
        console.warn("Failed to save theme preference:", error);
      }
      applyTheme(theme.id);
      renderThemeGrid();
    });
    themeGrid.appendChild(swatch);
  });
}

function loadTheme() {
  applyTheme(getStoredTheme());
  renderThemeGrid();
}

// ===================== Custom background =====================
function getCustomBg() {
  try {
    return localStorage.getItem(CUSTOM_BG_KEY) || "";
  } catch (error) {
    return "";
  }
}

function applyCustomBg() {
  const dataUrl = getCustomBg();
  if (dataUrl) {
    customBgLayer.style.backgroundImage = `url("${dataUrl}")`;
    document.body.classList.add("custom-bg");
  } else {
    customBgLayer.style.backgroundImage = "";
    document.body.classList.remove("custom-bg");
  }
}

async function handleBgFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await readFileAsDataUrl(file, CUSTOM_BG_MAX_BYTES);
    try {
      localStorage.setItem(CUSTOM_BG_KEY, dataUrl);
    } catch (error) {
      window.alert("Could not save that background — storage is full. Try a smaller image.");
      return;
    }
    applyCustomBg();
  } catch (error) {
    window.alert(error.message || "Could not use that image.");
  } finally {
    event.target.value = "";
  }
}

function resetCustomBg() {
  try {
    localStorage.removeItem(CUSTOM_BG_KEY);
  } catch (error) {
    // ignore
  }
  applyCustomBg();
}

// ===================== Weather =====================
function getWeatherCity() {
  return readJson(WEATHER_CITY_KEY, null);
}

function setWeatherCity(city) {
  writeJson(WEATHER_CITY_KEY, city);
}

function getWeatherCache() {
  return readJson(WEATHER_CACHE_KEY, null);
}

function setWeatherCache(cache) {
  writeJson(WEATHER_CACHE_KEY, cache);
}

async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Geocoding request failed.");
  const data = await response.json();
  const first = data && data.results && data.results[0];
  if (!first) throw new Error(`Couldn't find "${name}".`);
  return { name: first.name, lat: first.latitude, lon: first.longitude };
}

async function ipLocate() {
  const response = await fetch("https://ipwho.is/");
  if (!response.ok) throw new Error("IP lookup failed.");
  const data = await response.json();
  if (!data.success || typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    throw new Error("IP lookup returned no location.");
  }
  return { name: data.city || "Your area", lat: data.latitude, lon: data.longitude };
}

function browserLocate() {
  const geolocationPromise = new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        name: "Your location",
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }),
      (error) => reject(error),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });

  // getCurrentPosition's own `timeout` only counts once the user has
  // answered the permission prompt — if it sits unanswered, fall back
  // to IP-based location instead of hanging forever.
  const promptTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Location permission timed out.")), 9000);
  });

  return Promise.race([geolocationPromise, promptTimeout]);
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather request failed.");
  const data = await response.json();
  if (!data.current) throw new Error("Weather response missing data.");
  return {
    temp: Math.round(data.current.temperature_2m),
    code: data.current.weather_code
  };
}

function renderWeather(entry) {
  if (!entry) {
    weatherWidget.hidden = true;
    return;
  }
  const [icon] = WEATHER_CODES[entry.code] || ["🌤️", "Weather"];
  weatherIcon.textContent = icon;
  weatherTemp.textContent = `${entry.temp}°C`;
  weatherWidget.hidden = false;
}

async function resolveLocation() {
  const manual = getWeatherCity();
  if (manual && typeof manual.lat === "number") return manual;
  try {
    return await browserLocate();
  } catch (error) {
    try {
      return await ipLocate();
    } catch (ipError) {
      return null;
    }
  }
}

async function loadWeather(forceRefresh = false) {
  if (!weatherWidget) return;

  const cache = getWeatherCache();
  const manual = getWeatherCity();
  const cacheKey = manual ? `${manual.lat},${manual.lon}` : "auto";

  if (!forceRefresh && cache && cache.key === cacheKey && (Date.now() - cache.fetchedAt) < WEATHER_CACHE_TTL_MS) {
    renderWeather(cache.data);
    return;
  }

  try {
    const location = await resolveLocation();
    if (!location) {
      weatherWidget.hidden = true;
      return;
    }
    const data = await fetchWeather(location.lat, location.lon);
    setWeatherCache({ key: cacheKey, data, fetchedAt: Date.now() });
    renderWeather(data);
  } catch (error) {
    console.warn("Weather lookup failed:", error);
    weatherWidget.hidden = true;
  }
}

async function handleWeatherCitySubmit() {
  const name = weatherCityInput.value.trim();
  weatherError.textContent = "";
  if (!name) {
    setWeatherCity(null);
    try {
      localStorage.removeItem(WEATHER_CACHE_KEY);
    } catch (error) {
      // ignore
    }
    loadWeather(true);
    return;
  }
  try {
    const city = await geocodeCity(name);
    setWeatherCity(city);
    try {
      localStorage.removeItem(WEATHER_CACHE_KEY);
    } catch (error) {
      // ignore
    }
    await loadWeather(true);
  } catch (error) {
    weatherError.textContent = error.message || "Could not look up that city.";
  }
}

function handleUseMyLocation() {
  setWeatherCity(null);
  weatherCityInput.value = "";
  weatherError.textContent = "";
  try {
    localStorage.removeItem(WEATHER_CACHE_KEY);
  } catch (error) {
    // ignore
  }
  loadWeather(true);
}

// ===================== Panels / dock behavior =====================
function closeFolders() {
  document.querySelectorAll("[data-folder-panel]").forEach((panel) => panel.classList.add("hidden"));
}

function closeSettings() {
  settingsPanel.classList.add("hidden");
  syncActiveStates();
}

function getOpenFolderName() {
  const openFolder = Array.from(document.querySelectorAll("[data-folder-panel]"))
    .find((panel) => !panel.classList.contains("hidden"));
  return openFolder ? openFolder.dataset.folderPanel : "";
}

function toggleFolder(folderName) {
  const targetPanel = document.querySelector(`[data-folder-panel="${folderName}"]`);
  const isOpen = targetPanel && !targetPanel.classList.contains("hidden");

  closeFolders();
  notePanel.classList.add("hidden");
  settingsPanel.classList.add("hidden");
  startMenu.classList.remove("open");
  hideSearchSuggestions();

  if (targetPanel && !isOpen) {
    targetPanel.classList.remove("hidden");
  }

  syncActiveStates();
}

function toggleSettings() {
  const isOpen = !settingsPanel.classList.contains("hidden");
  closeFolders();
  notePanel.classList.add("hidden");
  startMenu.classList.add("open");
  hideSearchSuggestions();
  settingsPanel.classList.toggle("hidden", isOpen);

  if (isOpen) {
    shortcutError.textContent = "";
  } else {
    shortcutName.focus();
  }

  syncActiveStates();
}

function syncActiveStates() {
  const notesOpen = !notePanel.classList.contains("hidden");
  const menuOpen = startMenu.classList.contains("open");
  const openFolderName = getOpenFolderName();
  const settingsOpen = !settingsPanel.classList.contains("hidden");

  noteToggleButtons.forEach((button) => {
    button.classList.toggle("active", notesOpen);
    button.setAttribute("aria-label", notesOpen ? "Close notes" : "Open notes");
    button.setAttribute("aria-expanded", String(notesOpen));
  });

  document.querySelectorAll("[data-folder-toggle]").forEach((button) => {
    const isOpen = button.dataset.folder === openFolderName;
    button.classList.toggle("active", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
  });

  startButton.classList.toggle("active", menuOpen);
  startButton.setAttribute("aria-expanded", String(menuOpen));
  startButton.setAttribute("aria-label", menuOpen ? "Close menu" : "Open menu");
  startMenu.classList.toggle("settings-open", settingsOpen);

  settingsToggleButton.classList.toggle("active", settingsOpen);
  settingsToggleButton.setAttribute("aria-expanded", String(settingsOpen));
  settingsToggleButton.setAttribute("aria-label", settingsOpen ? "Close settings" : "Open settings");
}

function toggleStartMenu() {
  closeFolders();
  settingsPanel.classList.add("hidden");
  startMenu.classList.toggle("open");
  syncActiveStates();
}

function toggleNotes() {
  const isHidden = notePanel.classList.toggle("hidden");
  closeFolders();
  settingsPanel.classList.add("hidden");
  startMenu.classList.remove("open");
  if (!isHidden && currentNoteMode === "write") {
    notesInput.focus();
  }
  syncActiveStates();
}

function closeNotes() {
  notePanel.classList.add("hidden");
  syncActiveStates();
}

function closeOpenPanels() {
  notePanel.classList.add("hidden");
  startMenu.classList.remove("open");
  closeFolders();
  settingsPanel.classList.add("hidden");
  hideSearchSuggestions();
  syncActiveStates();
}

function handleSearchKeys(event) {
  if (searchSuggestions.hidden && !["ArrowDown", "ArrowUp"].includes(event.key)) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (searchSuggestions.hidden) renderSearchSuggestions();
    setActiveSuggestion(Math.min(activeSuggestionIndex + 1, currentSuggestions.length - 1));
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    setActiveSuggestion(Math.max(activeSuggestionIndex - 1, -1));
  }
  if (event.key === "Enter" && activeSuggestionIndex >= 0) {
    event.preventDefault();
    runSuggestion(activeSuggestionIndex);
  }
  if (event.key === "Escape") {
    hideSearchSuggestions();
  }
}

function handleShortcuts(event) {
  const target = event.target;
  const isTyping = target.matches("input, textarea");

  if (event.key === "Escape") {
    closeOpenPanels();
    return;
  }
  if (isTyping || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === "/") {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    toggleNotes();
  }
}

// ===================== Init =====================
loadNotes();
loadTheme();
applyCustomBg();
renderCustomShortcuts();
renderCustomFolders();
resetFolderGroupForm();
updateClock();
setInterval(updateClock, 1000);

const savedCity = getWeatherCity();
if (savedCity) weatherCityInput.value = savedCity.name || "";
loadWeather();

syncActiveStates();

searchForm.addEventListener("submit", handleSearch);
searchInput.addEventListener("input", renderSearchSuggestions);
searchInput.addEventListener("focus", renderSearchSuggestions);
searchInput.addEventListener("keydown", handleSearchKeys);

shortcutForm.addEventListener("submit", handleShortcutSubmit);
folderGroupForm.addEventListener("submit", handleFolderGroupSubmit);
folderGroupAddLink.addEventListener("click", () => addFolderGroupLinkRow());

bgFileInput.addEventListener("change", handleBgFileChange);
bgResetBtn.addEventListener("click", resetCustomBg);

weatherUseLocationBtn.addEventListener("click", handleUseMyLocation);
weatherCityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleWeatherCitySubmit();
  }
});
weatherCityInput.addEventListener("blur", () => {
  if (weatherCityInput.value.trim()) handleWeatherCitySubmit();
});

noteTabAddBtn.addEventListener("click", addNewNote);
noteRenameBtn.addEventListener("click", renameActiveNote);
noteDeleteBtn.addEventListener("click", deleteActiveNote);

settingsToggleButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleSettings();
});
closeSettingsButton.addEventListener("click", (event) => {
  event.stopPropagation();
  closeSettings();
});
settingsPanel.addEventListener("click", (event) => event.stopPropagation());

noteModeButtons.forEach((button) => {
  button.addEventListener("click", () => setNoteMode(button.dataset.noteMode));
});
noteToggleButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleNotes();
  });
});

closeNotesButton.addEventListener("click", closeNotes);

startButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleStartMenu();
});

startMenu.addEventListener("click", (event) => event.stopPropagation());

document.addEventListener("keydown", handleShortcuts);

// Delegated click handling covers both static (Google/Proton) and dynamically
// created (custom) folder toggles/panels/close buttons in one place.
document.addEventListener("click", (event) => {
  const folderToggle = event.target.closest("[data-folder-toggle]");
  if (folderToggle) {
    event.stopPropagation();
    toggleFolder(folderToggle.dataset.folder);
    return;
  }

  const folderClose = event.target.closest("[data-folder-close]");
  if (folderClose) {
    event.stopPropagation();
    closeFolders();
    syncActiveStates();
    return;
  }

  if (event.target.closest("[data-folder-panel]")) {
    event.stopPropagation();
    return;
  }

  startMenu.classList.remove("open");
  closeFolders();
  settingsPanel.classList.add("hidden");
  if (!searchForm.contains(event.target)) {
    hideSearchSuggestions();
  }
  syncActiveStates();
});
