// script.js

// script.js

let values = []; // <-- define values so it's available globally

document.addEventListener('DOMContentLoaded', function() {
    fetch('values-en.json')
        .then(response => response.json())
        .then(data => {
            values = data;
            setupUI();
            initializeValuesDictionary();
        })
        .catch(error => {
            console.error('Error loading values-en.json:', error);
        });
});
// Filter state
const filterState = {
    categories: [],
    tags: [],
    searchTerm: '',
    matchAll: true,
    sortMethod: 'name'
};

// Language and Values
let currentLanguage = 'en';
let values = [];

// DOM Elements
let searchInput, mainSearchInput, clearSearchBtn, sortSelect, tagFilters, categoryFilters, valuesList, 
    matchAll, matchAny, toggleSlide, activeFilters, clearFilters, filterCount, 
    toggleFilters, filtersContainer, valuesCount, alphaNav, backToTop, languageToggle, expandCollapseBtn;

// Wait for DOM
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
        expandCollapseBtn = document.getElementById('expandCollapseBtn');

        setupUI();
        fetchValues(currentLanguage);
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Setup
function setupUI() {
    setupFilterToggle();
    setupMatchTypeToggle();
    setupSearch();
    setupClearFilters();
    setupAlphaNav();
    setupBackToTop();
    setupLanguageToggle();
    setupExpandCollapseControls(); // <<<<<< ADD THIS
}

// Fetch Values
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

// Search functionality
function setupSearch() { /* ... */ }

// Filter toggle, match type toggle, alpha nav, back to top, etc...
// (your previous code is fine for those, just paste back what you had)

// --- Expand / Collapse All Cards ---
function setupExpandCollapseControls() {
    if (!expandCollapseBtn) return;

    expandCollapseBtn.addEventListener('click', () => {
        const cards = document.querySelectorAll('.value-card');
        const allExpanded = Array.from(cards).every(card => card.classList.contains('expanded'));

        if (allExpanded) {
            cards.forEach(card => collapseCard(card));
            expandCollapseBtn.textContent = 'Expand All';
        } else {
            cards.forEach(card => expandCard(card));
            expandCollapseBtn.textContent = 'Collapse All';
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.value-card-toggle')) {
            setTimeout(updateExpandCollapseButtonText, 100);
        }
    });
}

function updateExpandCollapseButtonText() {
    const cards = document.querySelectorAll('.value-card');
    const allExpanded = Array.from(cards).every(card => card.classList.contains('expanded'));
    expandCollapseBtn.textContent = allExpanded ? 'Collapse All' : 'Expand All';
}

function expandCard(card) {
    card.classList.add('expanded');
    const toggleButton = card.querySelector('.value-card-toggle');
    if (toggleButton) toggleButton.innerHTML = 'Read less <i class="fas fa-chevron-up"></i>';
    triggerPulse(card);
}

function collapseCard(card) {
    card.classList.remove('expanded');
    const toggleButton = card.querySelector('.value-card-toggle');
    if (toggleButton) toggleButton.innerHTML = 'Read more <i class="fas fa-chevron-down"></i>';
    triggerPulse(card);
}

function triggerPulse(card) {
    card.classList.add('pulse');
    setTimeout(() => {
        card.classList.remove('pulse');
    }, 600);
}

// --- Values rendering ---
function filterValues() { /* ... same logic you had ... */ }
function displayValues(valuesToDisplay) { /* ... same logic you had ... */ }
function updateValuesCount(count) { /* ... */ }
function updateActiveFilters() { /* ... */ }
