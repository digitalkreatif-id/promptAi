/* PromptAI – Scene Prompt Generator */
(() => {
  // ====== Configuration ======
  const API_KEY = "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";
  const API_URL = "https://api.openai.com/v1/chat/completions";
  const LOCAL_KEY = "promptAI-data";

  // ====== DOM Elements ======
  const form = document.getElementById("promptForm");
  const outputSection = document.getElementById("outputSection");
  const outputID = document.getElementById("outputID");
  const outputEN = document.getElementById("outputEN");
  const resetBtn = document.getElementById("resetBtn");
  const saveBtn = document.getElementById("saveBtn");
  const shareBtn = document.getElementById("shareBtn");

  // ====== Helpers ======
  const getValues = () => ({
    judul: document.getElementById("judul").value.trim(),
    kamera: document.getElementById("kamera").value,
    gaya: document.getElementById("gaya").value,
    karakter: document.getElementById("karakter").value.trim(),
    suaraKarakter: document.getElementById("suaraKarakter").value.trim(),
    aksi: document.getElementById("aksi").value.trim(),
    ekspresi: document.getElementById("ekspresi").value.trim(),
    latar: document.getElementById("latar").value.trim(),
    suasana: document.getElementById("suasana").value.trim(),
    suaraLingkungan: document.getElementById("suaraLingkungan").value.trim(),
    dialog: document.getElementById("dialog").value.trim(),
    visual: document.getElementById("visual").value.trim(),
    negative: document.getElementById("negative").value.trim()
  });

  const setValues = (data) => {
    if (!data) return;
    document.getElementById("judul").value = data.judul || "";
    document.getElementById("kamera").value = data.kamera || "static";
    document.getElementById("gaya").value = data.gaya || "cinematic";
    document.getElementById("karakter").value = data.karakter || "";
    document.getElementById("suaraKarakter").value = data.suaraKarakter || "";
    document.getElementById("aksi").value = data.aksi || "";
    document.getElementById("ekspresi").value = data.ekspresi || "";
    document.getElementById("latar").value = data.latar || "";
    document.getElementById("suasana").value = data.suasana || "";
    document.getElementById("suaraLingkungan").value = data.suaraLingkungan || "";
    document.getElementById("dialog").value = data.dialog || "";
    document.getElementById("visual").value = data.visual || "";
    document.getElementById("negative").value = data.negative || "";
  };

  const autoResize = (el) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const attachAutoResize = (textarea) => {
    textarea.addEventListener("input", () => autoResize(textarea));
    // initial
    autoResize(textarea);
  };

  const buildPrompt = (values) => {
    return `Buatkan deskripsi skenario video berdasarkan detail berikut dan berikan hasil dalam JSON dengan kunci \"id\" untuk Bahasa Indonesia dan \"en\" untuk English. Jangan sertakan teks lain selain JSON.\n\nJudul scene: ${values.judul}\nPergerakan kamera: ${values.kamera}\nGaya video: ${values.gaya}\nDeskripsi karakter: ${values.karakter}\nDetail suara karakter: ${values.suaraKarakter}\nAksi karakter: ${values.aksi}\nEkspresi karakter: ${values.ekspresi}\nLatar tempat & waktu: ${values.latar}\nSuasana keseluruhan: ${values.suasana}\nSuara lingkungan: ${values.suaraLingkungan}\nDialog karakter: ${values.dialog}\nDetail visual tambahan: ${values.visual}\nNegative prompt: ${values.negative}`;
  };

  const showLoadingState = (isLoading) => {
    const btn = form.querySelector("button[type=submit]");
    if (isLoading) {
      btn.disabled = true;
      btn.textContent = "⏳ Generating...";
    } else {
      btn.disabled = false;
      btn.textContent = "🎬 Generate Prompt";
    }
  };

  const alertError = (msg) => {
    alert(msg || "Terjadi kesalahan. Silakan coba lagi.");
  };

  // ====== Main Generate Function ======
  const generatePrompt = async (e) => {
    e.preventDefault();
    const values = getValues();
    if (!values.judul) {
      alertError("Judul scene wajib diisi!");
      return;
    }
    showLoadingState(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            { role: "system", content: "You are a creative video script assistant." },
            { role: "user", content: buildPrompt(values) }
          ]
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();

      let idText = "";
      let enText = "";
      try {
        const json = JSON.parse(text);
        idText = json.id || "";
        enText = json.en || "";
      } catch (err) {
        // fallback: try split
        const parts = text.split(/---|====|\n\n/);
        idText = parts[0] || text;
        enText = parts.slice(1).join("\n") || "(Failed to parse English)";
      }

      outputID.value = idText.trim();
      outputEN.value = enText.trim();
      autoResize(outputID);
      autoResize(outputEN);
      outputSection.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      alertError(err.message);
    } finally {
      showLoadingState(false);
    }
  };

  // ====== Reset Function ======
  const resetAll = () => {
    form.reset();
    outputID.value = "";
    outputEN.value = "";
    outputSection.classList.add("hidden");
    localStorage.removeItem(LOCAL_KEY);
  };

  // ====== Save to localStorage ======
  const saveData = () => {
    const data = {
      inputs: getValues(),
      outputs: {
        id: outputID.value,
        en: outputEN.value
      }
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    alert("Data berhasil disimpan ke localStorage ✅");
  };

  // ====== Load on start ======
  const loadSaved = () => {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setValues(data.inputs);
      if (data.outputs) {
        outputID.value = data.outputs.id || "";
        outputEN.value = data.outputs.en || "";
        if (data.outputs.id || data.outputs.en) {
          outputSection.classList.remove("hidden");
          autoResize(outputID);
          autoResize(outputEN);
        }
      }
    } catch (_) {
      // ignore
    }
  };

  // ====== Share Function ======
  const shareApp = () => {
    const shareData = {
      title: "PromptAI – Video Scene Generator",
      text: "Coba PromptAI untuk membuat prompt video!",
      url: "https://digitalkreatif-id.github.io/promptAi/"
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareData.text + " " + shareData.url
      )}`;
      const whatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        shareData.text + " " + shareData.url
      )}`;
      const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareData.url
      )}`;
      window.open(twitter, "_blank");
      // Additional share links available inside output
    }
  };

  // ====== Attach Events ======
  form.addEventListener("submit", generatePrompt);
  resetBtn.addEventListener("click", resetAll);
  saveBtn.addEventListener("click", saveData);
  shareBtn.addEventListener("click", shareApp);

  // Auto-resize outputs
  attachAutoResize(outputID);
  attachAutoResize(outputEN);

  // Load saved data on start
  document.addEventListener("DOMContentLoaded", loadSaved);
})(); 
