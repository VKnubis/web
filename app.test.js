const {
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
} = require("./app");

function createMockStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: jest.fn((key) => (key in store ? store[key] : null)),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    _store: store,
  };
}

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------
describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("escapes all special characters in one string", () => {
    expect(escapeHtml(`<a href="x" title='y'>&`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#039;y&#039;&gt;&amp;"
    );
  });

  it("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns safe strings unchanged", () => {
    expect(escapeHtml("hello world 123")).toBe("hello world 123");
  });
});

// ---------------------------------------------------------------------------
// looksLikeUrl
// ---------------------------------------------------------------------------
describe("looksLikeUrl", () => {
  it("detects http URLs", () => {
    expect(looksLikeUrl("http://example.com")).toBe(true);
  });

  it("detects https URLs", () => {
    expect(looksLikeUrl("https://example.com")).toBe(true);
  });

  it("detects bare domains", () => {
    expect(looksLikeUrl("example.com")).toBe(true);
  });

  it("detects domains with paths", () => {
    expect(looksLikeUrl("example.com/path")).toBe(true);
  });

  it("detects domains with query strings", () => {
    expect(looksLikeUrl("example.com?q=1")).toBe(true);
  });

  it("detects domains with hash", () => {
    expect(looksLikeUrl("example.com#section")).toBe(true);
  });

  it("detects subdomains", () => {
    expect(looksLikeUrl("sub.domain.co.uk")).toBe(true);
  });

  it("rejects plain words", () => {
    expect(looksLikeUrl("hello")).toBe(false);
  });

  it("rejects search queries", () => {
    expect(looksLikeUrl("how to make a website")).toBe(false);
  });

  it("is case insensitive for protocol", () => {
    expect(looksLikeUrl("HTTP://Example.COM")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// normalizeUrl
// ---------------------------------------------------------------------------
describe("normalizeUrl", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeUrl("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeUrl("   ")).toBe("");
  });

  it("leaves http URLs unchanged", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("leaves https URLs unchanged", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("prepends https to bare domains", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });

  it("trims whitespace", () => {
    expect(normalizeUrl("  example.com  ")).toBe("https://example.com");
  });
});

// ---------------------------------------------------------------------------
// getShortcutIconText
// ---------------------------------------------------------------------------
describe("getShortcutIconText", () => {
  it("uses iconText if provided", () => {
    expect(getShortcutIconText({ iconText: "ab", name: "Alpha" })).toBe("AB");
  });

  it("truncates to 2 characters", () => {
    expect(getShortcutIconText({ iconText: "abcdef", name: "Alpha" })).toBe("AB");
  });

  it("falls back to name when iconText is empty", () => {
    expect(getShortcutIconText({ iconText: "", name: "Beta" })).toBe("BE");
  });

  it("falls back to name when iconText is missing", () => {
    expect(getShortcutIconText({ name: "Gamma" })).toBe("GA");
  });

  it("returns ? when both are missing", () => {
    expect(getShortcutIconText({})).toBe("?");
  });

  it("uppercases the result", () => {
    expect(getShortcutIconText({ iconText: "xy" })).toBe("XY");
  });

  it("trims whitespace from iconText", () => {
    expect(getShortcutIconText({ iconText: "  z  " })).toBe("Z");
  });
});

// ---------------------------------------------------------------------------
// getSearchHistory / saveSearchHistory
// ---------------------------------------------------------------------------
describe("getSearchHistory", () => {
  it("returns empty array when storage is empty", () => {
    const storage = createMockStorage();
    expect(getSearchHistory(storage)).toEqual([]);
  });

  it("returns parsed history from storage", () => {
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: JSON.stringify(["one", "two"]),
    });
    expect(getSearchHistory(storage)).toEqual(["one", "two"]);
  });

  it("filters out non-string entries", () => {
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: JSON.stringify(["ok", 42, null, "also ok"]),
    });
    expect(getSearchHistory(storage)).toEqual(["ok", "also ok"]);
  });

  it("returns empty array on invalid JSON", () => {
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: "not json",
    });
    expect(getSearchHistory(storage)).toEqual([]);
  });

  it("returns empty array if stored value is not an array", () => {
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: JSON.stringify({ key: "value" }),
    });
    expect(getSearchHistory(storage)).toEqual([]);
  });
});

