const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const analyzeButton = document.getElementById('analyze-button');

let imageBase64 = null;

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        imageBase64 = reader.result.split(',')[1];
        imagePreview.src = reader.result;
        analyzeButton.disabled = false;
    };
    reader.readAsDataURL(file);
});

analyzeButton.addEventListener('click', () => {
    if (!imageBase64) return;
    // Llama a Android para enviar la imagen
    Android.analyzeImage(imageBase64);
});

// Función que recibe el resultado desde Android
function handleAnalysisResult(result) {
    console.log("Resultado recibido:", result);
    // Aquí renderizas la receta en tu HTML
}
