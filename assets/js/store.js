(function () {
  const DATA_URL = "data/plugins.json?v=20260428-4";

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

  function toHebrewLetters(n, isYear) {
    const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
    const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
    const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];

    if (isYear) n = n % 1000;

    const h = Math.floor(n / 100);
    const remainder = n % 100;
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;

    let result = hundreds[h];
    if (remainder === 15) result += "טו";
    else if (remainder === 16) result += "טז";
    else result += tens[t] + ones[o];

    if (result.length === 1) result += "׳";
    else result = result.slice(0, -1) + "״" + result.slice(-1);

    return result;
  }

  function formatHebrewDate(dateValue) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue || "");

    if (!match) {
      return dateValue || "";
    }

    const date = new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        12
      )
    );

    try {
      const parts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).formatToParts(date);

      const get = (type) => (parts.find((p) => p.type === type) || {}).value || "";
      const day = toHebrewLetters(parseInt(get("day"), 10), false);
      const month = get("month");
      const year = toHebrewLetters(parseInt(get("year"), 10), true);

      return `${day} ב${month} ${year}`;
    } catch (error) {
      return dateValue;
    }
  }

  function canDirectInstall(plugin) {
    return /\.otzplugin(?:[?#].*)?$/i.test(plugin.downloadUrl || "");
  }

  function buildDirectInstallUrl(plugin) {
    if (!canDirectInstall(plugin)) {
      return "";
    }

    return "otzaria://plugin/install?url=" + encodeURIComponent(plugin.downloadUrl);
  }

  function buildCard(plugin) {
    const tags = (plugin.tags || [])
      .slice(0, 4)
      .map(function (tag) {
        return '<span class="tag-pill">' + escapeHtml(tag) + "</span>";
      })
      .join("");
    const formattedUpdatedAt = formatHebrewDate(plugin.updatedAt);
    const directInstallUrl = buildDirectInstallUrl(plugin);
    const pluginUrl = buildPluginUrl(plugin.id);
    const actionLinks =
      '<div class="plugin-card__actions">' +
      '  <a class="plugin-card__action plugin-card__action--download" href="' +
      escapeHtml(plugin.downloadUrl) +
      '" target="_blank" rel="noreferrer">הורדה</a>' +
      (directInstallUrl
        ? '  <button class="plugin-card__action plugin-card__action--install" type="button" data-direct-install-url="' +
          escapeHtml(directInstallUrl) +
          '">התקנה ישירה</button>'
        : "") +
      "</div>";

    return (
      '<article class="plugin-card">' +
      '  <a class="plugin-card__visual-link" href="' + pluginUrl + '">' +
      '    <div class="plugin-card__visual">' +
      '    <img src="' + escapeHtml(plugin.image) + '" alt="' + escapeHtml(plugin.name) + '">' +
      "    </div>" +
      "  </a>" +
      '  <div class="plugin-card__body">' +
      '    <div class="plugin-card__topline">' +
      '      <span class="status-pill status-pill--' + escapeHtml(plugin.status) + '">' + formatStatus(plugin.status) + "</span>" +
      '      <span class="meta-pill">גרסה ' + escapeHtml(plugin.version) + "</span>" +
      "    </div>" +
      '    <a class="plugin-card__summary" href="' + pluginUrl + '">' +
      '      <h3 class="plugin-card__title">' + escapeHtml(plugin.name) + "</h3>" +
      '      <p class="plugin-card__description">' + escapeHtml(plugin.shortDescription) + "</p>" +
      "    </a>" +
      '    <div class="plugin-meta-list">' + tags + "</div>" +
      actionLinks +
      '    <div class="plugin-card__footer">' +
      '      <a class="plugin-card__link" href="' + pluginUrl + '">לפרטים מלאים</a>' +
      '      <span class="meta-pill">עודכן ב־' + escapeHtml(formattedUpdatedAt) + "</span>" +
      "    </div>" +
      "  </div>" +
      "</article>"
    );
  }

  function handleDirectInstallClick(event) {
    const button = event.target.closest("[data-direct-install-url]");

    if (!button) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    window.location.assign(button.getAttribute("data-direct-install-url"));
  }

  function renderStoreEmptyState() {
    emptyState.innerHTML =
      '<img class="empty-state__image" src="assets/images/empty-store.svg" alt="">' +
      "<h3>בקרוב יופיעו כאן תוספים נוספים</h3>" +
      "<p>אם יש לכם תוסף מוכן לאוצריא, אפשר לשלוח אותו לחנות ולהציג אותו כאן עם עמוד מסודר, תגיות, הוראות וקישורי התקנה.</p>" +
      '<a class="button button--solid" href="contribute.html">איך מפרסמים תוסף?</a>';
  }

  function renderFilterEmptyState() {
    emptyState.innerHTML =
      '<img class="empty-state__image" src="assets/images/empty-store.svg" alt="">' +
      "<h3>לא נמצאו תוספים לפי הסינון שבחרתם</h3>" +
      "<p>נסו לחפש בשם אחר, להסיר תגית, או לבחור סטטוס שונה כדי לראות תוצאות נוספות.</p>";
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
      renderStoreEmptyState();
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
    if (filtered.length === 0) {
      renderFilterEmptyState();
    }
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
      renderStoreEmptyState();
      renderTags(allPlugins);
      applyFilters();
    } catch (error) {
      console.error(error);
      resultsMeta.textContent = "לא הצלחנו לטעון את התוספים";
      pluginsGrid.innerHTML = "";
      emptyState.classList.remove("hidden");
      emptyState.innerHTML =
        "<h3>שגיאה בטעינת הנתונים</h3><p>בדקו שקובץ <code>data/plugins.json</code> קיים, תקין ונגיש לדפדפן.</p>";
    }
  }

  searchInput.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  document.addEventListener("click", handleDirectInstallClick);

  loadPlugins();
})();
