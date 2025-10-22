// Debug status message
function showStatus(message, isError = false, action = null) {
    console.log(message);
    // Create a status element if it doesn't exist
    let statusEl = document.getElementById('appStatus');
    if (statusEl) {
        statusEl.remove();
    }
    statusEl = document.createElement('div');
    statusEl.id = 'appStatus';
    statusEl.setAttribute('role', 'alert');
    statusEl.setAttribute('aria-live', 'assertive');
    document.body.appendChild(statusEl);


    if (isError) {
        statusEl.className = 'status-error';
    } else {
        statusEl.className = 'status-success';
    }

    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    statusEl.appendChild(messageEl);

    if (action) {
        const actionButton = document.createElement('button');
        actionButton.textContent = action.text;
        actionButton.className = 'status-action-button';
        actionButton.onclick = () => {
            action.onClick();
            statusEl.style.opacity = '0';
            setTimeout(() => statusEl.remove(), 500);
        };
        statusEl.appendChild(actionButton);
    } else {
        // Auto-hide after 5 seconds if no action
        setTimeout(() => {
            statusEl.style.opacity = '0';
            setTimeout(() => statusEl.remove(), 500);
        }, 5000);
    }
}

// Values data will be fetched from JSON file
let values = [];

// Filter state
const filterState = {
    categories: [],
    tags: [],
    searchTerm: '',
    matchAll: false, // true for ALL (AND), false for ANY (OR)
    sortMethod: 'name'
};

// Alphabet helper
function getAlphabetForLanguage(lang) {
    switch (lang) {
        case 'es':
            return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        default:
            return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    }
}

// Locale-aware comparison helper for names and categories
function compareByName(a, b) {
    return a.localeCompare(b, currentLanguage, { sensitivity: 'base' });
}

// Map accented initials to their base letter counterparts (preserving locale-specific letters like Ñ)
const initialLetterMap = {
    'Á': 'A', 'À': 'A', 'Â': 'A', 'Ä': 'A', 'Ã': 'A', 'Å': 'A', 'Ā': 'A', 'Ă': 'A', 'Ą': 'A',
    'Æ': 'A',
    'Ç': 'C', 'Ć': 'C', 'Č': 'C',
    'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E', 'Ē': 'E', 'Ě': 'E', 'Ę': 'E', 'Ė': 'E',
    'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I', 'Ī': 'I', 'Į': 'I', 'İ': 'I',
    'Ñ': 'Ñ',
    'Ó': 'O', 'Ò': 'O', 'Ô': 'O', 'Ö': 'O', 'Õ': 'O', 'Ø': 'O', 'Ō': 'O', 'Ő': 'O',
    'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'Ū': 'U', 'Ű': 'U',
    'Ý': 'Y', 'Ÿ': 'Y'
};

function normalizeInitialLetter(name) {
    if (!name) {
        return '#';
    }

    const trimmed = name.trim();
    if (!trimmed) {
        return '#';
    }

    const firstChar = trimmed.charAt(0).toLocaleUpperCase(currentLanguage);
    if (initialLetterMap[firstChar]) {
        return initialLetterMap[firstChar];
    }

    const normalized = firstChar.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return normalized.charAt(0) || firstChar;
}

// Language state
let currentLanguage = 'en';
let activeAlphabet = getAlphabetForLanguage(currentLanguage);

