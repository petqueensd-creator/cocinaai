document.addEventListener("DOMContentLoaded", function () {
  const uploadInput = document.getElementById("upload");
  const previewImg = document.getElementById("imgPreview");
  const analizarBtn = document.getElementById("analizar");
  const resultadoDiv = document.getElementById("resultado");

  analizarBtn.disabled = true;

  uploadInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "demo");

    fetch("https://api.cloudinary.com/v1_1/dr985hdwg/image/upload", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        const imageUrl = data.secure_url;
        console.log("Imagen subida:", imageUrl);

        previewImg.src = imageUrl;
        previewImg.style.display = "block";

        analizarBtn.disabled = false;
        analizarBtn.onclick = () => {
          analizarImagen(imageUrl);
        };
      })
      .catch(err => {
        console.error("Error al subir a Cloudinary:", err);
        resultadoDiv.innerText = "❌ Error al subir la imagen.";
      });
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
        resultadoDiv.innerText =
          `🍽️ Plato detectado: ${data.plato}\n🧂 Ingredientes: ${data.ingredientes.join(", ")}`;
      })
      .catch(err => {
        console.error("Error al analizar la imagen:", err);
        resultadoDiv.innerText = "❌ Error al analizar la imagen.";
      });
  }
});
