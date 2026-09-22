/* ==========================================================================
   BELAJAR — data.js
   Lapisan akses data untuk struktur Jurusan → Level → Folder Pelajaran.
   Memakai BelajarAuth.callGet/callPost yang sudah ada dari auth.js.
   ========================================================================== */

const BelajarData = (() => {
  function requireUrl() {
    const url = BelajarStorage.getScriptUrl();
    if (!url) throw new Error("Belum tersambung ke Sheet.");
    return url;
  }

  return {
    async listJurusan() {
      const data = await BelajarAuth.callGet(requireUrl(), "listJurusan");
      if (data.status !== "ok") throw new Error(data.message || "Gagal memuat jurusan.");
      return data.items || [];
    },
    async addJurusan(name, icon) {
      const data = await BelajarAuth.callPost(requireUrl(), "addJurusan", { name, icon });
      if (data.status !== "ok") throw new Error(data.message || "Gagal menambah jurusan.");
      return data.item;
    },
    async renameJurusan(id, name) {
      const data = await BelajarAuth.callPost(requireUrl(), "renameJurusan", { id, name });
      if (data.status !== "ok") throw new Error(data.message || "Gagal mengganti nama jurusan.");
    },
    async deleteJurusan(id) {
      const data = await BelajarAuth.callPost(requireUrl(), "deleteJurusan", { id });
      if (data.status !== "ok") throw new Error(data.message || "Gagal menghapus jurusan.");
    },

    async listLevel(jurusanId) {
      const data = await BelajarAuth.callGet(requireUrl(), "listLevel", { jurusanId });
      if (data.status !== "ok") throw new Error(data.message || "Gagal memuat level.");
      return data.items || [];
    },
    async addLevel(jurusanId, title) {
      const data = await BelajarAuth.callPost(requireUrl(), "addLevel", { jurusanId, title });
      if (data.status !== "ok") throw new Error(data.message || "Gagal menambah level.");
      return data.item;
    },
    async renameLevel(id, title) {
      const data = await BelajarAuth.callPost(requireUrl(), "renameLevel", { id, title });
      if (data.status !== "ok") throw new Error(data.message || "Gagal mengganti nama level.");
    },
    async deleteLevel(id) {
      const data = await BelajarAuth.callPost(requireUrl(), "deleteLevel", { id });
      if (data.status !== "ok") throw new Error(data.message || "Gagal menghapus level.");
    },

    async listFolder(levelId) {
      const data = await BelajarAuth.callGet(requireUrl(), "listFolder", { levelId });
      if (data.status !== "ok") throw new Error(data.message || "Gagal memuat folder.");
      return data.items || [];
    },
    async addFolder(levelId, name) {
      const data = await BelajarAuth.callPost(requireUrl(), "addFolder", { levelId, name });
      if (data.status !== "ok") throw new Error(data.message || "Gagal menambah folder.");
      return data.item;
    },
    async renameFolder(id, name) {
      const data = await BelajarAuth.callPost(requireUrl(), "renameFolder", { id, name });
      if (data.status !== "ok") throw new Error(data.message || "Gagal mengganti nama folder.");
    },
    async deleteFolder(id) {
      const data = await BelajarAuth.callPost(requireUrl(), "deleteFolder", { id });
      if (data.status !== "ok") throw new Error(data.message || "Gagal menghapus folder.");
    },
  };
})();
