// Authentication functionality - COMPLETE ENHANCED VERSION
class Auth {
    static init() {
        console.log('🔐 Auth system initializing...');
        this.bindEventListeners();
        
        // Don't check auth status on login/register pages
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
            this.checkAuthStatus();
        }
    }

    static bindEventListeners() {
        console.log('📡 Binding authentication event listeners...');
        
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('✅ Login form found');
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            console.log('✅ Register form found');
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // Logout buttons
        const logoutBtns = document.querySelectorAll('#logoutBtn');
        if (logoutBtns.length > 0) {
            console.log(`✅ Found ${logoutBtns.length} logout button(s)`);
            logoutBtns.forEach(btn => {
                btn.addEventListener('click', this.handleLogout.bind(this));
            });
        }
    }

    static async handleLogin(e) {
        e.preventDefault();
        console.log('🔐 Login form submitted');
        
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const loginText = document.getElementById('login-text');
        const loginLoading = document.getElementById('login-loading');
        const errorDiv = document.getElementById('error-message');

        // Show loading state
        if (loginText) loginText.classList.add('hidden');
        if (loginLoading) loginLoading.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = true;
        if (errorDiv) errorDiv.classList.add('hidden');

        try {
            const formData = new FormData(e.target);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            console.log('📤 Sending login request for:', loginData.email);

            // Make API call
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();
            console.log('📥 Login response received:', result.success ? 'SUCCESS' : 'FAILED');

            if (result.success) {
                // Store comprehensive auth data
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userId', result.user.id);
                localStorage.setItem('userRole', result.user.role);
                localStorage.setItem('userFullName', result.user.fullName);
                localStorage.setItem('username', result.user.username);
                localStorage.setItem('userEmail', result.user.email);
                localStorage.setItem('lastLoginTime', new Date().toISOString());
                
                // Store user stats if available from server
                if (result.user.profileStats) {
                    localStorage.setItem('problemsSolved', result.user.profileStats.problemsSolved || '0');
                    localStorage.setItem('totalSubmissions', result.user.profileStats.totalSubmissions || '0');
                    localStorage.setItem('acceptedSubmissions', result.user.profileStats.acceptedSubmissions || '0');
                    localStorage.setItem('currentStreak', result.user.profileStats.currentStreak || '0');
                } else {
                    // Initialize with default stats if not provided
                    localStorage.setItem('problemsSolved', '0');
                    localStorage.setItem('totalSubmissions', '0');
                    localStorage.setItem('acceptedSubmissions', '0');
                    localStorage.setItem('currentStreak', '0');
                }
                
                console.log('✅ Login successful! User data stored:', {
                    fullName: result.user.fullName,
                    username: result.user.username,
                    role: result.user.role,
                    userId: result.user.id
                });
                
                // Show success message briefly
                if (loginText) {
                    loginText.textContent = 'Login Successful! Redirecting...';
                    loginText.classList.remove('hidden');
                    loginText.style.color = '#28a745';
                }
                if (loginLoading) loginLoading.classList.add('hidden');
                
                // Show success toast
                this.showToast(`Welcome back, ${result.user.fullName}!`, 'success');
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                throw new Error(result.message || 'Login failed');
            }

        } catch (error) {
            console.error('❌ Login error:', error.message);
            
            if (errorDiv) {
                errorDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24;">
                        <span style="font-size: 1.2rem;">⚠️</span>
                        <span>${error.message || 'Login failed. Please try again.'}</span>
                    </div>
                `;
                errorDiv.classList.remove('hidden');
            } else {
                alert('Login error: ' + (error.message || 'Please try again.'));
            }
        } finally {
            // Reset loading state
            setTimeout(() => {
                if (loginText && loginText.style.color !== 'rgb(40, 167, 69)') {
                    loginText.textContent = 'Sign In';
                    loginText.classList.remove('hidden');
                    loginText.style.color = '';
                }
                if (loginLoading) loginLoading.classList.add('hidden');
                if (submitBtn) submitBtn.disabled = false;
            }, 1000);
        }
    }

    static async handleRegister(e) {
        e.preventDefault();
        console.log('📝 Register form submitted');
        
        const submitBtn = document.querySelector('#registerForm button[type="submit"]');
        const registerText = document.getElementById('register-text');
        const registerLoading = document.getElementById('register-loading');
        const errorDiv = document.getElementById('error-message');

        // Show loading state
        if (registerText) registerText.classList.add('hidden');
        if (registerLoading) registerLoading.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = true;
        if (errorDiv) errorDiv.classList.add('hidden');

        try {
            const formData = new FormData(e.target);
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');

            // Enhanced validation
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const registerData = {
                fullName: formData.get('fullName').trim(),
                username: formData.get('username').trim(),
                email: formData.get('email').trim(),
                password: password
            };

            // Enhanced validation
            if (!registerData.fullName || !registerData.username || !registerData.email) {
                throw new Error('All fields are required');
            }

            if (registerData.username.length < 3) {
                throw new Error('Username must be at least 3 characters long');
            }

            if (!this.isValidEmail(registerData.email)) {
                throw new Error('Please enter a valid email address');
            }

            console.log('📤 Sending registration request for:', registerData.email);

            // Make API call
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            });

            const result = await response.json();
            console.log('📥 Registration response received:', result.success ? 'SUCCESS' : 'FAILED');

            if (result.success) {
                // Show success message
                if (registerText) {
                    registerText.textContent = 'Registration Successful!';
                    registerText.classList.remove('hidden');
                    registerText.style.color = '#28a745';
                }
                if (registerLoading) registerLoading.classList.add('hidden');
                
                console.log('✅ Registration successful! User created:', {
                    fullName: registerData.fullName,
                    username: registerData.username,
                    email: registerData.email,
                    userId: result.user?.id,
                    timestamp: new Date().toISOString()
                });

                // Show success toast
                this.showToast(`Welcome to CodeArena, ${registerData.fullName}!`, 'success');

                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);

            } else {
                throw new Error(result.message || 'Registration failed');
            }

        } catch (error) {
            console.error('❌ Registration error:', error.message);
            
            if (errorDiv) {
                errorDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24;">
                        <span style="font-size: 1.2rem;">⚠️</span>
                        <span>${error.message || 'Registration failed. Please try again.'}</span>
                    </div>
                `;
                errorDiv.classList.remove('hidden');
            } else {
                alert('Registration error: ' + (error.message || 'Please try again.'));
            }
        } finally {
            // Reset loading state
            setTimeout(() => {
                if (registerText && registerText.style.color !== 'rgb(40, 167, 69)') {
                    registerText.textContent = 'Create Account';
                    registerText.classList.remove('hidden');
                    registerText.style.color = '';
                }
                if (registerLoading) registerLoading.classList.add('hidden');
                if (submitBtn) submitBtn.disabled = false;
            }, 2000);
        }
    }

    static handleLogout(e) {
        e.preventDefault();
        console.log('👋 User logout initiated');
        
        const currentUser = this.getCurrentUser();
        if (currentUser.fullName) {
            console.log(`👋 Logging out user: ${currentUser.fullName}`);
        }

        // Show confirmation dialog
        if (!confirm('Are you sure you want to logout?')) {
            return;
        }
        
        // Clear all auth-related data
        const keysToRemove = [
            'authToken',
            'userId',
            'userRole',
            'userFullName',
            'username',
            'userEmail',
            'problemsSolved',
            'totalSubmissions',
            'acceptedSubmissions',
            'currentStreak',
            'lastLoginTime',
            'submissions' // Also clear submissions on logout if desired
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('🧹 Local storage cleared');
        
        // Show logout toast
        this.showToast('Logged out successfully!', 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }

    static checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const currentPath = window.location.pathname;
        
        console.log(`🔍 Checking auth status for path: ${currentPath}`);
        console.log(`🎫 Token present: ${token ? 'YES' : 'NO'}`);

        // Define protected routes
        const protectedRoutes = ['/dashboard', '/problems', '/submissions', '/admin'];
        const isProtectedRoute = protectedRoutes.some(route => 
            currentPath === route || currentPath.startsWith(route)
        );

        // Check token expiry if token exists
        if (token && this.isTokenExpired()) {
            console.log('🕐 Token expired, redirecting to login');
            return false;
        }

        // Redirect unauthenticated users away from protected pages
        if (!token && isProtectedRoute) {
            console.log('🚫 Access denied - redirecting to login');
            this.showToast('Please login to access this page', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
            return false;
        }

        // If authenticated, log user info
        if (token) {
            const user = this.getCurrentUser();
            console.log('✅ Authenticated user:', user.fullName || user.username || 'Unknown');
        }

        return true;
    }

    static isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const hasValidToken = token && token !== 'null' && token !== 'undefined';
        
        console.log('🔐 Authentication check:', hasValidToken ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
        
        // Also check if token is expired
        if (hasValidToken && this.isTokenExpired()) {
            return false;
        }
        
        return hasValidToken;
    }

    static getCurrentUser() {
        return {
            id: localStorage.getItem('userId'),
            role: localStorage.getItem('userRole'),
            fullName: localStorage.getItem('userFullName'),
            username: localStorage.getItem('username'),
            email: localStorage.getItem('userEmail'),
            token: localStorage.getItem('authToken'),
            lastLogin: localStorage.getItem('lastLoginTime'),
            stats: {
                problemsSolved: parseInt(localStorage.getItem('problemsSolved')) || 0,
                totalSubmissions: parseInt(localStorage.getItem('totalSubmissions')) || 0,
                acceptedSubmissions: parseInt(localStorage.getItem('acceptedSubmissions')) || 0,
                currentStreak: parseInt(localStorage.getItem('currentStreak')) || 0
            }
        };
    }

    // Enhanced method to update user stats with dashboard integration
    static updateUserStats(newStats) {
        console.log('📊 Updating user stats:', newStats);
        
        if (newStats.problemsSolved !== undefined) {
            localStorage.setItem('problemsSolved', newStats.problemsSolved.toString());
        }
        if (newStats.totalSubmissions !== undefined) {
            localStorage.setItem('totalSubmissions', newStats.totalSubmissions.toString());
        }
        if (newStats.acceptedSubmissions !== undefined) {
            localStorage.setItem('acceptedSubmissions', newStats.acceptedSubmissions.toString());
        }
        if (newStats.currentStreak !== undefined) {
            localStorage.setItem('currentStreak', newStats.currentStreak.toString());
        }

        console.log('📊 User stats updated in localStorage');

        // Trigger dashboard update if on dashboard page
        if (typeof window.Dashboard !== 'undefined') {
            if (window.Dashboard.loadAndCalculateUserStats) {
                window.Dashboard.loadAndCalculateUserStats();
                console.log('📊 Dashboard stats refreshed');
            }
        }

        // Also trigger any other stat listeners
        this.notifyStatsUpdate(newStats);
    }

    // Method to notify other components of stats update
    static notifyStatsUpdate(newStats) {
        const event = new CustomEvent('userStatsUpdated', {
            detail: newStats
        });
        window.dispatchEvent(event);
    }

    // Method to check if user has specific role
    static hasRole(requiredRole) {
        const userRole = localStorage.getItem('userRole');
        return userRole === requiredRole;
    }

    // Method to check if user is admin
    static isAdmin() {
        return this.hasRole('admin');
    }

    // Method to get formatted user display name
    static getUserDisplayName() {
        const fullName = localStorage.getItem('userFullName');
        const username = localStorage.getItem('username');
        
        if (fullName) {
            // Return first name only for dashboard
            return fullName.split(' ')[0];
        } else if (username) {
            return username;
        }
        
        return 'User';
    }

    // Enhanced method to validate token expiry
    static isTokenExpired() {
        const token = localStorage.getItem('authToken');
        if (!token) return true;

        try {
            // Basic JWT structure check (this is client-side only, not security)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < currentTime) {
                console.log('🕐 Token expired, clearing auth data');
                this.clearAuthData();
                this.showToast('Session expired. Please login again.', 'error');
                return true;
            }
            
            return false;
        } catch (error) {
            console.log('⚠️ Invalid token format');
            this.clearAuthData();
            return true;
        }
    }

    // Helper method to clear auth data
    static clearAuthData() {
        const keysToRemove = [
            'authToken',
            'userId',
            'userRole',
            'userFullName',
            'username',
            'userEmail',
            'lastLoginTime'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🧹 Auth data cleared');
    }

    // Enhanced email validation
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Enhanced toast notification system
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // Method to refresh user session
    static async refreshSession() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;

        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    // Update localStorage with fresh user data
                    localStorage.setItem('userFullName', data.user.fullName);
                    localStorage.setItem('username', data.user.username);
                    localStorage.setItem('userRole', data.user.role);
                    
                    console.log('✅ Session refreshed successfully');
                    return true;
                }
            }
            
            throw new Error('Session refresh failed');
            
        } catch (error) {
            console.log('⚠️ Session refresh failed:', error.message);
            return false;
        }
    }

    // Method to get user activity summary
    static getUserActivitySummary() {
        const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        const stats = this.getCurrentUser().stats;
        
        return {
            ...stats,
            recentSubmissions: submissions.slice(0, 5),
            lastActivity: submissions.length > 0 ? submissions[0].submittedAt : null,
            joinDate: localStorage.getItem('lastLoginTime')
        };
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Auth script loaded and initializing...');
    Auth.init();
});

