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
    console.log("Enviando imagen a análisis:", imageUrl);

    // Simulación temporal para evitar CORS en GitHub Pages
    const data = {
      plato: "Spaghetti Carbonara",
      ingredientes: ["pasta", "huevo", "queso", "panceta"],
      imagen: imageUrl
    };

    resultadoDiv.classList.remove("hidden");
    resultadoDiv.innerHTML = `
      <div class="text-center">
        <h2 class="text-xl font-bold mb-2">🍽️ Plato detectado: ${data.plato}</h2>
        <p class="text-gray-700">🧂 Ingredientes: ${data.ingredientes.join(", ")}</p>
        <img src="${data.imagen}" class="mx-auto mt-4 rounded-lg shadow-md max-w-xs">
      </div>
    `;
  }
});