describe("saveSearchHistory", () => {
  it("saves a query to storage", () => {
    const storage = createMockStorage();
    saveSearchHistory(storage, "test query");
    const saved = JSON.parse(storage._store[SEARCH_HISTORY_KEY]);
    expect(saved).toEqual(["test query"]);
  });

  it("does not save empty queries", () => {
    const storage = createMockStorage();
    saveSearchHistory(storage, "");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("does not save whitespace-only queries", () => {
    const storage = createMockStorage();
    saveSearchHistory(storage, "   ");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("moves duplicate to front (case-insensitive)", () => {
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: JSON.stringify(["alpha", "beta", "gamma"]),
    });
    saveSearchHistory(storage, "Beta");
    const saved = JSON.parse(storage._store[SEARCH_HISTORY_KEY]);
    expect(saved[0]).toBe("Beta");
    expect(saved).not.toContain("beta");
  });

  it("limits history to SEARCH_HISTORY_LIMIT entries", () => {
    const initial = Array.from({ length: SEARCH_HISTORY_LIMIT }, (_, i) => `item${i}`);
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: JSON.stringify(initial),
    });
    saveSearchHistory(storage, "new item");
    const saved = JSON.parse(storage._store[SEARCH_HISTORY_KEY]);
    expect(saved.length).toBe(SEARCH_HISTORY_LIMIT);
    expect(saved[0]).toBe("new item");
  });
});

// ---------------------------------------------------------------------------
// getCustomShortcuts / saveCustomShortcuts
// ---------------------------------------------------------------------------
describe("getCustomShortcuts", () => {
  it("returns empty array when storage is empty", () => {
    const storage = createMockStorage();
    expect(getCustomShortcuts(storage)).toEqual([]);
  });

  it("returns valid shortcuts from storage", () => {
    const shortcuts = [{ name: "Test", url: "https://test.com" }];
    const storage = createMockStorage({
      [CUSTOM_SHORTCUTS_KEY]: JSON.stringify(shortcuts),
    });
    expect(getCustomShortcuts(storage)).toEqual(shortcuts);
  });

  it("filters out entries without name or url", () => {
    const shortcuts = [
      { name: "Good", url: "https://good.com" },
      { name: "", url: "https://noname.com" },
      { name: "No URL" },
      null,
    ];
    const storage = createMockStorage({
      [CUSTOM_SHORTCUTS_KEY]: JSON.stringify(shortcuts),
    });
    expect(getCustomShortcuts(storage)).toEqual([{ name: "Good", url: "https://good.com" }]);
  });

  it("returns empty array on invalid JSON", () => {
    const storage = createMockStorage({
      [CUSTOM_SHORTCUTS_KEY]: "broken{",
    });
    expect(getCustomShortcuts(storage)).toEqual([]);
  });
});

describe("saveCustomShortcuts", () => {
  it("serializes and saves shortcuts", () => {
    const storage = createMockStorage();
    const shortcuts = [{ name: "A", url: "https://a.com" }];
    saveCustomShortcuts(storage, shortcuts);
    expect(storage.setItem).toHaveBeenCalledWith(
      CUSTOM_SHORTCUTS_KEY,
      JSON.stringify(shortcuts)
    );
  });
});

// ---------------------------------------------------------------------------
// buildSearchTarget
// ---------------------------------------------------------------------------
describe("buildSearchTarget", () => {
  it("builds Google search URL by default", () => {
    expect(buildSearchTarget("cats")).toBe(
      "https://www.google.com/search?q=cats"
    );
  });

  it("encodes query parameters", () => {
    expect(buildSearchTarget("hello world")).toBe(
      "https://www.google.com/search?q=hello%20world"
    );
  });

  it("navigates directly for http URLs", () => {
    expect(buildSearchTarget("http://example.com")).toBe("http://example.com");
  });

  it("navigates directly for https URLs", () => {
    expect(buildSearchTarget("https://example.com")).toBe("https://example.com");
  });

  it("prepends https for bare domains", () => {
    expect(buildSearchTarget("example.com")).toBe("https://example.com");
  });

  it("builds YouTube search URL", () => {
    expect(buildSearchTarget("cats", "youtube")).toBe(
      "https://www.youtube.com/results?search_query=cats"
    );
  });

  it("builds GitHub search URL", () => {
    expect(buildSearchTarget("react", "github")).toBe(
      "https://github.com/search?q=react"
    );
  });

  it("trims whitespace from query", () => {
    expect(buildSearchTarget("  cats  ")).toBe(
      "https://www.google.com/search?q=cats"
    );
  });
});