// Internationalization map
const i18n = {
    en: {
        languages: {
            english: 'English',
            spanish: 'Spanish'
        },
        page: {
            title: 'The Howdy Human Dictionary of Values',
            heading: 'The Howdy Human Dictionary of Values',
            tagline: 'Discover values in action',
            introDescription: 'This dictionary is designed to help you understand values not just as abstract concepts, but as active forces that shape our daily choices and actions. Each value is presented with its associated verbs - the concrete ways we embody and express these values in our lives.<br><br>',
            introInstructions: 'Use the search bar to find specific values, or explore by categories and tags. Click on a value to learn more about it and discover related values that share similar characteristics.'
        },
        buttons: {
            languageToggle: 'En español'
        },
        aria: {
            languageToggle: 'Switch language',
            alphaNav: 'Alphabetical navigation'
        },
        search: {
            placeholder: 'Search values by name, description, or example...',
            ariaLabel: 'Search values',
            valuesLabel: 'Values'
        },
        filters: {
            matchType: 'Match Type:',
            matchAll: 'All Selected Verbs',
            matchAny: 'Any Selected Verb',
            sortBy: 'Sort By:',
            sortName: 'Name',
            sortCategory: 'Category',
            categories: 'Categories',
            verbs: 'Verbs',
            verbsCaption: 'tags',
            activeFilters: 'Active Filters',
            showFilters: 'Show Filters',
            hideFilters: 'Hide Filters',
            showMore: 'Show More',
            showLess: 'Show Less',
            noActiveFilters: 'No active filters',
            clearAll: 'Clear All Filters'
        },
        footer: {
            learnMore: 'Learn more about this project'
        },
        valueCard: {
            exampleLabel: 'EXAMPLE IN REAL LIFE',
            associatedVerbsLabel: 'ASSOCIATED VERBS',
            relatedValuesLabel: 'RELATED VALUES',
            clickToView: 'Click to view this value',
            readMore: 'Read more',
            readLess: 'Read less',
            showAllWithTag: 'Show all values tagged with "{{tag}}"'
        },
        messages: {
            noResults: 'No values match your search criteria.',
            suggestion: 'Try adjusting your filters or search terms.',
            resetFilters: 'Reset Filters',
            fallbackIntro: 'There was an issue loading the interactive dictionary. Here\'s a simplified version:',
            errorDisplayingHeading: 'Error Displaying Values',
            valuesListHeading: 'Values List:',
            errorLoadingDictionaryHeading: 'Error Loading Dictionary',
            errorLoadingDictionaryHint: 'Please reload the page or try again later.'
        },
        statuses: {
            appInitializing: 'App initializing...',
            appInitialized: 'App initialized successfully!',
            appInitError: 'Error initializing app: {{message}}',
            loadingValues: 'Loading {{language}} values...',
            allFiltersCleared: 'All filters cleared',
            errorFetchingValues: 'Error fetching values: {{message}}',
            errorLoadingDictionary: 'Error loading values dictionary',
            showingTaggedValues: 'Showing values tagged with "{{tag}}"',
            errorHighlightingTag: 'Error highlighting tag: {{message}}',
            filtersWidened: 'Filters widened to include "{{value}}"',
            filtersRestored: 'Filters restored',
            showingCategory: 'Showing values in category: {{category}}',
            errorFilteringValues: 'Error filtering values'
        },
        actions: {
            undo: 'Undo'
        }
    },
    es: {
        languages: {
            english: 'inglés',
            spanish: 'español'
        },
        page: {
            title: 'El Diccionario de Valores de Howdy Human',
            heading: 'El Diccionario de Valores de Howdy Human',
            tagline: 'Descubre valores en acción',
            introDescription: 'Este diccionario está diseñado para ayudarte a comprender los valores no solo como conceptos abstractos, sino como fuerzas activas que moldean nuestras decisiones y acciones diarias. Cada valor se presenta con sus verbos asociados: las formas concretas en que encarnamos y expresamos estos valores en nuestra vida.<br><br>',
            introInstructions: 'Usa la barra de búsqueda para encontrar valores específicos, o explora por categorías y etiquetas. Haz clic en un valor para saber más al respecto y descubrir valores relacionados que comparten características similares.'
        },
        buttons: {
            languageToggle: 'En inglés'
        },
        aria: {
            languageToggle: 'Cambiar idioma',
            alphaNav: 'Navegación alfabética'
        },
        search: {
            placeholder: 'Busca valores por nombre, descripción o ejemplo...',
            ariaLabel: 'Buscar valores',
            valuesLabel: 'Valores'
        },
        filters: {
            matchType: 'Tipo de coincidencia:',
            matchAll: 'Todos los verbos seleccionados',
            matchAny: 'Cualquier verbo seleccionado',
            sortBy: 'Ordenar por:',
            sortName: 'Nombre',
            sortCategory: 'Categoría',
            categories: 'Categorías',
            verbs: 'Verbos',
            verbsCaption: 'etiquetas',
            activeFilters: 'Filtros activos',
            showFilters: 'Mostrar filtros',
            hideFilters: 'Ocultar filtros',
            showMore: 'Mostrar más',
            showLess: 'Mostrar menos',
            noActiveFilters: 'No hay filtros activos',
            clearAll: 'Borrar todos los filtros'
        },
        footer: {
            learnMore: 'Conoce más sobre este proyecto'
        },
        valueCard: {
            exampleLabel: 'EJEMPLO EN LA VIDA REAL',
            associatedVerbsLabel: 'VERBOS ASOCIADOS',
            relatedValuesLabel: 'VALORES RELACIONADOS',
            clickToView: 'Haz clic para ver este valor',
            readMore: 'Ver más',
            readLess: 'Ver menos',
            showAllWithTag: 'Mostrar todos los valores etiquetados con "{{tag}}"'
        },
        messages: {
            noResults: 'Ningún valor coincide con tus criterios de búsqueda.',
            suggestion: 'Intenta ajustar tus filtros o términos de búsqueda.',
            resetFilters: 'Restablecer filtros',
            fallbackIntro: 'Hubo un problema al cargar el diccionario interactivo. Aquí tienes una versión simplificada:',
            errorDisplayingHeading: 'Error al mostrar los valores',
            valuesListHeading: 'Lista de valores:',
            errorLoadingDictionaryHeading: 'Error al cargar el diccionario',
            errorLoadingDictionaryHint: 'Por favor, recarga la página o inténtalo de nuevo más tarde.'
        },
        statuses: {
            appInitializing: 'Inicializando la aplicación...',
            appInitialized: '¡Aplicación inicializada correctamente!',
            appInitError: 'Error al inicializar la aplicación: {{message}}',
            loadingValues: 'Cargando valores en {{language}}...',
            allFiltersCleared: 'Todos los filtros se han borrado',
            errorFetchingValues: 'Error al obtener los valores: {{message}}',
            errorLoadingDictionary: 'Error al cargar el diccionario de valores',
            showingTaggedValues: 'Mostrando valores etiquetados con "{{tag}}"',
            errorHighlightingTag: 'Error al resaltar la etiqueta: {{message}}',
            filtersWidened: 'Los filtros se ampliaron para incluir "{{value}}"',
            filtersRestored: 'Filtros restaurados',
            showingCategory: 'Mostrando valores en la categoría: {{category}}',
            errorFilteringValues: 'Error al filtrar los valores'
        },
        actions: {
            undo: 'Deshacer'
        }
    }
};

function formatTranslation(template, params = {}) {
    if (typeof template !== 'string') return '';
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : '';
    });
}

function translate(key, params = {}, lang = currentLanguage) {
    const keys = key.split('.');
    const fallbackLang = 'en';
    let translation = i18n[lang];

    for (const segment of keys) {
        if (translation && Object.prototype.hasOwnProperty.call(translation, segment)) {
            translation = translation[segment];
        } else {
            translation = null;
            break;
        }
    }

    if (translation == null && lang !== fallbackLang) {
        return translate(key, params, fallbackLang);
    }

    if (typeof translation === 'string') {
        return formatTranslation(translation, params);
    }

    return key;
}

function translateElement(element) {
    const key = element.dataset.i18n;
    if (!key) return;

    const mode = element.dataset.i18nMode || 'text';
    const attr = element.dataset.i18nAttr;
    const translation = translate(key);

    if (attr) {
        element.setAttribute(attr, translation);
    } else if (mode === 'html') {
        element.innerHTML = translation;
    } else {
        element.textContent = translation;
    }
}

function updateFilterToggleUI() {
    if (!filtersContainer || !toggleFilters) return;

    const toggleText = document.getElementById('toggleFiltersText');
    const icon = document.getElementById('toggleFiltersIcon');
    const isCollapsed = filtersContainer.classList.contains('collapsed');

    if (toggleText) {
        toggleText.textContent = translate(isCollapsed ? 'filters.showFilters' : 'filters.hideFilters');
    }

    if (icon) {
        icon.classList.toggle('fa-chevron-down', isCollapsed);
        icon.classList.toggle('fa-chevron-up', !isCollapsed);
    }
}

