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
let valuesDataCache = {};
const valuesDataPromises = {};
let valuesLoadedLanguage = null;
let lazyValuesLoadTriggered = false;
let valuesDataReady = false;

// Filter state
const filterState = {
    categories: [],
    tags: [],
    searchTerm: '',
    matchAll: false, // true for ALL (AND), false for ANY (OR)
    sortMethod: 'name'
};
let selectedVerb = null;

const filterAccordionSections = [];
const accordionMediaQuery = window.matchMedia('(max-width: 767px)');
let currentAccordionSection = null;
const mobileAlphaNavMediaQuery = window.matchMedia('(max-width: 1023px)');
const ALPHA_NAV_TOGGLE_STORAGE_KEY = 'alphaNavTogglePosition';
const ALPHA_NAV_TOGGLE_MARGIN = 12;
const ALPHA_NAV_DRAG_THRESHOLD = 5;
let heroMenuOpen = false;
let activeHeroTarget = 'menu';
let alphaOverlayLastFocus = null;
let alphaOverlayFocusable = [];
let filtersSheetBackdrop;
let filtersSheetHeader;
let filtersSheetClose;
let filtersSheetApply;
let filtersSheetReset;
let filtersSheetSummary;
let lastFiltersSheetTrigger = null;

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

const DIACRITIC_PATTERN = /\p{Diacritic}/gu;

function normalizeSearchText(value, lang = currentLanguage) {
    if (!value) {
        return '';
    }

    return value
        .toLocaleLowerCase(lang)
        .normalize('NFD')
        .replace(DIACRITIC_PATTERN, '');
}

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
            introDescription: 'This dictionary helps you see values as everyday actions. Each value includes verbs that show how we practice and express it in real life.<br><br>',
            introInstructions: 'Search for a value or browse by category and verb. Open a card to read a quick description, an example, and related values with similar energy.'
        },
        buttons: {
            languageToggle: 'En español'
        },
        aria: {
            languageToggle: 'Switch language',
            alphaNav: 'Alphabetical navigation',
            heroMenuOpen: 'Open quick menu',
            heroMenuClose: 'Close quick menu'
        },
        alphaNav: {
            overlayHint: 'Jump to a letter to browse matching values.',
            closeLabel: 'Close navigation'
        },
        search: {
            placeholder: 'Search values...',
            ariaLabel: 'Search values',
            valuesLabel: 'Values'
        },
        filters: {
            matchType: 'Verb match',
            matchAll: 'Match all selected verbs',
            matchAny: 'Match any selected verb',
            sortBy: 'Sort',
            sortName: 'Name',
            sortCategory: 'Category',
            categories: 'Categories',
            verbs: 'Verbs',
            verbsCaption: 'tags',
            categorySearchPlaceholder: 'Search categories',
            tagSearchPlaceholder: 'Search verbs',
            activeFilters: 'Active Filters',
            showFilters: 'Show Filters',
            hideFilters: 'Hide Filters',
            showMore: 'Show More',
            showLess: 'Show Less',
            noActiveFilters: 'No active filters',
            noFiltersSelected: 'No filters selected',
            singleFilterSelected: '({{count}}) Filter Selected',
            multipleFiltersSelected: '({{count}}) Filters Selected',
            clearAll: 'Clear All Filters',
            sheetTitle: 'Filter & Sort',
            openSheet: 'Filter & Sort',
            closeSheet: 'Close Filters',
            reset: 'Reset',
            apply: 'Apply',
            collapsedHint: 'Filters are hidden. Select “Show filters” to update your list.'
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
            showAllWithTag: 'Show all values tagged with "{{tag}}"',
            verbFilterAllVerbs: 'All verbs',
            verbFilterClear: 'See all verbs',
            verbFilterShowing: 'Showing values associated with "{{verb}}".'
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
            introDescription: 'Este diccionario te muestra cómo los valores se viven en el día a día. Cada valor incluye verbos que explican cómo lo ponemos en práctica y lo expresamos en la vida real.<br><br>',
            introInstructions: 'Busca un valor o explora por categoría y verbo. Abre una tarjeta para leer una breve descripción, un ejemplo y valores relacionados con energía similar.'
        },
        buttons: {
            languageToggle: 'In English'
        },
        aria: {
            languageToggle: 'Cambiar idioma',
            alphaNav: 'Navegación alfabética',
            heroMenuOpen: 'Abrir menú flotante',
            heroMenuClose: 'Cerrar menú flotante'
        },
        alphaNav: {
            overlayHint: 'Elige una letra para explorar los valores relacionados.',
            closeLabel: 'Cerrar navegación'
        },
        search: {
            placeholder: 'Busca valores por nombre, descripción o ejemplo...',
            ariaLabel: 'Buscar valores',
            valuesLabel: 'Valores'
        },
        filters: {
            matchType: 'Coincidencia de verbos',
            matchAll: 'Coincidir con todos los verbos',
            matchAny: 'Coincidir con cualquier verbo',
            sortBy: 'Ordenar',
            sortName: 'Nombre',
            sortCategory: 'Categoría',
            categories: 'Categorías',
            verbs: 'Verbos',
            verbsCaption: 'etiquetas',
            categorySearchPlaceholder: 'Buscar categorías',
            tagSearchPlaceholder: 'Buscar verbos',
            activeFilters: 'Filtros activos',
            showFilters: 'Mostrar filtros',
            hideFilters: 'Ocultar filtros',
            showMore: 'Mostrar más',
            showLess: 'Mostrar menos',
            noActiveFilters: 'No hay filtros activos',
            noFiltersSelected: 'No hay filtros seleccionados',
            singleFilterSelected: '({{count}}) filtro seleccionado',
            multipleFiltersSelected: '({{count}}) filtros seleccionados',
            clearAll: 'Borrar todos los filtros',
            sheetTitle: 'Filtrar y ordenar',
            openSheet: 'Filtrar y ordenar',
            closeSheet: 'Cerrar filtros',
            reset: 'Restablecer',
            apply: 'Aplicar',
            collapsedHint: 'Los filtros están ocultos. Selecciona «Mostrar filtros» para actualizar la lista.'
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
            showAllWithTag: 'Mostrar todos los valores etiquetados con "{{tag}}"',
            verbFilterAllVerbs: 'Todos los verbos',
            verbFilterClear: 'Ver todos los verbos',
            verbFilterShowing: 'Mostrando valores asociados con "{{verb}}".'
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

const translationCache = new Map();

function formatTranslation(template, params = {}) {
    if (typeof template !== 'string') return '';
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : '';
    });
}

