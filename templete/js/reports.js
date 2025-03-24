/**
 * VELA SYSTEM - Reports Page
 * Handles reports interface and charts
 */

// Global variable for chart
let dayCapacityChart = null;

// Global variable for data
let summaryData = null;

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

    // Load report data
    loadReportData('overview');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Date range picker
    const applyDatesBtn = document.getElementById('apply-report-dates');
    if (applyDatesBtn) {
        applyDatesBtn.addEventListener('click', () => {
            loadReportData('overview');
        });
    }

    // Date presets
    const presetButtons = document.querySelectorAll('.date-preset');
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            setDatePreset(button.getAttribute('data-range'));
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

    // Load report data
    loadReportData('overview');
}

/**
 * Get report title based on type
 */
function getReportTitle(reportType) {
    return 'Overview Report';
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

    // Load overview report
    loadOverviewReport(startDate, endDate);
}

/**
 * Load overview report data
 */
async function loadOverviewReport(startDate, endDate) {
    try {
        // Show loading state
        document.getElementById('overview-loading').style.display = 'block';
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

        // Create or update day capacity chart
        createDayCapacityChart(summaryData.day_capacity_trend || []);

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