// ---------------------------------------------------------------------------
// makeSuggestion
// ---------------------------------------------------------------------------
describe("makeSuggestion", () => {
  it("creates suggestion objects", () => {
    const result = makeSuggestion("search", "Title", "Detail", "val", "target");
    expect(result).toEqual({
      kind: "search",
      title: "Title",
      detail: "Detail",
      value: "val",
      target: "target",
    });
  });
});

// ---------------------------------------------------------------------------
// getSearchSuggestions
// ---------------------------------------------------------------------------
describe("getSearchSuggestions", () => {
  it("returns recent history when query is empty", () => {
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: JSON.stringify(["a", "b", "c", "d", "e", "f"]),
    });
    const suggestions = getSearchSuggestions("", storage);
    expect(suggestions.length).toBe(5);
    suggestions.forEach((s) => expect(s.kind).toBe("history"));
  });

  it("returns empty array when query is empty and no history", () => {
    const storage = createMockStorage();
    const suggestions = getSearchSuggestions("", storage);
    expect(suggestions).toEqual([]);
  });

  it("returns primary + youtube + github suggestions for a query", () => {
    const storage = createMockStorage();
    const suggestions = getSearchSuggestions("test", storage);
    expect(suggestions.length).toBe(3);
    expect(suggestions[0].kind).toBe("search");
    expect(suggestions[1].kind).toBe("youtube");
    expect(suggestions[2].kind).toBe("github");
  });

  it("includes matching history items", () => {
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: JSON.stringify(["testing 123", "other"]),
    });
    const suggestions = getSearchSuggestions("test", storage);
    const historyItems = suggestions.filter((s) => s.kind === "history");
    expect(historyItems.length).toBe(1);
    expect(historyItems[0].title).toBe("testing 123");
  });

  it("excludes exact match from history suggestions", () => {
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: JSON.stringify(["test"]),
    });
    const suggestions = getSearchSuggestions("test", storage);
    const historyItems = suggestions.filter((s) => s.kind === "history");
    expect(historyItems.length).toBe(0);
  });

  it("caps total suggestions at 6", () => {
    const storage = createMockStorage({
      [SEARCH_HISTORY_KEY]: JSON.stringify([
        "test alpha", "test beta", "test gamma", "test delta",
        "test epsilon", "test zeta",
      ]),
    });
    const suggestions = getSearchSuggestions("test", storage);
    expect(suggestions.length).toBeLessThanOrEqual(6);
  });

  it('shows "Open" for URL-like queries', () => {
    const storage = createMockStorage();
    const suggestions = getSearchSuggestions("example.com", storage);
    expect(suggestions[0].title).toMatch(/^Open /);
  });

  it('shows "Search Google for" for non-URL queries', () => {
    const storage = createMockStorage();
    const suggestions = getSearchSuggestions("cats", storage);
    expect(suggestions[0].title).toMatch(/^Search Google for/);
  });
});

// ---------------------------------------------------------------------------
// parseNotesLine
// ---------------------------------------------------------------------------
describe("parseNotesLine", () => {
  it("parses blank lines", () => {
    expect(parseNotesLine("")).toEqual({ type: "blank" });
    expect(parseNotesLine("   ")).toEqual({ type: "blank" });
  });

  it("parses headings (h1)", () => {
    expect(parseNotesLine("# Title")).toEqual({ type: "heading", text: "Title" });
  });

  it("parses headings (h2)", () => {
    expect(parseNotesLine("## Subtitle")).toEqual({ type: "heading", text: "Subtitle" });
  });

  it("parses headings (h3)", () => {
    expect(parseNotesLine("### Section")).toEqual({ type: "heading", text: "Section" });
  });

  it("parses unchecked checkboxes", () => {
    expect(parseNotesLine("- [ ] todo item")).toEqual({
      type: "check",
      checked: false,
      text: "todo item",
    });
  });

  it("parses checked checkboxes", () => {
    expect(parseNotesLine("- [x] done item")).toEqual({
      type: "check",
      checked: true,
      text: "done item",
    });
  });

  it("parses checked checkboxes case-insensitively", () => {
    expect(parseNotesLine("- [X] Done")).toEqual({
      type: "check",
      checked: true,
      text: "Done",
    });
  });

  it("parses bullet points", () => {
    expect(parseNotesLine("- bullet text")).toEqual({
      type: "bullet",
      text: "bullet text",
    });
  });

  it("parses plain text as paragraphs", () => {
    expect(parseNotesLine("just some text")).toEqual({
      type: "paragraph",
      text: "just some text",
    });
  });
});

