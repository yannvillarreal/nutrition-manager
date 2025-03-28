// Global state
let ingredients = [];
let recipes = [];
let nextIngredientId = 1;
let nextRecipeId = 1;

// Load data from localStorage or initialize empty arrays
function initializeData() {
    const savedIngredients = localStorage.getItem('ingredients');
    const savedRecipes = localStorage.getItem('recipes');
    const savedNextIngredientId = localStorage.getItem('nextIngredientId');
    const savedNextRecipeId = localStorage.getItem('nextRecipeId');
    
    ingredients = savedIngredients ? JSON.parse(savedIngredients) : [];
    recipes = savedRecipes ? JSON.parse(savedRecipes) : [];
    nextIngredientId = savedNextIngredientId ? parseInt(savedNextIngredientId) : 1;
    nextRecipeId = savedNextRecipeId ? parseInt(savedNextRecipeId) : 1;
    
    renderIngredients();
    renderRecipes();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('ingredients', JSON.stringify(ingredients));
    localStorage.setItem('recipes', JSON.stringify(recipes));
    localStorage.setItem('nextIngredientId', nextIngredientId.toString());
    localStorage.setItem('nextRecipeId', nextRecipeId.toString());
}

// Export data to Excel
function exportToExcel() {
    const wb = XLSX.utils.book_new();
    
    // Create ingredients worksheet
    const ingredientsWS = XLSX.utils.json_to_sheet(ingredients.map(ing => ({
        id: parseInt(ing.id),
        name: ing.name,
        serving_size_amount: ing.servingSize.amount,
        serving_size_unit: ing.servingSize.unit,
        calories: ing.nutrients.calories,
        protein: ing.nutrients.protein,
        carbs: ing.nutrients.carbohydratesTotal,
        fat_total: ing.nutrients.fatTotal,
        fat_saturated: ing.nutrients.fatSaturated,
        fat_trans: ing.nutrients.fatTrans,
        cholesterol: ing.nutrients.cholesterol,
        sodium: ing.nutrients.sodium,
        fiber: ing.nutrients.fiber,
        sugar: ing.nutrients.sugars
    })));
    XLSX.utils.book_append_sheet(wb, ingredientsWS, "Ingredients");
    
    // Create recipes worksheet with stringified ingredients
    const recipesWS = XLSX.utils.json_to_sheet(recipes.map(recipe => ({
        id: parseInt(recipe.id),
        title: recipe.title,
        instructions: recipe.instructions,
        ingredients_used: JSON.stringify(recipe.ingredientsUsed)
    })));
    XLSX.utils.book_append_sheet(wb, recipesWS, "Recipes");
    
    // Save the file
    XLSX.writeFile(wb, "nutrition_data.xlsx");
}

// Import data from Excel
function importFromExcel(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Read ingredients
        const ingredientsSheet = workbook.Sheets["Ingredients"];
        if (ingredientsSheet) {
            const importedIngredients = XLSX.utils.sheet_to_json(ingredientsSheet);
            ingredients = importedIngredients.map(ing => ({
                id: ing.id.toString(),
                name: ing.name,
                servingSize: {
                    amount: ing.serving_size_amount,
                    unit: ing.serving_size_unit
                },
                nutrients: {
                    calories: ing.calories,
                    protein: ing.protein,
                    carbohydratesTotal: ing.carbs,
                    fatTotal: ing.fat_total,
                    fatSaturated: ing.fat_saturated,
                    fatTrans: ing.fat_trans,
                    cholesterol: ing.cholesterol,
                    sodium: ing.sodium,
                    fiber: ing.fiber,
                    sugars: ing.sugar
                }
            }));
            nextIngredientId = Math.max(...ingredients.map(i => parseInt(i.id))) + 1;
        }
        
        // Read recipes
        const recipesSheet = workbook.Sheets["Recipes"];
        if (recipesSheet) {
            const importedRecipes = XLSX.utils.sheet_to_json(recipesSheet);
            recipes = importedRecipes.map(recipe => ({
                id: recipe.id.toString(),
                title: recipe.title,
                instructions: recipe.instructions,
                ingredientsUsed: JSON.parse(recipe.ingredients_used)
            }));
            nextRecipeId = Math.max(...recipes.map(r => parseInt(r.id))) + 1;
        }
        
        // Update UI and save to localStorage
        renderIngredients();
        renderRecipes();
        saveData();
    };
    
    reader.readAsArrayBuffer(file);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
});

