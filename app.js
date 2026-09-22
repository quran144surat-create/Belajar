/* ==========================================================================
   BELAJAR — app.js
   Orkestrasi utama Tahap 1: tema terang/gelap, alur login/sambung, dan
   sapaan personal (waktu + jejak kunjungan). Tahap berikutnya akan menambah
   view baru (Jurusan/Level/Folder) tanpa mengubah fondasi ini.
   ========================================================================== */

(function () {
  const els = {
    themeToggle: document.getElementById("themeToggle"),
    syncBadge: document.getElementById("syncBadge"),
    syncLabel: document.getElementById("syncLabel"),

    viewLogin: document.getElementById("view-login"),
    viewDashboard: document.getElementById("view-dashboard"),

    scriptUrlInput: document.getElementById("scriptUrlInput"),
    connectBtn: document.getElementById("connectBtn"),
    loginStatus: document.getElementById("loginStatus"),
    toggleSetup: document.getElementById("toggleSetup"),
    setupPanel: document.getElementById("setupPanel"),
    codeGsContent: document.getElementById("codeGsContent"),
    copyCodeBtn: document.getElementById("copyCodeBtn"),

    greetingLabel: document.getElementById("greetingLabel"),
    greetingText: document.getElementById("greetingText"),
    editNameBtn: document.getElementById("editNameBtn"),
    nameEditRow: document.getElementById("nameEditRow"),
    nameInput: document.getElementById("nameInput"),
    saveNameBtn: document.getElementById("saveNameBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
  };

  /* ---------------------------- Tema terang/gelap --------------------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    BelajarStorage.setTheme(theme);
  }

  function initTheme() {
    const saved = BelajarStorage.getTheme();
    if (saved) {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  }

  els.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  /* --------------------------- Status sinkronisasi --------------------------- */
  function setSyncStatus(status) {
    // status: "sending" | "synced" | "error" | "offline"
    const labels = {
      sending: "Mengirim…",
      synced: "Tersinkron",
      error: "Gagal tersinkron",
      offline: "Koneksi hilang",
    };
    els.syncBadge.dataset.status = status;
    els.syncLabel.textContent = labels[status] || status;
  }

  window.addEventListener("online", () => setSyncStatus("synced"));
  window.addEventListener("offline", () => setSyncStatus("offline"));

  /* -------------------------------- Navigasi -------------------------------- */
  function showView(name) {
    els.viewLogin.classList.toggle("is-active", name === "login");
    els.viewDashboard.classList.toggle("is-active", name === "dashboard");
  }

  /* ------------------------------ Panel code.gs ------------------------------ */
  els.toggleSetup.addEventListener("click", () => {
    els.setupPanel.classList.toggle("is-open");
  });

  async function loadCodeGsPreview() {
    try {
      const res = await fetch("code.gs");
      if (!res.ok) throw new Error();
      const text = await res.text();
      els.codeGsContent.textContent = text;
    } catch {
      els.codeGsContent.textContent =
        "Tidak bisa memuat pratinjau otomatis. Buka file code.gs langsung dari repo GitHub ini, lalu salin isinya.";
    }
  }

  els.copyCodeBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(els.codeGsContent.textContent);
      els.copyCodeBtn.textContent = "Tersalin ✓";
      setTimeout(() => (els.copyCodeBtn.textContent = "Salin kode code.gs"), 1800);
    } catch {
      els.copyCodeBtn.textContent = "Gagal menyalin, salin manual ya";
      setTimeout(() => (els.copyCodeBtn.textContent = "Salin kode code.gs"), 2200);
    }
  });

  /* --------------------------------- Sapaan --------------------------------- */
  function timeGreeting() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return { label: "Selamat pagi", emoji: "🌤️" };
    if (hour >= 11 && hour < 15) return { label: "Selamat siang", emoji: "🌞" };
    if (hour >= 15 && hour < 18) return { label: "Selamat sore", emoji: "🌇" };
    return { label: "Selamat malam", emoji: "🌙" };
  }

  function experienceNote(profile) {
    const now = Date.now();
    if (!profile.firstLoginAt) return "Selamat datang pertama kali! Yuk mulai belajar 🎉";
    const daysSinceLast = profile.lastLoginAt
      ? Math.floor((now - profile.lastLoginAt) / 86400000)
      : 0;
    if (daysSinceLast >= 7) return "Lama tidak terlihat! Yuk lanjut lagi 💪";
    if (daysSinceLast >= 1) return "Senang kamu kembali belajar hari ini.";
    return "Semangat terus untuk sesi belajar kali ini.";
  }

  function renderGreeting(profile) {
    const { label, emoji } = timeGreeting();
    const name = profile?.name?.trim() || "Sahabat Belajar";
    els.greetingLabel.textContent = `${label} ${emoji}`;
    els.greetingText.textContent = `Halo, ${name}!`;
    // Catatan "pengalaman" ditumpangkan di label sebagai baris kedua via title,
    // tampilan penuh akan diperluas di Tahap 6 (dashboard) memakai data Sheet.
    els.greetingLabel.title = experienceNote(profile);
  }

  /* ------------------------------ Alur koneksi ------------------------------- */
  function setLoginStatus(msg, tone) {
    els.loginStatus.textContent = msg;
    els.loginStatus.dataset.tone = tone || "";
  }

  async function connect(scriptUrl) {
    setLoginStatus("Menghubungkan…", "");
    els.connectBtn.disabled = true;
    setSyncStatus("sending");
    try {
      await BelajarAuth.testConnection(scriptUrl);
      BelajarStorage.setScriptUrl(scriptUrl);

      let profile = BelajarStorage.getProfile();
      const now = Date.now();
      if (!profile) {
        // Coba ambil profil yang mungkin sudah tersimpan di Sheet ini sebelumnya.
        const remote = await BelajarAuth.fetchProfile(scriptUrl).catch(() => null);
        profile = remote || { name: "", firstLoginAt: now, lastLoginAt: now };
        if (!remote) {
          profile.firstLoginAt = now;
        }
      }
      profile.lastLoginAt = now;
      BelajarStorage.setProfile(profile);

      setSyncStatus("synced");
      setLoginStatus("Berhasil tersambung!", "success");
      renderGreeting(profile);
      showView("dashboard");

      if (!profile.name) {
        openNameEdit();
      }
    } catch (err) {
      setSyncStatus("error");
      setLoginStatus(
        "Gagal menyambungkan: " + (err.message || "periksa kembali link-nya."),
        "error"
      );
    } finally {
      els.connectBtn.disabled = false;
    }
  }

  els.connectBtn.addEventListener("click", () => {
    const url = els.scriptUrlInput.value.trim();
    if (!url) {
      setLoginStatus("Tempelkan link Web App terlebih dahulu.", "error");
      return;
    }
    connect(url);
  });

  /* -------------------------------- Edit nama -------------------------------- */
  function openNameEdit() {
    const profile = BelajarStorage.getProfile();
    els.nameInput.value = profile?.name || "";
    els.nameEditRow.style.display = "flex";
    els.nameInput.focus();
  }

  els.editNameBtn.addEventListener("click", openNameEdit);

  els.saveNameBtn.addEventListener("click", async () => {
    const name = els.nameInput.value.trim();
    if (!name) return;

    const profile = BelajarStorage.getProfile() || {};
    profile.name = name;
    BelajarStorage.setProfile(profile);
    renderGreeting(profile);
    els.nameEditRow.style.display = "none";

    const scriptUrl = BelajarStorage.getScriptUrl();
    if (scriptUrl) {
      setSyncStatus("sending");
      try {
        await BelajarAuth.saveProfile(scriptUrl, profile);
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error");
      }
    }
  });

  /* --------------------------------- Logout ---------------------------------- */
  els.logoutBtn.addEventListener("click", () => {
    BelajarStorage.clearScriptUrl();
    BelajarStorage.clearProfile();
    els.scriptUrlInput.value = "";
    setLoginStatus("", "");
    showView("login");
  });

  /* --------------------------------- Mulai ------------------------------------ */
  function init() {
    initTheme();
    loadCodeGsPreview();
    setSyncStatus(navigator.onLine ? "synced" : "offline");

    const savedUrl = BelajarStorage.getScriptUrl();
    const savedProfile = BelajarStorage.getProfile();
    if (savedUrl && savedProfile) {
      els.scriptUrlInput.value = savedUrl;
      renderGreeting(savedProfile);
      showView("dashboard");
    } else {
      showView("login");
    }
  }

  init();
})();
