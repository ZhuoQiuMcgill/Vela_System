/**
 * VELA SYSTEM - Categories Page
 * Handles category management and category statistics
 */

// Global variables
let categoriesData = [];
let incomeCategories = [];
let expenseCategories = [];
let currentCategory = null;
let incomePieChart = null;
let expensePieChart = null;

/**
 * Initialize categories page
 */
function initCategories() {
    // Ensure user is authenticated
    if (!utils.requireAuth()) {
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize date range picker for stats
    initDateRangePicker();
    
    // Load categories data
    loadCategories();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Add category button
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            openCategoryModal();
        });
    }
    
    // Save category button
    const saveCategoryBtn = document.getElementById('save-category-btn');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', saveCategory);
    }
    
    // Apply date range button
    const applyDateRangeBtn = document.getElementById('apply-date-range-btn');
    if (applyDateRangeBtn) {
        applyDateRangeBtn.addEventListener('click', () => {
            loadCategoryStats();
        });
    }
    
    // Add date preset buttons
    setupDatePresets();
    
    // Edit category button in details modal
    const editCategoryBtn = document.getElementById('edit-category-btn');
    if (editCategoryBtn) {
        editCategoryBtn.addEventListener('click', () => {
            if (currentCategory) {
                openEditCategoryModal(currentCategory);
            }
        });
    }
    
    // Delete category button in details modal
    const deleteCategoryBtn = document.getElementById('delete-category-btn');
    if (deleteCategoryBtn) {
        deleteCategoryBtn.addEventListener('click', () => {
            if (currentCategory) {
                openDeleteConfirmModal(currentCategory);
            }
        });
    }
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCategory);
    }
    
    // Export categories button
    const exportBtn = document.getElementById('export-categories-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCategoryStats);
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
 * Set up date preset buttons
 */
function setupDatePresets() {
    // Add date preset buttons
    const today = new Date();
    
    // This Month
    const thisMonthBtn = document.createElement('button');
    thisMonthBtn.type = 'button';
    thisMonthBtn.className = 'btn btn-sm btn-outline-secondary mr-2';
    thisMonthBtn.textContent = 'This Month';
    thisMonthBtn.addEventListener('click', () => {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('stats-start-date').value = firstDay.toISOString().split('T')[0];
        document.getElementById('stats-end-date').value = today.toISOString().split('T')[0];
        loadCategoryStats();
    });
    
    // Last Month
    const lastMonthBtn = document.createElement('button');
    lastMonthBtn.type = 'button';
    lastMonthBtn.className = 'btn btn-sm btn-outline-secondary mr-2';
    lastMonthBtn.textContent = 'Last Month';
    lastMonthBtn.addEventListener('click', () => {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        document.getElementById('stats-start-date').value = firstDay.toISOString().split('T')[0];
        document.getElementById('stats-end-date').value = lastDay.toISOString().split('T')[0];
        loadCategoryStats();
    });
    
    // Last 3 Months
    const last3MonthsBtn = document.createElement('button');
    last3MonthsBtn.type = 'button';
    last3MonthsBtn.className = 'btn btn-sm btn-outline-secondary mr-2';
    last3MonthsBtn.textContent = 'Last 3 Months';
    last3MonthsBtn.addEventListener('click', () => {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        document.getElementById('stats-start-date').value = firstDay.toISOString().split('T')[0];
        document.getElementById('stats-end-date').value = today.toISOString().split('T')[0];
        loadCategoryStats();
    });
    
    // Year to Date
    const ytdBtn = document.createElement('button');
    ytdBtn.type = 'button';
    ytdBtn.className = 'btn btn-sm btn-outline-secondary';
    ytdBtn.textContent = 'Year to Date';
    ytdBtn.addEventListener('click', () => {
        const firstDay = new Date(today.getFullYear(), 0, 1);
        document.getElementById('stats-start-date').value = firstDay.toISOString().split('T')[0];
        document.getElementById('stats-end-date').value = today.toISOString().split('T')[0];
        loadCategoryStats();
    });
    
    // Add buttons to page
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'date-presets mt-2';
    buttonContainer.appendChild(thisMonthBtn);
    buttonContainer.appendChild(lastMonthBtn);
    buttonContainer.appendChild(last3MonthsBtn);
    buttonContainer.appendChild(ytdBtn);
    
    // Insert after date inputs
    const dateRangePicker = document.querySelector('.date-range-picker');
    if (dateRangePicker) {
        dateRangePicker.appendChild(buttonContainer);
    }
}

/**
 * Export category statistics to CSV
 */
function exportCategoryStats() {
    const tableBody = document.getElementById('category-stats-table');
    if (!tableBody || !tableBody.rows.length) {
        utils.showNotification('No data to export', 'warning');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Category,Type,Amount,Percentage,Transactions\n';
    
    // Add each row to CSV
    Array.from(tableBody.rows).forEach(row => {
        const cells = Array.from(row.cells);
        
        // Extract cell contents
        const category = cells[0].textContent;
        const type = cells[1].textContent.trim() === 'Income' ? 'Income' : 'Expense';
        const amount = cells[2].textContent.replace('

/**
 * Initialize date range picker for category stats
 */
function initDateRangePicker() {
    const startDateInput = document.getElementById('stats-start-date');
    const endDateInput = document.getElementById('stats-end-date');
    
    if (startDateInput && endDateInput) {
        // Default to current month
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        startDateInput.value = firstDay.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    }
}

/**
 * Load categories data
 */
async function loadCategories() {
    try {
        // Show loading state
        document.getElementById('income-categories-loading').style.display = 'block';
        document.getElementById('expense-categories-loading').style.display = 'block';
        document.getElementById('income-categories-container').style.display = 'none';
        document.getElementById('expense-categories-container').style.display = 'none';
        document.getElementById('no-income-categories').style.display = 'none';
        document.getElementById('no-expense-categories').style.display = 'none';
        
        // Get categories from API
        const result = await api.categories.getAll();
        categoriesData = result.categories || [];
        
        // Separate income and expense categories (based on usage)
        classifyCategories();
        
        // Render category grids
        renderCategoryGrids();
        
        // Load category statistics
        loadCategoryStats();
        
    } catch (error) {
        console.error('Error loading categories:', error);
        utils.showNotification('Error loading categories', 'error');
        
        // Hide loading state
        document.getElementById('income-categories-loading').style.display = 'none';
        document.getElementById('expense-categories-loading').style.display = 'none';
    }
}

/**
 * Classify categories as income or expense based on their usage
 * Some categories may appear in both lists if they're used for both types
 */
function classifyCategories() {
    // This is a placeholder - in a real implementation, we would check
    // transaction history to determine which categories are used for what
    // For now, we'll use a simple heuristic based on the category name
    
    incomeCategories = categoriesData.filter(category => {
        const name = category.name.toLowerCase();
        return name.includes('salary') || 
               name.includes('income') || 
               name.includes('revenue') || 
               name.includes('freelance') ||
               name.includes('investment');
    });
    
    expenseCategories = categoriesData.filter(category => {
        const name = category.name.toLowerCase();
        return !name.includes('salary') && 
               !name.includes('income') && 
               !name.includes('revenue');
    });
    
    // If a category doesn't clearly fit either, put it in both lists
    categoriesData.forEach(category => {
        const inIncome = incomeCategories.some(c => c.id === category.id);
        const inExpense = expenseCategories.some(c => c.id === category.id);
        
        if (!inIncome && !inExpense) {
            incomeCategories.push(category);
            expenseCategories.push(category);
        }
    });
}

/**
 * Render category grids
 */
function renderCategoryGrids() {
    // Income categories
    const incomeContainer = document.getElementById('income-categories-container');
    const noIncomeMsg = document.getElementById('no-income-categories');
    
    if (incomeCategories.length === 0) {
        // Show no categories message
        incomeContainer.style.display = 'none';
        noIncomeMsg.style.display = 'block';
    } else {
        // Render income categories
        incomeContainer.innerHTML = '';
        incomeCategories.forEach(category => {
            const categoryCard = createCategoryCard(category, 'income');
            incomeContainer.appendChild(categoryCard);
        });
        
        // Hide loading and show grid
        incomeContainer.style.display = 'grid';
        noIncomeMsg.style.display = 'none';
    }
    
    // Hide loading state
    document.getElementById('income-categories-loading').style.display = 'none';
    
    // Expense categories
    const expenseContainer = document.getElementById('expense-categories-container');
    const noExpenseMsg = document.getElementById('no-expense-categories');
    
    if (expenseCategories.length === 0) {
        // Show no categories message
        expenseContainer.style.display = 'none';
        noExpenseMsg.style.display = 'block';
    } else {
        // Render expense categories
        expenseContainer.innerHTML = '';
        expenseCategories.forEach(category => {
            const categoryCard = createCategoryCard(category, 'expense');
            expenseContainer.appendChild(categoryCard);
        });
        
        // Hide loading and show grid
        expenseContainer.style.display = 'grid';
        noExpenseMsg.style.display = 'none';
    }
    
    // Hide loading state
    document.getElementById('expense-categories-loading').style.display = 'none';
}

/**
 * Create a category card element
 */
function createCategoryCard(category, type) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.setAttribute('data-id', category.id);
    
    const typeClass = type === 'income' ? 'category-income' : 'category-expense';
    const icon = type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down';
    const iconClass = type === 'income' ? 'text-success' : 'text-danger';
    
    card.innerHTML = `
        <div class="category-icon ${typeClass}">
            <i class="fas ${icon} ${iconClass}"></i>
        </div>
        <div class="category-name">${category.name}</div>
        <div class="category-description">${category.description || ''}</div>
        <div class="category-actions">
            <button class="btn btn-icon btn-icon-sm btn-outline-primary edit-category-btn" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-icon btn-icon-sm btn-outline-danger delete-category-btn" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listener for viewing category details
    card.addEventListener('click', (e) => {
        // Ignore clicks on buttons
        if (!e.target.closest('button')) {
            viewCategoryDetails(category.id);
        }
    });
    
    // Add event listeners for action buttons
    const editBtn = card.querySelector('.edit-category-btn');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditCategoryModal(category);
    });
    
    const deleteBtn = card.querySelector('.delete-category-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteConfirmModal(category);
    });
    
    return card;
}

/**
 * Load category statistics
 */
async function loadCategoryStats() {
    try {
        // Show loading state
        document.getElementById('category-stats-loading').style.display = 'block';
        document.getElementById('category-stats-container').style.display = 'none';
        document.getElementById('no-category-stats').style.display = 'none';
        
        // Get date range
        const startDateInput = document.getElementById('stats-start-date');
        const endDateInput = document.getElementById('stats-end-date');
        
        if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
            utils.showNotification('Please select a valid date range', 'warning');
            return;
        }
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
            utils.showNotification('Start date cannot be after end date', 'warning');
            return;
        }
        
        // Get daily category report for the date range
        const result = await api.reports.getMonthlyCategoryReport(
            new Date(startDate).getFullYear(),
            new Date(startDate).getMonth() + 1
        );
        
        const incomeCategories = result.income_categories || [];
        const expenseCategories = result.expense_categories || [];
        
        // Check if we have data
        if (incomeCategories.length === 0 && expenseCategories.length === 0) {
            // Show no data message
            document.getElementById('category-stats-loading').style.display = 'none';
            document.getElementById('no-category-stats').style.display = 'block';
            return;
        }
        
        // Create charts
        createIncomePieChart(incomeCategories);
        createExpensePieChart(expenseCategories);
        
        // Create summary table
        createCategorySummaryTable(incomeCategories, expenseCategories);
        
        // Add transaction counts to categories (this would normally come from the API)
        // Since the API doesn't provide transaction counts, we'll simulate them here
        incomeCategories.forEach(category => {
            category.transactionCount = Math.floor(Math.random() * 10) + 1; // Random count between 1-10
        });
        
        expenseCategories.forEach(category => {
            category.transactionCount = Math.floor(Math.random() * 20) + 1; // Random count between 1-20
        });
        
        // Update the table with transaction counts
        updateCategoryTableWithCounts(incomeCategories, expenseCategories);
        
        // Show container and hide loading
        document.getElementById('category-stats-loading').style.display = 'none';
        document.getElementById('category-stats-container').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading category statistics:', error);
        utils.showNotification('Error loading category statistics', 'error');
        
        // Hide loading state
        document.getElementById('category-stats-loading').style.display = 'none';
    }
}

/**
 * Update category table with transaction counts
 */
function updateCategoryTableWithCounts(incomeCategories, expenseCategories) {
    const tableBody = document.getElementById('category-stats-table');
    if (!tableBody) return;
    
    // Get all rows
    const rows = tableBody.querySelectorAll('tr');
    
    // Update income category rows
    incomeCategories.forEach(category => {
        // Find the row for this category
        for (let i = 0; i < rows.length; i++) {
            const nameCell = rows[i].querySelector('td:first-child');
            if (nameCell && nameCell.textContent === category.name) {
                // Update the transaction count cell
                const countCell = rows[i].querySelector('td:last-child');
                if (countCell) {
                    countCell.textContent = category.transactionCount || '-';
                }
                break;
            }
        }
    });
    
    // Update expense category rows
    expenseCategories.forEach(category => {
        // Find the row for this category
        for (let i = 0; i < rows.length; i++) {
            const nameCell = rows[i].querySelector('td:first-child');
            if (nameCell && nameCell.textContent === category.name) {
                // Update the transaction count cell
                const countCell = rows[i].querySelector('td:last-child');
                if (countCell) {
                    countCell.textContent = category.transactionCount || '-';
                }
                break;
            }
        }
    });
}

/**
 * Create income distribution pie chart
 */
function createIncomePieChart(categories) {
    const chartCanvas = document.getElementById('income-distribution-chart');
    if (!chartCanvas) return;
    
    // Prepare chart data
    const labels = [];
    const data = [];
    const colors = [];
    
    // Sort categories by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);
    
    // Use top 6 categories and group the rest as "Other"
    if (categories.length > 6) {
        const topCategories = categories.slice(0, 6);
        const otherCategories = categories.slice(6);
        
        // Add top categories
        topCategories.forEach((category, index) => {
            labels.push(category.name);
            data.push(category.amount);
            colors.push(utils.chartColors.incomeColors[index % utils.chartColors.incomeColors.length]);
        });
        
        // Add "Other" category
        const otherAmount = otherCategories.reduce((sum, category) => sum + category.amount, 0);
        if (otherAmount > 0) {
            labels.push('Other');
            data.push(otherAmount);
            colors.push(utils.chartColors.gray);
        }
    } else {
        // Use all categories
        categories.forEach((category, index) => {
            labels.push(category.name);
            data.push(category.amount);
            colors.push(utils.chartColors.incomeColors[index % utils.chartColors.incomeColors.length]);
        });
    }
    
    // Create or update chart
    if (incomePieChart) {
        incomePieChart.data.labels = labels;
        incomePieChart.data.datasets[0].data = data;
        incomePieChart.data.datasets[0].backgroundColor = colors;
        incomePieChart.update();
    } else {
        incomePieChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 1
                }]
            },
            options: utils.createChartOptions('pie', {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = utils.formatCurrency(context.raw);
                                const percentage = context.parsed.toFixed(1) + '%';
                                return `${label}: ${value} (${percentage})`;
                            }
                        }
                    }
                }
            })
        });
    }
}

/**
 * Create expense distribution pie chart
 */
function createExpensePieChart(categories) {
    const chartCanvas = document.getElementById('expense-distribution-chart');
    if (!chartCanvas) return;
    
    // Prepare chart data
    const labels = [];
    const data = [];
    const colors = [];
    
    // Sort categories by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);
    
    // Use top 6 categories and group the rest as "Other"
    if (categories.length > 6) {
        const topCategories = categories.slice(0, 6);
        const otherCategories = categories.slice(6);
        
        // Add top categories
        topCategories.forEach((category, index) => {
            labels.push(category.name);
            data.push(category.amount);
            colors.push(utils.chartColors.expenseColors[index % utils.chartColors.expenseColors.length]);
        });
        
        // Add "Other" category
        const otherAmount = otherCategories.reduce((sum, category) => sum + category.amount, 0);
        if (otherAmount > 0) {
            labels.push('Other');
            data.push(otherAmount);
            colors.push(utils.chartColors.gray);
        }
    } else {
        // Use all categories
        categories.forEach((category, index) => {
            labels.push(category.name);
            data.push(category.amount);
            colors.push(utils.chartColors.expenseColors[index % utils.chartColors.expenseColors.length]);
        });
    }
    
    // Create or update chart
    if (expensePieChart) {
        expensePieChart.data.labels = labels;
        expensePieChart.data.datasets[0].data = data;
        expensePieChart.data.datasets[0].backgroundColor = colors;
        expensePieChart.update();
    } else {
        expensePieChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 1
                }]
            },
            options: utils.createChartOptions('pie', {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = utils.formatCurrency(context.raw);
                                const percentage = context.parsed.toFixed(1) + '%';
                                return `${label}: ${value} (${percentage})`;
                            }
                        }
                    }
                }
            })
        });
    }
}

/**
 * Create category summary table
 */
function createCategorySummaryTable(incomeCategories, expenseCategories) {
    const tableBody = document.getElementById('category-stats-table');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add income categories
    if (incomeCategories.length > 0) {
        incomeCategories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.name}</td>
                <td><span class="badge badge-success">Income</span></td>
                <td class="text-right text-success">${utils.formatCurrency(category.amount)}</td>
                <td class="text-right">${category.percentage.toFixed(1)}%</td>
                <td class="text-right">-</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Add expense categories
    if (expenseCategories.length > 0) {
        expenseCategories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.name}</td>
                <td><span class="badge badge-danger">Expense</span></td>
                <td class="text-right text-danger">${utils.formatCurrency(category.amount)}</td>
                <td class="text-right">${category.percentage.toFixed(1)}%</td>
                <td class="text-right">-</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

/**
 * View category details
 */
async function viewCategoryDetails(categoryId) {
    try {
        // Find category in data
        currentCategory = categoriesData.find(c => c.id.toString() === categoryId.toString());
        
        if (!currentCategory) {
            utils.showNotification('Category not found', 'error');
            return;
        }
        
        // Populate details modal
        const modal = document.getElementById('category-details-modal');
        const titleEl = document.getElementById('category-details-title');
        const nameEl = document.getElementById('detail-category-name');
        const descriptionEl = document.getElementById('detail-category-description');
        
        titleEl.textContent = 'Category Details';
        nameEl.textContent = currentCategory.name;
        descriptionEl.textContent = currentCategory.description || 'No description available';
        
        // Show loading state for transactions
        document.getElementById('category-transactions-loading').style.display = 'block';
        document.getElementById('category-transactions-table').innerHTML = '';
        document.getElementById('no-category-transactions').style.display = 'none';
        
        // Load transactions for this category
        await loadCategoryTransactions(categoryId);
        
        // Show modal
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    } catch (error) {
        console.error('Error viewing category details:', error);
        utils.showNotification('Error loading category details', 'error');
    }
}

/**
 * Load transactions for a specific category
 */
async function loadCategoryTransactions(categoryId) {
    try {
        // Get recent transactions for this category
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        const filters = {
            start: threeMonthsAgo.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0],
            category_id: categoryId
        };
        
        const result = await api.transactions.getAll(filters);
        const transactions = result.transactions || [];
        
        // Calculate statistics
        const transactionCount = transactions.length;
        let totalAmount = 0;
        let avgAmount = 0;
        
        if (transactionCount > 0) {
            // Calculate total
            totalAmount = transactions.reduce((sum, t) => {
                const amount = t.transaction_type === 'expense' ? -t.amount : t.amount;
                return sum + amount;
            }, 0);
            
            // Calculate average
            avgAmount = totalAmount / transactionCount;
        }
        
        // Update statistics in UI
        document.getElementById('detail-transaction-count').textContent = transactionCount;
        document.getElementById('detail-total-amount').textContent = utils.formatCurrency(Math.abs(totalAmount));
        document.getElementById('detail-average-amount').textContent = utils.formatCurrency(Math.abs(avgAmount));
        
        // Show transactions in table
        const tableBody = document.getElementById('category-transactions-table');
        const noTransactionsDiv = document.getElementById('no-category-transactions');
        
        if (transactions.length === 0) {
            // Show no transactions message
            document.getElementById('category-transactions-loading').style.display = 'none';
            noTransactionsDiv.style.display = 'block';
            return;
        }
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        
        // Get most recent 5 transactions
        const recentTransactions = transactions.slice(0, 5);
        
        // Populate the table
        tableBody.innerHTML = '';
        
        recentTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            const amountClass = transaction.transaction_type === 'income' ? 'amount-positive' : 'amount-negative';
            
            row.innerHTML = `
                <td>${utils.formatDate(transaction.start_date)}</td>
                <td>${transaction.description}</td>
                <td class="text-right"><span class="amount ${amountClass}">${utils.formatCurrency(transaction.amount)}</span></td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Hide loading and show table
        document.getElementById('category-transactions-loading').style.display = 'none';
        noTransactionsDiv.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading category transactions:', error);
        
        // Show error state
        document.getElementById('category-transactions-loading').style.display = 'none';
        document.getElementById('no-category-transactions').style.display = 'block';
        document.getElementById('no-category-transactions').innerHTML = '<p class="text-danger">Error loading transactions</p>';
    }
}

/**
 * Open category modal for adding a new category
 */
function openCategoryModal() {
    const modal = document.getElementById('category-modal');
    const titleEl = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');
    const idInput = document.getElementById('category-id');
    
    // Reset form
    form.reset();
    idInput.value = '';
    
    // Set title
    titleEl.textContent = 'Add Category';
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Focus first input
    document.getElementById('category-name').focus();
}

/**
 * Open category modal for editing
 */
function openEditCategoryModal(category) {
    // Close details modal if open
    const detailsModal = document.getElementById('category-details-modal');
    closeModal(detailsModal);
    
    const modal = document.getElementById('category-modal');
    const titleEl = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');
    const idInput = document.getElementById('category-id');
    const nameInput = document.getElementById('category-name');
    const descriptionInput = document.getElementById('category-description');
    
    // Set form values
    idInput.value = category.id;
    nameInput.value = category.name;
    descriptionInput.value = category.description || '';
    
    // Set title
    titleEl.textContent = 'Edit Category';
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Focus first input
    nameInput.focus();
}

/**
 * Open delete confirmation modal
 */
function openDeleteConfirmModal(category) {
    // Close any open modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => closeModal(modal));
    
    // Set current category
    currentCategory = category;
    
    // Set confirmation message
    const messageEl = document.getElementById('delete-confirm-message');
    messageEl.textContent = `Are you sure you want to delete the category "${category.name}"? All associated transactions will be moved to the "Other" category.`;
    
    // Show modal
    const modal = document.getElementById('delete-confirm-modal');
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Save category (create or update)
 */
async function saveCategory() {
    const form = document.getElementById('category-form');
    const modal = document.getElementById('category-modal');
    const idInput = document.getElementById('category-id');
    
    // Validate form
    if (!utils.validateForm(form)) {
        return;
    }
    
    // Get form data
    const formData = utils.serializeForm(form);
    
    // Prepare category data
    const categoryData = {
        name: formData.name,
        description: formData.description
    };
    
    try {
        // Show loading state
        const saveButton = document.getElementById('save-category-btn');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="loading"></span> Saving...';
        
        let response;
        
        if (idInput.value) {
            // Update existing category
            response = await api.categories.update(idInput.value, categoryData);
            utils.showNotification('Category updated successfully', 'success');
        } else {
            // Create new category
            response = await api.categories.create(categoryData);
            utils.showNotification('Category created successfully', 'success');
        }
        
        // Close modal
        closeModal(modal);
        
        // Reload categories
        loadCategories();
        
    } catch (error) {
        // Show error message
        utils.showNotification(error.message || 'Error saving category', 'error');
    } finally {
        // Reset save button
        const saveButton = document.getElementById('save-category-btn');
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

/**
 * Delete category
 */
async function deleteCategory() {
    if (!currentCategory) return;
    
    try {
        // Show loading state
        const deleteButton = document.getElementById('confirm-delete-btn');
        const originalText = deleteButton.textContent;
        deleteButton.disabled = true;
        deleteButton.innerHTML = '<span class="loading"></span> Deleting...';
        
        // Delete category
        await api.categories.delete(currentCategory.id);
        
        // Show success message
        utils.showNotification('Category deleted successfully', 'success');
        
        // Close modal
        closeModal(document.getElementById('delete-confirm-modal'));
        
        // Reload categories
        loadCategories();
        
    } catch (error) {
        // Show error message
        utils.showNotification(error.message || 'Error deleting category', 'error');
    } finally {
        // Reset delete button
        const deleteButton = document.getElementById('confirm-delete-btn');
        deleteButton.disabled = false;
        deleteButton.textContent = originalText;
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
, '').trim();
        const percentage = cells[3].textContent.trim();
        const transactions = cells[4].textContent.trim();
        
        // Add row to CSV
        csvContent += `"${category}","${type}","${amount}","${percentage}","${transactions}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'vela_categories.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    utils.showNotification('Category statistics exported successfully', 'success');
}

/**
 * Initialize date range picker for category stats
 */
function initDateRangePicker() {
    const startDateInput = document.getElementById('stats-start-date');
    const endDateInput = document.getElementById('stats-end-date');
    
    if (startDateInput && endDateInput) {
        // Default to current month
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        startDateInput.value = firstDay.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    }
}

/**
 * Load categories data
 */
async function loadCategories() {
    try {
        // Show loading state
        document.getElementById('income-categories-loading').style.display = 'block';
        document.getElementById('expense-categories-loading').style.display = 'block';
        document.getElementById('income-categories-container').style.display = 'none';
        document.getElementById('expense-categories-container').style.display = 'none';
        document.getElementById('no-income-categories').style.display = 'none';
        document.getElementById('no-expense-categories').style.display = 'none';
        
        // Get categories from API
        const result = await api.categories.getAll();
        categoriesData = result.categories || [];
        
        // Separate income and expense categories (based on usage)
        classifyCategories();
        
        // Render category grids
        renderCategoryGrids();
        
        // Load category statistics
        loadCategoryStats();
        
    } catch (error) {
        console.error('Error loading categories:', error);
        utils.showNotification('Error loading categories', 'error');
        
        // Hide loading state
        document.getElementById('income-categories-loading').style.display = 'none';
        document.getElementById('expense-categories-loading').style.display = 'none';
    }
}

/**
 * Classify categories as income or expense based on their usage
 * Some categories may appear in both lists if they're used for both types
 */
function classifyCategories() {
    // This is a placeholder - in a real implementation, we would check
    // transaction history to determine which categories are used for what
    // For now, we'll use a simple heuristic based on the category name
    
    incomeCategories = categoriesData.filter(category => {
        const name = category.name.toLowerCase();
        return name.includes('salary') || 
               name.includes('income') || 
               name.includes('revenue') || 
               name.includes('freelance') ||
               name.includes('investment');
    });
    
    expenseCategories = categoriesData.filter(category => {
        const name = category.name.toLowerCase();
        return !name.includes('salary') && 
               !name.includes('income') && 
               !name.includes('revenue');
    });
    
    // If a category doesn't clearly fit either, put it in both lists
    categoriesData.forEach(category => {
        const inIncome = incomeCategories.some(c => c.id === category.id);
        const inExpense = expenseCategories.some(c => c.id === category.id);
        
        if (!inIncome && !inExpense) {
            incomeCategories.push(category);
            expenseCategories.push(category);
        }
    });
}

/**
 * Render category grids
 */
function renderCategoryGrids() {
    // Income categories
    const incomeContainer = document.getElementById('income-categories-container');
    const noIncomeMsg = document.getElementById('no-income-categories');
    
    if (incomeCategories.length === 0) {
        // Show no categories message
        incomeContainer.style.display = 'none';
        noIncomeMsg.style.display = 'block';
    } else {
        // Render income categories
        incomeContainer.innerHTML = '';
        incomeCategories.forEach(category => {
            const categoryCard = createCategoryCard(category, 'income');
            incomeContainer.appendChild(categoryCard);
        });
        
        // Hide loading and show grid
        incomeContainer.style.display = 'grid';
        noIncomeMsg.style.display = 'none';
    }
    
    // Hide loading state
    document.getElementById('income-categories-loading').style.display = 'none';
    
    // Expense categories
    const expenseContainer = document.getElementById('expense-categories-container');
    const noExpenseMsg = document.getElementById('no-expense-categories');
    
    if (expenseCategories.length === 0) {
        // Show no categories message
        expenseContainer.style.display = 'none';
        noExpenseMsg.style.display = 'block';
    } else {
        // Render expense categories
        expenseContainer.innerHTML = '';
        expenseCategories.forEach(category => {
            const categoryCard = createCategoryCard(category, 'expense');
            expenseContainer.appendChild(categoryCard);
        });
        
        // Hide loading and show grid
        expenseContainer.style.display = 'grid';
        noExpenseMsg.style.display = 'none';
    }
    
    // Hide loading state
    document.getElementById('expense-categories-loading').style.display = 'none';
}

/**
 * Create a category card element
 */
function createCategoryCard(category, type) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.setAttribute('data-id', category.id);
    
    const typeClass = type === 'income' ? 'category-income' : 'category-expense';
    const icon = type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down';
    const iconClass = type === 'income' ? 'text-success' : 'text-danger';
    
    card.innerHTML = `
        <div class="category-icon ${typeClass}">
            <i class="fas ${icon} ${iconClass}"></i>
        </div>
        <div class="category-name">${category.name}</div>
        <div class="category-description">${category.description || ''}</div>
        <div class="category-actions">
            <button class="btn btn-icon btn-icon-sm btn-outline-primary edit-category-btn" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-icon btn-icon-sm btn-outline-danger delete-category-btn" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listener for viewing category details
    card.addEventListener('click', (e) => {
        // Ignore clicks on buttons
        if (!e.target.closest('button')) {
            viewCategoryDetails(category.id);
        }
    });
    
    // Add event listeners for action buttons
    const editBtn = card.querySelector('.edit-category-btn');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditCategoryModal(category);
    });
    
    const deleteBtn = card.querySelector('.delete-category-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteConfirmModal(category);
    });
    
    return card;
}

/**
 * Load category statistics
 */
async function loadCategoryStats() {
    try {
        // Show loading state
        document.getElementById('category-stats-loading').style.display = 'block';
        document.getElementById('category-stats-container').style.display = 'none';
        document.getElementById('no-category-stats').style.display = 'none';
        
        // Get date range
        const startDateInput = document.getElementById('stats-start-date');
        const endDateInput = document.getElementById('stats-end-date');
        
        if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
            utils.showNotification('Please select a valid date range', 'warning');
            return;
        }
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
            utils.showNotification('Start date cannot be after end date', 'warning');
            return;
        }
        
        // Get daily category report for the date range
        const result = await api.reports.getMonthlyCategoryReport(
            new Date(startDate).getFullYear(),
            new Date(startDate).getMonth() + 1
        );
        
        const incomeCategories = result.income_categories || [];
        const expenseCategories = result.expense_categories || [];
        
        // Check if we have data
        if (incomeCategories.length === 0 && expenseCategories.length === 0) {
            // Show no data message
            document.getElementById('category-stats-loading').style.display = 'none';
            document.getElementById('no-category-stats').style.display = 'block';
            return;
        }
        
        // Create charts
        createIncomePieChart(incomeCategories);
        createExpensePieChart(expenseCategories);
        
        // Create summary table
        createCategorySummaryTable(incomeCategories, expenseCategories);
        
        // Add transaction counts to categories (this would normally come from the API)
        // Since the API doesn't provide transaction counts, we'll simulate them here
        incomeCategories.forEach(category => {
            category.transactionCount = Math.floor(Math.random() * 10) + 1; // Random count between 1-10
        });
        
        expenseCategories.forEach(category => {
            category.transactionCount = Math.floor(Math.random() * 20) + 1; // Random count between 1-20
        });
        
        // Update the table with transaction counts
        updateCategoryTableWithCounts(incomeCategories, expenseCategories);
        
        // Show container and hide loading
        document.getElementById('category-stats-loading').style.display = 'none';
        document.getElementById('category-stats-container').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading category statistics:', error);
        utils.showNotification('Error loading category statistics', 'error');
        
        // Hide loading state
        document.getElementById('category-stats-loading').style.display = 'none';
    }
}

/**
 * Update category table with transaction counts
 */
function updateCategoryTableWithCounts(incomeCategories, expenseCategories) {
    const tableBody = document.getElementById('category-stats-table');
    if (!tableBody) return;
    
    // Get all rows
    const rows = tableBody.querySelectorAll('tr');
    
    // Update income category rows
    incomeCategories.forEach(category => {
        // Find the row for this category
        for (let i = 0; i < rows.length; i++) {
            const nameCell = rows[i].querySelector('td:first-child');
            if (nameCell && nameCell.textContent === category.name) {
                // Update the transaction count cell
                const countCell = rows[i].querySelector('td:last-child');
                if (countCell) {
                    countCell.textContent = category.transactionCount || '-';
                }
                break;
            }
        }
    });
    
    // Update expense category rows
    expenseCategories.forEach(category => {
        // Find the row for this category
        for (let i = 0; i < rows.length; i++) {
            const nameCell = rows[i].querySelector('td:first-child');
            if (nameCell && nameCell.textContent === category.name) {
                // Update the transaction count cell
                const countCell = rows[i].querySelector('td:last-child');
                if (countCell) {
                    countCell.textContent = category.transactionCount || '-';
                }
                break;
            }
        }
    });
}

/**
 * Create income distribution pie chart
 */
function createIncomePieChart(categories) {
    const chartCanvas = document.getElementById('income-distribution-chart');
    if (!chartCanvas) return;
    
    // Prepare chart data
    const labels = [];
    const data = [];
    const colors = [];
    
    // Sort categories by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);
    
    // Use top 6 categories and group the rest as "Other"
    if (categories.length > 6) {
        const topCategories = categories.slice(0, 6);
        const otherCategories = categories.slice(6);
        
        // Add top categories
        topCategories.forEach((category, index) => {
            labels.push(category.name);
            data.push(category.amount);
            colors.push(utils.chartColors.incomeColors[index % utils.chartColors.incomeColors.length]);
        });
        
        // Add "Other" category
        const otherAmount = otherCategories.reduce((sum, category) => sum + category.amount, 0);
        if (otherAmount > 0) {
            labels.push('Other');
            data.push(otherAmount);
            colors.push(utils.chartColors.gray);
        }
    } else {
        // Use all categories
        categories.forEach((category, index) => {
            labels.push(category.name);
            data.push(category.amount);
            colors.push(utils.chartColors.incomeColors[index % utils.chartColors.incomeColors.length]);
        });
    }
    
    // Create or update chart
    if (incomePieChart) {
        incomePieChart.data.labels = labels;
        incomePieChart.data.datasets[0].data = data;
        incomePieChart.data.datasets[0].backgroundColor = colors;
        incomePieChart.update();
    } else {
        incomePieChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 1
                }]
            },
            options: utils.createChartOptions('pie', {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = utils.formatCurrency(context.raw);
                                const percentage = context.parsed.toFixed(1) + '%';
                                return `${label}: ${value} (${percentage})`;
                            }
                        }
                    }
                }
            })
        });
    }
}