function translate(key, params = {}, lang = currentLanguage) {
    const cacheKey = `${lang}::${key}::${JSON.stringify(params)}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

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

    let result;

    if (typeof translation === 'string') {
        result = formatTranslation(translation, params);
    } else {
        result = key;
    }

    translationCache.set(cacheKey, result);
    return result;
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
    const isMobile = accordionMediaQuery.matches;
    const sheetOpen = isFiltersSheetOpen();

    if (toggleText) {
        if (isMobile) {
            toggleText.textContent = translate(sheetOpen ? 'filters.closeSheet' : 'filters.openSheet');
        } else {
            toggleText.textContent = translate(isCollapsed ? 'filters.showFilters' : 'filters.hideFilters');
        }
    }

    if (icon) {
        if (isMobile) {
            icon.style.display = 'none';
        } else {
            icon.style.display = '';
            icon.classList.toggle('fa-chevron-down', isCollapsed);
            icon.classList.toggle('fa-chevron-up', !isCollapsed);
        }
    }

    if (filtersCollapsedHint) {
        const hintVisible = !isMobile && isCollapsed;
        filtersCollapsedHint.classList.toggle('is-visible', hintVisible);
        filtersCollapsedHint.setAttribute('aria-hidden', hintVisible ? 'false' : 'true');
        if (hintVisible && filtersContainer) {
            filtersCollapsedHint.setAttribute('data-related-control', filtersContainer.id);
        } else {
            filtersCollapsedHint.removeAttribute('data-related-control');
        }
    }

    toggleFilters.setAttribute('aria-expanded', isMobile ? (sheetOpen ? 'true' : 'false') : (!isCollapsed ? 'true' : 'false'));
}

function setFiltersCollapsed(isCollapsed) {
    if (!filtersContainer) return;
    if (accordionMediaQuery.matches) {
        if (isCollapsed) {
            closeFiltersSheet({ restoreFocus: false, skipToggleUpdate: true });
        } else {
            openFiltersSheet({ restoreFocus: false, skipToggleUpdate: true });
        }
        updateFilterToggleUI();
        return;
    }

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

function updateHeroPillLayout() {
    if (!heroPillTray) return;
    const reference = introBox || mainSearchContainer;
    const rect = reference ? reference.getBoundingClientRect() : null;
    const topOffset = rect ? rect.bottom + 8 : 120;
    const clamped = Math.min(Math.max(topOffset, 24), window.innerHeight - 120);
    document.documentElement.style.setProperty('--hero-pills-top', `${Math.round(clamped)}px`);
}

function setHeroActiveTarget(target) {
    activeHeroTarget = target;

    if (heroPillButtons && heroPillButtons.length) {
        heroPillButtons.forEach(button => {
            const isActive = button.dataset.heroTarget === target;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    if (heroNotesPane) {
        heroNotesPane.classList.toggle('is-visible', target === 'notes');
    }
}

function pulseHeroPill(button) {
    if (!button) return;
    button.classList.remove('hero-pill--pulse');
    // Force reflow for restart
    void button.offsetWidth;
    button.classList.add('hero-pill--pulse');
}

function openHeroMenu({ initialTarget = 'menu' } = {}) {
    heroMenuOpen = true;
    if (heroControls) {
        heroControls.classList.add('hero-controls--open');
    }
    if (heroPillTray) {
        heroPillTray.setAttribute('aria-hidden', 'false');
    }
    if (heroPaneBackdrop) {
        heroPaneBackdrop.classList.add('is-active');
    }

    resetAlphaNavTogglePosition();
    updateHeroPillLayout();
    setHeroActiveTarget(initialTarget);

    if (alphaNavToggle) {
        alphaNavToggle.setAttribute('aria-expanded', 'true');
        alphaNavToggle.setAttribute('aria-label', translate('aria.heroMenuClose'));
    }
}

function closeHeroMenu({ skipFiltersSheetClose = false } = {}) {
    heroMenuOpen = false;
    if (heroControls) {
        heroControls.classList.remove('hero-controls--open');
    }
    if (heroPillTray) {
        heroPillTray.setAttribute('aria-hidden', 'true');
    }
    if (heroPaneBackdrop) {
        heroPaneBackdrop.classList.remove('is-active');
    }

    setHeroActiveTarget('menu');
    closeAlphaOverlay({ restoreFocus: false });
    if (accordionMediaQuery.matches && !skipFiltersSheetClose) {
        closeFiltersSheet({ restoreFocus: false, skipToggleUpdate: false });
    }
    restoreAlphaNavTogglePositionFromStorage();

    if (alphaNavToggle) {
        alphaNavToggle.setAttribute('aria-expanded', 'false');
        alphaNavToggle.setAttribute('aria-label', translate('aria.heroMenuOpen'));
    }
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

    if (mobileSearchInput) {
        mobileSearchInput.setAttribute('aria-label', translate('search.ariaLabel'));
    }

    if (alphaNavToggle) {
        const labelKey = heroMenuOpen ? 'aria.heroMenuClose' : 'aria.heroMenuOpen';
        alphaNavToggle.setAttribute('aria-label', translate(labelKey));
    }

    updateFilterToggleUI();
    updateFilterExpanderButtons();
}

function updateSearchClearButtons(hasValue) {
    const shouldShow = typeof hasValue === 'boolean' ? hasValue : Boolean(filterState.searchTerm);

    if (clearSearchBtn) {
        clearSearchBtn.style.display = shouldShow ? 'block' : 'none';
    }

    if (mobileSearchClear) {
        mobileSearchClear.style.display = shouldShow ? 'block' : 'none';
    }
}

function setSearchTerm(value, { sourceInput = null, updateUI = true } = {}) {
    const term = value ?? '';
    filterState.searchTerm = term.toLowerCase();

    if (mainSearchInput && mainSearchInput !== sourceInput) {
        mainSearchInput.value = term;
    }

    if (mobileSearchInput && mobileSearchInput !== sourceInput) {
        mobileSearchInput.value = term;
    }

    updateSearchClearButtons(Boolean(term));

    if (updateUI) {
        filterValues();
        updateActiveFilters();
    }
}

function clearSearchTerm({ updateUI = true } = {}) {
    setSearchTerm('', { updateUI });
}

// Initialize DOM elements
    let searchInput, mainSearchInput, mainSearchContainer, clearSearchBtn, mobileSearchInput, mobileSearchClear,
        sortSelect, tagFilters, categoryFilters, valuesList, matchAll, matchAny, toggleSlide,
        activeFilters, clearFilters, filterCount, toggleFilters, filtersContainer, valuesCount,
        alphaNav, alphaNavList, alphaNavToggle, alphaNavOverlay, alphaNavOverlayList,
        alphaNavOverlayClose, backToTop, languageToggle, filtersSheetTitle, filtersCollapsedHint,
        categoryFilterSearch, tagFilterSearch, heroControls, heroPillTray, heroNotesPane,
        heroPaneBackdrop, heroPillButtons, introBox;

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

function clampAlphaNavTogglePosition(left, top) {
    if (!alphaNavToggle) {
        return { left, top };
    }

    const toggleWidth = alphaNavToggle.offsetWidth;
    const toggleHeight = alphaNavToggle.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const maxLeft = Math.max(viewportWidth - toggleWidth - ALPHA_NAV_TOGGLE_MARGIN, ALPHA_NAV_TOGGLE_MARGIN);
    const maxTop = Math.max(viewportHeight - toggleHeight - ALPHA_NAV_TOGGLE_MARGIN, ALPHA_NAV_TOGGLE_MARGIN);

    return {
        left: Math.min(Math.max(left, ALPHA_NAV_TOGGLE_MARGIN), maxLeft),
        top: Math.min(Math.max(top, ALPHA_NAV_TOGGLE_MARGIN), maxTop)
    };
}

function applyAlphaNavTogglePosition(left, top) {
    if (!alphaNavToggle) {
        return null;
    }

    const clamped = clampAlphaNavTogglePosition(left, top);
    alphaNavToggle.style.left = `${clamped.left}px`;
    alphaNavToggle.style.top = `${clamped.top}px`;
    alphaNavToggle.style.right = 'auto';
    alphaNavToggle.style.bottom = 'auto';
    alphaNavToggle.style.transform = 'none';
    alphaNavToggle.classList.add('alpha-nav-toggle--dragged');
    return clamped;
}

function resetAlphaNavTogglePosition() {
    if (!alphaNavToggle) {
        return;
    }

    alphaNavToggle.style.left = '';
    alphaNavToggle.style.top = '';
    alphaNavToggle.style.right = '';
    alphaNavToggle.style.bottom = '';
    alphaNavToggle.style.transform = '';
    alphaNavToggle.classList.remove('alpha-nav-toggle--dragged');
    alphaNavToggle.classList.remove('alpha-nav-toggle--dragging');
}

function restoreAlphaNavTogglePositionFromStorage() {
    if (!alphaNavToggle || !mobileAlphaNavMediaQuery.matches) {
        return;
    }

    try {
        const stored = localStorage.getItem(ALPHA_NAV_TOGGLE_STORAGE_KEY);
        if (!stored) {
            return;
        }

        const { left, top } = JSON.parse(stored);
        if (typeof left === 'number' && typeof top === 'number') {
            applyAlphaNavTogglePosition(left, top);
        }
    } catch (error) {
        console.warn('Failed to restore alpha nav toggle position:', error);
    }
}

function setupAlphaNavToggleDrag() {
    if (!alphaNavToggle) {
        return;
    }

    const dragLongPressDelay = 450;

    restoreAlphaNavTogglePositionFromStorage();

    let pointerDown = false;
    let isDragging = false;
    let dragReady = false;
    let pointerId = null;
    let offsetX = 0;
    let offsetY = 0;
    let startX = 0;
    let startY = 0;
    let shouldCancelClick = false;
    let longPressTimer = null;

    const clearLongPress = () => {
        if (longPressTimer) {
            window.clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    const startLongPressTimer = () => {
        clearLongPress();
        longPressTimer = window.setTimeout(() => {
            if (!pointerDown) {
                return;
            }
            dragReady = true;
        }, dragLongPressDelay);
    };

    const persistPosition = () => {
        if (!alphaNavToggle) {
            return;
        }

        const rect = alphaNavToggle.getBoundingClientRect();
        const clamped = applyAlphaNavTogglePosition(rect.left, rect.top);
        if (!clamped) {
            return;
        }

        try {
            localStorage.setItem(ALPHA_NAV_TOGGLE_STORAGE_KEY, JSON.stringify(clamped));
        } catch (error) {
            console.warn('Failed to store alpha nav toggle position:', error);
        }
    };

    const handlePointerDown = (event) => {
        if (!mobileAlphaNavMediaQuery.matches) {
            return;
        }

        pointerDown = true;
        isDragging = false;
        dragReady = false;
        shouldCancelClick = false;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;

        const rect = alphaNavToggle.getBoundingClientRect();
        offsetX = startX - rect.left;
        offsetY = startY - rect.top;

        alphaNavToggle.classList.remove('alpha-nav-toggle--dragging');

        const dragHandle = event.target.closest('[data-alpha-nav-drag-handle]');
        if (dragHandle) {
            dragReady = true;
        } else {
            startLongPressTimer();
        }
    };

    const handlePointerMove = (event) => {
        if (!pointerDown || (pointerId !== null && event.pointerId !== pointerId)) {
            return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        if (!dragReady) {
            if (Math.hypot(deltaX, deltaY) >= ALPHA_NAV_DRAG_THRESHOLD) {
                clearLongPress();
            }
            return;
        }

        if (!isDragging && Math.hypot(deltaX, deltaY) >= ALPHA_NAV_DRAG_THRESHOLD) {
            isDragging = true;
            shouldCancelClick = true;
            clearLongPress();
            alphaNavToggle.classList.add('alpha-nav-toggle--dragged');
            alphaNavToggle.classList.add('alpha-nav-toggle--dragging');

            if (typeof alphaNavToggle.setPointerCapture === 'function') {
                try {
                    alphaNavToggle.setPointerCapture(pointerId);
                } catch (error) {
                    // Ignore errors from pointer capture (e.g., unsupported pointers)
                }
            }
        }

        if (!isDragging) {
            return;
        }

        const { left, top } = clampAlphaNavTogglePosition(event.clientX - offsetX, event.clientY - offsetY);
        alphaNavToggle.style.left = `${left}px`;
        alphaNavToggle.style.top = `${top}px`;
        alphaNavToggle.style.right = 'auto';
        alphaNavToggle.style.bottom = 'auto';
        alphaNavToggle.style.transform = 'none';
    };

    const endDrag = (event) => {
        if (!pointerDown || (pointerId !== null && event.pointerId !== pointerId)) {
            return;
        }

        pointerDown = false;
        dragReady = false;
        clearLongPress();

        if (isDragging) {
            event.preventDefault();
            event.stopPropagation();
            persistPosition();
        }

        if (typeof alphaNavToggle.releasePointerCapture === 'function' && pointerId !== null) {
            try {
                alphaNavToggle.releasePointerCapture(pointerId);
            } catch (error) {
                // Ignore errors from releasing pointer capture
            }
        }

        alphaNavToggle.classList.remove('alpha-nav-toggle--dragging');
        pointerId = null;
        isDragging = false;
    };

    const cancelDrag = (event) => {
        if (!pointerDown || (pointerId !== null && event.pointerId !== pointerId)) {
            return;
        }

        pointerDown = false;
        isDragging = false;
        dragReady = false;
        pointerId = null;
        alphaNavToggle.classList.remove('alpha-nav-toggle--dragging');
        shouldCancelClick = false;
        clearLongPress();
    };

    const handleClick = (event) => {
        if (!shouldCancelClick) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        shouldCancelClick = false;
    };

    const handleResize = () => {
        if (!mobileAlphaNavMediaQuery.matches || !alphaNavToggle.classList.contains('alpha-nav-toggle--dragged')) {
            return;
        }

        persistPosition();
    };

    alphaNavToggle.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', endDrag, true);
    window.addEventListener('pointercancel', cancelDrag, true);
    alphaNavToggle.addEventListener('click', handleClick, true);
    window.addEventListener('resize', handleResize);

}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        showStatus(translate('statuses.appInitializing'));

        // Get DOM elements
        searchInput = document.getElementById('searchInput');
        mainSearchInput = document.getElementById('mainSearchInput');
        mainSearchContainer = document.querySelector('.main-search-container');
        clearSearchBtn = document.getElementById('clearSearch');
        mobileSearchInput = document.getElementById('mobileSearchInput');
        mobileSearchClear = document.getElementById('mobileSearchClear');
        sortSelect = document.getElementById('sortSelect');
        tagFilters = document.getElementById('tagFilters');
        categoryFilters = document.getElementById('categoryFilters');
        categoryFilterSearch = document.getElementById('categoryFilterSearch');
        tagFilterSearch = document.getElementById('tagFilterSearch');
        valuesList = document.getElementById('valuesList');
        matchAll = document.getElementById('matchAll');
        matchAny = document.getElementById('matchAny');
        toggleSlide = document.getElementById('toggleSlide');
        activeFilters = document.getElementById('activeFilters');
        clearFilters = document.getElementById('clearFilters');
        filterCount = document.getElementById('filterCount');
        toggleFilters = document.getElementById('toggleFilters');
        filtersContainer = document.getElementById('filtersContainer');
        filtersSheetHeader = document.querySelector('.filters-sheet-header');
        filtersSheetBackdrop = document.getElementById('filtersSheetBackdrop');
        filtersSheetClose = document.getElementById('filtersSheetClose');
        filtersSheetApply = document.getElementById('filtersSheetApply');
        filtersSheetReset = document.getElementById('filtersSheetReset');
        filtersSheetTitle = document.getElementById('filtersSheetTitle');
        filtersCollapsedHint = document.getElementById('filtersCollapsedHint');
        filtersSheetSummary = document.getElementById('filtersSheetSummary');
        valuesCount = document.getElementById('valuesCount');
        alphaNav = document.getElementById('alphaNav');
        alphaNavList = alphaNav ? alphaNav.querySelector('.alpha-nav-list') : null;
        alphaNavToggle = document.getElementById('alphaNavToggle');
        alphaNavOverlay = document.getElementById('alphaNavOverlay');
        alphaNavOverlayList = document.getElementById('alphaNavOverlayList');
        alphaNavOverlayClose = document.getElementById('alphaNavOverlayClose');
        backToTop = document.getElementById('backToTop');
        languageToggle = document.getElementById('languageToggle');
        heroControls = document.getElementById('heroControls');
        heroPillTray = document.getElementById('heroPillTray');
        heroNotesPane = document.getElementById('heroNotesPane');
        heroPaneBackdrop = document.getElementById('heroPaneBackdrop');
        heroPillButtons = heroPillTray ? heroPillTray.querySelectorAll('.hero-pill') : [];
        introBox = document.querySelector('.intro-box');

        // Verify critical elements were found
        if (!valuesList) {
            throw new Error('Critical DOM elements could not be found');
        }

        setupFiltersSheetLayoutObservers();

        syncFiltersSheetAria(isFiltersSheetOpen());

        applyTranslations();

        // Set up filter toggle
        setupFilterToggle();

        // Set up responsive filter accordion
        setupFilterAccordion();

        // Set up match type toggle
        setupMatchTypeToggle();

        setupFiltersSheetKeyboardHandlers();

        updateFiltersSheetSummary();

        // Set up search
        const handleSearchInput = (event) => {
            setSearchTerm(event.target.value, { sourceInput: event.target });
        };

        if (mainSearchInput) {
            mainSearchInput.addEventListener('input', handleSearchInput);
        }

        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('input', handleSearchInput);
        }

        // Clear search buttons
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                clearSearchTerm();
            });
        }

        if (mobileSearchClear) {
            mobileSearchClear.addEventListener('click', () => {
                clearSearchTerm();
                if (mobileSearchInput) {
                    mobileSearchInput.focus();
                }
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                filterState.sortMethod = sortSelect.value;
                filterValues();
                updateFiltersSheetSummary();
            });
        }

        if (clearFilters) {
            // Set up clear filters button
            clearFilters.addEventListener('click', clearAllFilters);
        }

        // Set up alphabetical navigation
        setupAlphaNavToggleDrag();

        updateHeroPillLayout();
        setHeroActiveTarget('menu');

        if (alphaNavToggle) {
            alphaNavToggle.addEventListener('click', () => {
                if (heroMenuOpen) {
                    closeHeroMenu();
                } else {
                    openHeroMenu({ initialTarget: activeHeroTarget });
                }
            });
        }

        if (heroPaneBackdrop) {
            heroPaneBackdrop.addEventListener('click', () => closeHeroMenu());
        }

        if (heroPillButtons && heroPillButtons.length) {
            heroPillButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const target = button.dataset.heroTarget;
                    pulseHeroPill(button);

                    if (!heroMenuOpen) {
                        openHeroMenu({ initialTarget: target });
                    } else {
                        setHeroActiveTarget(target);
                    }

                    if (target === 'alphabet') {
                        openAlphaOverlay();
                    } else if (target === 'filters') {
                        if (accordionMediaQuery.matches) {
                            openFiltersSheet({ restoreFocus: false });
                        } else {
                            filtersContainer.classList.remove('collapsed');
                            updateFilterToggleUI();
                        }
                    } else {
                        closeAlphaOverlay({ restoreFocus: false });
                        if (accordionMediaQuery.matches) {
                            closeFiltersSheet({ restoreFocus: false });
                        }
                    }
                });
            });
        }

        window.addEventListener('resize', updateHeroPillLayout);
        window.addEventListener('scroll', () => {
            if (heroMenuOpen) {
                updateHeroPillLayout();
            }
        }, { passive: true });

        if (alphaNavOverlayClose) {
            alphaNavOverlayClose.addEventListener('click', () => closeAlphaOverlay());
        }

        if (alphaNavOverlay) {
            alphaNavOverlay.addEventListener('click', (event) => {
                if (event.target === alphaNavOverlay) {
                    closeAlphaOverlay();
                }
            });
        }

        const handleAlphaNavViewportChange = (event) => {
            if (!event.matches) {
                closeAlphaOverlay({ restoreFocus: false });
                resetAlphaNavTogglePosition();
            } else {
                restoreAlphaNavTogglePositionFromStorage();
            }
        };

        if (typeof mobileAlphaNavMediaQuery.addEventListener === 'function') {
            mobileAlphaNavMediaQuery.addEventListener('change', handleAlphaNavViewportChange);
        } else if (typeof mobileAlphaNavMediaQuery.addListener === 'function') {
            mobileAlphaNavMediaQuery.addListener(handleAlphaNavViewportChange);
        }

        // Set up back to top button
        setupBackToTop();

        // Set up language toggle
        setupLanguageToggle();

        setupLazyValuesLoaders();

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

    if (alphaNavOverlayList) {
        alphaNavOverlayList.querySelectorAll('.alpha-nav-overlay-link').forEach(button => {
            if (button.classList.contains('is-disabled')) return;
            const isActive = button.dataset.letter === letter;
            button.classList.toggle('active', isActive);
            if (isActive) {
                button.setAttribute('aria-current', 'true');
            } else {
                button.removeAttribute('aria-current');
            }
        });
    }
}

// Setup alphabetical navigation
function updateAlphaOverlayFocusable() {
    if (!alphaNavOverlay) return;
    alphaOverlayFocusable = Array.from(alphaNavOverlay.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.classList.contains('is-disabled'));
}

function handleAlphaOverlayKeydown(event) {
    if (!alphaNavOverlay || alphaNavOverlay.getAttribute('aria-hidden') === 'true') {
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        closeAlphaOverlay();
    } else if (event.key === 'Tab' && alphaOverlayFocusable.length) {
        const first = alphaOverlayFocusable[0];
        const last = alphaOverlayFocusable[alphaOverlayFocusable.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
        } else if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
}

function openAlphaOverlay() {
    if (!alphaNavOverlay) return;

    alphaOverlayLastFocus = document.activeElement;
    alphaNavOverlay.classList.add('is-active');
    alphaNavOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('alpha-nav-open');
    if (alphaNavToggle) {
        alphaNavToggle.setAttribute('aria-expanded', 'true');
    }

    updateAlphaNavAvailability();
    updateAlphaOverlayFocusable();

    const focusTarget = (alphaNavOverlayClose && !alphaNavOverlayClose.classList.contains('is-disabled'))
        ? alphaNavOverlayClose
        : alphaOverlayFocusable[0];
    if (focusTarget) {
        focusTarget.focus();
    }

    document.addEventListener('keydown', handleAlphaOverlayKeydown);
}

function closeAlphaOverlay(options = {}) {
    const { restoreFocus = true } = options;
    if (!alphaNavOverlay) return;

    alphaNavOverlay.classList.remove('is-active');
    alphaNavOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('alpha-nav-open');
    if (alphaNavToggle) {
        alphaNavToggle.setAttribute('aria-expanded', 'false');
    }

    if (heroMenuOpen && activeHeroTarget === 'alphabet') {
        setHeroActiveTarget('menu');
    }

    document.removeEventListener('keydown', handleAlphaOverlayKeydown);

    if (restoreFocus && alphaOverlayLastFocus && typeof alphaOverlayLastFocus.focus === 'function') {
        alphaOverlayLastFocus.focus();
    }
    alphaOverlayLastFocus = null;
    alphaOverlayFocusable = [];
}

function jumpToLetterSection(letter) {
    const section = document.getElementById(`section-${letter}`);
    if (section) {
        window.scrollTo({
            top: Math.max(section.offsetTop - getAlphaNavOffset(), 0),
            behavior: 'smooth'
        });
        setActiveLetter(letter);
        setTimeout(() => {
            if (section && document.body.contains(section)) {
                section.focus({ preventScroll: true });
            }
        }, 400);
        return true;
    }
    return false;
}

function handleAlphaLetterSelection(letter, { fromOverlay = false } = {}) {
    if (!letter) return;

    if (fromOverlay) {
        closeAlphaOverlay({ restoreFocus: false });
    }

    const navigated = jumpToLetterSection(letter);
    if (!navigated) {
        findClosestSection(letter);
    }
}

function setupAlphaNav() {
    if (!alphaNavList) return;

    activeAlphabet = getAlphabetForLanguage(currentLanguage);
    const alphabet = activeAlphabet;

    alphaNavList.innerHTML = '';
    alphabet.forEach(letter => {
        const item = document.createElement('li');
        item.className = 'alpha-nav-item';
        item.dataset.letter = letter;

        const link = document.createElement('a');
        link.className = 'alpha-nav-link';
        link.href = `#section-${letter}`;
        link.textContent = letter;
        link.dataset.letter = letter;
        link.setAttribute('aria-label', `Jump to values that start with the letter ${letter}`);
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleAlphaLetterSelection(letter);
        });

        item.appendChild(link);
        alphaNavList.appendChild(item);
    });

    if (alphaNavOverlayList) {
        alphaNavOverlayList.innerHTML = '';
        alphabet.forEach(letter => {
            const overlayItem = document.createElement('div');
            overlayItem.className = 'alpha-nav-overlay-item';
            overlayItem.dataset.letter = letter;
            overlayItem.setAttribute('role', 'listitem');

            const overlayButton = document.createElement('button');
            overlayButton.type = 'button';
            overlayButton.className = 'alpha-nav-overlay-link';
            overlayButton.dataset.letter = letter;
            overlayButton.textContent = letter;
            overlayButton.addEventListener('click', () => {
                handleAlphaLetterSelection(letter, { fromOverlay: true });
            });

            overlayItem.appendChild(overlayButton);
            alphaNavOverlayList.appendChild(overlayItem);
        });
    }

    updateAlphaNavAvailability();
    setupScrollSpy();
}

