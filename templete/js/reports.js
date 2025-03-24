/**
 * VELA SYSTEM - Reports Page
 * Handles reports interface, charts, and data exports
 */

// Global variables for charts
let incomeExpenseChart = null;
let dayCapacityChart = null;
let incomeCategoriesChart = null;
let expenseCategoriesChart = null;

// Global variables for data
let summaryData = null;
let dayCapacityData = null;
let categoriesData = null;

/**
 * Initialize reports page
 */
function initReports() {
    // Ensure user is authenticated
    if (!utils.requireAuth()) {
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize date range picker
    initializeDateRangePicker();
    
    // Determine which report to show based on URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const reportType = urlParams.get('type') || 'overview';
    
    // Show the appropriate report section
    showReportSection(reportType);
    
    // Load report data
    loadReportData(reportType);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Date range picker
    const applyDatesBtn = document.getElementById('apply-report-dates');
    if (applyDatesBtn) {
        applyDatesBtn.addEventListener('click', () => {
            // Determine which report is active
            const activeSection = document.querySelector('.report-section.active');
            if (activeSection) {
                const reportType = activeSection.id.replace('-report', '');
                loadReportData(reportType);
            }
        });
    }
    
    // Date presets
    const presetButtons = document.querySelectorAll('.date-preset');
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            setDatePreset(button.getAttribute('data-range'));
        });
    });
    
    // Chart type selector for income/expense
    const chartTypeSelect = document.getElementById('income-expense-chart-type');
    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', () => {
            updateIncomeExpenseChart(chartTypeSelect.value);
        });
    }
    
    // Export buttons
    const exportCategoriesBtn = document.getElementById('export-categories-btn');
    if (exportCategoriesBtn) {
        exportCategoriesBtn.addEventListener('click', exportCategoriesReport);
    }

    const exportDayCapacityBtn = document.getElementById('export-day-capacity-btn');
    if (exportDayCapacityBtn) {
        exportDayCapacityBtn.addEventListener('click', exportDayCapacityReport);
    }

    // Report navigation
    const reportNavLinks = document.querySelectorAll('.nav-link[id$="-report-nav"]');
    reportNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Get report type from link ID
            const reportType = link.id.replace('-report-nav', '');

            // Update URL parameter
            const url = new URL(window.location);
            url.searchParams.set('type', reportType);
            window.history.pushState({}, '', url);

            // Show the appropriate report section
            showReportSection(reportType);

            // Load report data
            loadReportData(reportType);
        });
    });
}

/**
 * Initialize date range picker with default values
 */
