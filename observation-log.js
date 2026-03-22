const OBSERVATION_STORAGE_KEY = 'valuesObservationLog.observations';
const MAX_OBSERVATION_SUGGESTIONS = 8;

let observationValueNames = [];

function normalizeObservationValue(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function getObservationValueSuggestions() {
    return document.getElementById('observationValueSuggestions');
}

function requestObservationValueOptions() {
    if (typeof triggerLazyValuesLoad === 'function') {
        triggerLazyValuesLoad();
    }
}

function populateObservationValueOptions(valuesList) {
    observationValueNames = Array.from(new Set(
        (Array.isArray(valuesList) ? valuesList : [])
            .map((value) => value && typeof value.name === 'string' ? value.name.trim() : '')
            .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, document.documentElement.lang || 'en', { sensitivity: 'base' }));
}

function getMatchingObservationValues(query) {
    const normalizedQuery = normalizeSearchText(normalizeObservationValue(query));

    if (!normalizedQuery) {
        return observationValueNames.slice(0, MAX_OBSERVATION_SUGGESTIONS);
    }

    return observationValueNames
        .filter((name) => normalizeSearchText(name).includes(normalizedQuery))
        .slice(0, MAX_OBSERVATION_SUGGESTIONS);
}

function closeObservationSuggestions(valueInput, suggestionsList) {
    if (!valueInput || !suggestionsList) {
        return;
    }

    suggestionsList.hidden = true;
    suggestionsList.innerHTML = '';
    valueInput.setAttribute('aria-expanded', 'false');
    valueInput.removeAttribute('aria-activedescendant');
    valueInput.dataset.activeSuggestion = '-1';
}

function applyObservationSuggestion(valueInput, suggestionsList, value) {
    valueInput.value = value;
    closeObservationSuggestions(valueInput, suggestionsList);
}

function updateObservationSuggestions(valueInput, suggestionsList) {
    if (!valueInput || !suggestionsList) {
        return;
    }

    const matches = getMatchingObservationValues(valueInput.value);

    if (!matches.length) {
        closeObservationSuggestions(valueInput, suggestionsList);
        return;
    }

    suggestionsList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    matches.forEach((name, index) => {
        const item = document.createElement('li');
        item.id = `observationValueSuggestion-${index}`;
        item.className = 'observation-log__suggestion';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.textContent = name;
        item.addEventListener('mousedown', (event) => {
            event.preventDefault();
            applyObservationSuggestion(valueInput, suggestionsList, name);
        });
        fragment.appendChild(item);
    });

    suggestionsList.appendChild(fragment);
    suggestionsList.hidden = false;
    valueInput.setAttribute('aria-expanded', 'true');
    valueInput.dataset.activeSuggestion = '-1';
}

function setActiveObservationSuggestion(valueInput, suggestionsList, nextIndex) {
    const options = Array.from(suggestionsList.querySelectorAll('.observation-log__suggestion'));
    if (!options.length) {
        closeObservationSuggestions(valueInput, suggestionsList);
        return;
    }

    const boundedIndex = ((nextIndex % options.length) + options.length) % options.length;
    valueInput.dataset.activeSuggestion = String(boundedIndex);

    options.forEach((option, index) => {
        const isActive = index === boundedIndex;
        option.classList.toggle('is-active', isActive);
        option.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) {
            valueInput.setAttribute('aria-activedescendant', option.id);
            option.scrollIntoView({ block: 'nearest' });
        }
    });
}

function initObservationValuePicker() {
    const valueInput = document.getElementById('observationValue');
    const suggestionsList = getObservationValueSuggestions();
    const observationTab = document.getElementById('tab-observation-log');
    const syncOptions = (valuesList) => {
        populateObservationValueOptions(valuesList);
        if (document.activeElement === valueInput) {
            updateObservationSuggestions(valueInput, suggestionsList);
        }
    };

    if (!valueInput || !suggestionsList) {
        return;
    }

    valueInput.dataset.activeSuggestion = '-1';

    if (typeof values !== 'undefined' && Array.isArray(values) && values.length) {
        syncOptions(values);
    }

    [observationTab, valueInput].forEach((element) => {
        if (!element) {
            return;
        }

        ['focus', 'click', 'input'].forEach((eventName) => {
            element.addEventListener(eventName, requestObservationValueOptions, { once: true });
        });
    });

    valueInput.addEventListener('focus', () => {
        updateObservationSuggestions(valueInput, suggestionsList);
    });

    valueInput.addEventListener('input', () => {
        updateObservationSuggestions(valueInput, suggestionsList);
    });

    valueInput.addEventListener('keydown', (event) => {
        const options = Array.from(suggestionsList.querySelectorAll('.observation-log__suggestion'));
        const currentIndex = Number.parseInt(valueInput.dataset.activeSuggestion || '-1', 10);

        if (event.key === 'ArrowDown' && options.length) {
            event.preventDefault();
            setActiveObservationSuggestion(valueInput, suggestionsList, currentIndex + 1);
            return;
        }

        if (event.key === 'ArrowUp' && options.length) {
            event.preventDefault();
            setActiveObservationSuggestion(valueInput, suggestionsList, currentIndex <= 0 ? options.length - 1 : currentIndex - 1);
            return;
        }

        if (event.key === 'Enter' && !suggestionsList.hidden && currentIndex >= 0 && options[currentIndex]) {
            event.preventDefault();
            applyObservationSuggestion(valueInput, suggestionsList, options[currentIndex].textContent || '');
            return;
        }

        if (event.key === 'Escape') {
            closeObservationSuggestions(valueInput, suggestionsList);
        }
    });

    valueInput.addEventListener('blur', () => {
        window.setTimeout(() => closeObservationSuggestions(valueInput, suggestionsList), 120);
    });

    document.addEventListener('values-data-ready', (event) => {
        syncOptions(event.detail?.values);
    });
}

