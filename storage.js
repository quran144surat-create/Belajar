/* ==========================================================================
   BELAJAR — storage.js
   Wrapper kecil di atas localStorage. Tahap 1 baru menyimpan: preferensi
   tema, link Apps Script, dan profil (nama + jejak waktu login) untuk
   sapaan. Tahap berikutnya (5) akan menambah antrian offline & cache data
   di atas fondasi yang sama ini.
   ========================================================================== */

const BelajarStorage = (() => {
  const KEYS = {
    theme: "belajar:theme",
    scriptUrl: "belajar:scriptUrl",
    profile: "belajar:profile", // { name, firstLoginAt, lastLoginAt }
  };

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn("Storage tidak tersedia:", err);
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.warn("Gagal menyimpan ke storage:", err);
      return false;
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn("Gagal menghapus dari storage:", err);
    }
  }

  return {
    getTheme() {
      return safeGet(KEYS.theme);
    },
    setTheme(theme) {
      safeSet(KEYS.theme, theme);
    },

    getScriptUrl() {
      return safeGet(KEYS.scriptUrl);
    },
    setScriptUrl(url) {
      safeSet(KEYS.scriptUrl, url);
    },
    clearScriptUrl() {
      safeRemove(KEYS.scriptUrl);
    },

    getProfile() {
      const raw = safeGet(KEYS.profile);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    setProfile(profile) {
      safeSet(KEYS.profile, JSON.stringify(profile));
    },
    clearProfile() {
      safeRemove(KEYS.profile);
    },

    clearAll() {
      safeRemove(KEYS.scriptUrl);
      safeRemove(KEYS.profile);
      // Tema sengaja tidak dihapus saat logout — preferensi tampilan tetap.
    },
  };
})();
