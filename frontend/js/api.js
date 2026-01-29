// API configuration
const API_BASE_URL = '/api';

class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            console.log('Making API request to:', url, config); // Debug log
            
            const response = await fetch(url, config);
            const data = await response.json();

            console.log('API response:', data); // Debug log

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth methods
    static async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    static async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    static async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    // Test connection
    static async testConnection() {
        try {
            const response = await fetch('/health');
            return await response.json();
        } catch (error) {
            console.error('Connection test failed:', error);
            return null;
        }
    }
}

// Test API connection on load
API.testConnection().then(result => {
    if (result) {
        console.log('API connected:', result.message);
    } else {
        console.warn('API connection failed');
    }
});
