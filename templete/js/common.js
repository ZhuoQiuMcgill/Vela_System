/**
 * VELA SYSTEM Common JavaScript
 * 
 * This file contains common functionality used across multiple pages
 * including header initialization, authentication checks, and more.
 */

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components based on page
    initPage();
});

/**
 * Initialize page based on current path
 */
function initPage() {
    // Check if this is an authenticated page (not login or register)
    const isAuthPage = !window.location.pathname.includes('index.html') && 
                      !window.location.pathname.includes('register.html');
    
    if (isAuthPage) {
        // Verify authentication
        if (!utils.requireAuth()) {
            return; // Stop initialization if not authenticated
        }
        
        // Initialize common elements for authenticated pages
        initHeader();
        initSidebar();
        initFooter();
        
        // Update balance displays
        updateBalanceDisplays();
    }
    
    // Initialize page-specific components
    initPageSpecific();
}

/**
 * Initialize the header with user info and event listeners
 */
function initHeader() {
    const headerUserNameEl = document.querySelector('.header-user-name');
    const headerUserBalanceEl = document.querySelector('.header-user-balance');
    const headerUserDropdownToggle = document.querySelector('.header-user-avatar');
    const headerUserDropdown = document.querySelector('.header-dropdown');
    const headerMobileToggle = document.querySelector('.header-menu-toggle');
    
    // Set user info
    const currentUser = api.auth.getCurrentUser();
    if (currentUser) {
        // Set username
        if (headerUserNameEl) {
            headerUserNameEl.textContent = currentUser.username;
        }
        
        // Set user avatar initials
        const avatarEl = document.querySelector('.header-user-avatar');
        if (avatarEl) {
            avatarEl.textContent = currentUser.username.charAt(0).toUpperCase();
        }
        
        // Set current balance
        if (headerUserBalanceEl) {
            headerUserBalanceEl.textContent = utils.formatCurrency(currentUser.current_total_balance);
        }
    }
    
    // Set up dropdown toggle
    if (headerUserDropdownToggle && headerUserDropdown) {
        headerUserDropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            utils.toggleDropdown(headerUserDropdown);
        });
    }
    
    // Set up mobile menu toggle
    if (headerMobileToggle) {
        headerMobileToggle.addEventListener('click', () => {
            utils.toggleSidebar();
        });
    }
    
    // Set up logout button
    const logoutBtn = document.querySelector('.logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            api.auth.logout();
        });
    }
}

/**
 * Initialize sidebar navigation with active state
 */
function initSidebar() {
    // Set active navigation item based on current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Special case for dashboard when at root
    if (currentPath === '/' || currentPath.endsWith('/') || currentPath.includes('dashboard')) {
        const dashboardLink = document.querySelector('.nav-link[href="dashboard.html"]');
        if (dashboardLink) {
            dashboardLink.classList.add('active');
        }
    }
}

/**
 * Initialize footer content
 */
function initFooter() {
    const yearEl = document.querySelector('.current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

/**
 * Update all balance displays (header and dashboard)
 */
function updateBalanceDisplays() {
    const currentUser = api.auth.getCurrentUser();
    if (!currentUser) return;
    
    // Update header balance
    const headerBalanceEl = document.querySelector('.header-user-balance');
    if (headerBalanceEl) {
        headerBalanceEl.textContent = utils.formatCurrency(currentUser.current_total_balance);
    }
    
    // Update dashboard balances if on dashboard page
    if (window.location.pathname.includes('dashboard')) {
        const currentBalanceEl = document.querySelector('#current-balance');
        const longTermBalanceEl = document.querySelector('#long-term-balance');
        
        if (currentBalanceEl) {
            currentBalanceEl.textContent = utils.formatCurrency(currentUser.current_total_balance);
        }
        
        if (longTermBalanceEl) {
            longTermBalanceEl.textContent = utils.formatCurrency(currentUser.long_term_balance);
        }
    }
}

/**
 * Initialize page-specific components
 */
function initPageSpecific() {
    const pagePath = window.location.pathname;
    
    // Dashboard
    if (pagePath.includes('dashboard.html')) {
        if (typeof initDashboard === 'function') {
            initDashboard();
        }
    }
    
    // Transactions
    else if (pagePath.includes('transactions.html')) {
        if (typeof initTransactions === 'function') {
            initTransactions();
        }
    }
    
    // Categories
    else if (pagePath.includes('categories.html')) {
        if (typeof initCategories === 'function') {
            initCategories();
        }
    }
    
    // Reports
    else if (pagePath.includes('reports.html')) {
        if (typeof initReports === 'function') {
            initReports();
        }
    }
    
    // Login page
    else if (pagePath.includes('index.html') || pagePath === '/' || pagePath.endsWith('/')) {
        if (typeof initLogin === 'function') {
            initLogin();
        }
    }
    
    // Register page
    else if (pagePath.includes('register.html')) {
        if (typeof initRegister === 'function') {
            initRegister();
        }
    }
}

/**
 * Create a loading overlay for AJAX operations
 */
function showPageLoading(show = true) {
    let loadingOverlay = document.querySelector('.loading-overlay');
    
    if (show) {
        // Create if doesn't exist
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="loading"></div>
                    <p>Loading...</p>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
        }
        
        // Show with animation
        setTimeout(() => {
            loadingOverlay.classList.add('active');
        }, 10);
    } else {
        // Hide if exists
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
            
            // Remove after animation
            setTimeout(() => {
                if (loadingOverlay.parentNode) {
                    loadingOverlay.parentNode.removeChild(loadingOverlay);
                }
            }, 300);
        }
    }
}
