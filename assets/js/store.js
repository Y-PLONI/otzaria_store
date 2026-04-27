(function () {
  const DATA_URL = "data/plugins.json";

  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const tagsBar = document.getElementById("tagsBar");
  const pluginsGrid = document.getElementById("pluginsGrid");
  const emptyState = document.getElementById("emptyState");
  const resultsMeta = document.getElementById("resultsMeta");
  const pluginCount = document.getElementById("pluginCount");

  let allPlugins = [];
  let activeTag = "all";

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    });
  }

  function formatStatus(status) {
    const labels = {
      stable: "יציב",
      beta: "בטא",
      experimental: "ניסיוני",
    };

    return labels[status] || "לא ידוע";
  }

  function buildPluginUrl(id) {
    return "plugin.html?id=" + encodeURIComponent(id);
  }

  function buildCard(plugin) {
    const tags = (plugin.tags || [])
      .slice(0, 3)
      .map(function (tag) {
        return '<span class="tag-pill">' + escapeHtml(tag) + "</span>";
      })
      .join("");

    return (
      '<article class="plugin-card">' +
      '  <div class="plugin-card__visual">' +
      '    <img src="' + escapeHtml(plugin.image) + '" alt="' + escapeHtml(plugin.name) + '">' +
      '    <a class="plugin-card__download" href="' + escapeHtml(plugin.downloadUrl) + '" target="_blank" rel="noreferrer">הורדה</a>' +
      "  </div>" +
      '  <a class="plugin-card__body" href="' + buildPluginUrl(plugin.id) + '">' +
      '    <div class="plugin-card__topline">' +
      '      <span class="status-pill status-pill--' + escapeHtml(plugin.status) + '">' + formatStatus(plugin.status) + "</span>" +
      '      <span class="meta-pill">גרסה ' + escapeHtml(plugin.version) + "</span>" +
      "    </div>" +
      '    <div>' +
      '      <h3 class="plugin-card__title">' + escapeHtml(plugin.name) + "</h3>" +
      '      <p class="plugin-card__description">' + escapeHtml(plugin.shortDescription) + "</p>" +
      "    </div>" +
      '    <div class="plugin-meta-list">' + tags + "</div>" +
      '    <div class="plugin-card__footer">' +
      '      <span class="plugin-card__link">לפרטים מלאים</span>' +
      '      <span class="meta-pill">עודכן ' + escapeHtml(plugin.updatedAt) + "</span>" +
      "    </div>" +
      "  </a>" +
      "</article>"
    );
  }

  function renderTags(plugins) {
    const tags = new Set();

    plugins.forEach(function (plugin) {
      (plugin.tags || []).forEach(function (tag) {
        tags.add(tag);
      });
    });

    const orderedTags = ["all"].concat(Array.from(tags).sort(function (a, b) {
      return a.localeCompare(b, "he");
    }));

    tagsBar.innerHTML = orderedTags
      .map(function (tag) {
        const isActive = tag === activeTag;
        const label = tag === "all" ? "כל התגיות" : tag;

        return (
          '<button class="tag-filter' + (isActive ? " is-active" : "") + '" type="button" data-tag="' + escapeHtml(tag) + '">' +
          escapeHtml(label) +
          "</button>"
        );
      })
      .join("");

    tagsBar.classList.toggle("hidden", orderedTags.length <= 1);

    Array.from(tagsBar.querySelectorAll(".tag-filter")).forEach(function (button) {
      button.addEventListener("click", function () {
        activeTag = button.getAttribute("data-tag") || "all";
        renderTags(allPlugins);
        applyFilters();
      });
    });
  }

  function applyFilters() {
    const query = (searchInput.value || "").trim().toLowerCase();
    const status = statusFilter.value;

    if (allPlugins.length === 0) {
      pluginsGrid.innerHTML = "";
      emptyState.classList.remove("hidden");
      resultsMeta.textContent = "עדיין אין תוספים בחנות";
      return;
    }

    const filtered = allPlugins.filter(function (plugin) {
      const searchableText = [
        plugin.name,
        plugin.shortDescription,
        plugin.description,
        (plugin.tags || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || searchableText.includes(query);
      const matchesStatus = status === "all" || plugin.status === status;
      const matchesTag =
        activeTag === "all" || (plugin.tags || []).includes(activeTag);

      return matchesQuery && matchesStatus && matchesTag;
    });

    pluginsGrid.innerHTML = filtered.map(buildCard).join("");
    emptyState.classList.toggle("hidden", filtered.length !== 0);
    resultsMeta.textContent =
      filtered.length === 0
        ? "לא נמצאו תוספים לפי הסינון שבחרתם"
        : filtered.length === allPlugins.length
        ? "כל התוספים מוצגים"
        : "מוצגים " + filtered.length + " מתוך " + allPlugins.length + " תוספים";
  }

  async function loadPlugins() {
    try {
      const response = await fetch(DATA_URL);

      if (!response.ok) {
        throw new Error("Failed to load plugins.json");
      }

      allPlugins = await response.json();
      pluginCount.textContent = allPlugins.length + " תוספים";
      renderTags(allPlugins);
      applyFilters();
    } catch (error) {
      console.error(error);
      resultsMeta.textContent = "לא הצלחנו לטעון את התוספים";
      pluginsGrid.innerHTML = "";
      emptyState.classList.remove("hidden");
      emptyState.innerHTML =
        "<h3>שגיאה בטעינת הנתונים</h3><p>בדקו שקובץ <code>data/plugins.json</code> קיים ותקין.</p>";
    }
  }

  searchInput.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);

  loadPlugins();
})();
