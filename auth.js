/* ==========================================================================
   BELAJAR — auth.js
   "Login" di app ini bukan akun pengguna biasa, tapi menyambungkan app ke
   Google Apps Script (code.gs) milik pengguna sendiri, yang menjadi jembatan
   ke Google Sheet + Gemini API mereka.
   ========================================================================== */

const BelajarAuth = (() => {
  /**
   * Memanggil Apps Script lewat GET. Dipakai untuk aksi ringan (ping, ambil profil)
   * karena GET tidak memicu CORS preflight di Apps Script.
   */
  async function callGet(scriptUrl, action, params = {}) {
    const url = new URL(scriptUrl);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) throw new Error("Server merespons dengan status " + res.status);
    return res.json();
  }

  /**
   * Memanggil Apps Script lewat POST. Content-Type sengaja "text/plain" agar
   * browser tidak mengirim preflight OPTIONS (Apps Script tidak menanganinya),
   * lalu code.gs membaca & mem-parse JSON dari body secara manual.
   */
  async function callPost(scriptUrl, action, payload = {}) {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) throw new Error("Server merespons dengan status " + res.status);
    return res.json();
  }

  return {
    /** Menguji apakah link Apps Script valid & sheet siap dipakai. */
    async testConnection(scriptUrl) {
      const data = await callGet(scriptUrl, "ping");
      if (!data || data.status !== "ok") {
        throw new Error(data?.message || "Link tersambung tapi responsnya tidak dikenali.");
      }
      return data;
    },

    async fetchProfile(scriptUrl) {
      const data = await callGet(scriptUrl, "getProfile");
      if (data && data.status === "ok") return data.profile || null;
      return null;
    },

    async saveProfile(scriptUrl, profile) {
      const data = await callPost(scriptUrl, "saveProfile", { profile });
      if (!data || data.status !== "ok") {
        throw new Error(data?.message || "Gagal menyimpan profil ke Sheet.");
      }
      return data;
    },

    callGet,
    callPost,
  };
})();
