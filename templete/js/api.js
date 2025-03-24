/**
 * VELA API Client
 * Handles all interactions with the VELA API
 */

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get stored token
const getToken = () => {
    return localStorage.getItem('vela_token');
};

// Helper function to handle API responses
const handleResponse = async (response) => {
    const data = await response.json();
    
    if (!response.ok) {
        // If the response includes a message, use it, otherwise use a generic error
        const errorMessage = data.message || 'An error occurred';
        throw new Error(errorMessage);
    }
    
    return data;
};

// Create request headers with authentication token
const createHeaders = (includeAuth = true) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (includeAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return headers;
};

/**
 * Authentication API
 */
const auth = {
    // Register a new user
    register: async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: createHeaders(false),
                body: JSON.stringify(userData)
            });
            
            return handleResponse(response);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },
    
    // Login a user
    login: async (credentials) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: createHeaders(false),
                body: JSON.stringify(credentials)
            });
            
            const data = await handleResponse(response);
            
            // Store token and user data in localStorage
            if (data.token) {
                localStorage.setItem('vela_token', data.token);
                localStorage.setItem('vela_user', JSON.stringify({
                    id: data.user_id,
                    username: data.username,
                    current_total_balance: data.current_total_balance,
                    long_term_balance: data.long_term_balance
                }));
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    
    // Logout current user
    logout: () => {
        localStorage.removeItem('vela_token');
        localStorage.removeItem('vela_user');
        window.location.href = 'index.html';
    },
    
    // Check if user is authenticated
    isAuthenticated: () => {
        return !!getToken();
    },
    
    // Get current user data
    getCurrentUser: () => {
        const userData = localStorage.getItem('vela_user');
        return userData ? JSON.parse(userData) : null;
    },
    
    // Update stored user data (balance, etc.)
    updateUserData: (userData) => {
        const currentData = auth.getCurrentUser();
        const updatedData = { ...currentData, ...userData };
        localStorage.setItem('vela_user', JSON.stringify(updatedData));
    }
};

/**
 * Categories API
 */
const categories = {
    // Get all categories
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'GET',
                headers: createHeaders()
            });
            
            return handleResponse(response);
        } catch (error) {
            console.error('Get categories error:', error);
            throw error;
        }
    },
    
    // Create a new category
    create: async (categoryData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: createHeaders(),
                body: JSON.stringify(categoryData)
            });
            
            return handleResponse(response);
        } catch (error) {
            console.error('Create category error:', error);
            throw error;
        }
    },
    
    // Update a category
    update: async (categoryId, categoryData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
                method: 'PUT',
                headers: createHeaders(),
                body: JSON.stringify(categoryData)
            });
            
            return handleResponse(response);
        } catch (error) {
            console.error('Update category error:', error);
            throw error;
        }
    },
    
    // Delete a category
    delete: async (categoryId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
                method: 'DELETE',
                headers: createHeaders()
            });
            
            return handleResponse(response);
        } catch (error) {
            console.error('Delete category error:', error);
            throw error;
        }
    }
};

/**
 * Transactions API
 */