function updateAlphaNavAvailability() {
    if (alphaNavList) {
        alphaNavList.querySelectorAll('.alpha-nav-item').forEach(item => {
            const letter = item.dataset.letter;
            const link = item.querySelector('.alpha-nav-link');
            if (!link) return;

            const hasSection = !!document.getElementById(`section-${letter}`);
            link.classList.toggle('is-disabled', !hasSection);
            if (hasSection) {
                link.removeAttribute('aria-disabled');
            } else {
                link.setAttribute('aria-disabled', 'true');
            }
            link.tabIndex = hasSection ? 0 : -1;
        });
    }

    if (alphaNavOverlayList) {
        alphaNavOverlayList.querySelectorAll('[data-letter]').forEach(item => {
            const letter = item.dataset.letter;
            const button = item.querySelector('.alpha-nav-overlay-link');
            if (!button) return;

            const hasSection = !!document.getElementById(`section-${letter}`);
            button.classList.toggle('is-disabled', !hasSection);
            button.disabled = !hasSection;
            if (hasSection) {
                button.removeAttribute('aria-disabled');
            } else {
                button.setAttribute('aria-disabled', 'true');
            }
        });
    }

    updateAlphaOverlayFocusable();
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
        if (jumpToLetterSection(alphabet[i])) {
            return;
        }
    }

    // If no next letter, try previous letters
    for (let i = letterIndex - 1; i >= 0; i--) {
        if (jumpToLetterSection(alphabet[i])) {
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
        closeAlphaOverlay({ restoreFocus: false });
        currentLanguage = currentLanguage === 'en' ? 'es' : 'en';
        applyTranslations();
        updateActiveFilters();
        activeAlphabet = getAlphabetForLanguage(currentLanguage);
        lazyValuesLoadTriggered = true;
        ensureValuesDataLoaded(currentLanguage);
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
        if (accordionMediaQuery.matches) {
            if (isFiltersSheetOpen()) {
                closeFiltersSheet();
            } else {
                openFiltersSheet();
            }
        } else {
            filtersContainer.classList.toggle('collapsed');
            updateFilterToggleUI();
        }
    });

    if (filtersSheetClose) {
        filtersSheetClose.addEventListener('click', () => closeFiltersSheet());
    }

    if (filtersSheetApply) {
        filtersSheetApply.addEventListener('click', () => closeFiltersSheet());
    }

    if (filtersSheetReset) {
        filtersSheetReset.addEventListener('click', () => {
            clearAllFilters();
            if (accordionMediaQuery.matches) {
                filtersContainer.focus({ preventScroll: true });
            }
        });
    }

    if (filtersSheetBackdrop) {
        filtersSheetBackdrop.addEventListener('click', () => closeFiltersSheet());
    }

    document.addEventListener('keydown', handleFiltersSheetKeydown);
}

