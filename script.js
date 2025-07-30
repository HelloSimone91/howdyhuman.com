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
    matchAll: true, // true for ALL (AND), false for ANY (OR)
    sortMethod: 'name'
};

// Language state
let currentLanguage = 'en';

// Initialize DOM elements
let searchInput, mainSearchInput, clearSearchBtn, sortSelect, tagFilters, categoryFilters, valuesList,
    matchAll, matchAny, toggleSlide, activeFilters, clearFilters, filterCount,
    toggleFilters, filtersContainer, valuesCount, alphaNav, backToTop, languageToggle;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        showStatus("App initializing...");

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

        // Verify critical elements were found
        if (!valuesList) {
            throw new Error("Critical DOM elements could not be found");
        }

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
        fetchValuesData();

        showStatus("App initialized successfully!");
    } catch (error) {
        console.error("Error initializing app:", error);
        showStatus(`Error initializing app: ${error.message}`, true);

        // Fallback initialization to ensure basic functionality
        fallbackInitialization();
    }
});

// Setup alphabetical navigation
function setupAlphaNav() {
    if (!alphaNav) return;

    // Create array of alphabet letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    // Add each letter
    alphabet.forEach(letter => {
        const link = document.createElement('a');
        link.href = `#section-${letter}`;
        link.textContent = letter;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = document.getElementById(`section-${letter}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            } else {
                // If section doesn't exist, find closest available section
                findClosestSection(letter);
            }
        });
        alphaNav.appendChild(link);
    });

    // Add divider
    const divider = document.createElement('div');
    divider.classList.add('nav-divider');
    alphaNav.appendChild(divider);

    // Add "Skip to Bottom" link
    const skipToBottom = document.createElement('a');
    skipToBottom.href = "#bottom";
    skipToBottom.textContent = "↓";
    skipToBottom.title = "Skip to bottom";
    skipToBottom.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    });
    alphaNav.appendChild(skipToBottom);
}

// Find closest available section for a letter
function findClosestSection(letter) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letterIndex = alphabet.indexOf(letter);

    // Try next letters
    for (let i = letterIndex + 1; i < alphabet.length; i++) {
        const section = document.getElementById(`section-${alphabet[i]}`);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    }

    // If no next letter, try previous letters
    for (let i = letterIndex - 1; i >= 0; i--) {
        const section = document.getElementById(`section-${alphabet[i]}`);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    }
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
        if (currentLanguage === 'en') {
            // Switch to Spanish
            currentLanguage = 'es';
            languageToggle.textContent = 'In English';
            fetchValuesData('es'); // Fetch Spanish data
            showStatus("Loading Spanish values...");
        } else {
            // Switch to English
            currentLanguage = 'en';
            languageToggle.textContent = 'En español';
            fetchValuesData('en'); // Fetch English data
            showStatus("Loading English values...");
        }
    });
}

// Update values count display
function updateValuesCount(count) {
    if (valuesCount) {
        valuesCount.textContent = count || values.length;
    }
}

// Setup filter toggle button
function setupFilterToggle() {
    toggleFilters.addEventListener('click', () => {
        filtersContainer.classList.toggle('collapsed');
        const isCollapsed = filtersContainer.classList.contains('collapsed');

        // Update text and icon
        document.getElementById('toggleFiltersText').textContent = isCollapsed ? 'Show Filters' : 'Hide Filters';
        const icon = document.getElementById('toggleFiltersIcon');
        icon.classList.remove(isCollapsed ? 'fa-chevron-up' : 'fa-chevron-down');
        icon.classList.add(isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up');
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
    updateFilterControls();
    updateActiveFilters();
    filterValues();

    showStatus("All filters cleared");
}

// Fallback initialization if there's an error
function fallbackInitialization() {
    console.log("Using fallback initialization...");

    // Create a fallback display of values
    if (valuesList) {
        valuesList.innerHTML = `
            <div class="bg-yellow-100 p-4 rounded-md mb-4">
                <p>There was an issue loading the interactive dictionary. Here's a simplified version:</p>
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
                            <div class="section-label"><i class="fas fa-lightbulb"></i> EXAMPLE IN REAL LIFE</div>
                            ${value.example}
                        </div>
                        <div>
                            <div class="section-label"><i class="fas fa-tags"></i> ASSOCIATED VERBS</div>
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
        showStatus(`Error fetching values: ${error.message}`, true);
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
            const categories = [...new Set(values.map(value => value.category))].sort();

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
            Array.from(allTags).sort().forEach(tag => {
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

    } catch (error) {
        console.error("Error initializing dictionary:", error);
        showStatus("Error loading values dictionary", true);

        // Try fallback
        if (valuesList) {
            valuesList.innerHTML = `
                <div class="status-error p-4 rounded-md">
                    <h3 class="font-bold mb-2">Error Loading Dictionary</h3>
                    <p>${error.message}</p>
                    <p class="mt-2">Please reload the page or try again later.</p>
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
    badge.classList.add('active-filter', 'text-xs', 'rounded-full', 'px-3', 'py-1', 'flex', 'items-center', 'mr-2', 'mb-2');

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

function updateFilterControls() {
    // Update category checkboxes
    document.querySelectorAll('#categoryFilters input[type="checkbox"]').forEach(checkbox => {
        const category = checkbox.id.replace('category-', '');
        checkbox.checked = filterState.categories.includes(category);
    });

    // Update tag selections
    document.querySelectorAll('#tagFilters .tag').forEach(tagElement => {
        const tag = tagElement.dataset.tag;
        const isSelected = filterState.tags.includes(tag);
        updateTagSelection(tag, isSelected);
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
            filtersContainer.classList.remove('collapsed');
            document.getElementById('toggleFiltersText').textContent = 'Hide Filters';
            const icon = document.getElementById('toggleFiltersIcon');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');

            // Scroll to tag and highlight
            tagElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            tagElement.classList.add('animate-pulse');
            setTimeout(() => {
                tagElement.classList.remove('animate-pulse');
            }, 2000);
        }

        // Show status
        showStatus(`Showing values tagged with "${tagName}"`);

    } catch (error) {
        console.error("Error highlighting tag:", error);
        showStatus(`Error highlighting tag: ${error.message}`, true);
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
    updateFilterControls();
    updateActiveFilters();
    filterValues(valueName);

    // Show status with undo
    showStatus(`Filters widened to include "${valueName}"`, false, {
        text: "Undo",
        onClick: () => {
            // Restore previous filters
            Object.assign(filterState, previousFilterState);
            updateFilterControls();
            updateActiveFilters();
            filterValues();
            showStatus("Filters restored");
        }
    });
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
function displayValues(valuesToDisplay, valueToHighlight = null) {
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
            message.textContent = 'No values match your search criteria.';
            message.classList.add('opacity-75', 'text-lg', 'mb-4');

            const suggestion = document.createElement('p');
            suggestion.textContent = 'Try adjusting your filters or search terms.';
            suggestion.classList.add('opacity-50', 'text-sm');

            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset Filters';
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
            const firstLetter = value.name.charAt(0).toUpperCase();
            if (!valuesByLetter[firstLetter]) {
                valuesByLetter[firstLetter] = [];
            }
            valuesByLetter[firstLetter].push(value);
        });

        // Create sections for each letter
        Object.keys(valuesByLetter).sort().forEach(letter => {
            // Create section header
            const sectionHeader = document.createElement('div');
            sectionHeader.id = `section-${letter}`;
            sectionHeader.classList.add('text-2xl', 'font-bold', 'mt-8', 'mb-4', 'pb-2', 'border-b', 'border-gray-300');
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
                        showStatus(`Showing values in category: ${value.category}`);
                    }
                });

                header.appendChild(title);
                header.appendChild(category);

                const description = document.createElement('p');
                description.textContent = value.description;
                description.classList.add('mb-4');

                // Create content container (for collapsible functionality)
                const contentContainer = document.createElement('div');
                contentContainer.classList.add('value-card-content');

                // Add the example of value in action with label
                const exampleContainer = document.createElement('div');
                exampleContainer.classList.add('mb-4');

                const exampleLabel = document.createElement('div');
                exampleLabel.innerHTML = '<i class="fas fa-lightbulb"></i> EXAMPLE IN REAL LIFE';
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
                tagsLabel.innerHTML = '<i class="fas fa-tags"></i> ASSOCIATED VERBS';
                tagsLabel.classList.add('section-label');
                tagsSection.appendChild(tagsLabel);

                const tagsContainer = document.createElement('div');
                tagsContainer.classList.add('flex', 'flex-wrap');

                value.tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.textContent = tag;
                    tagElement.classList.add('tag', 'hover:bg-indigo-100', 'cursor-pointer');
                    tagElement.title = `Show all values tagged with "${tag}"`;
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
                    relatedLabel.innerHTML = '<i class="fas fa-link"></i> RELATED VALUES';
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
                        tooltip.textContent = 'Click to view this value';
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
                toggleButton.innerHTML = 'Read more <i class="fas fa-chevron-down"></i>';
                toggleButton.addEventListener('click', () => {
                    card.classList.toggle('expanded');
                    toggleButton.innerHTML = card.classList.contains('expanded')
                        ? 'Read less <i class="fas fa-chevron-up"></i>'
                        : 'Read more <i class="fas fa-chevron-down"></i>';
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

        if (valueToHighlight) {
            const cardToHighlight = Array.from(valuesList.querySelectorAll('.value-card'))
                .find(card => card.querySelector(`h3[data-value="${valueToHighlight}"]`));

            if (cardToHighlight) {
                cardToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                cardToHighlight.classList.add('ring-2', 'ring-indigo-500');
                setTimeout(() => {
                    cardToHighlight.classList.remove('ring-2', 'ring-indigo-500');
                }, 2000);

                // Expand the card if it's collapsed
                if (!cardToHighlight.classList.contains('expanded')) {
                    cardToHighlight.querySelector('.value-card-toggle').click();
                }
            }
        }

        console.log("Values displayed successfully");
    } catch (error) {
        console.error("Error displaying values:", error);

        if (valuesList) {
            valuesList.innerHTML = `
                <div class="status-error p-4 rounded-md">
                    <h3 class="font-bold mb-2">Error Displaying Values</h3>
                    <p>${error.message}</p>
                </div>

                <!-- Fallback display -->
                <div class="mt-6">
                    <h3 class="text-lg font-semibold mb-4">Values List:</h3>
                    <ul class="list-disc pl-5 space-y-2">
                        ${values.map(v => `<li>${v.name} - ${v.category}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }
}

// Filter values based on search input and selected tags/categories
function filterValues(valueToHighlight = null) {
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
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (filterState.sortMethod === 'category') {
            filtered.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
        }

        console.log("Found", filtered.length, "matching values");
        displayValues(filtered, valueToHighlight);

    } catch (error) {
        console.error("Error filtering values:", error);
        showStatus("Error filtering values", true);

        // Display all values as fallback
        displayValues(values);
    }
}
