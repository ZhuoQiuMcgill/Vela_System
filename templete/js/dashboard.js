/**
 * VELA SYSTEM - Dashboard Page
 * Handles dashboard functionality, charts, and transaction management
 */

// Global variables for charts
let dayCapacityChart = null;
let incomeCategoriesChart = null;
let expenseCategoriesChart = null;

// Global variables for data
let categoriesData = [];

/**
 * Initialize dashboard
 */
function initDashboard() {
    // Ensure user is authenticated
    if (!utils.requireAuth()) {
        return;
    }
    
    // Initialize UI components
    initDashboardUI();
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up event listeners for transactions
    setupTransactionListeners();
}

/**
 * Initialize dashboard UI components
 */
function initDashboardUI() {
    // Set current user data
    const currentUser = api.auth.getCurrentUser();
    if (currentUser) {
        document.getElementById('current-balance').textContent = utils.formatCurrency(currentUser.current_total_balance);
        document.getElementById('long-term-balance').textContent = utils.formatCurrency(currentUser.long_term_balance);
    }
    
    // Set up capacity chart range selector
    const rangeSelector = document.getElementById('capacity-chart-range');
    if (rangeSelector) {
        rangeSelector.addEventListener('change', () => {
            loadDayCapacityTrend(rangeSelector.value);
        });
    }
    
    // Add listeners to quick action buttons
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
    
    const viewReportsBtn = document.getElementById('view-reports-btn');
    if (viewReportsBtn) {
        viewReportsBtn.addEventListener('click', () => {
            window.location.href = 'reports.html';
        });
    }
    
    const addFirstTransactionBtn = document.getElementById('add-first-transaction-btn');
    if (addFirstTransactionBtn) {
        addFirstTransactionBtn.addEventListener('click', () => {
            openTransactionModal('income');
        });
    }
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    try {
        // Show loading states
        document.getElementById('day-capacity').textContent = '...';
        document.getElementById('monthly-net').textContent = '...';
        
        // Get categories for transaction forms
        await loadCategories();
        
        // Load recent transactions
        await loadRecentTransactions();
        
        // Load today's day capacity
        await loadTodayDayCapacity();
        
        // Load monthly net change
        await loadMonthlyNetChange();
        
        // Load day capacity trend chart
        await loadDayCapacityTrend();
        
        // Load category distribution charts
        await loadCategoryCharts();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        utils.showNotification('Error loading dashboard data', 'error');
    }
}

/**
 * Load categories for transaction forms
 */
