// script.js

// Filter state
const filterState = {
    categories: [],
    tags: [],
    searchTerm: '',
    matchAll: true, // true for ALL (AND), false for ANY (OR)
    sortMethod: 'name'
};

// Language state
let currentLanguage = 'en';

// DOM elements
let searchInput, mainSearchInput, clearSearchBtn, sortSelect, tagFilters, categoryFilters, valuesList, 
    matchAll, matchAny, toggleSlide, activeFilters, clearFilters, filterCount, 
    toggleFilters, filtersContainer, valuesCount, alphaNav, backToTop, languageToggle;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Get DOM elements
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

        setupUI();
        initializeValuesDictionary();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Basic app setup
function setupUI() {
    setupFilterToggle();
    setupMatchTypeToggle();
    setupSearch();
    setupClearFilters();
    setupAlphaNav();
    setupBackToTop();
    setupLanguageToggle();
}

// Search bar functionality
function setupSearch() {
    mainSearchInput.addEventListener('input', () => {
        filterState.searchTerm = mainSearchInput.value.toLowerCase();
        clearSearchBtn.style.display = filterState.searchTerm ? 'block' : 'none';
        filterValues();
        updateActiveFilters();
    });

    clearSearchBtn.addEventListener('click', () => {
        mainSearchInput.value = '';
        filterState.searchTerm = '';
        clearSearchBtn.style.display = 'none';
        filterValues();
        updateActiveFilters();
    });

    sortSelect.addEventListener('change', () => {
        filterState.sortMethod = sortSelect.value;
        filterValues();
    });
}

// Toggle filters open/closed
function setupFilterToggle() {
    toggleFilters.addEventListener('click', () => {
        filtersContainer.classList.toggle('collapsed');
        document.getElementById('toggleFiltersText').textContent = filtersContainer.classList.contains('collapsed') ? 'Show Filters' : 'Hide Filters';
        document.getElementById('toggleFiltersIcon').classList.toggle('fa-chevron-down');
        document.getElementById('toggleFiltersIcon').classList.toggle('fa-chevron-up');
    });
}

// Match ALL / ANY tags
function setupMatchTypeToggle() {
    matchAll.addEventListener('click', () => {
        filterState.matchAll = true;
        toggleSlide.classList.remove('right');
        filterValues();
    });
    matchAny.addEventListener('click', () => {
        filterState.matchAll = false;
        toggleSlide.classList.add('right');
        filterValues();
    });
}

// Clear all filters
function setupClearFilters() {
    clearFilters.addEventListener('click', () => {
        filterState.categories = [];
        filterState.tags = [];
        filterState.searchTerm = '';
        document.querySelectorAll('.tag.selected').forEach(tag => tag.classList.remove('selected'));
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        mainSearchInput.value = '';
        clearSearchBtn.style.display = 'none';
        filterValues();
        updateActiveFilters();
    });
}

// Scroll alphabet navigation
function setupAlphaNav() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    alphabet.forEach(letter => {
        const link = document.createElement('a');
        link.href = `#section-${letter}`;
        link.textContent = letter;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = document.getElementById(`section-${letter}`);
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        });
        alphaNav.appendChild(link);
    });
}

// Scroll back to top button
function setupBackToTop() {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Language toggle (placeholder)
function setupLanguageToggle() {
    languageToggle.addEventListener('click', () => {
        if (currentLanguage === 'en') {
            currentLanguage = 'es';
            languageToggle.textContent = 'In English';
            alert('Spanish translation coming soon!');
        } else {
            currentLanguage = 'en';
            languageToggle.textContent = 'En español';
        }
    });
}

// Filter and display values
function filterValues() {
    let filtered = values;

    // Search term
    if (filterState.searchTerm) {
        filtered = filtered.filter(value =>
            value.name.toLowerCase().includes(filterState.searchTerm) ||
            value.description.toLowerCase().includes(filterState.searchTerm) ||
            value.example.toLowerCase().includes(filterState.searchTerm) ||
            value.tags.some(tag => tag.toLowerCase().includes(filterState.searchTerm))
        );
    }

    // Categories
    if (filterState.categories.length) {
        filtered = filtered.filter(value => filterState.categories.includes(value.category));
    }

    // Tags
    if (filterState.tags.length) {
        if (filterState.matchAll) {
            filtered = filtered.filter(value => filterState.tags.every(tag => value.tags.includes(tag)));
        } else {
            filtered = filtered.filter(value => value.tags.some(tag => filterState.tags.includes(tag)));
        }
    }

    // Sort
    filtered.sort((a, b) => {
        if (filterState.sortMethod === 'name') {
            return a.name.localeCompare(b.name);
        } else {
            return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        }
    });

    displayValues(filtered);
}

// Actually render values
function displayValues(valuesToDisplay) {
    valuesList.innerHTML = '';

    if (valuesToDisplay.length === 0) {
        valuesList.innerHTML = `<div class="p-8 text-center">No matching values found.</div>`;
        return;
    }

    valuesToDisplay.forEach(value => {
        const card = document.createElement('div');
        card.className = 'value-card p-4 mb-4';

        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold">${value.name}</h3>
                <span class="category-badge">${value.category}</span>
            </div>
            <p class="mb-2">${value.description}</p>
            <div class="value-example">${value.example}</div>
            <div class="flex flex-wrap mt-2">
                ${value.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;

        valuesList.appendChild(card);
    });

    updateValuesCount(valuesToDisplay.length);
}

// Update counter
function updateValuesCount(count) {
    if (valuesCount) {
        valuesCount.textContent = count || 0;
    }
}

// Update active filters display
function updateActiveFilters() {
    // (You can leave this empty or add a badge feature later)
}