function setFiltersCollapsed(isCollapsed) {
    if (!filtersContainer) return;
    filtersContainer.classList.toggle('collapsed', isCollapsed);
    updateFilterToggleUI();
}

function updateFilterExpanderButtons() {
    document.querySelectorAll('.filter-column .show-more-btn').forEach(button => {
        const column = button.closest('.filter-column');
        if (!column) return;
        const isExpanded = column.classList.contains('expanded');
        button.textContent = translate(isExpanded ? 'filters.showLess' : 'filters.showMore');
    });
}

function applyTranslations() {
    document.documentElement.setAttribute('lang', currentLanguage);
    document.title = translate('page.title');

    document.querySelectorAll('[data-i18n]').forEach(translateElement);

    if (languageToggle) {
        languageToggle.setAttribute('aria-label', translate('aria.languageToggle'));
    }

    if (mainSearchInput) {
        mainSearchInput.setAttribute('aria-label', translate('search.ariaLabel'));
    }

    updateFilterToggleUI();
    updateFilterExpanderButtons();
}

// Initialize DOM elements
    let searchInput, mainSearchInput, clearSearchBtn, sortSelect, tagFilters, categoryFilters, valuesList,
        matchAll, matchAny, toggleSlide, activeFilters, clearFilters, filterCount,
        toggleFilters, filtersContainer, valuesCount, alphaNav, alphaNavList, backToTop, languageToggle;

// Scroll spy observer reference
let scrollSpyObserver;

// Helper to calculate the offset for alpha navigation
function getAlphaNavOffset() {
    if (!alphaNav) return 0;
    const styles = getComputedStyle(alphaNav);
    const position = styles.position;
    const top = parseInt(styles.top, 10);
    const hasTopOffset = !Number.isNaN(top) && styles.top !== 'auto';

    let offset = 0;

    if ((position === 'sticky' || position === 'fixed') && hasTopOffset) {
        offset += top;
    }

    const offsetTargets = alphaNav.dataset.offsetTargets;
    if (offsetTargets) {
        offsetTargets.split(',').forEach(selector => {
            const target = document.querySelector(selector.trim());
            if (target) {
                const targetStyles = getComputedStyle(target);
                if (['sticky', 'fixed'].includes(targetStyles.position)) {
                    offset += target.offsetHeight;
                }
            }
        });
    }

    return offset;
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        showStatus(translate('statuses.appInitializing'));

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
        alphaNavList = alphaNav ? alphaNav.querySelector('.alpha-nav-list') : null;
        backToTop = document.getElementById('backToTop');
        languageToggle = document.getElementById('languageToggle');

        // Verify critical elements were found
        if (!valuesList) {
            throw new Error('Critical DOM elements could not be found');
        }

        applyTranslations();

        // Set up filter toggle
        setupFilterToggle();

        // Set up match type toggle
        setupMatchTypeToggle();

        // Set up search
        mainSearchInput.addEventListener('input', () => {
            filterState.searchTerm = mainSearchInput.value.toLowerCase();

            // Show/hide clear button
            if (filterState.searchTerm) {
                clearSearchBtn.style.display = 'block';
            } else {
                clearSearchBtn.style.display = 'none';
            }

            filterValues();
            updateActiveFilters();
        });

        // Clear search button
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

        // Set up clear filters button
        clearFilters.addEventListener('click', clearAllFilters);

        // Set up alphabetical navigation
        setupAlphaNav();

        // Set up back to top button
        setupBackToTop();

        // Set up language toggle
        setupLanguageToggle();

        // Initialize the app
        fetchValuesData(currentLanguage);

        showStatus(translate('statuses.appInitialized'));
    } catch (error) {
        console.error("Error initializing app:", error);
        showStatus(translate('statuses.appInitError', { message: error.message }), true);

        // Fallback initialization to ensure basic functionality
        fallbackInitialization();
    }
});

// Update active letter in alphabetical navigation
function setActiveLetter(letter) {
    if (!alphaNavList) return;

    const items = alphaNavList.querySelectorAll('.alpha-nav-item');
    items.forEach(item => {
        const isActive = item.dataset.letter === letter;
        item.classList.toggle('active', isActive);

        const link = item.querySelector('.alpha-nav-link');
        if (link) {
            if (isActive) {
                link.setAttribute('aria-current', 'true');
                link.classList.add('active');
            } else {
                link.removeAttribute('aria-current');
                link.classList.remove('active');
            }
        }
    });
}

// Setup alphabetical navigation
function setupAlphaNav() {
    if (!alphaNavList) return;

    // Refresh active alphabet for the current language
    activeAlphabet = getAlphabetForLanguage(currentLanguage);
    const alphabet = activeAlphabet;

    // Add each letter link
    alphaNavList.innerHTML = '';
    alphabet.forEach(letter => {
        const item = document.createElement('li');
        item.className = 'alpha-nav-item';

        const link = document.createElement('a');
        link.className = 'alpha-nav-link';
        link.href = `#section-${letter}`;
        link.textContent = letter;
        link.dataset.letter = letter;
        link.setAttribute('aria-label', `Jump to values that start with the letter ${letter}`);
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = document.getElementById(`section-${letter}`);
            if (section) {
                window.scrollTo({
                    top: Math.max(section.offsetTop - getAlphaNavOffset(), 0),
                    behavior: 'smooth'
                });
                setActiveLetter(letter);
            } else {
                // If section doesn't exist, find closest available section
                findClosestSection(letter);
            }
        });
        item.dataset.letter = letter;
        item.appendChild(link);
        alphaNavList.appendChild(item);
    });

    // Ensure scroll spy observers reflect the current alphabet sections
    setupScrollSpy();
}

// Find closest available section for a letter
function findClosestSection(letter) {
    const alphabet = activeAlphabet && activeAlphabet.length
        ? activeAlphabet
        : getAlphabetForLanguage(currentLanguage);
    const letterIndex = alphabet.indexOf(letter);

    if (letterIndex === -1) {
        return;
    }

    // Try next letters
    for (let i = letterIndex + 1; i < alphabet.length; i++) {
        const section = document.getElementById(`section-${alphabet[i]}`);
        if (section) {
            window.scrollTo({
                top: Math.max(section.offsetTop - getAlphaNavOffset(), 0),
                behavior: 'smooth'
            });
            setActiveLetter(alphabet[i]);
            return;
        }
    }

    // If no next letter, try previous letters
    for (let i = letterIndex - 1; i >= 0; i--) {
        const section = document.getElementById(`section-${alphabet[i]}`);
        if (section) {
            window.scrollTo({
                top: Math.max(section.offsetTop - getAlphaNavOffset(), 0),
                behavior: 'smooth'
            });
            setActiveLetter(alphabet[i]);
            return;
        }
    }
}

