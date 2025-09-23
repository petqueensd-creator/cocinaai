document.addEventListener("DOMContentLoaded", function () {
  const uploadInput = document.getElementById("file-input");
  const previewImg = document.getElementById("image-preview");
  const analizarBtn = document.getElementById("analyze-button");
  const resultadoDiv = document.getElementById("results-container");

  analizarBtn.disabled = true;

  uploadInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Archivo seleccionado:", file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "demoparatodo");

    fetch("https://api.cloudinary.com/v1_1/dr985hdwg/image/upload", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        const imageUrl = data.secure_url;
        console.log("Imagen subida:", imageUrl);

        if (!imageUrl) {
          resultadoDiv.innerHTML = "<div class='text-red-600'>❌ No se pudo subir la imagen.</div>";
          resultadoDiv.classList.remove("hidden");
          return;
        }

        previewImg.src = imageUrl;
        previewImg.classList.remove("hidden");

        analizarBtn.disabled = false;
        analizarBtn.onclick = () => {
          analizarImagen(imageUrl);
        };
      })
      .catch(err => {
        console.error("Error al subir a Cloudinary:", err);
        resultadoDiv.innerHTML = "<div class='text-red-600'>❌ Error al subir la imagen.</div>";
        resultadoDiv.classList.remove("hidden");
      });
  });

  function analizarImagen(imageUrl) {
    console.log("Enviando imagen a Android para análisis:", imageUrl);

    if (window.AndroidBridge && window.AndroidBridge.analizar) {
      window.AndroidBridge.analizar(imageUrl);
    } else {
      console.warn("AndroidBridge no disponible. Simulando resultado...");
      mostrarResultado({
        plato: "Spaghetti Carbonara",
        ingredientes: ["rata"],
        imagen: imageUrl
      });
    }
  }

  window.mostrarResultado = function (data) {
    resultadoDiv.classList.remove("hidden");

    if (data.error) {
      resultadoDiv.innerHTML = `<div class="text-red-600">❌ ${data.error}</div>`;
      return;
    }

    resultadoDiv.innerHTML = `
      <div class="text-center">
        <h2 class="text-xl font-bold mb-2">🍽️ Plato detectado: ${data.plato}</h2>
        <p class="text-gray-700">🧂 Ingredientes: ${data.ingredientes.join(", ")}</p>
        <img src="${data.imagen}" class="mx-auto mt-4 rounded-lg shadow-md max-w-xs">
      </div>
    `;
  };
});