// ---------------------------------------------------------------------------
// renderNotesLine
// ---------------------------------------------------------------------------
describe("renderNotesLine", () => {
  it("renders blank as <br>", () => {
    expect(renderNotesLine({ type: "blank" })).toBe("<br>");
  });

  it("renders heading", () => {
    expect(renderNotesLine({ type: "heading", text: "Hello" })).toBe(
      '<div class="preview-heading">Hello</div>'
    );
  });

  it("renders unchecked checkbox", () => {
    const html = renderNotesLine({ type: "check", checked: false, text: "Task" });
    expect(html).toContain("checkbox");
    expect(html).not.toContain("checked");
    expect(html).toContain("Task");
  });

  it("renders checked checkbox", () => {
    const html = renderNotesLine({ type: "check", checked: true, text: "Done" });
    expect(html).toContain("checked");
    expect(html).toContain("Done");
  });

  it("renders bullet", () => {
    expect(renderNotesLine({ type: "bullet", text: "Item" })).toBe(
      "<ul><li>Item</li></ul>"
    );
  });

  it("renders paragraph", () => {
    expect(renderNotesLine({ type: "paragraph", text: "Text" })).toBe(
      "<p>Text</p>"
    );
  });

  it("escapes HTML in text", () => {
    const html = renderNotesLine({ type: "paragraph", text: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

// ---------------------------------------------------------------------------
// renderNotesHtml
// ---------------------------------------------------------------------------
describe("renderNotesHtml", () => {
  it("returns placeholder for empty input", () => {
    expect(renderNotesHtml("")).toBe("<p>No notes yet.</p>");
  });

  it("returns placeholder for whitespace-only input", () => {
    expect(renderNotesHtml("   ")).toBe("<p>No notes yet.</p>");
  });

  it("renders multi-line notes", () => {
    const input = "# Title\n- item 1\n- [x] done\nplain text";
    const html = renderNotesHtml(input);
    expect(html).toContain("preview-heading");
    expect(html).toContain("<ul><li>item 1</li></ul>");
    expect(html).toContain("checked");
    expect(html).toContain("<p>plain text</p>");
  });

  it("handles \\r\\n line endings", () => {
    const input = "line1\r\nline2";
    const html = renderNotesHtml(input);
    expect(html).toContain("<p>line1</p>");
    expect(html).toContain("<p>line2</p>");
  });
});

// ---------------------------------------------------------------------------
// getNextTheme / getThemeLabel
// ---------------------------------------------------------------------------
describe("getNextTheme", () => {
  it("cycles from default to oled-friendly", () => {
    expect(getNextTheme("default")).toBe("oled-friendly");
  });

  it("cycles from oled-friendly to blue-night", () => {
    expect(getNextTheme("oled-friendly")).toBe("blue-night");
  });

  it("cycles from blue-night back to default", () => {
    expect(getNextTheme("blue-night")).toBe("default");
  });

  it("defaults to default for unknown themes", () => {
    expect(getNextTheme("nonexistent")).toBe("default");
  });
});

describe("getThemeLabel", () => {
  it("returns label for default theme", () => {
    expect(getThemeLabel("default")).toBe("Theme: Default");
  });

  it("returns label for oled theme", () => {
    expect(getThemeLabel("oled-friendly")).toBe("Theme: OLED");
  });

  it("returns label for blue-night theme", () => {
    expect(getThemeLabel("blue-night")).toBe("Theme: Night");
  });

  it("falls back to default label for unknown themes", () => {
    expect(getThemeLabel("unknown")).toBe("Theme: Default");
  });
});

// ---------------------------------------------------------------------------
// readIconFile
// ---------------------------------------------------------------------------
describe("readIconFile", () => {
  it("resolves empty string for null/undefined file", async () => {
    await expect(readIconFile(null)).resolves.toBe("");
    await expect(readIconFile(undefined)).resolves.toBe("");
  });

  it("rejects files over the size limit", async () => {
    const bigFile = { size: CUSTOM_ICON_MAX_BYTES + 1 };
    await expect(readIconFile(bigFile)).rejects.toThrow("too large");
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe("constants", () => {
  it("has correct history limit", () => {
    expect(SEARCH_HISTORY_LIMIT).toBe(12);
  });

  it("has correct icon max bytes", () => {
    expect(CUSTOM_ICON_MAX_BYTES).toBe(512 * 1024);
  });

  it("has three themes", () => {
    expect(THEMES).toEqual(["default", "oled-friendly", "blue-night"]);
  });

  it("has labels for all themes", () => {
    THEMES.forEach((t) => {
      expect(THEME_LABELS[t]).toBeDefined();
    });
  });
});