// Highlight current section letter in navigation
function setupScrollSpy() {
    if (!alphaNavList) return;

    const sections = document.querySelectorAll('.letter-section');

    if (scrollSpyObserver) {
        scrollSpyObserver.disconnect();
    }

    if (!sections.length) {
        setActiveLetter('');
        return;
    }

    let currentLetter = '';
    const sectionsArray = Array.from(sections);

    const updateActiveLetter = () => {
        const offset = getAlphaNavOffset();
        let nearestSection = sectionsArray[0];

        for (const section of sectionsArray) {
            const rect = section.getBoundingClientRect();
            if (rect.top - offset <= 0) {
                nearestSection = section;
            } else {
                break;
            }
        }

        if (nearestSection) {
            const letter = nearestSection.id.replace('section-', '');
            if (letter !== currentLetter) {
                currentLetter = letter;
                setActiveLetter(letter);
            }
        }
    };

    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0.4
    };

    scrollSpyObserver = new IntersectionObserver(() => {
        updateActiveLetter();
    }, observerOptions);

    sectionsArray.forEach(section => scrollSpyObserver.observe(section));

    updateActiveLetter();
}

// Setup back to top button
function setupBackToTop() {
    if (!backToTop) return;

    // Show back to top button when scrolled down
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    // Scroll to top when clicked
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Setup language toggle
function setupLanguageToggle() {
    if (!languageToggle) return;

    languageToggle.addEventListener('click', () => {
        currentLanguage = currentLanguage === 'en' ? 'es' : 'en';
        activeAlphabet = getAlphabetForLanguage(currentLanguage);
        setupAlphaNav();
        applyTranslations();

        const languageNameKey = currentLanguage === 'en' ? 'languages.english' : 'languages.spanish';
        showStatus(translate('statuses.loadingValues', { language: translate(languageNameKey) }));
        fetchValuesData(currentLanguage);
    });
}

// Update values count display
function updateValuesCount(count) {
    if (valuesCount) {
        valuesCount.textContent = typeof count === 'number' ? count : values.length;
    }
}

// Setup filter toggle button
function setupFilterToggle() {
    if (!toggleFilters || !filtersContainer) return;

    updateFilterToggleUI();

    toggleFilters.addEventListener('click', () => {
        filtersContainer.classList.toggle('collapsed');
        updateFilterToggleUI();
    });
}

// Setup match type toggle
function setupMatchTypeToggle() {
    matchAll.addEventListener('click', () => {
        if (!filterState.matchAll) {
            filterState.matchAll = true;
            toggleSlide.classList.remove('right');
            matchAll.classList.remove('opacity-75');
            matchAll.classList.add('text-purple-800');
            matchAny.classList.remove('text-purple-800');
            matchAny.classList.add('opacity-75');
            filterValues();
        }
    });

    matchAny.addEventListener('click', () => {
        if (filterState.matchAll) {
            filterState.matchAll = false;
            toggleSlide.classList.add('right');
            matchAny.classList.remove('opacity-75');
            matchAny.classList.add('text-purple-800');
            matchAll.classList.remove('text-purple-800');
            matchAll.classList.add('opacity-75');
            filterValues();
        }
    });
}

// Setup show more/less buttons for filter columns
function setupFilterExpanders() {
    document.querySelectorAll('.filter-column').forEach(column => {
        const button = column.querySelector('.show-more-btn');
        if (!button) return;

        const isOverflowing = column.scrollHeight > column.clientHeight;
        button.style.display = isOverflowing ? 'block' : 'none';
        const setLabel = () => {
            const key = column.classList.contains('expanded') ? 'filters.showLess' : 'filters.showMore';
            button.textContent = translate(key);
        };

        setLabel();

        button.onclick = () => {
            column.classList.toggle('expanded');
            setLabel();
        };
    });
}

// Clear all filters
function clearAllFilters() {
    // Reset filter state
    filterState.categories = [];
    filterState.tags = [];
    filterState.searchTerm = '';

    // Reset UI elements
    document.querySelectorAll('.tag.selected').forEach(tag => {
        tag.classList.remove('selected');
        if (tag.querySelector('.tag-icon')) {
            tag.querySelector('.tag-icon').remove();
        }
    });

    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        checkbox.checked = false;
    });

    if (mainSearchInput) mainSearchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';

    // Update UI
    updateActiveFilters();
    filterValues();

    showStatus(translate('statuses.allFiltersCleared'));
}