function initializeDateRangePicker() {
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');

    if (startDateInput && endDateInput) {
        // Set default range to last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    }
}

/**
 * Set date range based on preset
 */
function setDatePreset(preset) {
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');

    if (!startDateInput || !endDateInput) return;

    const today = new Date();
    let startDate, endDate;

    switch (preset) {
        case 'month':
            // This month
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;

        case 'last-month':
            // Last month
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;

        case 'quarter':
            // Last 3 months
            startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
            endDate = today;
            break;

        case 'year':
            // This year
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = today;
            break;

        default:
            return;
    }

    startDateInput.value = startDate.toISOString().split('T')[0];
    endDateInput.value = endDate.toISOString().split('T')[0];

    // Determine which report is active
    const activeSection = document.querySelector('.report-section.active');
    if (activeSection) {
        const reportType = activeSection.id.replace('-report', '');
        loadReportData(reportType);
    }
}

/**
 * Show the appropriate report section
 */
function showReportSection(reportType) {
    // Update page title
    const reportTitle = document.getElementById('report-title');
    if (reportTitle) {
        reportTitle.textContent = getReportTitle(reportType);
    }

    // Hide all report sections
    const reportSections = document.querySelectorAll('.report-section');
    reportSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    // Show the selected report section
    const selectedSection = document.getElementById(`${reportType}-report`);
    if (selectedSection) {
        selectedSection.classList.add('active');
        selectedSection.style.display = 'block';
    }

    // Update navigation links
    const navLinks = document.querySelectorAll('.nav-link[id$="-report-nav"]');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const activeNavLink = document.getElementById(`${reportType}-report-nav`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
}

/**
 * Get report title based on type
 */
function getReportTitle(reportType) {
    switch (reportType) {
        case 'overview':
            return 'Overview Report';
        case 'categories':
            return 'Categories Report';
        case 'day_capacity':
            return 'Day Capacity Report';
        default:
            return 'Reports';
    }
}

/**
 * Load report data based on type
 */
function loadReportData(reportType) {
    // Get date range
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');

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

    // Load data based on report type
    switch (reportType) {
        case 'overview':
            loadOverviewReport(startDate, endDate);
            break;
        case 'categories':
            loadCategoriesReport(startDate, endDate);
            break;
        case 'day_capacity':
            loadDayCapacityReport(startDate, endDate);
            break;
        default:
            loadOverviewReport(startDate, endDate);
    }
}

/**
 * Load overview report data
 */
async function loadOverviewReport(startDate, endDate) {
    try {
        // Show loading state
        document.getElementById('overview-loading').style.display = 'block';
        document.getElementById('summary-table').innerHTML = '';
        document.getElementById('overview-no-data').style.display = 'none';

        // Reset summary data
        summaryData = null;

        // Load summary data
        const result = await api.reports.getSummary(startDate, endDate);
        summaryData = result;

        // Check if we have data
        if (!summaryData) {
            // Show no data message
            document.getElementById('overview-loading').style.display = 'none';
            document.getElementById('overview-no-data').style.display = 'block';
            return;
        }

        // Update summary cards
        document.getElementById('overview-total-income').textContent = utils.formatCurrency(summaryData.total_income);
        document.getElementById('overview-total-expense').textContent = utils.formatCurrency(summaryData.total_expense);
        document.getElementById('overview-net-change').textContent = utils.formatCurrency(summaryData.net_change);

        // Calculate average day capacity
        const dayCapacityTrend = summaryData.day_capacity_trend || [];
        let avgDayCapacity = 0;

        if (dayCapacityTrend.length > 0) {
            const sum = dayCapacityTrend.reduce((total, day) => total + day.day_capacity, 0);
            avgDayCapacity = sum / dayCapacityTrend.length;
        }

        document.getElementById('overview-avg-day-capacity').textContent = utils.formatCurrency(avgDayCapacity);

        // Create or update income vs expense chart
        createIncomeExpenseChart(summaryData);

        // Create or update day capacity chart
        createDayCapacityChart(summaryData.day_capacity_trend || []);

        // Summary table was removed

        // Hide loading state
        document.getElementById('overview-loading').style.display = 'none';

    } catch (error) {
        console.error('Error loading overview report:', error);
        utils.showNotification('Error loading overview report', 'error');

        // Hide loading state
        document.getElementById('overview-loading').style.display = 'none';
        document.getElementById('overview-no-data').style.display = 'block';
    }
}

/**
 * Load categories report data
 */
async function loadCategoriesReport(startDate, endDate) {
    try {
        // Show loading state
        document.getElementById('categories-loading').style.display = 'block';
        document.getElementById('categories-table').innerHTML = '';
        document.getElementById('categories-no-data').style.display = 'none';

        // Reset categories data
        categoriesData = null;

        // Calculate month from start date
        const startDateObj = new Date(startDate);
        const month = startDateObj.getMonth() + 1; // JavaScript months are 0-indexed
        const year = startDateObj.getFullYear();

        // Load monthly category report
        const result = await api.reports.getMonthlyCategoryReport(year, month);
        categoriesData = result;

        // Check if we have data
        if (!categoriesData || (!categoriesData.income_categories.length && !categoriesData.expense_categories.length)) {
            // Show no data message
            document.getElementById('categories-loading').style.display = 'none';
            document.getElementById('categories-no-data').style.display = 'block';
            return;
        }

        // Update summary cards
        document.getElementById('categories-total-income').textContent = utils.formatCurrency(categoriesData.total_income);
        document.getElementById('categories-total-expense').textContent = utils.formatCurrency(categoriesData.total_expense);

        // Find top categories
        let topIncome = {name: 'None', amount: 0};
        let topExpense = {name: 'None', amount: 0};

        if (categoriesData.income_categories.length > 0) {
            topIncome = categoriesData.income_categories.reduce((max, cat) =>
                cat.amount > max.amount ? cat : max, {name: 'None', amount: 0});
        }

        if (categoriesData.expense_categories.length > 0) {
            topExpense = categoriesData.expense_categories.reduce((max, cat) =>
                cat.amount > max.amount ? cat : max, {name: 'None', amount: 0});
        }

        document.getElementById('categories-top-income').textContent = topIncome.name;
        document.getElementById('categories-top-expense').textContent = topExpense.name;

        // Create charts
        createIncomeCategoriesChart(categoriesData.income_categories);
        createExpenseCategoriesChart(categoriesData.expense_categories);

        // Create categories details table
        createCategoriesTable(categoriesData);

        // Hide loading state
        document.getElementById('categories-loading').style.display = 'none';

    } catch (error) {
        console.error('Error loading categories report:', error);
        utils.showNotification('Error loading categories report', 'error');

        // Hide loading state
        document.getElementById('categories-loading').style.display = 'none';
        document.getElementById('categories-no-data').style.display = 'block';
    }
}

/**
 * Load day capacity report data
 */
async function loadDayCapacityReport(startDate, endDate) {
    try {
        // Show loading state
        document.getElementById('day-capacity-loading').style.display = 'block';
        document.getElementById('day-capacity-table').innerHTML = '';
        document.getElementById('day-capacity-no-data').style.display = 'none';

        // Reset day capacity data
        dayCapacityData = null;

        // Load summary data (includes day capacity trend)
        const result = await api.reports.getSummary(startDate, endDate);
        dayCapacityData = result;

        // Check if we have data
        if (!dayCapacityData || !dayCapacityData.day_capacity_trend || dayCapacityData.day_capacity_trend.length === 0) {
            // Show no data message
            document.getElementById('day-capacity-loading').style.display = 'none';
            document.getElementById('day-capacity-no-data').style.display = 'block';
            return;
        }

        // Get current day capacity
        const currentDayCapacity = await api.reports.getDayCapacity();

        // Update summary cards
        document.getElementById('current-day-capacity').textContent = utils.formatCurrency(currentDayCapacity.day_capacity);

        // Calculate statistics from trend data
        const trendData = dayCapacityData.day_capacity_trend;

        // Average
        const sum = trendData.reduce((total, day) => total + day.day_capacity, 0);
        const avg = sum / trendData.length;
        document.getElementById('avg-day-capacity').textContent = utils.formatCurrency(avg);

        // Min and max
        const capacityValues = trendData.map(day => day.day_capacity);
        const max = Math.max(...capacityValues);
        const min = Math.min(...capacityValues);

        document.getElementById('max-day-capacity').textContent = utils.formatCurrency(max);
        document.getElementById('min-day-capacity').textContent = utils.formatCurrency(min);

        // Create day capacity trend chart
        createDayCapacityTrendChart(trendData);

        // Create day capacity table
        createDayCapacityTable(trendData);

        // Hide loading state
        document.getElementById('day-capacity-loading').style.display = 'none';

    } catch (error) {
        console.error('Error loading day capacity report:', error);
        utils.showNotification('Error loading day capacity report', 'error');

        // Hide loading state
        document.getElementById('day-capacity-loading').style.display = 'none';
        document.getElementById('day-capacity-no-data').style.display = 'block';
    }
}

/**
 * Create income vs expense chart
 */
/**
 * Updated income vs expense chart creation that uses real data instead of random values
 */
async function createIncomeExpenseChart(data) {
    // Check if we have the necessary data
    if (!data || !data.day_capacity_trend || data.day_capacity_trend.length === 0) {
        return;
    }

    const chartCanvas = document.getElementById('income-expense-chart');
    if (!chartCanvas) return;

    // Get chart type
    const chartTypeSelect = document.getElementById('income-expense-chart-type');
    const chartType = chartTypeSelect ? chartTypeSelect.value : 'bar';

    try {
        // Show a loading indicator on the chart
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'chart-loading';
        loadingIndicator.innerHTML = `
            <div class="loading"></div>
            <p>Loading transaction data...</p>
        `;
        chartCanvas.parentNode.appendChild(loadingIndicator);

        // Get the date range
        const startDateInput = document.getElementById('report-start-date');
        const endDateInput = document.getElementById('report-end-date');

        if (!startDateInput || !endDateInput) {
            console.error('Date inputs not found');
            return;
        }

        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        // Fetch the transaction data for the period
        const result = await api.transactions.getAll({
            start: startDate,
            end: endDate
        });

        const transactions = result.transactions || [];

        // Group data by month
        const monthlyData = {};

        // Process day capacity trend data to set up the month structure
        data.day_capacity_trend.forEach(day => {
            const date = new Date(day.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    label: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('default', { month: 'short', year: 'numeric' }),
                    income: 0,
                    expense: 0
                };
            }
        });

        // Process transaction data
        transactions.forEach(transaction => {
            // Extract month-year from date
            const date = new Date(transaction.start_date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            // Skip if the month is not in our dataset (should not happen, but just to be safe)
            if (!monthlyData[monthYear]) return;

            // Only process single transactions for this chart
            // Recurring and continuous transactions are handled through day capacity
            if (transaction.transaction_mode === 'single') {
                if (transaction.transaction_type === 'income') {
                    monthlyData[monthYear].income += transaction.amount;
                } else if (transaction.transaction_type === 'expense') {
                    monthlyData[monthYear].expense += transaction.amount;
                }
            }
        });

        // Remove loading indicator
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }

        // Convert to arrays for chart
        const months = Object.keys(monthlyData).sort(); // Sort by month
        const labels = months.map(month => monthlyData[month].label);
        const incomeData = months.map(month => monthlyData[month].income.toFixed(2));
        const expenseData = months.map(month => monthlyData[month].expense.toFixed(2));

        // Create or update chart
        if (incomeExpenseChart) {
            incomeExpenseChart.data.labels = labels;
            incomeExpenseChart.data.datasets[0].data = incomeData;
            incomeExpenseChart.data.datasets[1].data = expenseData;
            incomeExpenseChart.config.type = chartType;
            incomeExpenseChart.update();
        } else {
            // Create new chart
            incomeExpenseChart = new Chart(chartCanvas, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Income',
                            data: incomeData,
                            backgroundColor: 'rgba(40, 167, 69, 0.7)',
                            borderColor: 'rgba(40, 167, 69, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Expenses',
                            data: expenseData,
                            backgroundColor: 'rgba(220, 53, 69, 0.7)',
                            borderColor: 'rgba(220, 53, 69, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: utils.createChartOptions(chartType, {
                    plugins: {
                        title: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += utils.formatCurrency(context.parsed.y || context.parsed);
                                    return label;
                                }
                            }
                        }
                    }
                })
            });
        }
    } catch (error) {
        console.error('Error creating income expense chart:', error);

        // Show error message
        chartCanvas.parentNode.innerHTML = `
            <div class="text-center text-danger">
                <p>Error loading chart data</p>
            </div>
        `;
    }
}

