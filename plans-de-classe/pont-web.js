// Pont entre la page et un navigateur (version web pour les collègues, sans Claude) :
//   db        -> absent : la page enregistre alors tout dans le navigateur (localStorage)
//   downloads -> fenêtre « Enregistrer sous » quand le navigateur la propose, sinon téléchargement
//   sample    -> absent : les encadrés Claude sont retirés à la construction
(() => {
  const CLE_SAUV = "plans-de-classe-derniere-sauvegarde";
  const downloads = {
    save: async ({ filename, data }) => {
      const blob = data instanceof Blob ? data : new Blob([data], { type: /\.json$/i.test(filename) ? "application/json" : "application/octet-stream" });
      let fait = false;
      if (window.showSaveFilePicker) {
        try {
          const f = await showSaveFilePicker({ suggestedName: filename });
          const w = await f.createWritable(); await w.write(blob); await w.close(); fait = true;
        } catch (e) { if (e && e.name === "AbortError") throw { code: "declined", message: "Enregistrement annulé." }; }
      }
      if (!fait) {
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
        document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      }
      if (/\.json$/i.test(filename)) { try { localStorage.setItem(CLE_SAUV, String(Date.now())); } catch (e) {} document.getElementById("rappelSauvegarde")?.remove(); }
      return { status: "saved" };
    },
  };
  window.claude = { use: async nom => (nom === "downloads" ? downloads : null) };

  // les données restent sur l'ordinateur : on demande au navigateur de ne pas les effacer de lui-même
  navigator.storage?.persist?.().catch(() => {});
  if ("serviceWorker" in navigator && window.isSecureContext && location.protocol !== "file:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

  // rappel discret : exporter une sauvegarde au moins une fois par mois
  addEventListener("load", () => setTimeout(() => {
    let etat = null; try { etat = JSON.parse(localStorage.getItem("plans-de-classe-v2") || "null"); } catch (e) {}
    const vraies = (etat?.classes || []).filter(c => !c.exemple && (c.eleves || []).length);
    const derniere = Number(localStorage.getItem(CLE_SAUV) || 0);
    if (!vraies.length || Date.now() - derniere < 30 * 864e5) return;
    const b = document.createElement("div"); b.id = "rappelSauvegarde";
    b.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:50;background:#2f4a3c;color:#e8f1ea;padding:10px 14px;border-radius:10px;font:14px Lexend,system-ui,sans-serif;box-shadow:0 4px 16px #0003;display:flex;gap:12px;align-items:center;max-width:92vw";
    b.innerHTML = "<span>Vos plans sont enregistrés dans ce navigateur. Pensez à exporter une sauvegarde : menu « Sauvegarde », puis « Exporter mes données ».</span>";
    const x = document.createElement("button"); x.textContent = "Plus tard"; x.style.cssText = "border:0;border-radius:6px;padding:5px 12px;cursor:pointer;font:inherit;font-weight:600;background:#e8f1ea;color:#2f4a3c;white-space:nowrap";
    x.onclick = () => { try { localStorage.setItem(CLE_SAUV, String(Date.now() - 23 * 864e5)); } catch (e) {} b.remove(); };
    b.append(x); document.body.append(b);
  }, 1500));
})();