const transactions = {
    // Get all transactions, optionally filtered
    getAll: async (filters = {}) => {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            
            if (filters.start) queryParams.append('start', filters.start);
            if (filters.end) queryParams.append('end', filters.end);
            if (filters.category_id) queryParams.append('category_id', filters.category_id);
            
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            
            const response = await fetch(`${API_BASE_URL}/transactions${queryString}`, {
                method: 'GET',
                headers: createHeaders()
            });
            
            const data = await handleResponse(response);
            
            // Update user balances from response
            if (data.current_total_balance !== undefined && data.long_term_balance !== undefined) {
                auth.updateUserData({
                    current_total_balance: data.current_total_balance,
                    long_term_balance: data.long_term_balance
                });
            }
            
            return data;
        } catch (error) {
            console.error('Get transactions error:', error);
            throw error;
        }
    },
    
    // Get a single transaction by ID
    getById: async (transactionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
                method: 'GET',
                headers: createHeaders()
            });
            
            return handleResponse(response);
        } catch (error) {
            console.error('Get transaction error:', error);
            throw error;
        }
    },
    
    // Create a new transaction
    create: async (transactionData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: createHeaders(),
                body: JSON.stringify(transactionData)
            });
            
            const data = await handleResponse(response);
            
            // Update user balances from response
            if (data.current_total_balance !== undefined && data.long_term_balance !== undefined) {
                auth.updateUserData({
                    current_total_balance: data.current_total_balance,
                    long_term_balance: data.long_term_balance
                });
            }
            
            return data;
        } catch (error) {
            console.error('Create transaction error:', error);
            throw error;
        }
    },
    
    // Update a transaction
    update: async (transactionId, transactionData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
                method: 'PUT',
                headers: createHeaders(),
                body: JSON.stringify(transactionData)
            });
            
            const data = await handleResponse(response);
            
            // Update user balances from response
            if (data.current_total_balance !== undefined && data.long_term_balance !== undefined) {
                auth.updateUserData({
                    current_total_balance: data.current_total_balance,
                    long_term_balance: data.long_term_balance
                });
            }
            
            return data;
        } catch (error) {
            console.error('Update transaction error:', error);
            throw error;
        }
    },
    
    // Delete a transaction
    delete: async (transactionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: createHeaders()
            });
            
            const data = await handleResponse(response);
            
            // Update user balances from response
            if (data.current_total_balance !== undefined && data.long_term_balance !== undefined) {
                auth.updateUserData({
                    current_total_balance: data.current_total_balance,
                    long_term_balance: data.long_term_balance
                });
            }
            
            return data;
        } catch (error) {
            console.error('Delete transaction error:', error);
            throw error;
        }
    },
    
    // Update transaction category
    updateCategory: async (transactionId, categoryId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/category`, {
                method: 'PUT',
                headers: createHeaders(),
                body: JSON.stringify({ category_id: categoryId })
            });
            
            return handleResponse(response);
        } catch (error) {
            console.error('Update transaction category error:', error);
            throw error;
        }
    }
};

/**
 * Reports API
 */
const reports = {
    // Get day capacity for a specific date
    getDayCapacity: async (date = null) => {
        try {
            const queryParams = date ? `?date=${date}` : '';
            
            const response = await fetch(`${API_BASE_URL}/reports/day_capacity${queryParams}`, {
                method: 'GET',
                headers: createHeaders()
            });
            
            const data = await handleResponse(response);
            
            // Update user balances from response
            if (data.current_total_balance !== undefined && data.long_term_balance !== undefined) {
                auth.updateUserData({
                    current_total_balance: data.current_total_balance,
                    long_term_balance: data.long_term_balance
                });
            }
            
            return data;
        } catch (error) {
            console.error('Get day capacity error:', error);
            throw error;
        }
    },
    
    // Get summary report for a date range
    getSummary: async (startDate, endDate) => {
        try {
            if (!startDate || !endDate) {
                throw new Error('Start and end dates are required');
            }
            
            const response = await fetch(`${API_BASE_URL}/reports/summary?start=${startDate}&end=${endDate}`, {
                method: 'GET',
                headers: createHeaders()
            });
            
            const data = await handleResponse(response);
            
            // Update user balances from response
            if (data.current_total_balance !== undefined && data.long_term_balance !== undefined) {
                auth.updateUserData({
                    current_total_balance: data.current_total_balance,
                    long_term_balance: data.long_term_balance
                });
            }
            
            return data;
        } catch (error) {
            console.error('Get summary error:', error);
            throw error;
        }
    },
    
    // Get daily category report
    getDailyCategoryReport: async (date = null) => {
        try {
            const queryParams = date ? `?date=${date}` : '';
            
            const response = await fetch(`${API_BASE_URL}/reports/categories/daily${queryParams}`, {
                method: 'GET',
                headers: createHeaders()
            });
            
            return handleResponse(response);
        } catch (error) {
            console.error('Get daily category report error:', error);
            throw error;
        }
    },
    
    // Get monthly category report
    getMonthlyCategoryReport: async (year, month) => {
        try {
            if (!year || !month) {
                throw new Error('Year and month are required');
            }
            
            const response = await fetch(`${API_BASE_URL}/reports/categories/monthly?year=${year}&month=${month}`, {
                method: 'GET',
                headers: createHeaders()
            });
            
            return handleResponse(response);
        } catch (error) {
            console.error('Get monthly category report error:', error);
            throw error;
        }
    }
};

// Export the API client
const api = {
    auth,
    categories,
    transactions,
    reports
};
