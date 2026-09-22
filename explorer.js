/* ==========================================================================
   BELAJAR — explorer.js
   Menangani tampilan & interaksi tiga lapis struktur: Jurusan → Level →
   Folder Pelajaran. Bergantung pada BelajarData (data.js) untuk CRUD dan
   window.BelajarShowView / window.BelajarSetSync dari app.js untuk navigasi
   & indikator status.
   ========================================================================== */

const BelajarExplorer = (() => {
  const state = {
    currentJurusan: null, // {id, name, icon}
    currentLevel: null,   // {id, title}
    currentFolder: null,  // {id, name}
  };

  // Cache sementara di memori (hilang saat refresh halaman) supaya navigasi
  // bolak-balik antar folder terasa instan: data lama ditampilkan dulu,
  // lalu diperbarui diam-diam di belakang layar (stale-while-revalidate).
  const cache = {
    jurusan: BelajarStorage.getJurusanCache(), // langsung terisi kalau pernah tersimpan
    levelByJurusan: {},
    folderByLevel: {},
  };

  const el = {
    jurusanGrid: document.getElementById("jurusanGrid"),
    jurusanEmpty: document.getElementById("jurusanEmpty"),
    addJurusanBtn: document.getElementById("addJurusanBtn"),
    jurusanForm: document.getElementById("jurusanForm"),
    jurusanNameInput: document.getElementById("jurusanNameInput"),
    jurusanIconPicker: document.getElementById("jurusanIconPicker"),
    saveJurusanBtn: document.getElementById("saveJurusanBtn"),
    cancelJurusanBtn: document.getElementById("cancelJurusanBtn"),

    levelTitle: document.getElementById("levelTitle"),
    levelGrid: document.getElementById("levelGrid"),
    levelEmpty: document.getElementById("levelEmpty"),
    addLevelBtn: document.getElementById("addLevelBtn"),
    levelForm: document.getElementById("levelForm"),
    levelTitleInput: document.getElementById("levelTitleInput"),
    saveLevelBtn: document.getElementById("saveLevelBtn"),
    cancelLevelBtn: document.getElementById("cancelLevelBtn"),
    backToJurusanBtn: document.getElementById("backToJurusanBtn"),

    folderTitle: document.getElementById("folderTitle"),
    folderGrid: document.getElementById("folderGrid"),
    folderEmpty: document.getElementById("folderEmpty"),
    addFolderBtn: document.getElementById("addFolderBtn"),
    folderForm: document.getElementById("folderForm"),
    folderNameInput: document.getElementById("folderNameInput"),
    saveFolderBtn: document.getElementById("saveFolderBtn"),
    cancelFolderBtn: document.getElementById("cancelFolderBtn"),
    backToLevelBtn: document.getElementById("backToLevelBtn"),

    insideFolderTitle: document.getElementById("insideFolderTitle"),
    backToFolderBtn: document.getElementById("backToFolderBtn"),
  };

  let selectedIcon = "📘";

  /* ------------------------------- Util kartu ------------------------------- */

  function renderCards(container, emptyEl, items, opts) {
    // opts: { getLabel, getIcon, onOpen, onRename, onDelete }
    container.innerHTML = "";
    if (!items.length) {
      emptyEl.style.display = "block";
      container.appendChild(emptyEl);
      return;
    }
    emptyEl.style.display = "none";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "folder-card";

      const openBtn = document.createElement("button");
      openBtn.className = "folder-card__main";
      openBtn.innerHTML = `<span class="folder-card__icon">${opts.getIcon(item)}</span><span class="folder-card__label">${escapeHtml(opts.getLabel(item))}</span>`;
      openBtn.addEventListener("click", () => opts.onOpen(item));

      const menuBtn = document.createElement("button");
      menuBtn.className = "folder-card__menu";
      menuBtn.textContent = "⋯";
      menuBtn.setAttribute("aria-label", "Opsi");
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = window.prompt(
          `"${opts.getLabel(item)}"\n\nKetik "ubah" untuk ganti nama, atau "hapus" untuk menghapus.`
        );
        if (!action) return;
        const normalized = action.trim().toLowerCase();
        if (normalized === "ubah") opts.onRename(item);
        else if (normalized === "hapus") opts.onDelete(item);
      });

      card.appendChild(openBtn);
      card.appendChild(menuBtn);
      container.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* -------------------------------- Jurusan --------------------------------- */

  async function refreshJurusan() {
    // Tampilkan data cache dulu (kalau ada) supaya terasa instan.
    if (cache.jurusan) {
      renderJurusanList(cache.jurusan);
    } else {
      window.BelajarSetSync("sending");
      el.jurusanEmpty.textContent = "Memuat…";
    }
    try {
      const items = await BelajarData.listJurusan();
      cache.jurusan = items;
      BelajarStorage.setJurusanCache(items);
      window.BelajarSetSync("synced");
      renderJurusanList(items);
    } catch (err) {
      window.BelajarSetSync("error");
      if (!cache.jurusan) el.jurusanEmpty.textContent = "Gagal memuat jurusan. Coba tarik ulang halaman.";
    }
  }

  function renderJurusanList(items) {
    renderCards(el.jurusanGrid, el.jurusanEmpty, items, {
        getLabel: j => j.name,
        getIcon: j => j.icon || "📁",
        onOpen: openJurusan,
        onRename: async (j) => {
          const name = window.prompt("Nama baru untuk jurusan ini:", j.name);
          if (!name || !name.trim()) return;
          window.BelajarSetSync("sending");
          try {
            await BelajarData.renameJurusan(j.id, name.trim());
            window.BelajarSetSync("synced");
            refreshJurusan();
          } catch {
            window.BelajarSetSync("error");
          }
        },
        onDelete: async (j) => {
          if (!window.confirm(`Hapus jurusan "${j.name}"? Semua level & folder di dalamnya ikut terhapus.`)) return;
          window.BelajarSetSync("sending");
          try {
            await BelajarData.deleteJurusan(j.id);
            window.BelajarSetSync("synced");
            refreshJurusan();
          } catch {
            window.BelajarSetSync("error");
          }
        },
      });
  }

  function openJurusan(jurusan) {
    state.currentJurusan = jurusan;
    el.levelTitle.textContent = `${jurusan.icon || "📁"} ${jurusan.name}`;
    window.BelajarShowView("level");
    refreshLevel();
  }

  el.addJurusanBtn.addEventListener("click", () => {
    el.jurusanForm.style.display = "block";
    el.jurusanNameInput.value = "";
    el.jurusanNameInput.focus();
  });
  el.cancelJurusanBtn.addEventListener("click", () => {
    el.jurusanForm.style.display = "none";
  });
  el.jurusanIconPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".icon-opt");
    if (!btn) return;
    el.jurusanIconPicker.querySelectorAll(".icon-opt").forEach(b => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    selectedIcon = btn.dataset.icon;
  });
  el.saveJurusanBtn.addEventListener("click", async () => {
    const name = el.jurusanNameInput.value.trim();
    if (!name) return;
    window.BelajarSetSync("sending");
    try {
      await BelajarData.addJurusan(name, selectedIcon);
      window.BelajarSetSync("synced");
      el.jurusanForm.style.display = "none";
      refreshJurusan();
    } catch {
      window.BelajarSetSync("error");
    }
  });

  /* ---------------------------------- Level ---------------------------------- */

  async function refreshLevel() {
    if (!state.currentJurusan) return;
    const jId = state.currentJurusan.id;
    if (cache.levelByJurusan[jId]) {
      renderLevelList(cache.levelByJurusan[jId]);
    } else {
      window.BelajarSetSync("sending");
      el.levelEmpty.textContent = "Memuat…";
    }
    try {
      const items = await BelajarData.listLevel(jId);
      cache.levelByJurusan[jId] = items;
      window.BelajarSetSync("synced");
      renderLevelList(items);
    } catch {
      window.BelajarSetSync("error");
      if (!cache.levelByJurusan[jId]) el.levelEmpty.textContent = "Gagal memuat level. Coba tarik ulang halaman.";
    }
  }

  function renderLevelList(items) {
    renderCards(el.levelGrid, el.levelEmpty, items, {
        getLabel: l => l.title,
        getIcon: () => "🗂️",
        onOpen: openLevel,
        onRename: async (l) => {
          const title = window.prompt("Judul baru untuk level ini:", l.title);
          if (!title || !title.trim()) return;
          window.BelajarSetSync("sending");
          try {
            await BelajarData.renameLevel(l.id, title.trim());
            window.BelajarSetSync("synced");
            refreshLevel();
          } catch {
            window.BelajarSetSync("error");
          }
        },
        onDelete: async (l) => {
          if (!window.confirm(`Hapus level "${l.title}"? Semua folder di dalamnya ikut terhapus.`)) return;
          window.BelajarSetSync("sending");
          try {
            await BelajarData.deleteLevel(l.id);
            window.BelajarSetSync("synced");
            refreshLevel();
          } catch {
            window.BelajarSetSync("error");
          }
        },
      });
  }

  function openLevel(level) {
    state.currentLevel = level;
    el.folderTitle.textContent = level.title;
    window.BelajarShowView("folder");
    refreshFolder();
  }

  el.backToJurusanBtn.addEventListener("click", () => {
    state.currentJurusan = null;
    window.BelajarShowView("dashboard");
  });

  el.addLevelBtn.addEventListener("click", () => {
    el.levelForm.style.display = "block";
    el.levelTitleInput.value = "";
    el.levelTitleInput.focus();
  });
  el.cancelLevelBtn.addEventListener("click", () => {
    el.levelForm.style.display = "none";
  });
  el.saveLevelBtn.addEventListener("click", async () => {
    const title = el.levelTitleInput.value.trim();
    if (!title || !state.currentJurusan) return;
    window.BelajarSetSync("sending");
    try {
      await BelajarData.addLevel(state.currentJurusan.id, title);
      window.BelajarSetSync("synced");
      el.levelForm.style.display = "none";
      refreshLevel();
    } catch {
      window.BelajarSetSync("error");
    }
  });

  /* ---------------------------------- Folder --------------------------------- */

  async function refreshFolder() {
    if (!state.currentLevel) return;
    const lId = state.currentLevel.id;
    if (cache.folderByLevel[lId]) {
      renderFolderList(cache.folderByLevel[lId]);
    } else {
      window.BelajarSetSync("sending");
      el.folderEmpty.textContent = "Memuat…";
    }
    try {
      const items = await BelajarData.listFolder(lId);
      cache.folderByLevel[lId] = items;
      window.BelajarSetSync("synced");
      renderFolderList(items);
    } catch {
      window.BelajarSetSync("error");
      if (!cache.folderByLevel[lId]) el.folderEmpty.textContent = "Gagal memuat folder. Coba tarik ulang halaman.";
    }
  }

  function renderFolderList(items) {
    renderCards(el.folderGrid, el.folderEmpty, items, {
        getLabel: f => f.name,
        getIcon: () => "📄",
        onOpen: openFolder,
        onRename: async (f) => {
          const name = window.prompt("Nama baru untuk folder pelajaran ini:", f.name);
          if (!name || !name.trim()) return;
          window.BelajarSetSync("sending");
          try {
            await BelajarData.renameFolder(f.id, name.trim());
            window.BelajarSetSync("synced");
            refreshFolder();
          } catch {
            window.BelajarSetSync("error");
          }
        },
        onDelete: async (f) => {
          if (!window.confirm(`Hapus folder "${f.name}"?`)) return;
          window.BelajarSetSync("sending");
          try {
            await BelajarData.deleteFolder(f.id);
            window.BelajarSetSync("synced");
            refreshFolder();
          } catch {
            window.BelajarSetSync("error");
          }
        },
      });
  }

  function openFolder(folder) {
    state.currentFolder = folder;
    el.insideFolderTitle.textContent = folder.name;
    window.BelajarShowView("inside-folder");
  }

  el.backToLevelBtn.addEventListener("click", () => {
    state.currentLevel = null;
    window.BelajarShowView("level");
  });
  el.backToFolderBtn.addEventListener("click", () => {
    window.BelajarShowView("folder");
  });

  el.addFolderBtn.addEventListener("click", () => {
    el.folderForm.style.display = "block";
    el.folderNameInput.value = "";
    el.folderNameInput.focus();
  });
  el.cancelFolderBtn.addEventListener("click", () => {
    el.folderForm.style.display = "none";
  });
  el.saveFolderBtn.addEventListener("click", async () => {
    const name = el.folderNameInput.value.trim();
    if (!name || !state.currentLevel) return;
    window.BelajarSetSync("sending");
    try {
      await BelajarData.addFolder(state.currentLevel.id, name);
      window.BelajarSetSync("synced");
      el.folderForm.style.display = "none";
      refreshFolder();
    } catch {
      window.BelajarSetSync("error");
    }
  });

  return { refreshJurusan };
})();
