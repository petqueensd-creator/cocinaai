// ---------------------------
// script.js seguro para WebView
// ---------------------------

// URL del Google Script que publicaste
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzzlPkz_Oa5IMx4WGbY31TXhzcNHXNGOv4BsrE99o_7Nv0qjWq-H1P3fKWEH9S0w5z5bw/exec";

// Referencias al DOM
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const analyzeButton = document.getElementById('analyze-button');
const resultsContainer = document.getElementById('results-container');
const loader = document.getElementById('loader');
const resultContent = document.getElementById('result-content');
const errorMessage = document.getElementById('error-message');

let imageBase64 = null;

// Inicialización
window.onload = function() {
    analyzeButton.disabled = true;
};

// Manejo de carga de imagen
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
        analyzeButton.disabled = false;
        imageBase64 = e.target.result.split(',')[1];
    };
    reader.readAsDataURL(file);
});

// Lógica principal de análisis
analyzeButton.addEventListener('click', async () => {
    if (!imageBase64) return showError("Selecciona primero una imagen.");

    resetUI();
    resultsContainer.classList.remove('hidden');
    loader.classList.remove('hidden');
    analyzeButton.disabled = true;

    try {
        const payload = { imageBase64 };
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Error de API: ${response.status}`);
        const result = await response.json();
        const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) throw new Error("No se recibió respuesta válida del Script");

        const recipe = JSON.parse(candidateText);
        displayResults(recipe);

    } catch (err) {
        console.error("Error detallado:", err);
        showError("No se pudo analizar la imagen. Intenta otra foto.");
    } finally {
        analyzeButton.disabled = false;
        loader.classList.add('hidden');
    }
});

// Funciones de UI
function displayResults(data) {
    resultContent.classList.remove('hidden');
    resultsContainer.classList.remove('hidden');
    errorMessage.classList.add('hidden');

    resultContent.innerHTML = `<h2>${data.dishName}</h2>
        <ul>${data.ingredients.map(i => `<li>${i.quantity} ${i.unit} de ${i.name} (~${i.estimatedLocalPrice} ${data.currencyCode})</li>`).join('')}</ul>
        <ol>${data.instructions.map(ins => `<li>${ins}</li>`).join('')}</ol>
        ${data.supermarketSuggestions?.length ? `<p>Supermercados: ${data.supermarketSuggestions.join(', ')}</p>` : ''}`;
}

function resetUI() {
    resultContent.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
    resultsContainer.classList.remove('hidden');
}
