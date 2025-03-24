/**
 * VELA SYSTEM - Transactions Page
 * Handles transaction listing, filtering, and CRUD operations
 */

// Global variables
let categoriesData = [];
let allTransactions = [];
let filteredTransactions = [];
let currentTransaction = null;
const PAGE_SIZE = 10;
let currentPage = 1;

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
    
    // Export button
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTransactionsCSV);
    }
    
    // Add transaction buttons
    const addIncomeBtn = document.getElementById('add-income-btn');
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', () => {
            openTransactionModal('income');
        });
    }
    
    const addExpenseBtn = document.getElementById('add-expense-btn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            openTransactionModal('expense');
        });
    }
    
    // Transaction modal checkboxes
    const isRecurringCheck = document.getElementById('is-recurring');
    if (isRecurringCheck) {
        isRecurringCheck.addEventListener('change', () => {
            const recurringOptions = document.getElementById('recurring-options');
            recurringOptions.style.display = isRecurringCheck.checked ? 'block' : 'none';
            
            // Recurring income and continuous expense are mutually exclusive
            if (isRecurringCheck.checked) {
                const hasDurationCheck = document.getElementById('has-duration');
                const durationOptions = document.getElementById('duration-options');
                hasDurationCheck.checked = false;
                durationOptions.style.display = 'none';
            }
        });
    }
    
    const hasDurationCheck = document.getElementById('has-duration');
    if (hasDurationCheck) {
        hasDurationCheck.addEventListener('change', () => {
            const durationOptions = document.getElementById('duration-options');
            durationOptions.style.display = hasDurationCheck.checked ? 'block' : 'none';
            
            // Recurring income and continuous expense are mutually exclusive
            if (hasDurationCheck.checked) {
                const isRecurringCheck = document.getElementById('is-recurring');
                const recurringOptions = document.getElementById('recurring-options');
                isRecurringCheck.checked = false;
                recurringOptions.style.display = 'none';
            }
        });
    }
    
    // Transaction form save button
    const saveTransactionBtn = document.getElementById('save-transaction-btn');
    if (saveTransactionBtn) {
        saveTransactionBtn.addEventListener('click', saveTransaction);
    }
    
    // Details modal buttons
    const editTransactionBtn = document.getElementById('edit-transaction-btn');
    if (editTransactionBtn) {
        editTransactionBtn.addEventListener('click', () => {
            if (currentTransaction) {
                openEditTransactionModal(currentTransaction);
            }
        });
    }
    
    const deleteTransactionBtn = document.getElementById('delete-transaction-btn');
    if (deleteTransactionBtn) {
        deleteTransactionBtn.addEventListener('click', () => {
            if (currentTransaction) {
                confirmDeleteTransaction(currentTransaction);
            }
        });
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });
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
        
        // Populate transaction form category dropdown
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            utils.populateSelect(
                categorySelect,
                categoriesData,
                'id',
                'name',
                { value: '', text: 'Select a category', disabled: true, selected: true }
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
        const tableContainer = document.getElementById('transactions-table').parentNode;
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
    
    // Reset to first page
    currentPage = 1;
    
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
 * Render transactions table with pagination
 */
function renderTransactionsTable() {
    const tableBody = document.getElementById('transactions-table');
    const noTransactionsDiv = document.getElementById('no-transactions');
    const tableContainer = tableBody ? tableBody.parentNode.parentNode : null;
    const paginationContainer = document.getElementById('pagination');
    const transactionsCount = document.getElementById('transactions-count');
    
    if (!tableBody) return;
    
    // Check if there are any transactions
    if (!filteredTransactions || filteredTransactions.length === 0) {
        // Show no transactions message
        tableContainer.style.display = 'none';
        noTransactionsDiv.style.display = 'block';
        
        // Update count
        if (transactionsCount) {
            transactionsCount.textContent = '0';
        }
        
        return;
    }
    
    // Show table and hide no transactions message
    tableContainer.style.display = 'block';
    noTransactionsDiv.style.display = 'none';
    
    // Update count
    if (transactionsCount) {
        transactionsCount.textContent = filteredTransactions.length.toString();
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, filteredTransactions.length);
    const currentPageTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Add transactions to table
    currentPageTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format amount with class based on type
        const amountClass = transaction.transaction_type === 'income' ? 'amount-positive' : 'amount-negative';
        const typeClass = transaction.transaction_type === 'income' ? 'transaction-type-income' : 'transaction-type-expense';
        
        // Format details
        let detailsText = '';
        if (transaction.is_recurring) {
            detailsText = `Recurring (${transaction.cycle_days} days)`;
        } else if (transaction.duration_days) {
            detailsText = `Duration: ${transaction.duration_days} days`;
        } else {
            detailsText = 'Single transaction';
        }
        
        row.innerHTML = `
            <td>${utils.formatDate(transaction.start_date)}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category_name || 'Uncategorized'}</td>
            <td><span class="transaction-type ${typeClass}">${transaction.transaction_type}</span></td>
            <td class="text-right"><span class="amount ${amountClass}">${utils.formatCurrency(transaction.amount)}</span></td>
            <td>${detailsText}</td>
            <td class="table-actions">
                <button class="btn btn-icon btn-icon-sm btn-outline-secondary view-transaction-btn" data-id="${transaction.id}" title="View details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-icon btn-icon-sm btn-outline-primary edit-transaction-btn" data-id="${transaction.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-icon btn-icon-sm btn-outline-danger delete-transaction-btn" data-id="${transaction.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    const viewButtons = tableBody.querySelectorAll('.view-transaction-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const transactionId = button.getAttribute('data-id');
            viewTransactionDetails(transactionId);
        });
    });
    
    const editButtons = tableBody.querySelectorAll('.edit-transaction-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const transactionId = button.getAttribute('data-id');
            editTransaction(transactionId);
        });
    });
    
    const deleteButtons = tableBody.querySelectorAll('.delete-transaction-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const transactionId = button.getAttribute('data-id');
            confirmDeleteTransaction(transactionId);
        });
    });
    
    // Render pagination
    renderPagination(totalPages);
}

/**
 * Render pagination controls
 */
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    // Clear pagination
    paginationContainer.innerHTML = '';
    
    // Don't show pagination if there's only one page
    if (totalPages <= 1) return;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Previous');
    prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
    
    if (currentPage > 1) {
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(currentPage - 1);
        });
    }
    
    prevLi.appendChild(prevLink);
    paginationContainer.appendChild(prevLi);
    
    // Page numbers
    const maxPages = 5; // Maximum number of page links to show
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    // Adjust start page if end page is at maximum
    if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    // Add first page if not visible
    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.className = 'page-item';
        
        const firstLink = document.createElement('a');
        firstLink.className = 'page-link';
        firstLink.href = '#';
        firstLink.textContent = '1';
        
        firstLink.addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(1);
        });
        
        firstLi.appendChild(firstLink);
        paginationContainer.appendChild(firstLi);
        
        // Add ellipsis if there's a gap
        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            
            const ellipsisSpan = document.createElement('span');
            ellipsisSpan.className = 'page-link';
            ellipsisSpan.innerHTML = '&hellip;';
            
            ellipsisLi.appendChild(ellipsisSpan);
            paginationContainer.appendChild(ellipsisLi);
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i.toString();
        
        if (i !== currentPage) {
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                goToPage(i);
            });
        }
        
        pageLi.appendChild(pageLink);
        paginationContainer.appendChild(pageLi);
    }
    
    // Add last page if not visible
    if (endPage < totalPages) {
        // Add ellipsis if there's a gap
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            
            const ellipsisSpan = document.createElement('span');
            ellipsisSpan.className = 'page-link';
            ellipsisSpan.innerHTML = '&hellip;';
            
            ellipsisLi.appendChild(ellipsisSpan);
            paginationContainer.appendChild(ellipsisLi);
        }
        
        const lastLi = document.createElement('li');
        lastLi.className = 'page-item';
        
        const lastLink = document.createElement('a');
        lastLink.className = 'page-link';
        lastLink.href = '#';
        lastLink.textContent = totalPages.toString();
        
        lastLink.addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(totalPages);
        });
        
        lastLi.appendChild(lastLink);
        paginationContainer.appendChild(lastLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Next');
    nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
    
    if (currentPage < totalPages) {
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(currentPage + 1);
        });
    }
    
    nextLi.appendChild(nextLink);
    paginationContainer.appendChild(nextLi);
}

/**
 * Go to a specific page
 */
function goToPage(page) {
    currentPage = page;
    renderTransactionsTable();
    
    // Scroll to top of table
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Export transactions to CSV
 */
function exportTransactionsCSV() {
    if (!filteredTransactions || filteredTransactions.length === 0) {
        utils.showNotification('No transactions to export', 'warning');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Date,Description,Category,Type,Amount,Details\n';
    
    filteredTransactions.forEach(transaction => {
        // Format amount
        const amount = transaction.amount.toFixed(2);
        
        // Format details
        let details = '';
        if (transaction.is_recurring) {
            details = `Recurring (${transaction.cycle_days} days)`;
        } else if (transaction.duration_days) {
            details = `Duration: ${transaction.duration_days} days`;
        } else {
            details = 'Single transaction';
        }
        
        // Add row to CSV
        csvContent += `${transaction.start_date},${transaction.description.replace(/,/g, ' ')},${(transaction.category_name || 'Uncategorized').replace(/,/g, ' ')},${transaction.transaction_type},${amount},"${details}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'vela_transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    utils.showNotification('Transactions exported successfully', 'success');
}

/**
 * View transaction details
 */
async function viewTransactionDetails(transactionId) {
    try {
        // Find transaction in filtered transactions
        const transaction = filteredTransactions.find(t => t.id.toString() === transactionId.toString());
        
        if (!transaction) {
            // If not found in filtered, get from API
            const response = await api.transactions.getById(transactionId);
            currentTransaction = response;
        } else {
            currentTransaction = transaction;
        }
        
        // Populate details modal
        const modal = document.getElementById('transaction-details-modal');
        
        // Amount
        const amountElement = document.getElementById('detail-amount');
        const amountClass = currentTransaction.transaction_type === 'income' ? 'amount-positive' : 'amount-negative';
        amountElement.textContent = utils.formatCurrency(currentTransaction.amount);
        amountElement.className = `transaction-detail-value ${amountClass}`;
        
        // Type
        const typeElement = document.getElementById('detail-type');
        typeElement.textContent = currentTransaction.transaction_type === 'income' ? 'Income' : 'Expense';
        
        // Other fields
        document.getElementById('detail-description').textContent = currentTransaction.description;
        document.getElementById('detail-category').textContent = currentTransaction.category_name || 'Uncategorized';
        document.getElementById('detail-date').textContent = utils.formatDate(currentTransaction.start_date);
        document.getElementById('detail-created-at').textContent = utils.formatDateTime(currentTransaction.created_at);
        
        // Recurring details
        const recurringSection = document.getElementById('detail-recurring-section');
        if (currentTransaction.is_recurring) {
            recurringSection.style.display = 'block';
            document.getElementById('detail-cycle').textContent = `${currentTransaction.cycle_days} days`;
            
            // Calculate daily allocation
            const dailyAllocation = currentTransaction.amount / currentTransaction.cycle_days;
            document.getElementById('detail-daily-allocation').textContent = `${utils.formatCurrency(dailyAllocation)}/day`;
        } else {
            recurringSection.style.display = 'none';
        }
        
        // Duration details
        const durationSection = document.getElementById('detail-duration-section');
        if (currentTransaction.duration_days) {
            durationSection.style.display = 'block';
            document.getElementById('detail-duration').textContent = `${currentTransaction.duration_days} days`;
            
            // Calculate end date
            const startDate = new Date(currentTransaction.start_date);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + currentTransaction.duration_days);
            document.getElementById('detail-end-date').textContent = utils.formatDate(endDate);
            
            // Calculate daily allocation
            const dailyAllocation = currentTransaction.amount / currentTransaction.duration_days;
            document.getElementById('detail-expense-allocation').textContent = `${utils.formatCurrency(dailyAllocation)}/day`;
        } else {
            durationSection.style.display = 'none';
        }
        
        // Show modal
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    } catch (error) {
        console.error('Error loading transaction details:', error);
        utils.showNotification('Error loading transaction details', 'error');
    }
}

