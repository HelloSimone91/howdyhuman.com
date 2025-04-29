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

// --- DOM Helpers ---
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

// --- Setup UI ---
function setupUI() {
    setupSearch();
    setupFilterToggle();
    setupMatchTypeToggle();
    setupAlphaNav();
    setupBackToTop();
    setupLanguageToggle();
    setupExpandCollapseControls();
}

// --- Fetch Values ---
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

// --- Initialize the Values List ---
function initializeValuesDictionary() {
    if (!valuesList) return;

    valuesList.innerHTML = '';

    values.forEach(value => {
        const card = document.createElement('div');
        card.className = 'value-card group mb-4 border rounded-lg p-4 shadow-md transition-all duration-300';
        card.innerHTML = `
            <div class="flex justify-between items-center cursor-pointer value-card-header">
                <h2 class="text-lg font-semibold">${value.name}</h2>
                <button class="value-card-toggle text-purple-600 hover:text-purple-800">
                    Read more <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="value-card-body mt-2 hidden">
                <p class="text-gray-700 mb-2">${value.description}</p>
                <div class="text-sm text-gray-500">${value.example}</div>
            </div>
        `;
        valuesList.appendChild(card);

        const toggleBtn = card.querySelector('.value-card-toggle');
        const body = card.querySelector('.value-card-body');

        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('hidden');
            card.classList.toggle('expanded');

            toggleBtn.innerHTML = body.classList.contains('hidden') 
                ? 'Read more <i class="fas fa-chevron-down"></i>' 
                : 'Read less <i class="fas fa-chevron-up"></i>';

            triggerPulse(card);
        });
    });

    updateValuesCount(values.length);
}

// --- Filtering Logic ---
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

function displayValues(valuesToDisplay) {
    if (!valuesList) return;
    valuesList.innerHTML = '';

    valuesToDisplay.forEach(value => {
        const card = document.createElement('div');
        card.className = 'value-card group mb-4 border rounded-lg p-4 shadow-md transition-all duration-300';
        card.innerHTML = `
            <div class="flex justify-between items-center cursor-pointer value-card-header">
                <h2 class="text-lg font-semibold">${value.name}</h2>
                <button class="value-card-toggle text-purple-600 hover:text-purple-800">
                    Read more <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="value-card-body mt-2 hidden">
                <p class="text-gray-700 mb-2">${value.description}</p>
                <div class="text-sm text-gray-500">${value.example}</div>
            </div>
        `;
        valuesList.appendChild(card);

        const toggleBtn = card.querySelector('.value-card-toggle');
        const body = card.querySelector('.value-card-body');

        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('hidden');
            card.classList.toggle('expanded');

            toggleBtn.innerHTML = body.classList.contains('hidden') 
                ? 'Read more <i class="fas fa-chevron-down"></i>' 
                : 'Read less <i class="fas fa-chevron-up"></i>';

            triggerPulse(card);
        });
    });

    updateValuesCount(valuesToDisplay.length);
}

// --- Expand / Collapse All Controls ---
function setupExpandCollapseControls() {
    if (!expandCollapseBtn) return;

    expandCollapseBtn.addEventListener('click', () => {
        const cards = document.querySelectorAll('.value-card');
        const allExpanded = Array.from(cards).every(card => card.classList.contains('expanded'));

        cards.forEach(card => {
            const body = card.querySelector('.value-card-body');
            const toggleBtn = card.querySelector('.value-card-toggle');

            if (allExpanded) {
                body.classList.add('hidden');
                card.classList.remove('expanded');
                toggleBtn.innerHTML = 'Read more <i class="fas fa-chevron-down"></i>';
            } else {
                body.classList.remove('hidden');
                card.classList.add('expanded');
                toggleBtn.innerHTML = 'Read less <i class="fas fa-chevron-up"></i>';
            }
        });

        expandCollapseBtn.textContent = allExpanded ? 'Expand All' : 'Collapse All';
    });
}

function triggerPulse(card) {
    card.classList.add('pulse');
    setTimeout(() => {
        card.classList.remove('pulse');
    }, 600);
}

// --- UI Setup (Search, Filters, Alpha Nav, etc) ---
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

function setupFilterToggle() { /* same simple toggle you had */ }
function setupMatchTypeToggle() { /* your match any / all toggle */ }
function setupAlphaNav() { /* optional alphabet nav */ }
function setupBackToTop() { /* optional scroll-to-top */ }

// --- Language Toggle ---
function setupLanguageToggle() {
    if (!languageToggle) return;
    languageToggle.addEventListener('click', () => {
        alert('Coming soon!');
    });
}

// --- Values Counters ---
function updateValuesCount(count) {
    if (valuesCount) valuesCount.textContent = `${count} values found`;
}
