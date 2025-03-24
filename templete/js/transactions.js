/**
 * VELA SYSTEM - Transactions Page
 * Handles transaction listing and filtering
 */

// Global variables
let categoriesData = [];
let allTransactions = [];
let filteredTransactions = [];

/**
 * Initialize transactions page
 */
function initTransactions() {
    // Ensure user is authenticated
    if (!utils.requireAuth()) {
        return;
    }

    // Set up event listeners
    setupEventListeners();

    // Initialize date inputs
    initializeDateRangeFilter();

    // Load categories
    loadCategories().then(() => {
        // Load transactions (after categories are loaded)
        loadTransactions();
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Filter form
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFilters();
        });
    }

    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    // Clear filters button (in no results message)
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', resetFilters);
    }

    // Sort dropdown
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortTransactions(sortSelect.value);
            renderTransactionsTable();
        });
    }
}

/**
 * Initialize date range filter with default values
 */
function initializeDateRangeFilter() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    if (startDateInput && endDateInput) {
        // Set default range to current month
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        startDateInput.value = firstDay.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    }
}

/**
 * Load categories
 */
async function loadCategories() {
    try {
        const result = await api.categories.getAll();
        categoriesData = result.categories || [];

        // Populate category filter dropdown
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            utils.populateSelect(
                categoryFilter,
                categoriesData,
                'id',
                'name',
                { value: '', text: 'All Categories' }
            );
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        utils.showNotification('Error loading categories', 'error');
    }
}

/**
 * Load transactions based on current filters
 */
async function loadTransactions() {
    try {
        // Show loading state
        const loadingDiv = document.getElementById('transactions-loading');
        const tableContainer = document.querySelector('.table-container');
        const noTransactionsDiv = document.getElementById('no-transactions');

        if (loadingDiv) loadingDiv.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        if (noTransactionsDiv) noTransactionsDiv.style.display = 'none';

        // Get filter values
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const categoryFilter = document.getElementById('category-filter');

        // Build filters
        const filters = {};
        if (startDateInput && startDateInput.value) {
            filters.start = startDateInput.value;
        }
        if (endDateInput && endDateInput.value) {
            filters.end = endDateInput.value;
        }
        if (categoryFilter && categoryFilter.value) {
            filters.category_id = categoryFilter.value;
        }

        // Get transactions from API
        const result = await api.transactions.getAll(filters);
        allTransactions = result.transactions || [];

        // Apply any additional client-side filters
        applyFilters();

        // Hide loading state
        if (loadingDiv) loadingDiv.style.display = 'none';

    } catch (error) {
        console.error('Error loading transactions:', error);
        utils.showNotification('Error loading transactions', 'error');

        // Hide loading state
        const loadingDiv = document.getElementById('transactions-loading');
        if (loadingDiv) loadingDiv.style.display = 'none';

        // Show table container (even if empty) to display "no transactions" message
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) tableContainer.style.display = 'block';
    }
}

/**
 * Apply filters to transactions
 */
function applyFilters() {
    // Get filter values
    const typeFilter = document.getElementById('type-filter');
    const typeValue = typeFilter ? typeFilter.value : '';

    // Filter transactions
    filteredTransactions = allTransactions.filter(transaction => {
        // Apply type filter
        if (typeValue && transaction.transaction_type !== typeValue) {
            return false;
        }

        return true;
    });

    // Apply sorting
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortTransactions(sortSelect.value);
    } else {
        // Default sort by date (newest first)
        sortTransactions('date-desc');
    }

    // Render table
    renderTransactionsTable();
}

/**
 * Reset all filters
 */
function resetFilters() {
    // Reset filter form
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        filterForm.reset();

        // Reset date range to current month
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');

        if (startDateInput && endDateInput) {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

            startDateInput.value = firstDay.toISOString().split('T')[0];
            endDateInput.value = today.toISOString().split('T')[0];
        }
    }

    // Reset sort to default
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.value = 'date-desc';
    }

    // Reload transactions
    loadTransactions();
}

/**
 * Sort transactions based on selected criteria
 */
function sortTransactions(sortBy) {
    if (!filteredTransactions) return;

    switch (sortBy) {
        case 'date-desc':
            filteredTransactions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
            break;
        case 'date-asc':
            filteredTransactions.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            break;
        case 'amount-desc':
            filteredTransactions.sort((a, b) => b.amount - a.amount);
            break;
        case 'amount-asc':
            filteredTransactions.sort((a, b) => a.amount - b.amount);
            break;
        default:
            // Default sort by date (newest first)
            filteredTransactions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    }
}

/**
 * Render transactions table
 */
function renderTransactionsTable() {
    const tableBody = document.getElementById('transactions-table');
    const noTransactionsDiv = document.getElementById('no-transactions');
    const tableContainer = document.querySelector('.table-container');
    const transactionsCount = document.getElementById('transactions-count');

    if (!tableBody) return;

    // Check if there are any transactions
    if (!filteredTransactions || filteredTransactions.length === 0) {
        // Show no transactions message
        if (tableContainer) tableContainer.style.display = 'none';
        if (noTransactionsDiv) noTransactionsDiv.style.display = 'block';

        // Update count
        if (transactionsCount) {
            transactionsCount.textContent = '0';
        }

        return;
    }

    // Show table and hide no transactions message
    if (tableContainer) tableContainer.style.display = 'block';
    if (noTransactionsDiv) noTransactionsDiv.style.display = 'none';

    // Update count
    if (transactionsCount) {
        transactionsCount.textContent = filteredTransactions.length.toString();
    }

    // Clear table
    tableBody.innerHTML = '';

    // Add transactions to table
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');

        // Format amount with class based on type
        const amountClass = transaction.transaction_type === 'income' ? 'amount-positive' : 'amount-negative';
        const typeClass = transaction.transaction_type === 'income' ? 'transaction-type-income' : 'transaction-type-expense';

        // Format details based on transaction mode
        let detailsText = '';
        let modeIcon = '';

        if (transaction.transaction_mode === 'recurring') {
            detailsText = `Recurring (${transaction.cycle_days} days)`;
            modeIcon = '<i class="fas fa-sync-alt text-primary" title="Recurring Income"></i> ';
        } else if (transaction.transaction_mode === 'continuous') {
            detailsText = `Installment (${transaction.duration_days} days)`;
            modeIcon = '<i class="fas fa-hourglass-half text-info" title="Installment Plan"></i> ';
        } else {
            detailsText = 'Single transaction';
            modeIcon = '<i class="fas fa-coins" title="Single Transaction"></i> ';
        }

        // Calculate daily average amount
        let dailyAverage = 'N/A';
        if (transaction.transaction_mode === 'recurring' && transaction.cycle_days) {
            dailyAverage = utils.formatCurrency(transaction.amount / transaction.cycle_days);
        } else if (transaction.transaction_mode === 'continuous' && transaction.duration_days) {
            dailyAverage = utils.formatCurrency(transaction.amount / transaction.duration_days);
        }

        row.innerHTML = `
            <td>${utils.formatDate(transaction.start_date)}</td>
            <td>${modeIcon}${transaction.description}</td>
            <td>${transaction.category_name || 'Uncategorized'}</td>
            <td><span class="transaction-type ${typeClass}">${transaction.transaction_type}</span></td>
            <td class="text-right"><span class="amount ${amountClass}">${utils.formatCurrency(transaction.amount)}</span></td>
            <td>${detailsText}</td>
            <td class="text-right">${dailyAverage}</td>
        `;

        tableBody.appendChild(row);
    });
}