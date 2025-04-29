// script.js - Howdy Human Dictionary

// --- Global Variables ---
let currentLanguage = 'en';
let values = [];

const filterState = {
    categories: [],
    tags: [],
    searchTerm: '',
    matchAll: true,
    sortMethod: 'name'
};

let searchInput, mainSearchInput, clearSearchBtn, sortSelect, tagFilters, categoryFilters, valuesList, 
    matchAll, matchAny, toggleSlide, activeFilters, clearFilters, filterCount, 
    toggleFilters, filtersContainer, valuesCount, alphaNav, backToTop, languageToggle, expandCollapseBtn;

// --- Initialize on DOM Content Loaded ---
document.addEventListener('DOMContentLoaded', async function() {
    try {
        getDOMElements();
        setupUI();
        await fetchValues(currentLanguage);
        initializeValuesDictionary();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

function initializeValuesDictionary() {
    if (!valuesList) return;

    valuesList.innerHTML = ''; // Clear current list

    values.forEach(value => {
        const card = document.createElement('div');
        card.className = 'value-card';
        card.innerHTML = `
            <h2 class="text-xl font-semibold mb-2">${value.name}</h2>
            <p class="text-gray-700 mb-2">${value.description}</p>
            <div class="text-sm text-gray-500">${value.example}</div>
        `;
        valuesList.appendChild(card);
    });

    updateValuesCount(values.length);
}

// --- Helper Functions ---
function getDOMElements() {
    searchInput = document.getElementById('searchInput');
    mainSearchInput = document.getElementById('mainSearchInput');
    clearSearchBtn = document.getElementById('clearSearch');
    sortSelect = document.getElementById('sortSelect');
    tagFilters = document.getElementById('tagFilters');
    categoryFilters = document.getElementById('categoryFilters');
    valuesList = document.getElementById('valuesList');
    matchAll = document.getElementById('matchAll');
    matchAny = document.getElementById('matchAny');
    toggleSlide = document.getElementById('toggleSlide');
    activeFilters = document.getElementById('activeFilters');
    clearFilters = document.getElementById('clearFilters');
    filterCount = document.getElementById('filterCount');
    toggleFilters = document.getElementById('toggleFilters');
    filtersContainer = document.getElementById('filtersContainer');
    valuesCount = document.getElementById('valuesCount');
    alphaNav = document.getElementById('alphaNav');
    backToTop = document.getElementById('backToTop');
    languageToggle = document.getElementById('languageToggle');
    expandCollapseBtn = document.getElementById('expandCollapseBtn');
}

async function fetchValues(language) {
    const fileName = (language === 'es') ? 'values-es.json' : 'values-en.json';
    try {
        const response = await fetch(fileName);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        values = await response.json();
        filterValues();
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function setupUI() {
    setupSearch();
    setupFilterToggle();
    setupMatchTypeToggle();
    setupAlphaNav();
    setupBackToTop();
    setupLanguageToggle();
    setupExpandCollapseControls();
}

// --- Search Setup ---
function setupSearch() {
    if (!mainSearchInput || !clearSearchBtn) return;

    mainSearchInput.addEventListener('input', () => {
        filterState.searchTerm = mainSearchInput.value.toLowerCase();
        clearSearchBtn.style.display = filterState.searchTerm ? 'block' : 'none';
        filterValues();
    });

    clearSearchBtn.addEventListener('click', () => {
        mainSearchInput.value = '';
        filterState.searchTerm = '';
        clearSearchBtn.style.display = 'none';
        filterValues();
    });
}

// --- Language Toggle (Coming Soon) ---
function setupLanguageToggle() {
    if (!languageToggle) return;
    languageToggle.addEventListener('click', () => {
        alert('Coming soon!');
    });
}

// --- Alpha Navigation Setup ---
function setupAlphaNav() { /* same as before */ }

// --- Back to Top Button ---
function setupBackToTop() { /* same as before */ }

// --- Filter and Match Type Toggles ---
function setupFilterToggle() { /* same as before */ }
function setupMatchTypeToggle() { /* same as before */ }

// --- Expand / Collapse Controls ---
function setupExpandCollapseControls() { /* same as before */ }

// --- Filtering and Rendering ---
function filterValues() {
    let filtered = values;

    if (filterState.searchTerm) {
        filtered = filtered.filter(value => {
            const nameMatch = value.name.toLowerCase().includes(filterState.searchTerm);
            const descriptionMatch = value.description.toLowerCase().includes(filterState.searchTerm);
            const exampleMatch = value.example.toLowerCase().includes(filterState.searchTerm);
            const tagMatch = value.tags.some(tag => tag.toLowerCase().includes(filterState.searchTerm));
            return nameMatch || descriptionMatch || exampleMatch || tagMatch;
        });
    }

    if (filterState.categories.length > 0) {
        filtered = filtered.filter(value => filterState.categories.includes(value.category));
    }

    if (filterState.tags.length > 0) {
        if (filterState.matchAll) {
            filtered = filtered.filter(value => filterState.tags.every(tag => value.tags.includes(tag)));
        } else {
            filtered = filtered.filter(value => filterState.tags.some(tag => value.tags.includes(tag)));
        }
    }

    displayValues(filtered);
}

function initializeValuesDictionary() {
    filterValues();
}

function displayValues(valuesToDisplay) { /* same rendering logic you already had */ }
function updateValuesCount(count) { /* same as before */ }
function updateActiveFilters() { /* same as before */ }
