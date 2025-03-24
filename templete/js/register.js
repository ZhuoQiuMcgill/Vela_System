/**
 * VELA SYSTEM - Registration Page
 * Handles user registration form submission and validation
 */

document.addEventListener('DOMContentLoaded', () => {
    initRegister();
});

/**
 * Initialize registration page
 */
function initRegister() {
    // If user is already logged in, redirect to dashboard
    if (api.auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Get form elements
    const registerForm = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const initialBalanceInput = document.getElementById('initial-balance');
    const registerErrorDiv = document.getElementById('register-error');
    
    // Add form submit handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        registerErrorDiv.style.display = 'none';
        registerErrorDiv.textContent = '';
        
        // Basic form validation
        if (!utils.validateForm(registerForm)) {
            return;
        }
        
        // Check if passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.classList.add('is-invalid');
            const feedback = confirmPasswordInput.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = 'Passwords do not match';
            }
            return;
        }
        
        // Create user data object
        const userData = {
            username: usernameInput.value,
            password: passwordInput.value,
            initial_balance: parseFloat(initialBalanceInput.value) || 0
        };
        
        try {
            // Show loading state
            showPageLoading(true);
            
            // Send registration request
            const response = await api.auth.register(userData);
            
            // Show success message
            utils.showNotification('Account created successfully! You can now log in.', 'success');
            
            // Redirect to login page after a delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            // Show error message
            registerErrorDiv.textContent = error.message || 'An error occurred during registration';
            registerErrorDiv.style.display = 'block';
        } finally {
            // Hide loading state
            showPageLoading(false);
        }
    });
    
    // Add input validation listeners
    usernameInput.addEventListener('blur', () => {
        if (usernameInput.value.trim().length < 3) {
            usernameInput.classList.add('is-invalid');
            const feedback = usernameInput.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = 'Username must be at least 3 characters';
            }
        } else {
            usernameInput.classList.remove('is-invalid');
        }
    });
    
    passwordInput.addEventListener('blur', () => {
        if (passwordInput.value.length < 6) {
            passwordInput.classList.add('is-invalid');
            const feedback = passwordInput.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = 'Password must be at least 6 characters';
            }
        } else {
            passwordInput.classList.remove('is-invalid');
        }
    });
    
    confirmPasswordInput.addEventListener('input', () => {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.classList.add('is-invalid');
            const feedback = confirmPasswordInput.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = 'Passwords do not match';
            }
        } else {
            confirmPasswordInput.classList.remove('is-invalid');
        }
    });
    
    initialBalanceInput.addEventListener('input', () => {
        // Ensure the value is a valid number
        const value = parseFloat(initialBalanceInput.value);
        if (isNaN(value) || value < 0) {
            initialBalanceInput.classList.add('is-invalid');
            const feedback = initialBalanceInput.parentNode.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = 'Please enter a valid positive number';
            }
        } else {
            initialBalanceInput.classList.remove('is-invalid');
        }
    });
}

/**
 * Show or hide loading overlay
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
                    <p>Creating account...</p>
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