function isFiltersSheetOpen() {
    return document.body.classList.contains('filters-sheet-open');
}

function syncFiltersSheetAria(isOpen) {
    if (!filtersContainer) return;
    const isMobile = accordionMediaQuery.matches;

    if (!isMobile) {
        filtersContainer.setAttribute('role', 'region');
        filtersContainer.setAttribute('aria-hidden', 'false');
        filtersContainer.removeAttribute('aria-modal');
        return;
    }

    filtersContainer.setAttribute('role', 'dialog');
    filtersContainer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (isOpen) {
        filtersContainer.setAttribute('aria-modal', 'true');
    } else {
        filtersContainer.removeAttribute('aria-modal');
    }
}

function openFiltersSheet({ restoreFocus = true, skipToggleUpdate = false } = {}) {
    if (!filtersContainer) return;

    if (!accordionMediaQuery.matches) {
        syncFiltersSheetAria(false);
        filtersContainer.classList.remove('collapsed');
        if (!skipToggleUpdate) {
            updateFilterToggleUI();
        }
        return;
    }

    if (isFiltersSheetOpen()) {
        syncFiltersSheetAria(true);
        if (restoreFocus) {
            filtersContainer.focus({ preventScroll: true });
        }
        return;
    }

    if (document.activeElement instanceof HTMLElement) {
        lastFiltersSheetTrigger = document.activeElement;
    }

    document.body.classList.add('filters-sheet-open');

    if (heroMenuOpen) {
        closeHeroMenu({ skipFiltersSheetClose: true });
    }

    filtersContainer.classList.remove('collapsed');
    if (filtersSheetBackdrop) {
        filtersSheetBackdrop.classList.add('is-active');
        filtersSheetBackdrop.setAttribute('aria-hidden', 'false');
    }

    syncFiltersSheetAria(true);

    document.body.classList.remove('filters-sheet-keyboard');

    if (!skipToggleUpdate) {
        updateFilterToggleUI();
    }

    if (restoreFocus) {
        requestAnimationFrame(() => {
            const focusTarget = filtersSheetClose instanceof HTMLElement ? filtersSheetClose : filtersContainer;
            focusTarget.focus({ preventScroll: true });
        });
    }
}

