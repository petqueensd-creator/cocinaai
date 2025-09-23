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
    formData.append("upload_preset", "demo");

const formData = new FormData();
formData.append("file", file);
formData.append("upload_preset", "demoparatodo"); // ← este es el nombre exacto del preset

fetch("https://api.cloudinary.com/v1_1/dr985hdwg/image/upload", {
  method: "POST",
  body: formData
})
.then(res => res.json())
.then(data => {
  const imageUrl = data.secure_url;
  console.log("Imagen subida:", imageUrl);
  // continuar con análisis...
})
.catch(err => {
  console.error("Error al subir a Cloudinary:", err);
});


  function analizarImagen(imageUrl) {
    console.log("Enviando imagen a análisis:", imageUrl);

    fetch("https://script.google.com/macros/s/AKfycbzT1o_NLEYaUzdFb3EsKz6CYCoZWnC2m7X0xNzmb9z1GoPwZl-0Dc1e_Yd29cuZLRqxYg/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageUrl })
    })
      .then(res => res.json())
      .then(data => {
        resultadoDiv.classList.remove("hidden");
        resultadoDiv.innerHTML = `
          <div class="text-center">
            <h2 class="text-xl font-bold mb-2">🍽️ Plato detectado: ${data.plato}</h2>
            <p class="text-gray-700">🧂 Ingredientes: ${data.ingredientes.join(", ")}</p>
          </div>
        `;
      })
      .catch(err => {
        console.error("Error al analizar la imagen:", err);
        resultadoDiv.innerHTML = "<div class='text-red-600'>❌ Error al analizar la imagen.</div>";
        resultadoDiv.classList.remove("hidden");
      });
  }
});