// Fallback initialization if there's an error
function fallbackInitialization() {
    console.log("Using fallback initialization...");

    // Create a fallback display of values
    if (valuesList) {
        const fallbackIntro = translate('messages.fallbackIntro');
        const exampleLabel = translate('valueCard.exampleLabel');
        const associatedLabel = translate('valueCard.associatedVerbsLabel');
        valuesList.innerHTML = `
            <div class="bg-yellow-100 p-4 rounded-md mb-4">
                <p>${fallbackIntro}</p>
            </div>
            <div class="space-y-4">
                ${values.map(value => `
                    <div class="p-4 bg-filter-bg rounded-md shadow-sm">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="text-lg font-semibold">${value.name}</h3>
                            <span class="text-sm opacity-75 category-badge">${value.category}</span>
                        </div>
                        <p class="mb-3">${value.description}</p>
                        <div class="value-example">
                            <div class="section-label"><i class="fas fa-lightbulb"></i> ${exampleLabel}</div>
                            ${value.example}
                        </div>
                        <div>
                            <div class="section-label"><i class="fas fa-tags"></i> ${associatedLabel}</div>
                            <div class="flex flex-wrap">
                                ${value.tags.map(tag => `
                                    <span class="tag">${tag}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Fetch values data from JSON file
async function fetchValuesData(lang = 'en') {
    try {
        const response = await fetch(`Values-${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        values = data.values; // Assign fetched values to the global 'values' array

        // Once data is fetched, initialize the dictionary
        initializeValuesDictionary();
        updateValuesCount();

    } catch (error) {
        console.error("Error fetching values data:", error);
        showStatus(translate('statuses.errorFetchingValues', { message: error.message }), true);
        // Attempt to load fallback or default data if primary fetch fails
        values = []; // Ensure values is empty if fetch fails
        initializeValuesDictionary(); // Initialize with empty or fallback data
        updateValuesCount();
    }
}

// Initialize value dictionary
function initializeValuesDictionary() {
    try {
        console.log("Initializing dictionary with", values.length, "values");

        // Update the active alphabet for the current language context
        activeAlphabet = getAlphabetForLanguage(currentLanguage);

        // Clear previous filters if any (important for language switching)
        if (categoryFilters) categoryFilters.innerHTML = '';
        if (tagFilters) tagFilters.innerHTML = '';


        // Filter out verbs that only appear once
        const verbCounts = {};
        values.forEach(value => {
            value.tags.forEach(tag => {
                verbCounts[tag] = (verbCounts[tag] || 0) + 1;
            });
        });

        // Update values to remove single-occurrence verbs
        values.forEach(value => {
            value.tags = value.tags.filter(tag => verbCounts[tag] > 1);
        });

        // Populate category filters
        if (categoryFilters) {
            // Get unique categories
            const categories = [...new Set(values.map(value => value.category))].sort(compareByName);

            // Create category filters
            categories.forEach(category => {
                const categoryContainer = document.createElement('div');
                categoryContainer.classList.add('flex', 'items-center');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `category-${category}`;
                checkbox.classList.add('mr-2', 'form-checkbox', 'h-4', 'w-4', 'text-purple-600', 'rounded');
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        if (!filterState.categories.includes(category)) {
                            filterState.categories.push(category);
                        }
                    } else {
                        filterState.categories = filterState.categories.filter(c => c !== category);
                    }
                    filterValues();
                    updateActiveFilters();
                });

                const label = document.createElement('label');
                label.htmlFor = `category-${category}`;
                label.textContent = category;
                label.classList.add('text-sm', 'select-none');

                // Count values in this category
                const count = values.filter(value => value.category === category).length;
                const countSpan = document.createElement('span');
                countSpan.textContent = `(${count})`;
                countSpan.classList.add('ml-1', 'text-xs', 'opacity-75');
                label.appendChild(countSpan);

                categoryContainer.appendChild(checkbox);
                categoryContainer.appendChild(label);
                categoryFilters.appendChild(categoryContainer);
            });
        }

        // Populate tag filters
        if (tagFilters) {
            // Collect all unique tags that appear multiple times
            const allTags = new Set();
            Object.entries(verbCounts).forEach(([tag, count]) => {
                if (count > 1) {
                    allTags.add(tag);
                }
            });

            // Create tag filters
            Array.from(allTags).sort(compareByName).forEach(tag => {
                const tagContainer = document.createElement('div');
                tagContainer.classList.add('flex', 'items-center');

                // Create tag element for filter section
                const tagElement = document.createElement('span');
                tagElement.textContent = tag;
                tagElement.classList.add('tag');
                tagElement.dataset.tag = tag;

                // Count values with this tag
                const count = values.filter(value => value.tags.includes(tag)).length;
                const countSpan = document.createElement('span');
                countSpan.textContent = `(${count})`;
                countSpan.classList.add('ml-1', 'text-xs', 'opacity-75');
                tagElement.appendChild(countSpan);

                // Add click event to toggle selection
                tagElement.addEventListener('click', () => {
                    tagElement.classList.toggle('selected');

                    if (tagElement.classList.contains('selected')) {
                        const icon = document.createElement('i');
                        icon.classList.add('fas', 'fa-check', 'tag-icon');
                        tagElement.prepend(icon);

                        if (!filterState.tags.includes(tag)) {
                            filterState.tags.push(tag);
                        }
                    } else {
                        const icon = tagElement.querySelector('.tag-icon');
                        if (icon) icon.remove();

                        filterState.tags = filterState.tags.filter(t => t !== tag);
                    }

                    filterValues();
                    updateActiveFilters();
                });

                tagFilters.appendChild(tagElement);
            });
        }

        // Initial display of values
        console.log("Displaying values...");
        filterValues();
        setupFilterExpanders();

        // Ensure the alphabetical navigation reflects the rendered content
        setupAlphaNav();

    } catch (error) {
        console.error("Error initializing dictionary:", error);
        showStatus(translate('statuses.errorLoadingDictionary'), true);

        // Try fallback
        if (valuesList) {
            const heading = translate('messages.errorLoadingDictionaryHeading');
            const hint = translate('messages.errorLoadingDictionaryHint');
            valuesList.innerHTML = `
                <div class="status-error p-4 rounded-md">
                    <h3 class="font-bold mb-2">${heading}</h3>
                    <p>${error.message}</p>
                    <p class="mt-2">${hint}</p>
                </div>
            `;
        }
    }
}

// Update active filters display
function updateActiveFilters() {
    if (!activeFilters || !clearFilters) return;

    const hasFilters = filterState.categories.length > 0 ||
                       filterState.tags.length > 0 ||
                       filterState.searchTerm;

    // Show/hide elements based on filters
    clearFilters.classList.toggle('hidden', !hasFilters);
    document.getElementById('noActiveFilters').style.display = hasFilters ? 'none' : 'block';

    // Clear existing active filters
    const filters = activeFilters.querySelectorAll('.active-filter');
    filters.forEach(filter => filter.remove());

    // Add category filters
    filterState.categories.forEach(category => {
        addActiveFilterBadge(category, 'category');
    });

    // Add tag filters
    filterState.tags.forEach(tag => {
        addActiveFilterBadge(tag, 'tag');
    });

    // Add search filter
    if (filterState.searchTerm) {
        addActiveFilterBadge(`"${filterState.searchTerm}"`, 'search');
    }
}

