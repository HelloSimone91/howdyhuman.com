// script.js - Howdy Human Dictionary - FINAL BUILD

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
        filterValues();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

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

// --- Fetch Values ---
async function fetchValues(language) {
    const fileName = (language === 'es') ? 'values-es.json' : 'values-en.json';
    try {
        const response = await fetch(fileName);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        values = await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
    }
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

function setupLanguageToggle() {
    if (!languageToggle) return;
    languageToggle.addEventListener('click', () => {
        alert('Coming soon!');
    });
}

// --- Filtering Logic ---
function filterValues() {
    let filtered = values;

    if (filterState.searchTerm) {
        filtered = filtered.filter(value => {
            const nameMatch = value.name.toLowerCase().includes(filterState.searchTerm);
            const descriptionMatch = value.description.toLowerCase().includes(filterState.searchTerm);
            const exampleMatch = value.example?.toLowerCase().includes(filterState.searchTerm);
            const tagMatch = value.tags?.some(tag => tag.toLowerCase().includes(filterState.searchTerm));
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

// --- Display Values ---
function displayValues(valuesToDisplay) {
    if (!valuesList) return;

    valuesList.innerHTML = '';

    valuesToDisplay.forEach(value => {
        const card = document.createElement('div');
        card.className = 'value-card';

        card.innerHTML = `
            <div class="value-card-header">
                <h2>${value.name}</h2>
                <span class="category-tag">${value.category}</span>
                <button class="value-card-toggle">Read more <i class="fas fa-chevron-down"></i></button>
            </div>
            <div class="value-card-body">
                <p class="description">${value.description}</p>

                <div class="example-box">
                    <h4>Example in Real Life</h4>
                    <p>${value.example}</p>
                </div>

                <div class="verbs-section">
                    <h4>Associated Verbs</h4>
                    <div class="tags-container">
                        ${value.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>

                <div class="related-section">
                    <h4>Related Values</h4>
                    <div class="tags-container">
                        ${getRelatedValues(value).map(rel => `<span class="tag related-tag" data-name="${rel.name}">${rel.name}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;

        valuesList.appendChild(card);
    });

    setupExpandCollapseLogic();
}

function setupExpandCollapseLogic() {
    const toggles = document.querySelectorAll('.value-card-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const card = e.target.closest('.value-card');
            card.classList.toggle('expanded');
            const isExpanded = card.classList.contains('expanded');
            toggle.innerHTML = isExpanded ? 'Read less <i class="fas fa-chevron-up"></i>' : 'Read more <i class="fas fa-chevron-down"></i>';
        });
    });

    document.querySelectorAll('.related-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            const match = Array.from(document.querySelectorAll('.value-card')).find(card => 
                card.querySelector('h2').textContent.trim() === name);
            if (match) {
                match.classList.add('pulse');
                setTimeout(() => match.classList.remove('pulse'), 600);
            }
        });
    });
}

function getRelatedValues(currentValue) {
    if (!currentValue.tags) return [];

    return values.filter(v =>
        v.name !== currentValue.name &&
        v.tags?.some(tag => currentValue.tags.includes(tag))
    ).slice(0, 3);
}