async function loadCategories() {
    try {
        const result = await api.categories.getAll();
        categoriesData = result.categories || [];
        
        // Populate category dropdowns
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
 * Load recent transactions
 */
async function loadRecentTransactions() {
    try {
        // Get transactions for the last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const filters = {
            start: thirtyDaysAgo.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        };
        
        const result = await api.transactions.getAll(filters);
        const transactions = result.transactions || [];
        
        const tableBody = document.getElementById('recent-transactions-table');
        const noTransactionsDiv = document.getElementById('no-transactions');
        
        if (transactions.length === 0) {
            // Show no transactions message
            if (tableBody) tableBody.innerHTML = '';
            if (noTransactionsDiv) noTransactionsDiv.style.display = 'block';
            return;
        }
        
        // Hide no transactions message
        if (noTransactionsDiv) noTransactionsDiv.style.display = 'none';
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        
        // Get only the 5 most recent transactions
        const recentTransactions = transactions.slice(0, 5);
        
        // Populate the table
        if (tableBody) {
            tableBody.innerHTML = '';
            
            recentTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                const amountClass = transaction.transaction_type === 'income' ? 'amount-positive' : 'amount-negative';
                const typeClass = transaction.transaction_type === 'income' ? 'transaction-type-income' : 'transaction-type-expense';
                
                row.innerHTML = `
                    <td>${utils.formatDate(transaction.start_date)}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.category_name || 'Uncategorized'}</td>
                    <td><span class="transaction-type ${typeClass}">${transaction.transaction_type}</span></td>
                    <td class="text-right"><span class="amount ${amountClass}">${utils.formatCurrency(transaction.amount)}</span></td>
                `;
                
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading recent transactions:', error);
        utils.showNotification('Error loading recent transactions', 'error');
    }
}

/**
 * Load today's day capacity
 */
async function loadTodayDayCapacity() {
    try {
        const result = await api.reports.getDayCapacity();
        
        const dayCapacityElement = document.getElementById('day-capacity');
        if (dayCapacityElement) {
            dayCapacityElement.textContent = utils.formatCurrency(result.day_capacity);
        }
    } catch (error) {
        console.error('Error loading day capacity:', error);
        const dayCapacityElement = document.getElementById('day-capacity');
        if (dayCapacityElement) {
            dayCapacityElement.textContent = 'Error';
        }
    }
}

/**
 * Load monthly net change
 */
async function loadMonthlyNetChange() {
    try {
        // Get first and last day of current month
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const result = await api.reports.getSummary(
            firstDay.toISOString().split('T')[0],
            lastDay.toISOString().split('T')[0]
        );
        
        const monthlyNetElement = document.getElementById('monthly-net');
        if (monthlyNetElement) {
            monthlyNetElement.textContent = utils.formatCurrency(result.net_change);
            
            // Add color class based on value
            if (result.net_change > 0) {
                monthlyNetElement.classList.add('text-success');
            } else if (result.net_change < 0) {
                monthlyNetElement.classList.add('text-danger');
            }
        }
    } catch (error) {
        console.error('Error loading monthly net change:', error);
        const monthlyNetElement = document.getElementById('monthly-net');
        if (monthlyNetElement) {
            monthlyNetElement.textContent = 'Error';
        }
    }
}

/**
 * Load day capacity trend chart
 */
async function loadDayCapacityTrend(days = 30) {
    try {
        // Calculate date range
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - days);
        
        const result = await api.reports.getSummary(
            startDate.toISOString().split('T')[0],
            today.toISOString().split('T')[0]
        );
        
        const trendData = result.day_capacity_trend || [];
        
        // Prepare chart data
        const labels = [];
        const capacityData = [];
        
        trendData.forEach(day => {
            labels.push(utils.formatDate(day.date));
            capacityData.push(day.day_capacity);
        });
        
        // Get chart canvas
        const chartCanvas = document.getElementById('day-capacity-chart');
        if (!chartCanvas) return;
        
        // Use the chart loader to ensure Chart.js is available
        await window.chartReadyPromise;

        // Create or update chart
        if (dayCapacityChart) {
            dayCapacityChart.data.labels = labels;
            dayCapacityChart.data.datasets[0].data = capacityData;
            dayCapacityChart.update();
        } else {
            // Create gradient fill
            const ctx = chartCanvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(212, 175, 55, 0.5)');
            gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

            // Create chart
            dayCapacityChart = new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Day Capacity',
                        data: capacityData,
                        borderColor: '#D4AF37',
                        backgroundColor: gradient,
                        borderWidth: 2,
                        pointBackgroundColor: '#D4AF37',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1,
                        pointRadius: 3,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: utils.createChartOptions('line', {
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return utils.formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    }
                })
            });
        }
    } catch (error) {
        console.error('Error loading day capacity trend:', error);
        utils.showNotification('Error loading day capacity trend chart', 'error');
    }
}

/**
 * Load category distribution charts
 */
async function loadCategoryCharts() {
    try {
        // Get category data for current month
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        const result = await api.reports.getMonthlyCategoryReport(
            today.getFullYear(),
            today.getMonth() + 1
        );

        const incomeCategories = result.income_categories || [];
        const expenseCategories = result.expense_categories || [];

        // Load income categories chart
        loadIncomeCategoriesChart(incomeCategories);

        // Load expense categories chart
        loadExpenseCategoriesChart(expenseCategories);

    } catch (error) {
        console.error('Error loading category charts:', error);
        utils.showNotification('Error loading category charts', 'error');
    }
}

/**
 * Load income categories chart
 */
async function loadIncomeCategoriesChart(categories) {
    const chartCanvas = document.getElementById('income-categories-chart');
    const noDataDiv = document.getElementById('no-income-data');

    if (!chartCanvas) return;

    if (categories.length === 0) {
        // Show no data message
        chartCanvas.style.display = 'none';
        if (noDataDiv) noDataDiv.style.display = 'block';
        return;
    }

    // Hide no data message
    chartCanvas.style.display = 'block';
    if (noDataDiv) noDataDiv.style.display = 'none';

    // Prepare chart data
    const labels = [];
    const data = [];
    const colors = [];

    // Sort categories by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);

    // Use top 5 categories and group the rest as "Other"
    if (categories.length > 5) {
        const topCategories = categories.slice(0, 5);
        const otherCategories = categories.slice(5);

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

    // Ensure Chart.js is loaded
    await window.chartReadyPromise;

    // Create or update chart
    if (incomeCategoriesChart) {
        incomeCategoriesChart.data.labels = labels;
        incomeCategoriesChart.data.datasets[0].data = data;
        incomeCategoriesChart.data.datasets[0].backgroundColor = colors;
        incomeCategoriesChart.update();
    } else {
        // Create chart
        incomeCategoriesChart = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    hoverOffset: 4
                }]
            },
            options: utils.createChartOptions('doughnut', {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = utils.formatCurrency(context.parsed);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            })
        });
    }
}

