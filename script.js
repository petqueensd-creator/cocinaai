document.addEventListener('DOMContentLoaded', () => {
  // Referencias al DOM
  const fileInput            = document.getElementById('file-input');
  const imagePreview         = document.getElementById('image-preview');
  const uploadPrompt         = document.getElementById('upload-prompt');
  const analyzeButton        = document.getElementById('analyze-button');
  const resultsContainer     = document.getElementById('results-container');
  const loader               = document.getElementById('loader');
  const resultContent        = document.getElementById('result-content');
  const errorMessage         = document.getElementById('error-message');
  const dishNameEl           = document.getElementById('dish-name');
  const instructionListEl    = document.getElementById('instruction-list');
  const cartListEl           = document.getElementById('cart-list');
  const totalCostEl          = document.getElementById('total-cost');
  const locationStatusEl     = document.getElementById('location-status');
  const supermarketSectionEl = document.getElementById('supermarket-section');
  const supermarketListEl    = document.getElementById('supermarket-list');
  const servingsSelector     = document.getElementById('servings-selector');

  let baseRecipeForOne = null;
  let currentRecipeForDisplay = null;
  let imageBase64 = null;
  let userLocation = null;
  let currentServings = 1;

  // Deshabilita el botón hasta que cargues imagen
  analyzeButton.disabled = true;

  // Obtiene geolocalización al arrancar
  getLocation();

  /* --- FUNCIONES Y EVENTOS --- */

  function getLocation() {
    if (!navigator.geolocation) {
      locationStatusEl.textContent = "Geolocalización no soportada.";
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
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
  }

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const readerPreview = new FileReader();
    readerPreview.onload = ev => {
      imagePreview.src = ev.target.result;
      imagePreview.classList.remove('hidden');
      uploadPrompt.classList.add('hidden');
      analyzeButton.disabled = false;
    };
    readerPreview.readAsDataURL(file);

    // Base64 para la API
    const readerApi = new FileReader();
    readerApi.onloadend = () => {
      imageBase64 = readerApi.result.split(',')[1];
    };
    readerApi.readAsDataURL(file);
  });

  analyzeButton.addEventListener('click', () => {
    if (!imageBase64) {
      showError("Selecciona una imagen primero.");
      return;
    }
    analyzeImage(imageBase64);
  });

  servingsSelector.addEventListener('change', e => {
    if (e.target.name !== 'servings') return;
    currentServings = parseInt(e.target.value, 10);
    if (baseRecipeForOne) updateDisplayForServings();
  });

  async function analyzeImage(data64) {
    resetUI();
    resultsContainer.classList.remove('hidden');
    loader.classList.remove('hidden');
    analyzeButton.disabled = true;

    // URL de tu Apps Script o proxy
    const apiUrl = 'https://script.google.com/macros/s/AKfycbxG4fthHqJ1qVa8bxDGXBJCew7E-Lfi1rUNWqjKq9bV9KapiD-jBG4y9kwRhjZyFm6g/exec';

    const body = {
      systemPrompt: `Eres un chef experto y analista de costos.`,
      contents: [
        {
          parts: [
            { text: "Analiza este platillo y dame la receta para UNA SOLA PERSONA, con costos locales." },
            { inlineData: { mimeType: "image/jpeg", data: data64 } }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            dishName: { type: "STRING" },
            ingredients: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  quantity: { type: "NUMBER" },
                  unit: { type: "STRING" },
                  estimatedLocalPrice: { type: "NUMBER" }
                },
                required: ["name","quantity","unit","estimatedLocalPrice"]
              }
            },
            instructions:    { type: "ARRAY", items:{ type:"STRING" } },
            currencyCode:    { type: "STRING" },
            supermarketSuggestions: { type:"ARRAY", items:{ type:"STRING" } }
          },
          required: ["dishName","ingredients","instructions","currencyCode","supermarketSuggestions"]
        }
      }
    };

    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(resp.status);
      const json = await resp.json();
      baseRecipeForOne = JSON.parse(json.candidates[0].content.parts[0].text);
      updateDisplayForServings();
    } catch (err) {
      console.error(err);
      showError("Error al analizar la imagen.");
    } finally {
      analyzeButton.disabled = false;
    }
  }

  function updateDisplayForServings() {
    const scaled = JSON.parse(JSON.stringify(baseRecipeForOne));
    scaled.ingredients.forEach(ing => {
      ing.quantity *= currentServings;
      ing.estimatedLocalPrice *= currentServings;
    });
    currentRecipeForDisplay = scaled;
    displayResults(scaled);
  }

  function displayResults(data) {
    loader.classList.add('hidden');
    dishNameEl.textContent = `${data.dishName} (para ${currentServings} persona${currentServings>1?'s':''})`;

    cartListEl.innerHTML = '';
    let total = 0;
    data.ingredients.forEach(ing => {
      total += ing.estimatedLocalPrice;
      const li = document.createElement('li');
      li.innerHTML = `${ing.quantity} ${ing.unit} de ${ing.name} – ${ing.estimatedLocalPrice.toFixed(2)} ${data.currencyCode}`;
      cartListEl.appendChild(li);
    });
    totalCostEl.textContent = `${total.toFixed(2)} ${data.currencyCode}`;

    instructionListEl.innerHTML = data.instructions.map(s=>`<li>${s}</li>`).join('');
    supermarketListEl.innerHTML = data.supermarketSuggestions.map(s=>`<li>${s}</li>`).join('');
    supermarketSectionEl.classList.toggle('hidden', data.supermarketSuggestions.length===0);

    resultContent.classList.remove('hidden');
  }

  function resetUI() {
    loader.classList.add('hidden');
    errorMessage.classList.add('hidden');
    resultContent.classList.add('hidden');
    cartListEl.innerHTML = '';
    instructionListEl.innerHTML = '';
    supermarketListEl.innerHTML = '';
  }

  function showError(msg) {
    loader.classList.add('hidden');
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  }
});
