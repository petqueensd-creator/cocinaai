
//  Pedir/leer API Key
let apiKey = localStorage.getItem('apiKey');
if (!apiKey) {
  apiKey = prompt('Introduce tu API Key de Google Generative AI:');
  if (apiKey) localStorage.setItem('apiKey', apiKey);
}



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



// …luego usa la variable apiKey en tu fetch…

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
                userLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
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
        if(baseRecipeForOne) {
            updateDisplayForServings();
        }
    }
});

async function analyzeImage(base64ImageData) {
    resetUI();
    resultsContainer.classList.remove('hidden');
    loader.classList.remove('hidden');
    analyzeButton.disabled = true;

  
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    const locationText = userLocation ? `El usuario está en latitud ${userLocation.lat}, longitud ${userLocation.lon}.` : "No se pudo obtener la ubicación del usuario, asume que están en Estados Unidos.";
    
    const systemPrompt = `Eres un chef experto y analista de costos. ${locationText} Analiza la imagen del platillo.
IMPORTANTE: Tu objetivo principal es crear una receta para UNA SOLA PERSONA. Utiliza estas guías de porción promedio por persona:
- Carne de res/cerdo/cordero: 150g
- Pollo/Pescado: 120g
- Arroz (crudo): 50g
- Papas/Yuca/Camote: 150g
- Frijoles/Lentejas (cocido): 1 taza
Ajusta los demás ingredientes (verduras, especias, etc.) para que coincidan con una porción individual.

Tu respuesta DEBE ser un objeto JSON VÁLIDO sin texto adicional. El JSON debe contener:
1. 'dishName': El nombre del platillo.
2. 'ingredients': Un array de objetos, cada uno con 'name', 'quantity', 'unit' y 'estimatedLocalPrice' (costo para la cantidad de UNA porción, en la moneda local).
3. 'instructions': Un array de strings con los pasos de preparación (para una porción).
4. 'currencyCode': El código de 3 letras de la moneda local.
5. 'supermarketSuggestions': Un array con 2-3 nombres de supermercados comunes en la región.`;
    
    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [
            { text: "Analiza este platillo y dame la receta para UNA SOLA PERSONA, con costos locales y sugerencias, en formato JSON." }, 
            { inlineData: { mimeType: "image/jpeg", data: base64ImageData } }
        ] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    dishName: { type: "STRING" },
                    ingredients: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, quantity: { type: "NUMBER" }, unit: { type: "STRING" }, estimatedLocalPrice: { type: "NUMBER" } }, required: ["name", "quantity", "unit", "estimatedLocalPrice"] } },
                    instructions: { type: "ARRAY", items: { type: "STRING" } },
                    currencyCode: { type: "STRING" },
                    supermarketSuggestions: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["dishName", "ingredients", "instructions", "currencyCode", "supermarketSuggestions"]
            }
        }
    };
    
     try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            baseRecipeForOne = JSON.parse(candidate.content.parts[0].text);
            updateDisplayForServings();
        } else {
             throw new Error("No se pudo obtener una respuesta válida del modelo.");
        }

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

// --- Lógica para Compartir ---
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