/**
 * Edit transaction
 */
function editTransaction(transactionId) {
    // Find transaction in filtered transactions
    const transaction = filteredTransactions.find(t => t.id.toString() === transactionId.toString());
    
    if (transaction) {
        openEditTransactionModal(transaction);
    } else {
        utils.showNotification('Transaction not found', 'error');
    }
}

/**
 * Open transaction modal for editing
 */
function openEditTransactionModal(transaction) {
    // Close details modal if open
    const detailsModal = document.getElementById('transaction-details-modal');
    closeModal(detailsModal);
    
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('transaction-modal-title');
    const form = document.getElementById('transaction-form');
    const idInput = document.getElementById('transaction-id');
    const typeInput = document.getElementById('transaction-type');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const categorySelect = document.getElementById('category');
    const startDateInput = document.getElementById('start-date');
    const isRecurringCheck = document.getElementById('is-recurring');
    const cycleInput = document.getElementById('cycle-days');
    const recurringOptions = document.getElementById('recurring-options');
    const hasDurationCheck = document.getElementById('has-duration');
    const durationInput = document.getElementById('duration-days');
    const durationOptions = document.getElementById('duration-options');
    
    // Set title and type
    modalTitle.textContent = `Edit ${transaction.transaction_type === 'income' ? 'Income' : 'Expense'}`;
    
    // Populate form
    idInput.value = transaction.id;
    typeInput.value = transaction.transaction_type;
    amountInput.value = transaction.amount;
    descriptionInput.value = transaction.description;
    startDateInput.value = transaction.start_date;
    
    // Set category
    if (categorySelect) {
        utils.populateSelect(
            categorySelect,
            categoriesData,
            'id',
            'name',
            { value: '', text: 'Select a category', disabled: true, selected: !transaction.category_id }
        );
        
        if (transaction.category_id) {
            categorySelect.value = transaction.category_id;
        }
    }
    
    // Set recurring options
    isRecurringCheck.checked = transaction.is_recurring;
    recurringOptions.style.display = transaction.is_recurring ? 'block' : 'none';
    if (transaction.is_recurring && transaction.cycle_days) {
        cycleInput.value = transaction.cycle_days;
    }
    
    // Set duration options
    hasDurationCheck.checked = !!transaction.duration_days;
    durationOptions.style.display = transaction.duration_days ? 'block' : 'none';
    if (transaction.duration_days) {
        durationInput.value = transaction.duration_days;
    }
    
    // Show/hide appropriate checkboxes based on type
    if (transaction.transaction_type === 'income') {
        isRecurringCheck.parentNode.style.display = 'block'; // Show recurring option for income
        hasDurationCheck.parentNode.style.display = 'none'; // Hide duration option for income
    } else {
        isRecurringCheck.parentNode.style.display = 'none'; // Hide recurring option for expense
        hasDurationCheck.parentNode.style.display = 'block'; // Show duration option for expense
    }
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Open transaction modal for new transaction
 */
function openTransactionModal(type) {
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('transaction-modal-title');
    const form = document.getElementById('transaction-form');
    const idInput = document.getElementById('transaction-id');
    const typeInput = document.getElementById('transaction-type');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const categorySelect = document.getElementById('category');
    const startDateInput = document.getElementById('start-date');
    const isRecurringCheck = document.getElementById('is-recurring');
    const recurringOptions = document.getElementById('recurring-options');
    const hasDurationCheck = document.getElementById('has-duration');
    const durationOptions = document.getElementById('duration-options');
    
    // Reset form
    form.reset();
    
    // Set title and type
    modalTitle.textContent = type === 'income' ? 'Add Income' : 'Add Expense';
    idInput.value = '';
    typeInput.value = type;
    
    // Set today's date
    startDateInput.value = utils.getCurrentDateString();
    
    // Hide recurring and duration options
    recurringOptions.style.display = 'none';
    durationOptions.style.display = 'none';
    
    // Show the appropriate checkboxes based on type
    if (type === 'income') {
        isRecurringCheck.parentNode.style.display = 'block'; // Show recurring option for income
        hasDurationCheck.parentNode.style.display = 'none'; // Hide duration option for income
    } else {
        isRecurringCheck.parentNode.style.display = 'none'; // Hide recurring option for expense
        hasDurationCheck.parentNode.style.display = 'block'; // Show duration option for expense
    }
    
    // Reset and populate category dropdown
    if (categorySelect) {
        utils.populateSelect(
            categorySelect,
            categoriesData,
            'id',
            'name',
            { value: '', text: 'Select a category', disabled: true, selected: true }
        );
    }
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Focus amount input
    amountInput.focus();
}

/**
 * Save transaction (create or update)
 */
async function saveTransaction() {
    const form = document.getElementById('transaction-form');
    const modal = document.getElementById('transaction-modal');
    const idInput = document.getElementById('transaction-id');
    
    // Validate form
    if (!utils.validateForm(form)) {
        return;
    }
    
    // Get form data
    const formData = utils.serializeForm(form);
    
    // Prepare transaction data
    const transactionData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: formData.category_id || null,
        transaction_type: formData.transaction_type,
        start_date: formData.start_date,
        is_recurring: formData.is_recurring === 'on',
        cycle_days: formData.is_recurring === 'on' ? parseInt(formData.cycle_days) : null,
        duration_days: formData.has_duration === 'on' ? parseInt(formData.duration_days) : null
    };
    
    try {
        // Show loading state
        const saveButton = document.getElementById('save-transaction-btn');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="loading"></span> Saving...';
        
        let response;
        
        if (idInput.value) {
            // Update existing transaction
            response = await api.transactions.update(idInput.value, transactionData);
            utils.showNotification('Transaction updated successfully', 'success');
        } else {
            // Create new transaction
            response = await api.transactions.create(transactionData);
            utils.showNotification('Transaction created successfully', 'success');
        }
        
        // Close modal
        closeModal(modal);
        
        // Reload transactions
        loadTransactions();
        
    } catch (error) {
        // Show error message
        utils.showNotification(error.message || 'Error saving transaction', 'error');
    } finally {
        // Reset save button
        const saveButton = document.getElementById('save-transaction-btn');
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

/**
 * Confirm transaction deletion
 */
function confirmDeleteTransaction(transactionId) {
    if (typeof transactionId === 'object' && transactionId.id) {
        transactionId = transactionId.id;
    }
    
    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        deleteTransaction(transactionId);
    }
}

/**
 * Delete transaction
 */
async function deleteTransaction(transactionId) {
    try {
        // Close any open modals
        const detailsModal = document.getElementById('transaction-details-modal');
        closeModal(detailsModal);
        
        // Show loading overlay
        showPageLoading(true);
        
        // Delete transaction
        const response = await api.transactions.delete(transactionId);
        
        // Show success message
        utils.showNotification('Transaction deleted successfully', 'success');
        
        // Reload transactions
        loadTransactions();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        utils.showNotification(error.message || 'Error deleting transaction', 'error');
    } finally {
        // Hide loading overlay
        showPageLoading(false);
    }
}

/**
 * Close modal
 */
function closeModal(modal) {
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

/**
 * Show loading overlay
 */
function showPageLoading(show) {
    if (show) {
        // Create loading overlay if it doesn't exist
        let overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="loading"></div>
                    <p>Processing...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        // Show overlay
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
    } else {
        // Hide overlay if it exists
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }
}