// Make Auth available globally
window.Auth = Auth;

// Enhanced periodic token validation (every 5 minutes)
setInterval(() => {
    if (Auth.isAuthenticated()) {
        if (Auth.isTokenExpired()) {
            console.log('🕐 Token expired during periodic check');
            // Redirect to login if on protected page
            const currentPath = window.location.pathname;
            const protectedRoutes = ['/dashboard', '/problems', '/submissions', '/admin'];
            const isProtectedRoute = protectedRoutes.some(route => 
                currentPath === route || currentPath.startsWith(route)
            );
            
            if (isProtectedRoute) {
                window.location.href = '/login';
            }
        }
    }
}, 5 * 60 * 1000); // 5 minutes

// Handle page visibility change to refresh auth status
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Auth.isAuthenticated()) {
        Auth.isTokenExpired();
        
        // Refresh session data if needed
        const lastLogin = localStorage.getItem('lastLoginTime');
        const now = new Date();
        const lastLoginTime = new Date(lastLogin);
        const hoursSinceLogin = (now - lastLoginTime) / (1000 * 60 * 60);
        
        // Refresh session if it's been more than 1 hour
        if (hoursSinceLogin > 1) {
            Auth.refreshSession();
        }
    }
});

// Listen for custom events
window.addEventListener('userStatsUpdated', (event) => {
    console.log('📊 User stats updated event received:', event.detail);
});

console.log('✅ Enhanced Auth system loaded successfully');