// Add active filter badge
function addActiveFilterBadge(text, type) {
    if (!activeFilters) return;

    const badge = document.createElement('div');
    badge.classList.add('active-filter', 'text-sm', 'rounded-full', 'px-3', 'py-1', 'flex', 'items-center', 'mr-2', 'mb-2');

    // Add icon based on type
    const icon = document.createElement('i');
    if (type === 'category') {
        icon.classList.add('fas', 'fa-folder');
    } else if (type === 'tag') {
        icon.classList.add('fas', 'fa-tag');
    } else if (type === 'search') {
        icon.classList.add('fas', 'fa-search');
    }
    icon.classList.add('mr-1', 'opacity-75');
    badge.appendChild(icon);

    // Add text
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    badge.appendChild(textSpan);

    // Add remove button
    const removeButton = document.createElement('button');
    removeButton.classList.add('ml-1', 'text-gray-600', 'hover:text-gray-800');
    removeButton.innerHTML = '<i class="fas fa-times-circle"></i>';
    removeButton.addEventListener('click', () => {
        if (type === 'category') {
            filterState.categories = filterState.categories.filter(c => c !== text);
            // Update checkbox
            const checkbox = document.getElementById(`category-${text}`);
            if (checkbox) checkbox.checked = false;
        } else if (type === 'tag') {
            filterState.tags = filterState.tags.filter(t => t !== text);
            // Update tag
            updateTagSelection(text, false);
        } else if (type === 'search') {
            filterState.searchTerm = '';
            if (mainSearchInput) mainSearchInput.value = '';
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        }

        filterValues();
        updateActiveFilters();
    });
    badge.appendChild(removeButton);

    activeFilters.appendChild(badge);
}

// Update tag selection state
function updateTagSelection(tag, isSelected) {
    // Update tag in filter section
    const tagElements = tagFilters.querySelectorAll('.tag');
    tagElements.forEach(tagElement => {
        if (tagElement.dataset.tag === tag) {
            tagElement.classList.toggle('selected', isSelected);

            if (isSelected && !tagElement.querySelector('.tag-icon')) {
                const icon = document.createElement('i');
                icon.classList.add('fas', 'fa-check', 'tag-icon');
                tagElement.prepend(icon);
            } else if (!isSelected) {
                const icon = tagElement.querySelector('.tag-icon');
                if (icon) icon.remove();
            }
        }
    });
}

// Highlight a tag in the filter section
function highlightTag(tagName) {
    try {
        console.log("Highlighting tag:", tagName);

        // Check if tag is already in filters
        if (filterState.tags.includes(tagName)) {
            // Just focus on the existing tag
            const tagElement = Array.from(tagFilters.querySelectorAll('.tag'))
                .find(el => el.dataset.tag === tagName);

            if (tagElement) {
                tagElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add a pulsing animation
                tagElement.classList.add('animate-pulse');
                setTimeout(() => {
                    tagElement.classList.remove('animate-pulse');
                }, 2000);
            }

            return;
        }

        // Add the tag to filters
        filterState.tags.push(tagName);

        // Update UI
        updateTagSelection(tagName, true);
        updateActiveFilters();
        filterValues();

        // Find and highlight the tag element
        const tagElement = Array.from(tagFilters.querySelectorAll('.tag'))
            .find(el => el.dataset.tag === tagName);

        if (tagElement) {
            // Ensure filters are visible
            setFiltersCollapsed(false);

            // Scroll to tag and highlight
            tagElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            tagElement.classList.add('animate-pulse');
            setTimeout(() => {
                tagElement.classList.remove('animate-pulse');
            }, 2000);
        }

        // Show status
        showStatus(translate('statuses.showingTaggedValues', { tag: tagName }));

    } catch (error) {
        console.error("Error highlighting tag:", error);
        showStatus(translate('statuses.errorHighlightingTag', { message: error.message }), true);
    }
}

// Widen filters to include a specific value
function widenFiltersForValue(valueName) {
    const value = values.find(v => v.name === valueName);
    if (!value) return;

    // Save current filters for undo
    const previousFilterState = JSON.parse(JSON.stringify(filterState));

    // Widen filters
    if (!filterState.categories.includes(value.category)) {
        filterState.categories.push(value.category);
    }
    value.tags.forEach(tag => {
        if (!filterState.tags.includes(tag)) {
            filterState.tags.push(tag);
        }
    });

    // Update UI
    updateActiveFilters();
    filterValues();

    // Show status with undo
    showStatus(translate('statuses.filtersWidened', { value: valueName }), false, {
        text: translate('actions.undo'),
        onClick: () => {
            // Restore previous filters
            Object.assign(filterState, previousFilterState);
            updateActiveFilters();
            filterValues();
            showStatus(translate('statuses.filtersRestored'));
        }
    });

    // Scroll to the value
    const relatedValueCard = Array.from(valuesList.querySelectorAll('.value-card'))
        .find(card => card.querySelector(`h3[data-value="${valueName}"]`));

    if (relatedValueCard) {
        relatedValueCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        relatedValueCard.classList.add('ring-2', 'ring-indigo-500');
        setTimeout(() => {
            relatedValueCard.classList.remove('ring-2', 'ring-indigo-500');
        }, 2000);
    }
}

// Find related values based on shared tags
function findRelatedValues(value) {
    const related = [];

    values.forEach(otherValue => {
        if (otherValue.name === value.name) return;

        // Find shared tags
        const sharedTags = otherValue.tags.filter(tag => value.tags.includes(tag));

        if (sharedTags.length > 0) {
            related.push({
                name: otherValue.name,
                category: otherValue.category,
                matchCount: sharedTags.length,
                matchPercent: Math.round((sharedTags.length / Math.max(value.tags.length, otherValue.tags.length)) * 100),
                sharedTags
            });
        }
    });

    // Sort by number of matches (descending)
    related.sort((a, b) => b.matchCount - a.matchCount);

    // Return top 3
    return related.slice(0, 3);
}