function initTabs() {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    if (!tabs.length) {
        return;
    }

    const tabPanels = new Map();
    tabs.forEach((tab) => {
        const panelId = tab.getAttribute('aria-controls');
        if (panelId) {
            const panel = document.getElementById(panelId);
            if (panel) {
                tabPanels.set(tab, panel);
            }
        }
    });

    const activateTab = (nextTab, { focus = true } = {}) => {
        tabs.forEach((tab) => {
            const isActive = tab === nextTab;
            tab.setAttribute('aria-selected', String(isActive));
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
            const panel = tabPanels.get(tab);
            if (panel) {
                if (isActive) {
                    panel.removeAttribute('hidden');
                } else {
                    panel.setAttribute('hidden', '');
                }
            }
        });

        if (focus) {
            nextTab.focus();
        }
    };

    const handleKeydown = (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            return;
        }
        event.preventDefault();

        const currentIndex = tabs.indexOf(event.currentTarget);
        let nextIndex = currentIndex;

        if (event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % tabs.length;
        }

        if (event.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        }

        if (event.key === 'Home') {
            nextIndex = 0;
        }

        if (event.key === 'End') {
            nextIndex = tabs.length - 1;
        }

        activateTab(tabs[nextIndex]);
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => activateTab(tab));
        tab.addEventListener('keydown', handleKeydown);
    });

    const selectedTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
    activateTab(selectedTab, { focus: false });
}

function loadObservations() {
    const stored = localStorage.getItem(OBSERVATION_STORAGE_KEY);
    if (!stored) {
        return [];
    }

    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Unable to parse observation log entries.', error);
        return [];
    }
}

function saveObservations(observations) {
    localStorage.setItem(OBSERVATION_STORAGE_KEY, JSON.stringify(observations));
}

function formatObservationDate(dateString) {
    if (!dateString) {
        return '';
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const locale = document.documentElement.lang || navigator.language || 'en';
    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function renderObservations({ observations, list, emptyState, totalCount, latestEntry }) {
    list.innerHTML = '';

    if (!observations.length) {
        list.hidden = true;
        emptyState.hidden = false;
        latestEntry.setAttribute('data-i18n', 'observationLog.stats.latestEmpty');
        latestEntry.dataset.emptyText = latestEntry.textContent;
        totalCount.textContent = '0';
        return;
    }

    list.hidden = false;
    emptyState.hidden = true;
    totalCount.textContent = String(observations.length);
    latestEntry.removeAttribute('data-i18n');

    const latest = observations[0];
    const latestLabel = formatObservationDate(latest.createdAt);
    if (latestLabel) {
        latestEntry.textContent = latestLabel;
    }

    observations.forEach((observation) => {
        const item = document.createElement('li');
        item.className = 'observation-log__item';

        const header = document.createElement('div');
        header.className = 'observation-log__item-header';

        const value = document.createElement('span');
        value.className = 'observation-log__item-value';
        value.textContent = observation.value;

        const time = document.createElement('time');
        time.className = 'observation-log__item-time';
        time.dateTime = observation.createdAt;
        time.textContent = formatObservationDate(observation.createdAt);

        header.appendChild(value);
        header.appendChild(time);

        const context = document.createElement('p');
        context.className = 'observation-log__item-context';
        context.textContent = observation.context;

        item.appendChild(header);
        if (observation.context) {
            item.appendChild(context);
        }

        list.appendChild(item);
    });
}

function initObservationLog() {
    const form = document.getElementById('observationForm');
    if (!form) {
        return;
    }

    const valueInput = document.getElementById('observationValue');
    const contextInput = document.getElementById('observationContext');
    const list = document.getElementById('observationList');
    const emptyState = document.getElementById('observationEmpty');
    const totalCount = document.getElementById('observationTotal');
    const latestEntry = document.getElementById('observationLatest');
    const suggestionsList = getObservationValueSuggestions();

    if (!valueInput || !contextInput || !list || !emptyState || !totalCount || !latestEntry) {
        return;
    }

    latestEntry.dataset.emptyText = latestEntry.textContent;

    let observations = loadObservations();

    const updateUI = () => {
        renderObservations({ observations, list, emptyState, totalCount, latestEntry });
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const value = valueInput.value.trim();
        const context = contextInput.value.trim();

        if (!value) {
            valueInput.focus();
            return;
        }

        const id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `observation-${Date.now()}`;

        observations = [
            {
                id,
                value,
                context,
                createdAt: new Date().toISOString()
            },
            ...observations
        ];

        saveObservations(observations);
        updateUI();

        form.reset();
        if (suggestionsList) {
            closeObservationSuggestions(valueInput, suggestionsList);
        }
        valueInput.focus();
    });

    updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initObservationValuePicker();
    initObservationLog();
});