function closeFiltersSheet({ restoreFocus = true, skipToggleUpdate = false } = {}) {
    if (!filtersContainer) return;
    const isMobile = accordionMediaQuery.matches;
    const wasOpen = isFiltersSheetOpen();

    document.body.classList.remove('filters-sheet-open');
    document.body.classList.remove('filters-sheet-keyboard');
    if (filtersSheetBackdrop) {
        filtersSheetBackdrop.classList.remove('is-active');
        filtersSheetBackdrop.setAttribute('aria-hidden', 'true');
    }

    if (!isMobile) {
        syncFiltersSheetAria(false);
        if (!skipToggleUpdate) {
            updateFilterToggleUI();
        }
        return;
    }

    if (!wasOpen) {
        syncFiltersSheetAria(false);
        return;
    }

    filtersContainer.classList.add('collapsed');

    syncFiltersSheetAria(false);

    if (!skipToggleUpdate) {
        updateFilterToggleUI();
    }

    if (restoreFocus && lastFiltersSheetTrigger instanceof HTMLElement) {
        lastFiltersSheetTrigger.focus({ preventScroll: true });
    }

    lastFiltersSheetTrigger = null;

    if (heroMenuOpen && activeHeroTarget === 'filters') {
        setHeroActiveTarget('menu');
    }
}

