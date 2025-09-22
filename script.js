// --- Estado de la Aplicación ---
let baseRecipeForOne = null;
let currentRecipeForDisplay = null;
let currentServings = 1;
let imageBase64 = null;

// --- Referencias al DOM ---
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const analyzeButton = document.getElementById('analyze-button');
const resultsContainer = document.getElementById('results-container');
const loader = document.getElementById('loader');
const resultContent = document.getElementById('result-content');
const errorMessage = document.getElementById('error-message');
const dishNameEl = document.getElementById('dish-name');
const instructionListEl = document.getElementById('instruction-list');
const cartListEl = document.getElementById('cart-list');
const totalCostEl = document.getElementById('total-cost');
const supermarketSectionEl = document.getElementById('supermarket-section');
const supermarketListEl = document.getElementById('supermarket-list');
const servingsSelector = document.getElementById('servings-selector');

// --- Inicialización ---
window.onload = function() {
    analyzeButton.disabled = true;
};

// --- Carga de imagen ---
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            analyzeButton.disabled = false;
            imageBase64 = e.target.result.split(',')[1]; // guardar solo base64
        };
        reader.readAsDataURL(file);
    }
});

// --- Botón de análisis ---
analyzeButton.addEventListener('click', () => {
    if (imageBase64) {
        // Llamamos a Android para procesar la imagen
        if (window.AndroidInterface && window.AndroidInterface.analyzeImage) {
            resetUI();
            loader.classList.remove('hidden');
            window.AndroidInterface.analyzeImage(imageBase64);
        } else {
            showError("No se detectó la interfaz de Android.");
        }
    } else {
        showError("Selecciona una imagen primero.");
    }
});

// --- Función que Android llamará para pasar los resultados ---
function handleAnalysisResult(jsonString) {
    try {
        baseRecipeForOne = JSON.parse(jsonString);
        currentServings = 1;
        updateDisplayForServings();
    } catch (err) {
        showError("Error al procesar la respuesta del servidor.");
        console.error(err);
    }
}

// --- Actualizar UI ---
function updateDisplayForServings() {
    if (!baseRecipeForOne) return;

    const scaledRecipe = JSON.parse(JSON.stringify(baseRecipeForOne));
    scaledRecipe.ingredients.forEach(ing => {
        ing.quantity *= currentServings;
        ing.estimatedLocalPrice *= currentServings;
    });
    currentRecipeForDisplay = scaledRecipe;
    displayResults(currentRecipeForDisplay);
}

function displayResults(data) {
    loader.classList.add('hidden');
    resultContent.classList.remove('hidden');
    resultsContainer.classList.remove('hidden');

    dishNameEl.textContent = `${data.dishName || "Plato no identificado"} (para ${currentServings} ${currentServings > 1 ? 'personas' : 'persona'})`;

    // Ingredientes
    cartListEl.innerHTML = '';
    let totalCost = 0;
    data.ingredients.forEach(ing => {
        const li = document.createElement('li');
        li.innerHTML = `${ing.quantity.toFixed(2)} ${ing.unit} de ${ing.name} - ${ing.estimatedLocalPrice.toFixed(2)} ${data.currencyCode}`;
        cartListEl.appendChild(li);
        totalCost += ing.estimatedLocalPrice;
    });
    totalCostEl.textContent = `Total: ${totalCost.toFixed(2)} ${data.currencyCode}`;

    // Instrucciones
    instructionListEl.innerHTML = '';
    data.instructions.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        instructionListEl.appendChild(li);
    });

    // Supermercados
    supermarketListEl.innerHTML = '';
    if (data.supermarketSuggestions && data.supermarketSuggestions.length > 0) {
        supermarketSectionEl.classList.remove('hidden');
        data.supermarketSuggestions.forEach(store => {
            const li = document.createElement('li');
            li.textContent = store;
            supermarketListEl.appendChild(li);
        });
    } else {
        supermarketSectionEl.classList.add('hidden');
    }
}

// --- UI ---
function resetUI() {
    resultContent.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loader.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    baseRecipeForOne = null;
    currentRecipeForDisplay = null;
    document.getElementById('servings1').checked = true;
    currentServings = 1;
}

function showError(msg) {
    loader.classList.add('hidden');
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
    resultsContainer.classList.remove('hidden');
    resultContent.classList.add('hidden');
}
