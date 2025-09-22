// --- Referencias al DOM ---
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const uploadPrompt = document.getElementById('upload-prompt');
const analyzeButton = document.getElementById('analyze-button');
const resultsContainer = document.getElementById('results-container');
const loader = document.getElementById('loader');
const resultContent = document.getElementById('result-content');
const errorMessage = document.getElementById('error-message');
const dishNameEl = document.getElementById('dish-name');
const instructionListEl = document.getElementById('instruction-list');
const shareButtons = document.getElementById('share-buttons');
const cartListEl = document.getElementById('cart-list');
const totalCostEl = document.getElementById('total-cost');
const locationStatusEl = document.getElementById('location-status');
const supermarketSectionEl = document.getElementById('supermarket-section');
const supermarketListEl = document.getElementById('supermarket-list');
const servingsSelector = document.getElementById('servings-selector');

// --- Estado de la Aplicación ---
let baseRecipeForOne = null;
let currentRecipeForDisplay = null;
let imageBase64 = null;
let userLocation = null;
let currentServings = 1;

// --- Inicialización ---
window.onload = function() {
    getLocation();
};

analyzeButton.disabled = true;

// --- Lógica de Geolocalización ---
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
                locationStatusEl.textContent = "✅ Ubicación obtenida. ¡Listo para analizar!";
                locationStatusEl.classList.replace('bg-gray-100', 'bg-green-100');
                locationStatusEl.classList.replace('text-gray-600', 'text-green-800');
            },
            () => {
                locationStatusEl.textContent = "⚠️ No se pudo obtener la ubicación. Se usarán estimaciones en USD.";
                locationStatusEl.classList.replace('bg-gray-100', 'bg-yellow-100');
                locationStatusEl.classList.replace('text-gray-600', 'text-yellow-800');
            }
        );
    } else {
        locationStatusEl.textContent = "La geolocalización no es soportada por este navegador.";
    }
}

// --- Lógica de Carga de Imagen ---
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const readerForPreview = new FileReader();
        readerForPreview.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            uploadPrompt.classList.add('hidden');
            analyzeButton.disabled = false;
        };
        readerForPreview.readAsDataURL(file);

        const readerForApi = new FileReader();
        readerForApi.onloadend = () => { imageBase64 = readerForApi.result.split(',')[1]; };
        readerForApi.readAsDataURL(file);
    }
});

// --- Lógica Principal de Análisis ---
analyzeButton.addEventListener('click', () => {
    if (imageBase64) {
        analyzeImage(imageBase64);
    } else {
        showError("Por favor, selecciona una imagen primero.");
    }
});

servingsSelector.addEventListener('change', (event) => {
    if(event.target.name === 'servings') {
        currentServings = parseInt(event.target.value, 10);
        if(baseRecipeForOne) updateDisplayForServings();
    }
});

// --- Función analyzeImage adaptada para Web App seguro ---
async function analyzeImage(base64ImageData) {
    resetUI();
    resultsContainer.classList.remove('hidden');
    loader.classList.remove('hidden');
    analyzeButton.disabled = true;

    const apiUrl = 'https://script.google.com/macros/s/AKfycbxQPst6wDVirAh32EGQN3hGYxEUQ5RNW1QLU7zhZnWHEOKyND0xB7Rx66GJVjywi39B/exec';
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64ImageData })
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const result = await response.json();

        // Asume que tu Apps Script devuelve directamente el JSON esperado
        baseRecipeForOne = result;
        updateDisplayForServings();

    } catch (error) {
        console.error("Error detallado:", error);
        showError("Lo siento, no pude analizar la imagen. Inténtalo de nuevo con otra foto.");
    } finally {
        analyzeButton.disabled = false;
    }
}

// --- Funciones de Renderizado en UI ---
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

    let totalCost = 0;
    const currency = data.currencyCode || 'USD';

    dishNameEl.textContent = `${data.dishName || "Plato no identificado"} (para ${currentServings} ${currentServings > 1 ? 'personas' : 'persona'})`;
    
    cartListEl.innerHTML = '';
    instructionListEl.innerHTML = '';
    supermarketListEl.innerHTML = '';

    data.ingredients.forEach(ing => {
        const itemPrice = ing.estimatedLocalPrice;
        totalCost += itemPrice;

        const li = document.createElement('li');
        li.className = 'flex justify-between items-center';
        li.innerHTML = `<span>${ing.quantity.toFixed(2).replace(/\.00$/, '')} ${ing.unit} de ${ing.name}</span> <span class="font-medium text-gray-700">${itemPrice.toFixed(2)} ${currency}</span>`;
        cartListEl.appendChild(li);
    });

    totalCostEl.textContent = `${totalCost.toFixed(2)} ${currency}`;
    
    baseRecipeForOne.instructions.forEach(step => {
        instructionListEl.innerHTML += `<li>${step}</li>`;
    });
    
    if (data.supermarketSuggestions && data.supermarketSuggestions.length > 0) {
        data.supermarketSuggestions.forEach(store => {
            supermarketListEl.innerHTML += `<li>${store}</li>`;
        });
        supermarketSectionEl.classList.remove('hidden');
    } else {
        supermarketSectionEl.classList.add('hidden');
    }
    
    resultContent.classList.remove('hidden');
    shareButtons.classList.remove('hidden');
}

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

function showError(message) {
    loader.classList.add('hidden');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    resultsContainer.classList.remove('hidden');
    resultContent.classList.add('hidden');
}

// --- Compartir ---
function generateShareableText() {
    if (!currentRecipeForDisplay) return "Mi receta";

    const recipe = currentRecipeForDisplay;
    let totalCost = 0;
    let shareText = `*${recipe.dishName} (para ${currentServings} ${currentServings > 1 ? 'personas' : 'persona'})*\n\n`;
    
    shareText += "🛒 *Lista de Compras:*\n";
    recipe.ingredients.forEach(ing => {
        const itemPrice = ing.estimatedLocalPrice;
        totalCost += itemPrice;
        shareText += `- ${ing.quantity.toFixed(2).replace(/\.00$/, '')} ${ing.unit} de ${ing.name} (~${itemPrice.toFixed(2)} ${recipe.currencyCode})\n`;
    });
    
    shareText += `\n*Costo Total Estimado:* ${totalCost.toFixed(2)} ${recipe.currencyCode}\n`;

    if(recipe.supermarketSuggestions && recipe.supermarketSuggestions.length > 0) {
        shareText += `\n🏪 *Puedes comprar en:* ${recipe.supermarketSuggestions.join(', ')}\n`
    }
    
    shareText += `\n📝 *Instrucciones:*\n`;
    baseRecipeForOne.instructions.forEach((step, i) => { shareText += `${i + 1}. ${step}\n`; });
    
    return shareText;
}

function share(platform) {
    const textToShare = generateShareableText();
    const encodedText = encodeURIComponent(textToShare);
    let url = '';

    switch (platform) {
        case 'whatsapp': url = `https://api.whatsapp.com/send?text=${encodedText}`; break;
        case 'email':
            const subject = encodeURIComponent(`Receta para ${currentRecipeForDisplay.dishName}`);
            url = `mailto:?subject=${subject}&body=${encodedText}`;
            break;
        case 'sms': url = `sms:?&body=${encodedText}`; break;
    }

    if (url) window.open(url, '_blank');
}