// Display values in the dictionary
function displayValues(valuesToDisplay) {
    try {
        console.log("Displaying", valuesToDisplay.length, "values");
        if (!valuesList) return;

        valuesList.innerHTML = '';

        // Update the count of filtered values
        updateValuesCount(valuesToDisplay.length);

        if (valuesToDisplay.length === 0) {
            const noResults = document.createElement('div');
            noResults.classList.add('p-8', 'text-center');

            const icon = document.createElement('i');
            icon.classList.add('fas', 'fa-search', 'opacity-25', 'text-5xl', 'mb-4');

            const message = document.createElement('p');
            message.textContent = translate('messages.noResults');
            message.classList.add('opacity-75', 'text-lg', 'mb-4');

            const suggestion = document.createElement('p');
            suggestion.textContent = translate('messages.suggestion');
            suggestion.classList.add('opacity-50', 'text-sm');

            const resetButton = document.createElement('button');
            resetButton.textContent = translate('messages.resetFilters');
            resetButton.classList.add('mt-4', 'reset-btn');
            resetButton.addEventListener('click', clearAllFilters);

            noResults.appendChild(icon);
            noResults.appendChild(message);
            noResults.appendChild(suggestion);
            noResults.appendChild(resetButton);

            valuesList.appendChild(noResults);
            return;
        }

        // Group values by first letter for alphabetical sections
        const valuesByLetter = {};
        valuesToDisplay.forEach(value => {
            const normalizedLetter = normalizeInitialLetter(value.name);
            if (!valuesByLetter[normalizedLetter]) {
                valuesByLetter[normalizedLetter] = [];
            }
            valuesByLetter[normalizedLetter].push(value);
        });

        Object.values(valuesByLetter).forEach(valuesForLetter => {
            valuesForLetter.sort((a, b) => compareByName(a.name, b.name));
        });

        const alphabetReference = activeAlphabet && activeAlphabet.length
            ? activeAlphabet
            : getAlphabetForLanguage(currentLanguage);
        const alphabetOrder = alphabetReference.reduce((order, letter, index) => {
            order[letter] = index;
            return order;
        }, {});

        const sortedLetters = Object.keys(valuesByLetter).sort((a, b) => {
            const indexA = alphabetOrder[a];
            const indexB = alphabetOrder[b];

            if (indexA !== undefined || indexB !== undefined) {
                const safeIndexA = indexA === undefined ? Number.POSITIVE_INFINITY : indexA;
                const safeIndexB = indexB === undefined ? Number.POSITIVE_INFINITY : indexB;

                if (safeIndexA !== safeIndexB) {
                    return safeIndexA - safeIndexB;
                }
            }

            return compareByName(a, b);
        });

        // Create sections for each letter
        sortedLetters.forEach(letter => {
            // Create section header
            const sectionHeader = document.createElement('div');
            sectionHeader.id = `section-${letter}`;
            sectionHeader.classList.add('text-2xl', 'font-bold', 'mt-8', 'mb-4', 'py-2', 'border-b', 'border-gray-300', 'letter-section');
            sectionHeader.textContent = letter;
            valuesList.appendChild(sectionHeader);

            // Add values for this letter
            valuesByLetter[letter].forEach(value => {
                const card = document.createElement('div');
                card.classList.add('value-card', 'p-4', 'rounded-md', 'shadow-sm', 'mb-4');

                const header = document.createElement('div');
                header.classList.add('flex', 'justify-between', 'items-center', 'mb-2');

                const title = document.createElement('h3');
                title.textContent = value.name;
                title.dataset.value = value.name; // Add for related value navigation
                title.classList.add('text-lg', 'font-semibold');

                const category = document.createElement('span');
                category.textContent = value.category;
                category.classList.add('category-badge');
                category.addEventListener('click', () => {
                    // Add category to filters
                    if (!filterState.categories.includes(value.category)) {
                        filterState.categories.push(value.category);
                        // Update checkbox
                        const checkbox = document.getElementById(`category-${value.category}`);
                        if (checkbox) checkbox.checked = true;
                        filterValues();
                        updateActiveFilters();

                        // Show status
                        showStatus(translate('statuses.showingCategory', { category: value.category }));
                    }
                });

                header.appendChild(title);
                header.appendChild(category);

                const description = document.createElement('p');
                description.textContent = value.description;
                description.classList.add('mb-4', 'value-description');

                // Create content container (for collapsible functionality)
                const contentContainer = document.createElement('div');
                contentContainer.classList.add('value-card-content');

                // Add the example of value in action with label
                const exampleContainer = document.createElement('div');
                exampleContainer.classList.add('mb-4');

                const exampleLabel = document.createElement('div');
                exampleLabel.innerHTML = `<i class="fas fa-lightbulb"></i> ${translate('valueCard.exampleLabel')}`;
                exampleLabel.classList.add('section-label');
                exampleContainer.appendChild(exampleLabel);

                const example = document.createElement('div');
                example.textContent = value.example;
                example.classList.add('value-example');
                exampleContainer.appendChild(example);

                contentContainer.appendChild(exampleContainer);

                // Add tags with label
                const tagsSection = document.createElement('div');
                tagsSection.classList.add('mb-3');

                const tagsLabel = document.createElement('div');
                tagsLabel.innerHTML = `<i class="fas fa-tags"></i> ${translate('valueCard.associatedVerbsLabel')}`;
                tagsLabel.classList.add('section-label');
                tagsSection.appendChild(tagsLabel);

                const tagsContainer = document.createElement('div');
                tagsContainer.classList.add('flex', 'flex-wrap');

                value.tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.textContent = tag;
                    tagElement.classList.add('tag', 'hover:bg-indigo-100', 'cursor-pointer');
                    tagElement.title = translate('valueCard.showAllWithTag', { tag });
                    // Add click event to filter by this tag
                    tagElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Find this tag in the filter section and activate it
                        highlightTag(tag);
                    });
                    tagsContainer.appendChild(tagElement);
                });

                tagsSection.appendChild(tagsContainer);
                contentContainer.appendChild(tagsSection);

                // Add related values section
                const relatedValues = findRelatedValues(value);
                if (relatedValues.length > 0) {
                    const relatedSection = document.createElement('div');
                    relatedSection.classList.add('mb-3');

                    const relatedLabel = document.createElement('div');
                    relatedLabel.innerHTML = `<i class="fas fa-link"></i> ${translate('valueCard.relatedValuesLabel')}`;
                    relatedLabel.classList.add('section-label');
                    relatedSection.appendChild(relatedLabel);

                    const relatedGrid = document.createElement('div');
                    relatedGrid.classList.add('related-values-grid');

                    relatedValues.forEach(related => {
                        const relatedCard = document.createElement('div');
                        relatedCard.classList.add('related-value-card');

                        const relatedName = document.createElement('div');
                        relatedName.textContent = related.name;
                        relatedName.classList.add('related-value-name');

                        const sharedTagsContainer = document.createElement('div');
                        sharedTagsContainer.classList.add('shared-tags');

                        // Add a subset of shared tags (up to 3)
                        const tagsToShow = related.sharedTags.slice(0, 3);
                        tagsToShow.forEach(tag => {
                            const tagElement = document.createElement('span');
                            tagElement.textContent = tag;
                            tagElement.classList.add('shared-tag');
                            sharedTagsContainer.appendChild(tagElement);
                        });

                        // Add tooltip that appears on hover
                        const tooltip = document.createElement('div');
                        tooltip.textContent = translate('valueCard.clickToView');
                        tooltip.classList.add('related-tooltip');

                        relatedCard.appendChild(relatedName);
                        relatedCard.appendChild(sharedTagsContainer);
                        relatedCard.appendChild(tooltip);

                        // Add click event to navigate to related value
                        relatedCard.addEventListener('click', () => {
                            const relatedValueCard = Array.from(valuesList.querySelectorAll('.value-card'))
                                .find(card => card.querySelector(`h3[data-value="${related.name}"]`));

                            if (relatedValueCard) {
                                relatedValueCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Highlight the card
                                relatedValueCard.classList.add('ring-2', 'ring-indigo-500');
                                setTimeout(() => {
                                    relatedValueCard.classList.remove('ring-2', 'ring-indigo-500');
                                }, 2000);

                                // Expand the card if it's collapsed
                                if (!relatedValueCard.classList.contains('expanded')) {
                                    relatedValueCard.querySelector('.value-card-toggle').click();
                                }
                            } else {
                                // If the card is not visible, widen the filters
                                widenFiltersForValue(related.name);
                            }
                        });

                        relatedGrid.appendChild(relatedCard);
                    });

                    relatedSection.appendChild(relatedGrid);
                    contentContainer.appendChild(relatedSection);
                }

                // Add toggle button
                const toggleButton = document.createElement('div');
                toggleButton.classList.add('value-card-toggle');
                toggleButton.setAttribute('role', 'button');
                toggleButton.setAttribute('tabindex', '0');
                toggleButton.setAttribute('aria-expanded', 'false');

                const toggleLabel = document.createElement('span');
                toggleLabel.classList.add('value-card-toggle__label');
                toggleLabel.textContent = translate('valueCard.readMore');

                const toggleIcon = document.createElement('i');
                toggleIcon.classList.add('fas', 'fa-chevron-down');

                toggleButton.appendChild(toggleLabel);
                toggleButton.appendChild(toggleIcon);

                const updateToggleState = (isExpanded) => {
                    toggleLabel.textContent = isExpanded ? translate('valueCard.readLess') : translate('valueCard.readMore');
                    toggleIcon.classList.toggle('fa-chevron-up', isExpanded);
                    toggleIcon.classList.toggle('fa-chevron-down', !isExpanded);
                    toggleButton.setAttribute('aria-expanded', String(isExpanded));
                };

                toggleButton.addEventListener('click', () => {
                    card.classList.toggle('expanded');
                    updateToggleState(card.classList.contains('expanded'));
                });

                toggleButton.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleButton.click();
                    }
                });

                card.appendChild(header);
                card.appendChild(description);
                card.appendChild(contentContainer);
                card.appendChild(toggleButton);

                valuesList.appendChild(card);
            });
        });

        // Add anchor for bottom of page
        const bottomAnchor = document.createElement('div');
        bottomAnchor.id = 'bottom';
        valuesList.appendChild(bottomAnchor);

        // Set up scroll spy for active letter display
        setupScrollSpy();

        console.log("Values displayed successfully");
    } catch (error) {
        console.error("Error displaying values:", error);

        if (valuesList) {
            const heading = translate('messages.errorDisplayingHeading');
            const listHeading = translate('messages.valuesListHeading');
            valuesList.innerHTML = `
                <div class="status-error p-4 rounded-md">
                    <h3 class="font-bold mb-2">${heading}</h3>
                    <p>${error.message}</p>
                </div>

                <!-- Fallback display -->
                <div class="mt-6">
                    <h3 class="text-lg font-semibold mb-4">${listHeading}</h3>
                    <ul class="list-disc pl-5 space-y-2">
                        ${values.map(v => `<li>${v.name} - ${v.category}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }
}