/**
 * Load expense categories chart
 */
async function loadExpenseCategoriesChart(categories) {
    const chartCanvas = document.getElementById('expense-categories-chart');
    const noDataDiv = document.getElementById('no-expense-data');

    if (!chartCanvas) return;

    if (categories.length === 0) {
        // Show no data message
        chartCanvas.style.display = 'none';
        if (noDataDiv) noDataDiv.style.display = 'block';
        return;
    }

    // Hide no data message
    chartCanvas.style.display = 'block';
    if (noDataDiv) noDataDiv.style.display = 'none';

    // Prepare chart data
    const labels = [];
    const data = [];
    const colors = [];

    // Sort categories by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);

    // Use top 5 categories and group the rest as "Other"
    if (categories.length > 5) {
        const topCategories = categories.slice(0, 5);
        const otherCategories = categories.slice(5);

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

    // Ensure Chart.js is loaded
    await window.chartReadyPromise;

    // Create or update chart
    if (expenseCategoriesChart) {
        expenseCategoriesChart.data.labels = labels;
        expenseCategoriesChart.data.datasets[0].data = data;
        expenseCategoriesChart.data.datasets[0].backgroundColor = colors;
        expenseCategoriesChart.update();
    } else {
        // Create chart
        expenseCategoriesChart = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    hoverOffset: 4
                }]
            },
            options: utils.createChartOptions('doughnut', {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = utils.formatCurrency(context.parsed);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            })
        });
    }
}

/**
 * Set up event listeners for transaction management
 */
function setupTransactionListeners() {
    // Modal elements
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('transaction-modal-title');
    const modalForm = document.getElementById('transaction-form');
    const typeInput = document.getElementById('transaction-type');
    const isRecurringCheck = document.getElementById('is-recurring');
    const recurringOptions = document.getElementById('recurring-options');
    const hasDurationCheck = document.getElementById('has-duration');
    const durationOptions = document.getElementById('duration-options');
    const saveButton = document.getElementById('save-transaction-btn');
    const closeButtons = document.querySelectorAll('[data-dismiss="modal"]');

    // Toggle recurring options
    if (isRecurringCheck) {
        isRecurringCheck.addEventListener('change', () => {
            recurringOptions.style.display = isRecurringCheck.checked ? 'block' : 'none';

            // Recurring income and continuous expense are mutually exclusive
            if (isRecurringCheck.checked) {
                hasDurationCheck.checked = false;
                durationOptions.style.display = 'none';
            }
        });
    }

    // Toggle duration options
    if (hasDurationCheck) {
        hasDurationCheck.addEventListener('change', () => {
            durationOptions.style.display = hasDurationCheck.checked ? 'block' : 'none';

            // Recurring income and continuous expense are mutually exclusive
            if (hasDurationCheck.checked) {
                isRecurringCheck.checked = false;
                recurringOptions.style.display = 'none';
            }
        });
    }

    // Add save transaction button listener
    if (saveButton) {
        saveButton.addEventListener('click', saveTransaction);
    }

    // Add modal close buttons listeners
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(modal);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
}

/**
 * Open transaction modal
 */
function openTransactionModal(type) {
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('transaction-modal-title');
    const form = document.getElementById('transaction-form');
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

    // Filter categories based on type
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
 * Close modal
 */
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

/**
 * Save transaction
 */
async function saveTransaction() {
    const form = document.getElementById('transaction-form');
    const modal = document.getElementById('transaction-modal');

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

        // Send API request
        const response = await api.transactions.create(transactionData);

        // Show success message
        utils.showNotification('Transaction saved successfully', 'success');

        // Close modal
        closeModal(modal);

        // Reload dashboard data
        loadDashboardData();

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