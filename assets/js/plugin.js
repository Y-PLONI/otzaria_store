(function () {
  const DATA_URL = "data/plugins.json?v=20260428-4";
  const pluginDetails = document.getElementById("pluginDetails");

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

  function readPluginId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
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
      return new Intl.DateTimeFormat("he-u-ca-hebrew", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
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

  function renderNotFound() {
    document.title = "התוסף לא נמצא";
    pluginDetails.innerHTML =
      '<section class="not-found">' +
      "  <h1>התוסף לא נמצא</h1>" +
      "  <p>יכול להיות שהקישור שגוי, או שהפריט כבר לא קיים בקובץ הנתונים.</p>" +
      '  <div class="not-found__actions">' +
      '    <a class="button button--solid" href="index.html">חזרה לחנות</a>' +
      '    <a class="button button--ghost" href="contribute.html">מדריך לתורמים</a>' +
      "  </div>" +
      "</section>";
  }

  function buildInfoCard(label, value) {
    return (
      '<div class="info-card">' +
      "  <span>" + escapeHtml(label) + "</span>" +
      "  <strong>" + escapeHtml(value) + "</strong>" +
      "</div>"
    );
  }

  function renderPlugin(plugin) {
    const tags = (plugin.tags || [])
      .map(function (tag) {
        return '<span class="tag-pill">' + escapeHtml(tag) + "</span>";
      })
      .join("");
    const formattedUpdatedAt = formatHebrewDate(plugin.updatedAt);
    const directInstallUrl = buildDirectInstallUrl(plugin);
    const actionLinks =
      '<a class="button button--solid" href="' +
      escapeHtml(plugin.downloadUrl) +
      '" target="_blank" rel="noreferrer">הורדת התוסף</a>' +
      (directInstallUrl
        ? '<button class="button button--accent" type="button" data-direct-install-url="' +
          escapeHtml(directInstallUrl) +
          '">התקנה ישירה לאוצריא</button>'
        : "") +
      '<a class="button button--ghost" href="' +
      escapeHtml(plugin.homepage) +
      '" target="_blank" rel="noreferrer">עמוד הפרויקט</a>';

    const instructions =
      plugin.installInstructions && plugin.installInstructions.length
        ? '<div class="plugin-section"><h2>איך מתקינים?</h2><ol class="plugin-list">' +
          plugin.installInstructions
            .map(function (step) {
              return "<li>" + escapeHtml(step) + "</li>";
            })
            .join("") +
          "</ol></div>"
        : "";

    const screenshots =
      plugin.screenshots && plugin.screenshots.length
        ? '<div class="plugin-section"><h2>תצוגה מקדימה</h2><div class="screenshot-grid">' +
          plugin.screenshots
            .map(function (image) {
              return (
                '<div class="screenshot-frame"><img src="' +
                escapeHtml(image) +
                '" alt="צילום מסך של ' +
                escapeHtml(plugin.name) +
                '"></div>'
              );
            })
            .join("") +
          "</div></div>"
        : "";

    document.title = plugin.name + " | חנות התוספים";
    pluginDetails.innerHTML =
      '<article class="plugin-page">' +
      '  <a class="button button--ghost plugin-page__back" href="index.html">חזרה לחנות</a>' +
      '  <section class="plugin-page__hero">' +
      '    <div class="plugin-page__image">' +
      '      <img src="' + escapeHtml(plugin.image) + '" alt="' + escapeHtml(plugin.name) + '">' +
      "    </div>" +
      '    <div class="plugin-page__summary">' +
      '      <div class="plugin-card__topline">' +
      '        <span class="status-pill status-pill--' + escapeHtml(plugin.status) + '">' + formatStatus(plugin.status) + "</span>" +
      '        <span class="meta-pill">גרסה ' + escapeHtml(plugin.version) + "</span>" +
      "      </div>" +
      "      <h1>" + escapeHtml(plugin.name) + "</h1>" +
      "      <p>" + escapeHtml(plugin.description) + "</p>" +
      '      <div class="plugin-meta-list">' + tags + "</div>" +
      '      <div class="plugin-actions">' + actionLinks + "</div>" +
      "    </div>" +
      "  </section>" +
      '  <section class="plugin-page__sections">' +
      '    <div class="plugin-section">' +
      "      <h2>מידע מהיר</h2>" +
      '      <div class="plugin-info-grid">' +
      buildInfoCard("סטטוס", formatStatus(plugin.status)) +
      buildInfoCard("גרסה", plugin.version) +
      buildInfoCard("עודכן ב", formattedUpdatedAt) +
      buildInfoCard("תאימות", plugin.compatibleWith) +
      buildInfoCard("מפתח", plugin.author) +
      "      </div>" +
      "    </div>" +
      instructions +
      screenshots +
      "  </section>" +
      "</article>";
  }

  async function loadPlugin() {
    const pluginId = readPluginId();

    if (!pluginId) {
      renderNotFound();
      return;
    }

    try {
      const response = await fetch(DATA_URL);

      if (!response.ok) {
        throw new Error("Failed to load plugins.json");
      }

      const plugins = await response.json();
      const plugin = plugins.find(function (item) {
        return item.id === pluginId;
      });

      if (!plugin) {
        renderNotFound();
        return;
      }

      renderPlugin(plugin);
    } catch (error) {
      console.error(error);
      renderNotFound();
    }
  }

  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-direct-install-url]");

    if (!button) {
      return;
    }

    event.preventDefault();
    window.location.assign(button.getAttribute("data-direct-install-url"));
  });

  loadPlugin();
})();