function handleFiltersSheetKeydown(event) {
    if (event.key === 'Escape' && accordionMediaQuery.matches && isFiltersSheetOpen()) {
        event.preventDefault();
        closeFiltersSheet();
    }
}

function updateFiltersSheetLayout() {
    if (!filtersContainer) return;

    const headerRect = filtersSheetHeader ? filtersSheetHeader.getBoundingClientRect() : null;
    const headerStyles = filtersSheetHeader ? window.getComputedStyle(filtersSheetHeader) : null;
    const headerMargin = headerStyles ? parseFloat(headerStyles.marginBottom) : 0;
    const headerHeight = headerRect ? headerRect.height + (Number.isNaN(headerMargin) ? 0 : headerMargin) : 0;
    const searchRect = mainSearchContainer ? mainSearchContainer.getBoundingClientRect() : null;
    const topOffset = searchRect ? searchRect.bottom + 12 : 120;

    document.documentElement.style.setProperty('--filters-sheet-top', `${Math.round(topOffset)}px`);
    document.documentElement.style.setProperty('--filters-sheet-header-height', `${Math.round(headerHeight)}px`);
}

function setupFiltersSheetKeyboardHandlers() {
    if (!filtersContainer) return;

    const inputs = filtersContainer.querySelectorAll('input[type="search"], input[type="text"], select');

    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            if (!accordionMediaQuery.matches || !isFiltersSheetOpen()) return;
            document.body.classList.add('filters-sheet-keyboard');
            setTimeout(() => {
                input.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 60);
        });

        input.addEventListener('blur', () => {
            document.body.classList.remove('filters-sheet-keyboard');
        });
    });
}

function setupFiltersSheetLayoutObservers() {
    if (!filtersContainer) return;

    updateFiltersSheetLayout();

    window.addEventListener('resize', updateFiltersSheetLayout);

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateFiltersSheetLayout);
        window.visualViewport.addEventListener('scroll', updateFiltersSheetLayout);
    }
}

function setupFilterAccordion() {
    if (!filtersContainer) return;
    if (filterAccordionSections.length) return;

    document.querySelectorAll('.filter-column').forEach(section => {
        const header = section.querySelector('.filter-header');
        const content = section.querySelector('.filter-content');

        if (!header || !content) {
            return;
        }

        if (!content.id) {
            content.id = `${section.id || `filter-section-${filterAccordionSections.length}`}-content`;
        }

        if (!header.hasAttribute('aria-controls')) {
            header.setAttribute('aria-controls', content.id);
        }

        header.setAttribute('aria-expanded', 'true');
        content.setAttribute('aria-hidden', 'false');

        filterAccordionSections.push({ section, header, content });

        header.addEventListener('click', () => {
            if (!accordionMediaQuery.matches) return;

            const isCurrent = currentAccordionSection === section;
            const shouldExpand = isCurrent ? !section.classList.contains('open') : true;

            if (!isCurrent && currentAccordionSection) {
                setSectionExpanded(currentAccordionSection, false);
            }

            setSectionExpanded(section, shouldExpand);
            currentAccordionSection = shouldExpand ? section : null;
        });
    });

    if (typeof accordionMediaQuery.addEventListener === 'function') {
        accordionMediaQuery.addEventListener('change', handleAccordionModeChange);
    } else if (typeof accordionMediaQuery.addListener === 'function') {
        accordionMediaQuery.addListener(handleAccordionModeChange);
    }

    handleAccordionModeChange(accordionMediaQuery);
}

function setSectionExpanded(section, expanded) {
    const entry = filterAccordionSections.find(item => item.section === section);
    if (!entry) return;

    const { header, content } = entry;
    const isMobile = accordionMediaQuery.matches;

    const shouldExpand = isMobile ? expanded : true;

    section.classList.toggle('open', shouldExpand);
    header.setAttribute('aria-expanded', shouldExpand ? 'true' : 'false');
    content.setAttribute('aria-hidden', shouldExpand ? 'false' : 'true');
}

function handleAccordionModeChange(event) {
    const isMobile = event.matches;

    if (!filterAccordionSections.length) {
        syncFiltersSheetAria(isMobile && isFiltersSheetOpen());
        updateFilterToggleUI();
        return;
    }

    if (isMobile) {
        if (!currentAccordionSection || !filterAccordionSections.some(item => item.section === currentAccordionSection)) {
            currentAccordionSection = filterAccordionSections[0].section;
        }

        const sheetOpen = isFiltersSheetOpen();

        filterAccordionSections.forEach(({ section }) => {
            const isActiveSection = sheetOpen && section === currentAccordionSection;
            setSectionExpanded(section, isActiveSection);
        });

        if (!sheetOpen) {
            filtersContainer.classList.add('collapsed');
        }
    } else {
        closeFiltersSheet({ restoreFocus: false, skipToggleUpdate: true });
        filtersContainer.classList.remove('collapsed');
        filterAccordionSections.forEach(({ section }) => setSectionExpanded(section, true));
        currentAccordionSection = null;
    }

    syncFiltersSheetAria(isMobile && isFiltersSheetOpen());
    updateFilterToggleUI();
}

