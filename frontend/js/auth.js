/**
 * Web Accessibility Auditor - Authentication Controller
 * Manages user session state, header controls, login/registration handling.
 */

const A11yAuth = {
    getUser() {
        try {
            const raw = localStorage.getItem('a11y_user_profile') || sessionStorage.getItem('a11y_user_profile');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    setUser(user, remember = true) {
        if (remember) {
            localStorage.setItem('a11y_user_profile', JSON.stringify(user));
        } else {
            sessionStorage.setItem('a11y_user_profile', JSON.stringify(user));
        }
    },

    isAuthenticated() {
        return !!A11yAPI.getToken() && !!this.getUser();
    },

    logout() {
        A11yAPI.clearToken();
        window.location.href = 'login.html?logged_out=1';
    },

    /**
     * Update navigation header based on active session
     */
    updateNav() {
        const user = this.getUser();
        const userProfileNav = document.getElementById('nav-user-profile');
        const loginNav = document.getElementById('nav-login-link');
        const logoutNav = document.getElementById('nav-logout-btn');
        const userNameDisplay = document.getElementById('user-name-display');

        if (this.isAuthenticated() && user) {
            if (userProfileNav) userProfileNav.style.display = 'inline-flex';
            if (loginNav) loginNav.style.display = 'none';
            if (logoutNav) logoutNav.style.display = 'inline-block';
            if (userNameDisplay) userNameDisplay.textContent = user.name || user.email;
        } else {
            if (userProfileNav) userProfileNav.style.display = 'none';
            if (loginNav) loginNav.style.display = 'inline-block';
            if (logoutNav) logoutNav.style.display = 'none';
        }
    },

    /**
     * Require authentication on protected pages
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            const current = encodeURIComponent(window.location.pathname.split('/').pop());
            window.location.href = `login.html?redirect=${current}`;
        }
    }
};

window.A11yAuth = A11yAuth;

document.addEventListener('DOMContentLoaded', () => {
    A11yAuth.updateNav();

    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            A11yAuth.logout();
        });
    }
});
