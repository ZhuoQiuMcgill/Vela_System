/**
 * VELA SYSTEM - Login Page
 * Handles user login form submission and validation
 */

document.addEventListener('DOMContentLoaded', () => {
    initLogin();
});

/**
 * Initialize login page
 */
function initLogin() {
    // If user is already logged in, redirect to dashboard
    if (api.auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Get form elements
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginErrorDiv = document.getElementById('login-error');
    
    // Add form submit handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        loginErrorDiv.style.display = 'none';
        loginErrorDiv.textContent = '';
        
        // Basic form validation
        if (!utils.validateForm(loginForm)) {
            return;
        }
        
        // Create credentials object
        const credentials = {
            username: usernameInput.value,
            password: passwordInput.value
        };
        
        try {
            // Show loading state
            showPageLoading(true);
            
            // Send login request
            const response = await api.auth.login(credentials);
            
            // Show success message
            utils.showNotification('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            // Show error message
            loginErrorDiv.textContent = error.message || 'Invalid username or password';
            loginErrorDiv.style.display = 'block';
        } finally {
            // Hide loading state
            showPageLoading(false);
        }
    });
    
    // Add input validation listeners
    usernameInput.addEventListener('input', () => {
        loginErrorDiv.style.display = 'none';
    });
    
    passwordInput.addEventListener('input', () => {
        loginErrorDiv.style.display = 'none';
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
                    <p>Logging in...</p>
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