// Setup match type toggle
function setupMatchTypeToggle() {
    if (!matchAll || !matchAny || !toggleSlide) return;

    updateMatchTypeUI();

    matchAll.addEventListener('click', () => {
        if (!filterState.matchAll) {
            filterState.matchAll = true;
            updateMatchTypeUI();
            filterValues();
            updateFiltersSheetSummary();
        }
    });

    matchAny.addEventListener('click', () => {
        if (filterState.matchAll) {
            filterState.matchAll = false;
            updateMatchTypeUI();
            filterValues();
            updateFiltersSheetSummary();
        }
    });
}

function updateMatchTypeUI() {
    if (!matchAll || !matchAny || !toggleSlide) return;

    if (filterState.matchAll) {
        toggleSlide.classList.remove('right');
        matchAll.classList.remove('opacity-75');
        matchAll.classList.add('text-purple-800');
        matchAny.classList.remove('text-purple-800');
        matchAny.classList.add('opacity-75');
    } else {
        toggleSlide.classList.add('right');
        matchAny.classList.remove('opacity-75');
        matchAny.classList.add('text-purple-800');
        matchAll.classList.remove('text-purple-800');
        matchAll.classList.add('opacity-75');
    }
}

function updateFiltersSheetSummary() {
    if (!filtersSheetSummary) return;

    const matchLabel = translate(filterState.matchAll ? 'filters.matchAll' : 'filters.matchAny');
    const sortLabel = sortSelect && sortSelect.options.length
        ? (sortSelect.options[sortSelect.selectedIndex]?.textContent?.trim() || '')
        : '';
    const appliedLabel = filterCount ? filterCount.textContent.trim() : translate('filters.noFiltersSelected');

    const summaryParts = [matchLabel];

    if (sortLabel) {
        summaryParts.push(`${translate('filters.sortBy')}: ${sortLabel}`);
    }

    if (appliedLabel) {
        summaryParts.push(appliedLabel);
    }

    filtersSheetSummary.textContent = summaryParts.join(' • ');
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
    clearSelectedVerb({ skipFilterValues: true });

    // Reset UI elements
    document.querySelectorAll('.tag.selected').forEach(tag => {
        setTagButtonState(tag, false);
    });

    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        checkbox.checked = false;
    });

    clearSearchTerm({ updateUI: false });

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

function ensureValuesDataLoaded(lang = currentLanguage) {
    if (valuesDataCache[lang]) {
        applyValuesData(lang, valuesDataCache[lang]);
        return Promise.resolve(valuesDataCache[lang]);
    }

    if (!valuesDataPromises[lang]) {
        const languageNameKey = lang === 'en' ? 'languages.english' : 'languages.spanish';
        showStatus(translate('statuses.loadingValues', { language: translate(languageNameKey) }));
        valuesDataPromises[lang] = fetchValuesData(lang);
    }

    return valuesDataPromises[lang];
}

function triggerLazyValuesLoad(lang = currentLanguage) {
    if (lazyValuesLoadTriggered) return;
    lazyValuesLoadTriggered = true;
    ensureValuesDataLoaded(lang);
}

function setupLazyValuesLoaders() {
    const triggerLoad = () => triggerLazyValuesLoad();

    if ('IntersectionObserver' in window && valuesList) {
        const observer = new IntersectionObserver((entries, obs) => {
            if (entries.some(entry => entry.isIntersecting)) {
                triggerLoad();
                obs.disconnect();
            }
        }, { rootMargin: '200px' });
        observer.observe(valuesList);
    }

    [mainSearchInput, filtersContainer, alphaNavToggle].forEach(element => {
        if (element) {
            ['focus', 'click', 'input'].forEach(eventName => {
                element.addEventListener(eventName, triggerLoad, { once: true });
            });
        }
    });

    setTimeout(triggerLoad, 1500);
}

function applyValuesData(lang, data) {
    values = Array.isArray(data) ? data : [];
    valuesDataReady = true;
    valuesLoadedLanguage = lang;
    activeAlphabet = getAlphabetForLanguage(lang);
    setupAlphaNav();
    initializeValuesDictionary();
    updateValuesCount();
}