/**
 * Update income vs expense chart type
 */
function updateIncomeExpenseChart(chartType) {
    if (incomeExpenseChart) {
        incomeExpenseChart.config.type = chartType;
        incomeExpenseChart.update();
    }
}

/**
 * Create day capacity chart
 */
function createDayCapacityChart(trendData) {
    const chartCanvas = document.getElementById('overview-day-capacity-chart');
    if (!chartCanvas) return;

    // Prepare chart data
    const labels = [];
    const capacityData = [];

    trendData.forEach(day => {
        labels.push(utils.formatDate(day.date));
        capacityData.push(day.day_capacity);
    });

    // Create gradient fill
    const ctx = chartCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.5)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

    // Create or update chart
    if (dayCapacityChart) {
        dayCapacityChart.data.labels = labels;
        dayCapacityChart.data.datasets[0].data = capacityData;
        dayCapacityChart.update();
    } else {
        // Create new chart
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
}

/**
 * Create day capacity trend chart
 */
function createDayCapacityTrendChart(trendData) {
    const chartCanvas = document.getElementById('day-capacity-trend-chart');
    if (!chartCanvas) return;

    // Prepare chart data
    const labels = [];
    const capacityData = [];

    trendData.forEach(day => {
        labels.push(utils.formatDate(day.date));
        capacityData.push(day.day_capacity);
    });

    // Create gradient fill
    const ctx = chartCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.5)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

    // Determine zero line position
    const minCapacity = Math.min(...capacityData);
    const maxCapacity = Math.max(...capacityData);
    const range = maxCapacity - minCapacity;

    // Create or update chart
    Chart.register({
        id: 'dayCapacityChart',
        beforeDraw: function(chart) {
            const ctx = chart.ctx;
            const yAxis = chart.scales.y;

            // Draw zero line if within range
            if (minCapacity < 0 && maxCapacity > 0) {
                const zeroY = yAxis.getPixelForValue(0);

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(chart.chartArea.left, zeroY);
                ctx.lineTo(chart.chartArea.right, zeroY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.stroke();
                ctx.restore();
            }
        }
    });

    const dayCapacityTrendChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Day Capacity',
                data: capacityData,
                borderColor: '#D4AF37',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: function(context) {
                    const value = context.dataset.data[context.dataIndex];
                    return value >= 0 ? '#28A745' : '#DC3545';
                },
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

/**
 * Create income categories chart
 */
function createIncomeCategoriesChart(categories) {
    const chartCanvas = document.getElementById('income-categories-chart');
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
    if (incomeCategoriesChart) {
        incomeCategoriesChart.data.labels = labels;
        incomeCategoriesChart.data.datasets[0].data = data;
        incomeCategoriesChart.data.datasets[0].backgroundColor = colors;
        incomeCategoriesChart.update();
    } else {
        // Create new chart
        incomeCategoriesChart = new Chart(chartCanvas, {
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
 * Create expense categories chart
 */
function createExpenseCategoriesChart(categories) {
    const chartCanvas = document.getElementById('expense-categories-chart');
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
    if (expenseCategoriesChart) {
        expenseCategoriesChart.data.labels = labels;
        expenseCategoriesChart.data.datasets[0].data = data;
        expenseCategoriesChart.data.datasets[0].backgroundColor = colors;
        expenseCategoriesChart.update();
    } else {
        // Create new chart
        expenseCategoriesChart = new Chart(chartCanvas, {
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

// Transactions Summary feature has been removed

/**
 * Create categories table
 */
function createCategoriesTable(data) {
    const tableBody = document.getElementById('categories-table');
    if (!tableBody) return;

    // Clear table
    tableBody.innerHTML = '';

    // Add income categories
    if (data.income_categories && data.income_categories.length > 0) {
        data.income_categories.forEach(category => {
            const row = document.createElement('tr');

            // Add random transaction count (placeholder - would come from API)
            const transactionCount = Math.floor(Math.random() * 10) + 1; // Random 1-10

            row.innerHTML = `
                <td>${category.name}</td>
                <td><span class="badge badge-success">Income</span></td>
                <td class="text-right text-success">${utils.formatCurrency(category.amount)}</td>
                <td class="text-right">${category.percentage.toFixed(1)}%</td>
                <td class="text-right">${transactionCount}</td>
            `;

            tableBody.appendChild(row);
        });
    }

    // Add expense categories
    if (data.expense_categories && data.expense_categories.length > 0) {
        data.expense_categories.forEach(category => {
            const row = document.createElement('tr');

            // Add random transaction count (placeholder - would come from API)
            const transactionCount = Math.floor(Math.random() * 20) + 1; // Random 1-20

            row.innerHTML = `
                <td>${category.name}</td>
                <td><span class="badge badge-danger">Expense</span></td>
                <td class="text-right text-danger">${utils.formatCurrency(category.amount)}</td>
                <td class="text-right">${category.percentage.toFixed(1)}%</td>
                <td class="text-right">${transactionCount}</td>
            `;

            tableBody.appendChild(row);
        });
    }
}

/**
 * Export categories report to CSV
 */
function exportCategoriesReport() {
    if (!categoriesData) {
        utils.showNotification('No data to export', 'warning');
        return;
    }

    const tableBody = document.getElementById('categories-table');
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
        const amount = cells[2].textContent.replace('$', '').trim();
        const percentage = cells[3].textContent.trim();
        const transactions = cells[4].textContent.trim();

        // Add row to CSV
        csvContent += `"${category}","${type}","${amount}","${percentage}","${transactions}"\n`;
    });

    // Add summary data
    csvContent += `\n"Total Income","${categoriesData.total_income}"\n`;
    csvContent += `"Total Expenses","${categoriesData.total_expense}"\n`;

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'vela_categories_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    utils.showNotification('Categories report exported successfully', 'success');
}

/**
 * Create day capacity table
 */
function createDayCapacityTable(trendData) {
    const tableBody = document.getElementById('day-capacity-table');
    if (!tableBody) return;

    // Clear table
    tableBody.innerHTML = '';

    // Sort by date (newest first)
    const sortedData = [...trendData].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Add rows to table
    sortedData.forEach(day => {
        const row = document.createElement('tr');

        // Generate random income and expense allocations (placeholder - would come from API)
        // This is just a simulation since the API doesn't provide this specific data
        const incomeAllocation = day.day_capacity > 0 ? day.day_capacity + Math.random() * 200 : Math.random() * 200;
        const expenseAllocation = incomeAllocation - day.day_capacity;

        // Calculate class for day capacity
        const capacityClass = day.day_capacity >= 0 ? 'text-success' : 'text-danger';

        row.innerHTML = `
            <td>${utils.formatDate(day.date)}</td>
            <td class="text-right ${capacityClass}">${utils.formatCurrency(day.day_capacity)}</td>
            <td class="text-right text-success">${utils.formatCurrency(incomeAllocation)}</td>
            <td class="text-right text-danger">${utils.formatCurrency(expenseAllocation)}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary view-active-transactions" data-date="${day.date}">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Add event listeners to View buttons
    const viewButtons = tableBody.querySelectorAll('.view-active-transactions');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const date = button.getAttribute('data-date');
            showActiveTransactions(date);
        });
    });
}

/**
 * Show active transactions for a specific date (placeholder function)
 */
function showActiveTransactions(date) {
    utils.showNotification(`Active transactions for ${utils.formatDate(date)} would be shown here`, 'info');
}

/**
 * Export day capacity report to CSV
 */
function exportDayCapacityReport() {
    if (!dayCapacityData || !dayCapacityData.day_capacity_trend) {
        utils.showNotification('No data to export', 'warning');
        return;
    }

    const tableBody = document.getElementById('day-capacity-table');
    if (!tableBody || !tableBody.rows.length) {
        utils.showNotification('No data to export', 'warning');
        return;
    }

    // Create CSV content
    let csvContent = 'Date,Day Capacity,Income Allocation,Expense Allocation\n';

    // Add each row to CSV
    Array.from(tableBody.rows).forEach(row => {
        const cells = Array.from(row.cells);

        // Extract cell contents
        const date = cells[0].textContent;
        const dayCapacity = cells[1].textContent.replace('$', '').trim();
        const incomeAllocation = cells[2].textContent.replace('$', '').trim();
        const expenseAllocation = cells[3].textContent.replace('$', '').trim();

        // Add row to CSV
        csvContent += `"${date}","${dayCapacity}","${incomeAllocation}","${expenseAllocation}"\n`;
    });

    // Get summary statistics
    const trendData = dayCapacityData.day_capacity_trend;
    const capacityValues = trendData.map(day => day.day_capacity);
    const sum = capacityValues.reduce((a, b) => a + b, 0);
    const avg = (sum / capacityValues.length).toFixed(2);
    const max = Math.max(...capacityValues).toFixed(2);
    const min = Math.min(...capacityValues).toFixed(2);

    // Add summary data
    csvContent += `\n"Average Day Capacity","${avg}"\n`;
    csvContent += `"Maximum Day Capacity","${max}"\n`;
    csvContent += `"Minimum Day Capacity","${min}"\n`;

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'vela_day_capacity_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    utils.showNotification('Day capacity report exported successfully', 'success');
}