// Add file input handler
document.getElementById('fileInput').addEventListener('change', importFromExcel);

// Modal Management
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Ingredients Management
function renderIngredients() {
    const container = document.getElementById('ingredients-list');
    container.innerHTML = ingredients.map(ingredient => `
        <div class="ingredient-card">
            <div class="card-header">
                <div class="card-header-left">
                    <h3 class="card-title">
                        <span class="id-badge" style="font-weight: 500">#${ingredient.id}</span>
                        <span class="name-text" title="${ingredient.name}">${ingredient.name}</span>
                    </h3>
                    <span class="serving-info">Per ${ingredient.servingSize.amount} ${ingredient.servingSize.unit}</span>
                </div>
                <div class="card-actions">
                    <button onclick="editIngredient('${ingredient.id}')" class="btn-secondary">Edit</button>
                    <button onclick="deleteIngredient('${ingredient.id}')" class="btn-danger">Delete</button>
                    <button onclick="toggleIngredientDetails('${ingredient.id}')" class="btn-secondary">
                        <span id="expand-icon-${ingredient.id}" class="expand-icon">▼</span>
                    </button>
                </div>
            </div>
            <div id="ingredient-details-${ingredient.id}" class="ingredient-details collapsed">
                <div class="nutrition-summary">
                    <div class="nutrition-grid">
                        <div class="nutrition-column">
                            <div class="nutrition-item">
                                <div class="nutrition-label">Calories</div>
                                <div class="nutrition-value">${ingredient.nutrients.calories}</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-label">Protein</div>
                                <div class="nutrition-value">${ingredient.nutrients.protein}g</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-label">Carbs</div>
                                <div class="nutrition-value">${ingredient.nutrients.carbohydratesTotal}g</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-label">Total Fat</div>
                                <div class="nutrition-value">${ingredient.nutrients.fatTotal}g</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-label">Saturated Fat</div>
                                <div class="nutrition-value">${ingredient.nutrients.fatSaturated}g</div>
                            </div>
                        </div>
                        <div class="nutrition-column">
                            <div class="nutrition-item">
                                <div class="nutrition-label">Trans Fat</div>
                                <div class="nutrition-value">${ingredient.nutrients.fatTrans}g</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-label">Cholesterol</div>
                                <div class="nutrition-value">${ingredient.nutrients.cholesterol}mg</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-label">Sodium</div>
                                <div class="nutrition-value">${ingredient.nutrients.sodium}mg</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-label">Fiber</div>
                                <div class="nutrition-value">${ingredient.nutrients.fiber}g</div>
                            </div>
                            <div class="nutrition-item">
                                <div class="nutrition-label">Sugar</div>
                                <div class="nutrition-value">${ingredient.nutrients.sugars}g</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleIngredientDetails(id) {
    const detailsElement = document.getElementById(`ingredient-details-${id}`);
    const expandIcon = document.getElementById(`expand-icon-${id}`);
    
    if (detailsElement.classList.contains('collapsed')) {
        detailsElement.classList.remove('collapsed');
        expandIcon.textContent = '▲';
    } else {
        detailsElement.classList.add('collapsed');
        expandIcon.textContent = '▼';
    }
}

function showIngredientForm(ingredient = null) {
    document.getElementById('ingredient-form-title').textContent = ingredient ? 'Edit Ingredient' : 'Add Ingredient';
    document.getElementById('ingredient-id').value = ingredient?.id || '';
    document.getElementById('ingredient-name').value = ingredient?.name || '';
    document.getElementById('serving-amount').value = ingredient?.servingSize.amount || '';
    document.getElementById('serving-unit').value = ingredient?.servingSize.unit || 'g';
    document.getElementById('calories').value = ingredient?.nutrients.calories || '';
    document.getElementById('protein').value = ingredient?.nutrients.protein || '';
    document.getElementById('carbs').value = ingredient?.nutrients.carbohydratesTotal || '';
    document.getElementById('fat').value = ingredient?.nutrients.fatTotal || '';
    document.getElementById('fat-saturated').value = ingredient?.nutrients.fatSaturated || '';
    document.getElementById('fat-trans').value = ingredient?.nutrients.fatTrans || '';
    document.getElementById('cholesterol').value = ingredient?.nutrients.cholesterol || '';
    document.getElementById('sodium').value = ingredient?.nutrients.sodium || '';
    document.getElementById('fiber').value = ingredient?.nutrients.fiber || '';
    document.getElementById('sugar').value = ingredient?.nutrients.sugars || '';
    
    showModal('ingredient-modal');
}

function editIngredient(id) {
    const ingredient = ingredients.find(i => i.id === id);
    if (ingredient) {
        showIngredientForm(ingredient);
    }
}

async function saveIngredient(event) {
    event.preventDefault();
    
    const ingredientData = {
        id: document.getElementById('ingredient-id').value || nextIngredientId.toString(),
        name: document.getElementById('ingredient-name').value,
        servingSize: {
            amount: parseFloat(document.getElementById('serving-amount').value),
            unit: document.getElementById('serving-unit').value
        },
        nutrients: {
            calories: parseFloat(document.getElementById('calories').value),
            protein: parseFloat(document.getElementById('protein').value),
            carbohydratesTotal: parseFloat(document.getElementById('carbs').value),
            fatTotal: parseFloat(document.getElementById('fat').value),
            fatSaturated: parseFloat(document.getElementById('fat-saturated').value),
            fatTrans: parseFloat(document.getElementById('fat-trans').value),
            cholesterol: parseFloat(document.getElementById('cholesterol').value),
            sodium: parseFloat(document.getElementById('sodium').value),
            fiber: parseFloat(document.getElementById('fiber').value),
            sugars: parseFloat(document.getElementById('sugar').value)
        }
    };
    
    // Update or add ingredient
    const index = ingredients.findIndex(i => i.id === ingredientData.id);
    if (index >= 0) {
        ingredients[index] = ingredientData;
    } else {
        ingredients.push(ingredientData);
        nextIngredientId++;
    }
    
    // Save to localStorage and update UI
    saveData();
    renderIngredients();
    closeModal('ingredient-modal');
}

function deleteIngredient(id) {
    // Check if ingredient is used in any recipes
    const usedInRecipes = recipes.filter(recipe => 
        recipe.ingredientsUsed.some(ing => ing.ingredientId === id)
    );

    if (usedInRecipes.length > 0) {
        alert(`Cannot delete this ingredient as it is used in the following recipes:\n${usedInRecipes.map(r => r.title).join('\n')}`);
        return;
    }

    if (confirm('Are you sure you want to delete this ingredient?')) {
        ingredients = ingredients.filter(ingredient => ingredient.id !== id);
        saveData();
        renderIngredients();
    }
}

// Recipes Management
function renderRecipes() {
    const container = document.getElementById('recipes-list');
    container.innerHTML = recipes.map(recipe => {
        const nutritionTotals = calculateRecipeNutrition(recipe);
        return `
            <div class="recipe-card">
                <div class="card-header">
                    <div class="card-header-left">
                        <h3 class="card-title">
                            <span class="id-badge" style="font-weight: 500">#${recipe.id}</span>
                            <span class="name-text" title="${recipe.title}">${recipe.title}</span>
                        </h3>
                    </div>
                    <div class="card-actions">
                        <button onclick="editRecipe('${recipe.id}')" class="btn-secondary">Edit</button>
                        <button onclick="deleteRecipe('${recipe.id}')" class="btn-danger">Delete</button>
                        <button onclick="toggleRecipeDetails('${recipe.id}')" class="btn-secondary">
                            <span id="recipe-expand-icon-${recipe.id}" class="expand-icon">▼</span>
                        </button>
                    </div>
                </div>
                <div id="recipe-details-${recipe.id}" class="recipe-details collapsed">
                    <h4>Ingredients:</h4>
                    <ul>
                        ${recipe.ingredientsUsed.map(ing => {
                            const ingredient = ingredients.find(i => i.id === ing.ingredientId);
                            return `<li>${ing.quantity} ${ing.unit} ${ingredient ? ingredient.name : 'Unknown ingredient'}</li>`;
                        }).join('')}
                    </ul>
                    <h4>Instructions:</h4>
                    <p>${recipe.instructions}</p>
                    <h4>Nutrition Totals:</h4>
                    <div class="nutrition-summary">
                        ${renderNutritionSummary(nutritionTotals)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderNutritionSummary(nutrition) {
    return `
        <div class="nutrition-grid">
            <div class="nutrition-column">
                <div class="nutrition-item">
                    <div class="nutrition-label">Calories</div>
                    <div class="nutrition-value">${nutrition.calories.toFixed(1)}</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Protein</div>
                    <div class="nutrition-value">${nutrition.protein.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Carbs</div>
                    <div class="nutrition-value">${nutrition.carbs.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Total Fat</div>
                    <div class="nutrition-value">${nutrition.fat.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Saturated Fat</div>
                    <div class="nutrition-value">${nutrition.fatSaturated.toFixed(1)}g</div>
                </div>
            </div>
            <div class="nutrition-column">
                <div class="nutrition-item">
                    <div class="nutrition-label">Trans Fat</div>
                    <div class="nutrition-value">${nutrition.fatTrans.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Cholesterol</div>
                    <div class="nutrition-value">${nutrition.cholesterol.toFixed(1)}mg</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Sodium</div>
                    <div class="nutrition-value">${nutrition.sodium.toFixed(1)}mg</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Fiber</div>
                    <div class="nutrition-value">${nutrition.fiber.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Sugar</div>
                    <div class="nutrition-value">${nutrition.sugar.toFixed(1)}g</div>
                </div>
            </div>
        </div>
    `;
}

function calculateRecipeNutrition(recipe) {
    const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fatSaturated: 0,
        fatTrans: 0,
        cholesterol: 0,
        sodium: 0,
        fiber: 0,
        sugar: 0
    };

    recipe.ingredientsUsed.forEach(ing => {
        const ingredient = ingredients.find(i => i.id === ing.ingredientId);
        if (ingredient) {
            const ratio = ing.quantity / ingredient.servingSize.amount;
            totals.calories += ingredient.nutrients.calories * ratio;
            totals.protein += ingredient.nutrients.protein * ratio;
            totals.carbs += ingredient.nutrients.carbohydratesTotal * ratio;
            totals.fat += ingredient.nutrients.fatTotal * ratio;
            totals.fatSaturated += ingredient.nutrients.fatSaturated * ratio;
            totals.fatTrans += ingredient.nutrients.fatTrans * ratio;
            totals.cholesterol += ingredient.nutrients.cholesterol * ratio;
            totals.sodium += ingredient.nutrients.sodium * ratio;
            totals.fiber += ingredient.nutrients.fiber * ratio;
            totals.sugar += ingredient.nutrients.sugars * ratio;
        }
    });

    return totals;
}

function showRecipeForm(recipe = null) {
    document.getElementById('recipe-form-title').textContent = recipe ? 'Edit Recipe' : 'Add Recipe';
    document.getElementById('recipe-id').value = recipe?.id || '';
    document.getElementById('recipe-title').value = recipe?.title || '';
    document.getElementById('recipe-instructions').value = recipe?.instructions || '';
    
    const ingredientsContainer = document.getElementById('recipe-ingredients');
    ingredientsContainer.innerHTML = '';
    
    if (recipe?.ingredientsUsed) {
        recipe.ingredientsUsed.forEach(ing => addIngredientToRecipe(ing));
    }
    
    showModal('recipe-modal');
    updateRecipeNutrition();
}

function editRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if (recipe) {
        showRecipeForm(recipe);
    }
}

function addIngredientToRecipe(existingIngredient = null) {
    const container = document.getElementById('recipe-ingredients');
    const div = document.createElement('div');
    div.className = 'recipe-ingredient';
    
    div.innerHTML = `
        <select onchange="updateRecipeNutrition()">
            <option value="">Select ingredient...</option>
            ${ingredients.map(ing => `
                <option value="${ing.id}" ${existingIngredient && existingIngredient.ingredientId === ing.id ? 'selected' : ''}>
                    ${ing.name}
                </option>
            `).join('')}
        </select>
        <input type="number" value="${existingIngredient?.quantity || ''}" 
               placeholder="Amount" min="0" step="0.1" onchange="updateRecipeNutrition()">
        <select onchange="updateRecipeNutrition()">
            ${['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece'].map(unit => `
                <option value="${unit}" ${existingIngredient && existingIngredient.unit === unit ? 'selected' : ''}>
                    ${unit}
                </option>
            `).join('')}
        </select>
        <button type="button" onclick="this.parentElement.remove(); updateRecipeNutrition()">×</button>
    `;
    
    container.appendChild(div);
}

function updateRecipeNutrition() {
    const ingredients = Array.from(document.querySelectorAll('.recipe-ingredient')).map(row => ({
        ingredientId: row.querySelector('select').value,
        quantity: parseFloat(row.querySelector('input[type="number"]').value) || 0,
        unit: row.querySelector('select:nth-of-type(2)').value
    })).filter(ing => ing.ingredientId && ing.quantity);
    
    const recipe = { ingredientsUsed: ingredients };
    const totals = calculateRecipeNutrition(recipe);
    
    const container = document.getElementById('recipe-nutrition');
    container.innerHTML = `
        <div class="nutrition-grid">
            <div class="nutrition-column">
                <div class="nutrition-item">
                    <div class="nutrition-label">Calories</div>
                    <div class="nutrition-value">${totals.calories.toFixed(1)}</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Protein</div>
                    <div class="nutrition-value">${totals.protein.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Carbs</div>
                    <div class="nutrition-value">${totals.carbs.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Total Fat</div>
                    <div class="nutrition-value">${totals.fat.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Saturated Fat</div>
                    <div class="nutrition-value">${totals.fatSaturated.toFixed(1)}g</div>
                </div>
            </div>
            <div class="nutrition-column">
                <div class="nutrition-item">
                    <div class="nutrition-label">Trans Fat</div>
                    <div class="nutrition-value">${totals.fatTrans.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Cholesterol</div>
                    <div class="nutrition-value">${totals.cholesterol.toFixed(1)}mg</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Sodium</div>
                    <div class="nutrition-value">${totals.sodium.toFixed(1)}mg</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Fiber</div>
                    <div class="nutrition-value">${totals.fiber.toFixed(1)}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Sugar</div>
                    <div class="nutrition-value">${totals.sugar.toFixed(1)}g</div>
                </div>
            </div>
        </div>
    `;
}

async function saveRecipe(event) {
    event.preventDefault();
    
    const recipeIngredients = Array.from(document.querySelectorAll('.recipe-ingredient')).map(row => ({
        ingredientId: row.querySelector('select').value,
        quantity: parseFloat(row.querySelector('input[type="number"]').value),
        unit: row.querySelector('select:nth-of-type(2)').value
    })).filter(ing => ing.ingredientId && ing.quantity);
    
    const recipeData = {
        id: document.getElementById('recipe-id').value || nextRecipeId.toString(),
        title: document.getElementById('recipe-title').value,
        instructions: document.getElementById('recipe-instructions').value,
        ingredientsUsed: recipeIngredients
    };
    
    // Update or add recipe
    const index = recipes.findIndex(r => r.id === recipeData.id);
    if (index >= 0) {
        recipes[index] = recipeData;
    } else {
        recipes.push(recipeData);
        nextRecipeId++;
    }
    
    // Save to localStorage and update UI
    saveData();
    renderRecipes();
    closeModal('recipe-modal');
}

function deleteRecipe(id) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        const index = recipes.findIndex(r => r.id === id);
        if (index >= 0) {
            recipes.splice(index, 1);
            saveData();
            renderRecipes();
        }
    }
}

function toggleRecipeDetails(id) {
    const detailsElement = document.getElementById(`recipe-details-${id}`);
    const expandIcon = document.getElementById(`recipe-expand-icon-${id}`);
    
    if (detailsElement.classList.contains('collapsed')) {
        detailsElement.classList.remove('collapsed');
        expandIcon.textContent = '▲';
    } else {
        detailsElement.classList.add('collapsed');
        expandIcon.textContent = '▼';
    }
}

function showSection(sectionId) {
    // Update mobile tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(sectionId)) {
            btn.classList.add('active');
        }
    });

    // Update sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}