async function fetchValuesData(lang = 'en') {
    try {
        const response = await fetch(`Values-${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        valuesDataCache[lang] = data.values;
        applyValuesData(lang, data.values);
        return data.values;

    } catch (error) {
        console.error("Error fetching values data:", error);
        showStatus(translate('statuses.errorFetchingValues', { message: error.message }), true);
        // Attempt to load fallback or default data if primary fetch fails
        values = []; // Ensure values is empty if fetch fails
        valuesDataReady = false;
        initializeValuesDictionary(); // Initialize with empty or fallback data
        updateValuesCount();
        return null;
    } finally {
        delete valuesDataPromises[lang];
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
        const { categoryCounts, verbCounts } = values.reduce((acc, value) => {
            const category = value.category;
            acc.categoryCounts[category] = (acc.categoryCounts[category] || 0) + 1;

            if (Array.isArray(value.tags)) {
                value.tags.forEach(tag => {
                    acc.verbCounts[tag] = (acc.verbCounts[tag] || 0) + 1;
                });
            }

            return acc;
        }, { categoryCounts: {}, verbCounts: {} });

        // Update values to remove single-occurrence verbs
        values.forEach(value => {
            value.tags = value.tags.filter(tag => verbCounts[tag] > 1);
        });

        // Populate category filters
        if (categoryFilters) {
            // Get unique categories
            const categories = Object.keys(categoryCounts).sort(compareByName);

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
                const countSpan = document.createElement('span');
                countSpan.textContent = `(${categoryCounts[category] || 0})`;
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
                // Create tag element for filter section
                const tagElement = document.createElement('button');
                tagElement.type = 'button';
                tagElement.textContent = tag;
                tagElement.classList.add('tag');
                tagElement.dataset.tag = tag;

                // Count values with this tag
                const countSpan = document.createElement('span');
                countSpan.textContent = `(${verbCounts[tag] || 0})`;
                countSpan.classList.add('ml-1', 'text-xs', 'opacity-75');
                tagElement.appendChild(countSpan);

                const isInitiallySelected = filterState.tags.includes(tag);
                setTagButtonState(tagElement, isInitiallySelected);

                const toggleTag = () => {
                    const tagName = tagElement.dataset.tag;
                    const willSelect = !tagElement.classList.contains('selected');
                    setTagButtonState(tagElement, willSelect);

                    if (willSelect) {
                        if (!filterState.tags.includes(tagName)) {
                            filterState.tags.push(tagName);
                        }
                    } else {
                        filterState.tags = filterState.tags.filter(t => t !== tagName);
                    }

                    filterValues();
                    updateActiveFilters();
                };

                tagElement.addEventListener('click', toggleTag);
                tagElement.addEventListener('keydown', (event) => {
                    const toggleKeys = [' ', 'Enter', 'Spacebar'];
                    if (toggleKeys.includes(event.key) || event.code === 'Space') {
                        event.preventDefault();
                        toggleTag();
                    }
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
        setupFilterSearchInputs();

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

function setupFilterSearchInputs() {
    attachFilterSearchListener(categoryFilterSearch, categoryFilters);
    attachFilterSearchListener(tagFilterSearch, tagFilters);
}

function attachFilterSearchListener(input, container) {
    if (!input || !container) return;

    if (input._filterSearchHandler) {
        input.removeEventListener('input', input._filterSearchHandler);
        input.removeEventListener('search', input._filterSearchHandler);
    }

    const handler = () => {
        const query = normalizeSearchText((input.value || '').trim());

        Array.from(container.children).forEach(child => {
            if (!(child instanceof HTMLElement)) return;
            const text = normalizeSearchText(child.textContent || '');
            const matches = text.includes(query);
            child.style.display = matches ? '' : 'none';
        });
    };

    input._filterSearchHandler = handler;
    input.addEventListener('input', handler);
    input.addEventListener('search', handler);
    handler();
}

// Update active filters display
function updateActiveFilters() {
    if (!activeFilters || !clearFilters) return;

    const hasFilters = filterState.categories.length > 0 ||
                       filterState.tags.length > 0 ||
                       filterState.searchTerm;

    const totalFilters = filterState.categories.length +
        filterState.tags.length +
        (filterState.searchTerm ? 1 : 0);

    // Enable/disable clear button based on filters
    clearFilters.disabled = !hasFilters;
    clearFilters.classList.toggle('is-disabled', !hasFilters);
    document.getElementById('noActiveFilters').style.display = hasFilters ? 'none' : 'block';

    if (filterCount) {
        let countKey = 'filters.noFiltersSelected';

        if (totalFilters === 1) {
            countKey = 'filters.singleFilterSelected';
        } else if (totalFilters > 1) {
            countKey = 'filters.multipleFiltersSelected';
        }

        filterCount.textContent = translate(countKey, { count: totalFilters });
        filterCount.classList.toggle('has-filters', totalFilters > 0);
    }

    updateFiltersSheetSummary();

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
            clearSearchTerm();
            return;
        }

        filterValues();
        updateActiveFilters();
    });
    badge.appendChild(removeButton);

    activeFilters.appendChild(badge);
}

function setTagButtonState(tagElement, isSelected) {
    tagElement.classList.toggle('selected', isSelected);
    const ariaState = isSelected ? 'true' : 'false';
    tagElement.setAttribute('aria-pressed', ariaState);

    if (isSelected) {
        if (!tagElement.querySelector('.tag-icon')) {
            const icon = document.createElement('i');
            icon.classList.add('fas', 'fa-check', 'tag-icon');
            tagElement.prepend(icon);
        }
    } else {
        const icon = tagElement.querySelector('.tag-icon');
        if (icon) icon.remove();
    }
}

function scrollValuesListToTop() {
    if (!valuesList) return;
    valuesList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof valuesList.scrollTop === 'number') {
        valuesList.scrollTop = 0;
    }
}

function clearSelectedVerb({ scrollToTop = false, skipFilterValues = false } = {}) {
    if (!selectedVerb) return;
    selectedVerb = null;
    if (!skipFilterValues) {
        filterValues();
    }
    if (scrollToTop) {
        scrollValuesListToTop();
    }
}

function setSelectedVerb(tag, { scrollToTop = true } = {}) {
    if (!tag || selectedVerb === tag) return;
    selectedVerb = tag;
    filterValues();
    if (scrollToTop) {
        scrollValuesListToTop();
    }
}

// Update tag selection state
function updateTagSelection(tag, isSelected) {
    if (!tagFilters) return;

    // Update tag in filter section
    const tagElements = tagFilters.querySelectorAll('.tag');
    tagElements.forEach(tagElement => {
        if (tagElement.dataset.tag === tag) {
            setTagButtonState(tagElement, isSelected);
        }
    });
}

// Highlight a tag in the filter section
function highlightTag(tagName) {
    try {
        console.log("Highlighting tag:", tagName);

        if (!tagFilters) {
            console.warn('Tag filters container not available; skipping tag highlight for', tagName);
            return;
        }

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

        const shouldAutoExpandFirstCard = valuesList.dataset.initialCardExpanded !== 'true';
        const hasSelectedVerb = Boolean(selectedVerb);

        if (hasSelectedVerb) {
            const verbHeader = document.createElement('div');
            verbHeader.classList.add('verb-filter-header');

            const breadcrumb = document.createElement('div');
            breadcrumb.classList.add('verb-filter-breadcrumb');

            const breadcrumbRoot = document.createElement('span');
            breadcrumbRoot.textContent = translate('valueCard.verbFilterAllVerbs');

            const breadcrumbSeparator = document.createElement('span');
            breadcrumbSeparator.classList.add('verb-filter-separator');
            breadcrumbSeparator.textContent = '→';

            const breadcrumbSelected = document.createElement('button');
            breadcrumbSelected.type = 'button';
            breadcrumbSelected.classList.add('tag', 'verb-filter-chip', 'is-selected-verb');
            breadcrumbSelected.textContent = selectedVerb;
            breadcrumbSelected.setAttribute('aria-pressed', 'true');

            breadcrumb.appendChild(breadcrumbRoot);
            breadcrumb.appendChild(breadcrumbSeparator);
            breadcrumb.appendChild(breadcrumbSelected);

            const clearButton = document.createElement('button');
            clearButton.type = 'button';
            clearButton.classList.add('verb-filter-clear');
            clearButton.textContent = translate('valueCard.verbFilterClear');
            clearButton.addEventListener('click', () => clearSelectedVerb({ scrollToTop: true }));

            const headerTop = document.createElement('div');
            headerTop.classList.add('verb-filter-header__top');
            headerTop.appendChild(breadcrumb);
            headerTop.appendChild(clearButton);

            const description = document.createElement('p');
            description.classList.add('verb-filter-description');
            description.textContent = translate('valueCard.verbFilterShowing', { verb: selectedVerb });

            verbHeader.appendChild(headerTop);
            verbHeader.appendChild(description);
            valuesList.appendChild(verbHeader);
        }

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
        let renderedCardCount = 0;

        sortedLetters.forEach(letter => {
            // Create section header
            const sectionHeader = document.createElement('div');
            sectionHeader.id = `section-${letter}`;
            sectionHeader.classList.add('text-2xl', 'font-bold', 'mt-8', 'mb-4', 'py-2', 'border-b', 'border-gray-300', 'letter-section');
            sectionHeader.setAttribute('tabindex', '-1');
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
                    tagElement.setAttribute('role', 'button');
                    tagElement.setAttribute('tabindex', '0');

                    if (selectedVerb === tag) {
                        tagElement.classList.add('is-selected-verb');
                        tagElement.setAttribute('aria-pressed', 'true');
                    } else {
                        tagElement.setAttribute('aria-pressed', 'false');
                    }

                    const onVerbSelect = (event) => {
                        event.stopPropagation();
                        setSelectedVerb(tag);
                    };

                    tagElement.addEventListener('click', onVerbSelect);
                    tagElement.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onVerbSelect(event);
                        }
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

                const shouldExpandThisCard = shouldAutoExpandFirstCard && renderedCardCount === 0;
                if (shouldExpandThisCard) {
                    card.classList.add('expanded');
                }

                updateToggleState(shouldExpandThisCard);

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
                renderedCardCount += 1;
            });
        });

        if (shouldAutoExpandFirstCard && valuesToDisplay.length > 0) {
            valuesList.dataset.initialCardExpanded = 'true';
        }

        // Add anchor for bottom of page
        const bottomAnchor = document.createElement('div');
        bottomAnchor.id = 'bottom';
        valuesList.appendChild(bottomAnchor);

        // Set up scroll spy for active letter display
        updateAlphaNavAvailability();
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

        if (selectedVerb) {
            filtered = filtered.filter(value => value.tags.includes(selectedVerb));
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
