// Espera a que el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  const uploadInput = document.getElementById("upload");
  const previewImg = document.getElementById("imgPreview");
  const analizarBtn = document.getElementById("analizar");
  const resultadoDiv = document.getElementById("resultado");

  // Desactiva el botón de analizar al inicio
  analizarBtn.disabled = true;

  // Maneja la subida de imagen
  uploadInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "demo"); // Asegúrate de tener este preset en Cloudinary

    fetch("https://api.cloudinary.com/v1_1/dr985hdwg/image/upload", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        const imageUrl = data.secure_url;
        console.log("Imagen subida:", imageUrl);

        // Muestra la imagen en pantalla
        previewImg.src = imageUrl;
        previewImg.style.display = "block";

        // Activa el botón de analizar
        analizarBtn.disabled = false;

        // Asocia el análisis a la imagen subida
        analizarBtn.onclick = () => {
          analizarImagen(imageUrl);
        };
      })
      .catch(err => {
        console.error("Error al subir a Cloudinary:", err);
        resultadoDiv.innerText = "Error al subir la imagen.";
      });
  });

  // Simula el análisis de imagen
  function analizarImagen(imageUrl) {
    console.log("Enviando imagen a análisis:", imageUrl);

    // Aquí se conectará con Google Apps Script en el siguiente paso
    // Por ahora, simulamos la respuesta
    resultadoDiv.innerText = "🍝 Plato detectado: Spaghetti Carbonara\n🧂 Ingredientes: pasta, huevo, queso, panceta";
  }
});
