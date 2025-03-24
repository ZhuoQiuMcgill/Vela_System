/**
 * VELA SYSTEM - Profile Page
 * Handles user profile management
 */

/**
 * Initialize profile page
 */
function initProfile() {
    // Ensure user is authenticated
    if (!utils.requireAuth()) {
        return;
    }

    // Set up event listeners
    setupEventListeners();
    
    // Load profile data
    loadProfileData();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfileChanges();
        });
    }
    
    // Update initial balance button
    const updateBalanceBtn = document.getElementById('update-balance-btn');
    if (updateBalanceBtn) {
        updateBalanceBtn.addEventListener('click', () => {
            openUpdateBalanceModal();
        });
    }
    
    // Save balance button
    const saveBalanceBtn = document.getElementById('save-balance-btn');
    if (saveBalanceBtn) {
        saveBalanceBtn.addEventListener('click', updateInitialBalance);
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            openChangePasswordModal();
        });
    }
    
    // Save password button
    const savePasswordBtn = document.getElementById('save-password-btn');
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', changePassword);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            api.auth.logout();
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
    
    // Password confirmation validation
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (confirmPasswordInput && newPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (newPasswordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.classList.add('is-invalid');
                const feedback = confirmPasswordInput.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.textContent = 'Passwords do not match';
                }
            } else {
                confirmPasswordInput.classList.remove('is-invalid');
            }
        });
    }
}

/**
 * Load profile data
 */
function loadProfileData() {
    // Get current user data
    const currentUser = api.auth.getCurrentUser();
    
    if (!currentUser) {
        utils.showNotification('Error loading user data', 'error');
        return;
    }
    
    // Update profile information
    document.getElementById('profile-username').textContent = currentUser.username;
    document.getElementById('profile-initials').textContent = currentUser.username.charAt(0).toUpperCase();
    document.getElementById('profile-balance').textContent = utils.formatCurrency(currentUser.current_total_balance);
    document.getElementById('profile-long-term-balance').textContent = utils.formatCurrency(currentUser.long_term_balance);
    
    // Set form values
    document.getElementById('username').value = currentUser.username;
    
    // Placeholder date (would come from API)
    document.getElementById('profile-date').textContent = 'January 2023';
    
    // Set placeholder statistics (would come from API)
    document.getElementById('total-transactions').textContent = '87';
    document.getElementById('total-income').textContent = utils.formatCurrency(15000);
    document.getElementById('total-expenses').textContent = utils.formatCurrency(9000);
    document.getElementById('total-categories').textContent = '12';
    document.getElementById('current-day-capacity').textContent = utils.formatCurrency(200);
    document.getElementById('avg-day-capacity').textContent = utils.formatCurrency(150);
    
    // Load additional data from the API
    loadProfileStatistics();
}

/**
 * Load profile statistics from API
 */
async function loadProfileStatistics() {
    try {
        // Get day capacity
        const dayCapacityResult = await api.reports.getDayCapacity();
        if (dayCapacityResult) {
            document.getElementById('current-day-capacity').textContent = utils.formatCurrency(dayCapacityResult.day_capacity);
        }
        
        // Additional statistics would be loaded here if the API supported them
        
    } catch (error) {
        console.error('Error loading profile statistics:', error);
    }
}

/**
 * Save profile changes
 */
async function saveProfileChanges() {
    try {
        // Get form data
        const displayName = document.getElementById('display-name').value;
        const email = document.getElementById('email').value;
        
        // Show notification (placeholder - would be saved to API)
        utils.showNotification('Profile updated successfully', 'success');
        
    } catch (error) {
        utils.showNotification('Error saving profile changes', 'error');
    }
}

/**
 * Open update balance modal
 */
function openUpdateBalanceModal() {
    const modal = document.getElementById('update-balance-modal');
    const currentUser = api.auth.getCurrentUser();
    
    // Set current balance
    document.getElementById('initial-balance').value = currentUser.current_total_balance;
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Update initial balance
 */
async function updateInitialBalance() {
    try {
        const initialBalance = parseFloat(document.getElementById('initial-balance').value);
        
        // Validate input
        if (isNaN(initialBalance) || initialBalance < 0) {
            utils.showNotification('Please enter a valid balance', 'warning');
            return;
        }
        
        // Show success message (placeholder - would update via API)
        utils.showNotification('Initial balance updated successfully', 'success');
        
        // Close modal
        closeModal(document.getElementById('update-balance-modal'));
        
        // Update displayed balance (placeholder - would be updated from API response)
        document.getElementById('profile-balance').textContent = utils.formatCurrency(initialBalance);
        
        // Update user data in localStorage (placeholder)
        const currentUser = api.auth.getCurrentUser();
        if (currentUser) {
            currentUser.current_total_balance = initialBalance;
            localStorage.setItem('vela_user', JSON.stringify(currentUser));
        }
        
    } catch (error) {
        utils.showNotification('Error updating initial balance', 'error');
    }
}

/**
 * Open change password modal
 */
function openChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    
    // Reset form
    document.getElementById('change-password-form').reset();
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Change password
 */
async function changePassword() {
    try {
        // Get form values
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate form
        if (!currentPassword || !newPassword || !confirmPassword) {
            utils.showNotification('Please fill in all fields', 'warning');
            return;
        }
        
        // Check if passwords match
        if (newPassword !== confirmPassword) {
            utils.showNotification('New passwords do not match', 'warning');
            return;
        }
        
        // Show success message (placeholder - would update via API)
        utils.showNotification('Password changed successfully', 'success');
        
        // Close modal
        closeModal(document.getElementById('change-password-modal'));
        
    } catch (error) {
        utils.showNotification('Error changing password', 'error');
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
