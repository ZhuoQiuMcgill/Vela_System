/**
 * VELA SYSTEM Utility Functions
 * 
 * This file contains utility functions used throughout the application
 * for formatting, validation, UI helpers and more.
 */

const utils = {
    // Date formatting
    formatDate: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    // Currency formatting
    formatCurrency: (amount, withSymbol = true) => {
        if (amount === undefined || amount === null) return '';
        
        const formatter = new Intl.NumberFormat('en-US', {
            style: withSymbol ? 'currency' : 'decimal',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        return formatter.format(amount);
    },
    
    // Get class for amount display (positive/negative)
    getAmountClass: (amount, type) => {
        if (type === 'income') return 'amount-positive';
        if (type === 'expense') return 'amount-negative';
        return amount >= 0 ? 'amount-positive' : 'amount-negative';
    },
    
    // Format percentage
    formatPercentage: (value) => {
        if (value === undefined || value === null) return '';
        return `${value.toFixed(2)}%`;
    },
    
    // Get current date in YYYY-MM-DD format
    getCurrentDateString: () => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    },
    
    // Get first day of current month in YYYY-MM-DD format
    getFirstDayOfMonth: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    },
    
    // Get last day of current month in YYYY-MM-DD format
    getLastDayOfMonth: () => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return lastDay.toISOString().split('T')[0];
    },
    
    // Get first day of previous month in YYYY-MM-DD format
    getFirstDayOfPreviousMonth: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return firstDay.toISOString().split('T')[0];
    },
    
    // Get last day of previous month in YYYY-MM-DD format
    getLastDayOfPreviousMonth: () => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        return lastDay.toISOString().split('T')[0];
    },
    
    // Get today minus 30 days in YYYY-MM-DD format
    get30DaysAgo: () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return thirtyDaysAgo.toISOString().split('T')[0];
    },
    
    // Show notification
    showNotification: (message, type = 'info') => {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },
    
    // Format date and time
    formatDateTime: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Calculate difference between two dates in days
    daysBetween: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },
    
    // Check if user is authenticated, redirect if not
    requireAuth: () => {
        if (!api.auth.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },
    
    // Toggle sidebar on mobile
    toggleSidebar: () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    },
    
    // Toggle dropdown menu
    toggleDropdown: (dropdown) => {
        dropdown.classList.toggle('show');
        
        // Close when clicking outside
        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', closeDropdown);
            }
        };
        
        if (dropdown.classList.contains('show')) {
            // Add timeout to prevent immediate close
            setTimeout(() => {
                document.addEventListener('click', closeDropdown);
            }, 0);
        }
    },
    
    // Generic function to populate a select element with options
    populateSelect: (selectElement, options, valueKey, textKey, defaultOption = null) => {
        // Clear existing options
        selectElement.innerHTML = '';
        
        // Add default option if provided
        if (defaultOption) {
            const option = document.createElement('option');
            option.value = defaultOption.value || '';
            option.textContent = defaultOption.text || 'Select an option';
            if (defaultOption.disabled) option.disabled = true;
            if (defaultOption.selected) option.selected = true;
            selectElement.appendChild(option);
        }
        
        // Add options from array
        options.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey];
            selectElement.appendChild(option);
        });
    },
    
    // Show loading state
    showLoading: (container, message = 'Loading...') => {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-container';
        loadingEl.innerHTML = `
            <div class="loading"></div>
            <p>${message}</p>
        `;
        
        container.innerHTML = '';
        container.appendChild(loadingEl);
    },
    
    // Show error message
    showError: (container, message = 'An error occurred') => {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-container';
        errorEl.innerHTML = `
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <p>${message}</p>
        `;
        
        container.innerHTML = '';
        container.appendChild(errorEl);
    },
    
    // Show empty state
    showEmptyState: (container, message = 'No data available', icon = 'fa-folder-open') => {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'empty-state';
        emptyEl.innerHTML = `
            <div class="empty-icon">
                <i class="fas ${icon}"></i>
            </div>
            <p>${message}</p>
        `;
        
        container.innerHTML = '';
        container.appendChild(emptyEl);
    },
    
    // Initialize Date Range Picker
    initDateRangePicker: (startInput, endInput, callback = null) => {
        // Set default values if empty
        if (!startInput.value) {
            startInput.value = utils.get30DaysAgo();
        }
        if (!endInput.value) {
            endInput.value = utils.getCurrentDateString();
        }
        
        // Event listeners
        const onDateChange = () => {
            const startDate = startInput.value;
            const endDate = endInput.value;
            
            // Validate dates
            if (new Date(startDate) > new Date(endDate)) {
                endInput.value = startDate;
            }
            
            // Execute callback if provided
            if (callback && typeof callback === 'function') {
                callback(startDate, endDate);
            }
        };
        
        startInput.addEventListener('change', onDateChange);
        endInput.addEventListener('change', onDateChange);
        
        // Initialize with current values
        onDateChange();
    },
    
    // Form validation
    validateForm: (form) => {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Reset previous validation state
            input.classList.remove('is-invalid');
            const feedbackEl = input.nextElementSibling;
            if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) {
                feedbackEl.textContent = '';
            }
            
            // Check required fields
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.classList.add('is-invalid');
                
                // Add feedback message if not present
                if (!feedbackEl || !feedbackEl.classList.contains('invalid-feedback')) {
                    const feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    feedback.textContent = 'This field is required';
                    input.parentNode.insertBefore(feedback, input.nextSibling);
                } else {
                    feedbackEl.textContent = 'This field is required';
                }
            }
            
            // Validate number inputs
            if (input.type === 'number' && input.value !== '') {
                const value = parseFloat(input.value);
                
                // Check min value if specified
                if (input.hasAttribute('min') && value < parseFloat(input.getAttribute('min'))) {
                    isValid = false;
                    input.classList.add('is-invalid');
                    
                    const minValue = input.getAttribute('min');
                    const message = `Value must be at least ${minValue}`;
                    
                    if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) {
                        feedbackEl.textContent = message;
                    } else {
                        const feedback = document.createElement('div');
                        feedback.className = 'invalid-feedback';
                        feedback.textContent = message;
                        input.parentNode.insertBefore(feedback, input.nextSibling);
                    }
                }
            }
            
            // Additional validation rules can be added here
        });
        
        return isValid;
    },
    
    // Serialize form data to JSON
    serializeForm: (form) => {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            // Handle number inputs
            if (form.elements[key].type === 'number' && value !== '') {
                data[key] = parseFloat(value);
            } else {
                data[key] = value;
            }
        }
        
        return data;
    },
    
    // Chart colors - consistent with our VELA color scheme
    chartColors: {
        primary: '#D4AF37',
        primaryLight: '#F5E7A3',
        primaryDark: '#A58A28',
        secondary: '#1A1A1A',
        secondaryLight: '#333333',
        success: '#28A745',
        danger: '#DC3545',
        warning: '#FFC107',
        info: '#17A2B8',
        background: '#FFFFFF',
        text: '#1A1A1A',
        gray: '#CCCCCC',
        // Color arrays for charts
        incomeColors: ['#D4AF37', '#F5E7A3', '#EAD78F', '#DFC978', '#D4BB61', '#C9AD4A', '#BEA033', '#A58A28'],
        expenseColors: ['#DC3545', '#E34C5A', '#E96370', '#EF7A86', '#F6929B', '#FCA9B0', '#FFC1C6', '#FFD8DB'],
        gradients: {
            primary: {
                start: '#F5E7A3',
                end: '#A58A28'
            },
            income: {
                start: 'rgba(212, 175, 55, 0.8)',
                end: 'rgba(212, 175, 55, 0.1)'
            },
            expense: {
                start: 'rgba(220, 53, 69, 0.8)',
                end: 'rgba(220, 53, 69, 0.1)'
            }
        }
    },
    
    // Create chart options consistent with VELA style
    createChartOptions: (type, customOptions = {}) => {
        // Base options for all charts
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 26, 0.8)',
                    titleFont: {
                        family: "'Inter', sans-serif",
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: "'Inter', sans-serif",
                        size: 12
                    },
                    padding: 10,
                    cornerRadius: 4,
                    displayColors: true
                }
            }
        };
        
        // Specific options based on chart type
        let typeOptions = {};
        
        switch (type) {
            case 'line':
                typeOptions = {
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 11
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(204, 204, 204, 0.1)'
                            },
                            ticks: {
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 11
                                },
                                callback: function(value) {
                                    return utils.formatCurrency(value, true);
                                }
                            }
                        }
                    },
                    elements: {
                        line: {
                            tension: 0.3
                        },
                        point: {
                            radius: 3,
                            hoverRadius: 5
                        }
                    }
                };
                break;
                
            case 'bar':
                typeOptions = {
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 11
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(204, 204, 204, 0.1)'
                            },
                            ticks: {
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 11
                                },
                                callback: function(value) {
                                    return utils.formatCurrency(value, true);
                                }
                            }
                        }
                    },
                    barPercentage: 0.7,
                    categoryPercentage: 0.7
                };
                break;
                
            case 'pie':
            case 'doughnut':
                typeOptions = {
                    cutout: type === 'doughnut' ? '65%' : 0,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                };
                break;
        }
        
        // Merge options
        return { ...baseOptions, ...typeOptions, ...customOptions };
    },
    
    // Parse URL query parameters
    getQueryParams: () => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const params = {};
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    },
    
    // Create a confirmation dialog
    confirmAction: (message, callback) => {
        const result = window.confirm(message);
        if (result && typeof callback === 'function') {
            callback();
        }
        return result;
    },
    
    // Copy text to clipboard
    copyToClipboard: (text) => {
        // Create temporary element
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        
        // Select and copy
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        
        // Show notification
        utils.showNotification('Copied to clipboard!', 'info');
    },
    
    // Initialize tooltips
    initTooltips: () => {
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(tooltip => {
            tooltip.setAttribute('title', tooltip.getAttribute('data-tooltip'));
            tooltip.addEventListener('mouseover', (e) => {
                // Create tooltip element
                const tip = document.createElement('div');
                tip.className = 'tooltip';
                tip.textContent = e.target.getAttribute('data-tooltip');
                
                // Position tooltip
                const rect = e.target.getBoundingClientRect();
                tip.style.left = rect.left + (rect.width / 2) + 'px';
                tip.style.top = rect.top - 10 + 'px';
                
                // Add to DOM
                document.body.appendChild(tip);
                
                // Show tooltip
                setTimeout(() => {
                    tip.style.opacity = 1;
                    tip.style.transform = 'translateY(-10px)';
                }, 10);
                
                // Store tooltip reference
                e.target._tooltip = tip;
            });
            
            tooltip.addEventListener('mouseout', (e) => {
                if (e.target._tooltip) {
                    // Hide tooltip
                    e.target._tooltip.style.opacity = 0;
                    e.target._tooltip.style.transform = 'translateY(0)';
                    
                    // Remove after animation
                    setTimeout(() => {
                        if (e.target._tooltip && e.target._tooltip.parentNode) {
                            e.target._tooltip.parentNode.removeChild(e.target._tooltip);
                            e.target._tooltip = null;
                        }
                    }, 300);
                }
            });
        });
    }
};