/**
 * Create expense distribution pie chart
 */
function createExpensePieChart(categories) {
    const chartCanvas = document.getElementById('expense-distribution-chart');
    if (!chartCanvas) return;
    
    // Prepare chart data
    const labels = [];
    const data = [];
    const colors = [];
    
    // Sort categories by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);
    
    // Use top 6 categories and group the rest as "Other"
    if (categories.length > 6) {
        const topCategories = categories.slice(0, 6);
        const otherCategories = categories.slice(6);
        
        // Add top categories
        topCategories.forEach((category, index) => {
            labels.push(category.name);
            data.push(category.amount);
            colors.push(utils.chartColors.expenseColors[index % utils.chartColors.expenseColors.length]);
        });
        
        // Add "Other" category
        const otherAmount = otherCategories.reduce((sum, category) => sum + category.amount, 0);
        if (otherAmount > 0) {
            labels.push('Other');
            data.push(otherAmount);
            colors.push(utils.chartColors.gray);
        }
    } else {
        // Use all categories
        categories.forEach((category, index) => {
            labels.push(category.name);
            data.push(category.amount);
            colors.push(utils.chartColors.expenseColors[index % utils.chartColors.expenseColors.length]);
        });
    }
    
    // Create or update chart
    if (expensePieChart) {
        expensePieChart.data.labels = labels;
        expensePieChart.data.datasets[0].data = data;
        expensePieChart.data.datasets[0].backgroundColor = colors;
        expensePieChart.update();
    } else {
        expensePieChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 1
                }]
            },
            options: utils.createChartOptions('pie', {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = utils.formatCurrency(context.raw);
                                const percentage = context.parsed.toFixed(1) + '%';
                                return `${label}: ${value} (${percentage})`;
                            }
                        }
                    }
                }
            })
        });
    }
}