// Filter values based on search input and selected tags/categories
function filterValues() {
    try {
        console.log("Filtering values...", filterState);

        let filtered = values;

        // Filter by search term
        if (filterState.searchTerm) {
            filtered = filtered.filter(value => {
                const nameMatch = value.name.toLowerCase().includes(filterState.searchTerm);
                const descriptionMatch = value.description.toLowerCase().includes(filterState.searchTerm);
                const exampleMatch = value.example.toLowerCase().includes(filterState.searchTerm);
                const tagMatch = value.tags.some(tag => tag.toLowerCase().includes(filterState.searchTerm));
                return nameMatch || descriptionMatch || exampleMatch || tagMatch;
            });
        }

        // Filter by categories
        if (filterState.categories.length > 0) {
            filtered = filtered.filter(value =>
                filterState.categories.includes(value.category)
            );
        }

        // Filter by tags
        if (filterState.tags.length > 0) {
            if (filterState.matchAll) {
                // Match ALL tags (AND logic)
                filtered = filtered.filter(value =>
                    filterState.tags.every(tag => value.tags.includes(tag))
                );
            } else {
                // Match ANY tag (OR logic)
                filtered = filtered.filter(value =>
                    filterState.tags.some(tag => value.tags.includes(tag))
                );
            }
        }

        // Sort results
        if (filterState.sortMethod === 'name') {
            filtered.sort((a, b) => compareByName(a.name, b.name));
        } else if (filterState.sortMethod === 'category') {
            filtered.sort((a, b) => compareByName(a.category, b.category) || compareByName(a.name, b.name));
        }

        console.log("Found", filtered.length, "matching values");
        displayValues(filtered);

    } catch (error) {
        console.error("Error filtering values:", error);
        showStatus(translate('statuses.errorFilteringValues'), true);

        // Display all values as fallback
        displayValues(values);
    }
}