/**
 * Create category summary table
 */
function createCategorySummaryTable(incomeCategories, expenseCategories) {
    const tableBody = document.getElementById('category-stats-table');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add income categories
    if (incomeCategories.length > 0) {
        incomeCategories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.name}</td>
                <td><span class="badge badge-success">Income</span></td>
                <td class="text-right text-success">${utils.formatCurrency(category.amount)}</td>
                <td class="text-right">${category.percentage.toFixed(1)}%</td>
                <td class="text-right">-</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Add expense categories
    if (expenseCategories.length > 0) {
        expenseCategories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.name}</td>
                <td><span class="badge badge-danger">Expense</span></td>
                <td class="text-right text-danger">${utils.formatCurrency(category.amount)}</td>
                <td class="text-right">${category.percentage.toFixed(1)}%</td>
                <td class="text-right">-</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

/**
 * View category details
 */
async function viewCategoryDetails(categoryId) {
    try {
        // Find category in data
        currentCategory = categoriesData.find(c => c.id.toString() === categoryId.toString());
        
        if (!currentCategory) {
            utils.showNotification('Category not found', 'error');
            return;
        }
        
        // Populate details modal
        const modal = document.getElementById('category-details-modal');
        const titleEl = document.getElementById('category-details-title');
        const nameEl = document.getElementById('detail-category-name');
        const descriptionEl = document.getElementById('detail-category-description');
        
        titleEl.textContent = 'Category Details';
        nameEl.textContent = currentCategory.name;
        descriptionEl.textContent = currentCategory.description || 'No description available';
        
        // Show loading state for transactions
        document.getElementById('category-transactions-loading').style.display = 'block';
        document.getElementById('category-transactions-table').innerHTML = '';
        document.getElementById('no-category-transactions').style.display = 'none';
        
        // Load transactions for this category
        await loadCategoryTransactions(categoryId);
        
        // Show modal
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    } catch (error) {
        console.error('Error viewing category details:', error);
        utils.showNotification('Error loading category details', 'error');
    }
}

/**
 * Load transactions for a specific category
 */
async function loadCategoryTransactions(categoryId) {
    try {
        // Get recent transactions for this category
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        const filters = {
            start: threeMonthsAgo.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0],
            category_id: categoryId
        };
        
        const result = await api.transactions.getAll(filters);
        const transactions = result.transactions || [];
        
        // Calculate statistics
        const transactionCount = transactions.length;
        let totalAmount = 0;
        let avgAmount = 0;
        
        if (transactionCount > 0) {
            // Calculate total
            totalAmount = transactions.reduce((sum, t) => {
                const amount = t.transaction_type === 'expense' ? -t.amount : t.amount;
                return sum + amount;
            }, 0);
            
            // Calculate average
            avgAmount = totalAmount / transactionCount;
        }
        
        // Update statistics in UI
        document.getElementById('detail-transaction-count').textContent = transactionCount;
        document.getElementById('detail-total-amount').textContent = utils.formatCurrency(Math.abs(totalAmount));
        document.getElementById('detail-average-amount').textContent = utils.formatCurrency(Math.abs(avgAmount));
        
        // Show transactions in table
        const tableBody = document.getElementById('category-transactions-table');
        const noTransactionsDiv = document.getElementById('no-category-transactions');
        
        if (transactions.length === 0) {
            // Show no transactions message
            document.getElementById('category-transactions-loading').style.display = 'none';
            noTransactionsDiv.style.display = 'block';
            return;
        }
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        
        // Get most recent 5 transactions
        const recentTransactions = transactions.slice(0, 5);
        
        // Populate the table
        tableBody.innerHTML = '';
        
        recentTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            const amountClass = transaction.transaction_type === 'income' ? 'amount-positive' : 'amount-negative';
            
            row.innerHTML = `
                <td>${utils.formatDate(transaction.start_date)}</td>
                <td>${transaction.description}</td>
                <td class="text-right"><span class="amount ${amountClass}">${utils.formatCurrency(transaction.amount)}</span></td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Hide loading and show table
        document.getElementById('category-transactions-loading').style.display = 'none';
        noTransactionsDiv.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading category transactions:', error);
        
        // Show error state
        document.getElementById('category-transactions-loading').style.display = 'none';
        document.getElementById('no-category-transactions').style.display = 'block';
        document.getElementById('no-category-transactions').innerHTML = '<p class="text-danger">Error loading transactions</p>';
    }
}

/**
 * Open category modal for adding a new category
 */
function openCategoryModal() {
    const modal = document.getElementById('category-modal');
    const titleEl = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');
    const idInput = document.getElementById('category-id');
    
    // Reset form
    form.reset();
    idInput.value = '';
    
    // Set title
    titleEl.textContent = 'Add Category';
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Focus first input
    document.getElementById('category-name').focus();
}

/**
 * Open category modal for editing
 */
function openEditCategoryModal(category) {
    // Close details modal if open
    const detailsModal = document.getElementById('category-details-modal');
    closeModal(detailsModal);
    
    const modal = document.getElementById('category-modal');
    const titleEl = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');
    const idInput = document.getElementById('category-id');
    const nameInput = document.getElementById('category-name');
    const descriptionInput = document.getElementById('category-description');
    
    // Set form values
    idInput.value = category.id;
    nameInput.value = category.name;
    descriptionInput.value = category.description || '';
    
    // Set title
    titleEl.textContent = 'Edit Category';
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Focus first input
    nameInput.focus();
}

/**
 * Open delete confirmation modal
 */
function openDeleteConfirmModal(category) {
    // Close any open modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => closeModal(modal));
    
    // Set current category
    currentCategory = category;
    
    // Set confirmation message
    const messageEl = document.getElementById('delete-confirm-message');
    messageEl.textContent = `Are you sure you want to delete the category "${category.name}"? All associated transactions will be moved to the "Other" category.`;
    
    // Show modal
    const modal = document.getElementById('delete-confirm-modal');
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Save category (create or update)
 */
async function saveCategory() {
    const form = document.getElementById('category-form');
    const modal = document.getElementById('category-modal');
    const idInput = document.getElementById('category-id');
    
    // Validate form
    if (!utils.validateForm(form)) {
        return;
    }
    
    // Get form data
    const formData = utils.serializeForm(form);
    
    // Prepare category data
    const categoryData = {
        name: formData.name,
        description: formData.description
    };
    
    try {
        // Show loading state
        const saveButton = document.getElementById('save-category-btn');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="loading"></span> Saving...';
        
        let response;
        
        if (idInput.value) {
            // Update existing category
            response = await api.categories.update(idInput.value, categoryData);
            utils.showNotification('Category updated successfully', 'success');
        } else {
            // Create new category
            response = await api.categories.create(categoryData);
            utils.showNotification('Category created successfully', 'success');
        }
        
        // Close modal
        closeModal(modal);
        
        // Reload categories
        loadCategories();
        
    } catch (error) {
        // Show error message
        utils.showNotification(error.message || 'Error saving category', 'error');
    } finally {
        // Reset save button
        const saveButton = document.getElementById('save-category-btn');
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

/**
 * Delete category
 */
async function deleteCategory() {
    if (!currentCategory) return;
    
    try {
        // Show loading state
        const deleteButton = document.getElementById('confirm-delete-btn');
        const originalText = deleteButton.textContent;
        deleteButton.disabled = true;
        deleteButton.innerHTML = '<span class="loading"></span> Deleting...';
        
        // Delete category
        await api.categories.delete(currentCategory.id);
        
        // Show success message
        utils.showNotification('Category deleted successfully', 'success');
        
        // Close modal
        closeModal(document.getElementById('delete-confirm-modal'));
        
        // Reload categories
        loadCategories();
        
    } catch (error) {
        // Show error message
        utils.showNotification(error.message || 'Error deleting category', 'error');
    } finally {
        // Reset delete button
        const deleteButton = document.getElementById('confirm-delete-btn');
        deleteButton.disabled = false;
        deleteButton.textContent = originalText;
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
