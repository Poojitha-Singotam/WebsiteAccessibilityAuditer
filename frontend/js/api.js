/**
 * Web Accessibility Auditor - API Client
 * Manages REST API communication with Flask backend, JWT authorization, and sample retrieval.
 */

const A11yAPI = {
    // Determine Base URL
    getBaseUrl() {
        if (window.location.protocol === 'file:') {
            return 'http://127.0.0.1:5050/api';
        }
        if (window.location.port === '3000' || window.location.port === '5500' || window.location.port === '8080') {
            return 'http://127.0.0.1:5050/api';
        }
        return `${window.location.origin}/api`;
    },

    // Retrieve active JWT token
    getToken() {
        return localStorage.getItem('a11y_auth_token') || sessionStorage.getItem('a11y_auth_token');
    },

    // Set active JWT token
    setToken(token, remember = true) {
        if (remember) {
            localStorage.setItem('a11y_auth_token', token);
        } else {
            sessionStorage.setItem('a11y_auth_token', token);
        }
    },

    // Clear active token
    clearToken() {
        localStorage.removeItem('a11y_auth_token');
        sessionStorage.removeItem('a11y_auth_token');
        localStorage.removeItem('a11y_user_profile');
        sessionStorage.removeItem('a11y_user_profile');
    },

    // Common fetch wrapper
    async request(endpoint, options = {}) {
        const url = `${this.getBaseUrl()}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
                    this.clearToken();
                    // If on a protected page, redirect to login
                    const path = window.location.pathname;
                    if (path.includes('dashboard.html') || path.includes('history.html')) {
                        window.location.href = 'login.html?expired=1';
                    }
                }
                const errorMsg = data.message || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(errorMsg);
            }

            return data;
        } catch (err) {
            console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err.message);
            throw err;
        }
    },

    // 1. Auth APIs
    async register(name, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
    },

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async getMe() {
        return this.request('/auth/me');
    },

    // 2. Audit APIs
    async saveAudit(auditData) {
        return this.request('/audits', {
            method: 'POST',
            body: JSON.stringify({
                page_name: auditData.pageName || 'Analysis Report',
                score: auditData.score || 100,
                summary: auditData.summary || {},
                issues: auditData.issues || []
            })
        });
    },

    async getAudits() {
        return this.request('/audits');
    },

    async getAudit(auditId) {
        return this.request(`/audits/${auditId}`);
    },

    async getAuditIssues(auditId) {
        return this.request(`/audits/${auditId}/issues`);
    },

    async deleteAudit(auditId) {
        return this.request(`/audits/${auditId}`, {
            method: 'DELETE'
        });
    },

    // 3. Load Sample HTML
    async loadSample(sampleType) {
        const samples = {
            poor: '../samples/poor.html',
            good: '../samples/good.html',
            mixed: '../samples/mixed.html'
        };

        const target = samples[sampleType] || samples.poor;
        try {
            const resp = await fetch(target);
            if (!resp.ok) {
                // Fallback direct path if running from root
                const fallbackResp = await fetch(`/samples/${sampleType}.html`);
                if (!fallbackResp.ok) throw new Error('Sample file could not be fetched');
                return await fallbackResp.text();
            }
            return await resp.text();
        } catch (e) {
            console.warn('Direct fetch of sample file failed, using bundled fallback:', e);
            return this.getBundledSample(sampleType);
        }
    },

    // Fallback bundled sample contents if static file path is blocked by CORS/file protocol
    getBundledSample(type) {
        if (type === 'poor') {
            return `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
</head>
<body>
    <div>
        <h1>TechSolutions Portal</h1>
        <h3>Latest Announcements</h3>
        <p>Welcome to our enterprise system.</p>
        <img src="hero-banner.jpg">
        <form>
            <input type="text" id="username" placeholder="Username">
            <input type="password" id="pwd" placeholder="Password">
            <button type="submit"></button>
            <button class="icon-btn"><span>&#128269;</span></button>
        </form>
        <a href="/dashboard"></a>
        <p>To read our corporate guidelines, <a href="/terms">click here</a>.</p>
        <p>For more details, <a href="/more">read more</a>.</p>
        <table>
            <tr><td>Quarter</td><td>Revenue</td></tr>
            <tr><td>Q1</td><td>$1.2M</td></tr>
        </table>
        <video src="overview.mp4" controls></video>
    </div>
</body>
</html>`;
        } else if (type === 'good') {
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TechSolutions - Enterprise Cloud & Security Services</title>
</head>
<body>
    <header role="banner">
        <nav aria-label="Main Navigation">
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/services">Our Cloud Services</a></li>
            </ul>
        </nav>
    </header>
    <main id="main-content" role="main">
        <h1>Enterprise Cloud Platform Solutions</h1>
        <section aria-labelledby="intro-heading">
            <h2 id="intro-heading">Infrastructure Modernization</h2>
            <img src="server.jpg" alt="High-density data server room glowing with blue status LED lights">
            <img src="divider.png" alt="" role="presentation">
        </section>
        <section aria-labelledby="pricing-heading">
            <h2 id="pricing-heading">Financial Quarterly Performance</h2>
            <table>
                <caption>Fiscal Year 2026 Revenue</caption>
                <thead>
                    <tr><th scope="col">Financial Quarter</th><th scope="col">Enterprise Revenue</th></tr>
                </thead>
                <tbody>
                    <tr><th scope="row">Q1 2026</th><td>$1,240,000</td></tr>
                </tbody>
            </table>
        </section>
        <form action="/submit" method="post">
            <label for="work-email">Business Email Address</label>
            <input type="email" id="work-email" name="email" autocomplete="email" required>
            <button type="submit">Submit Request</button>
        </form>
    </main>
    <footer>
        <p>&copy; 2026 TechSolutions Inc. All rights reserved.</p>
    </footer>
</body>
</html>`;
        } else {
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Dashboard - Mixed Accessibility Evaluation</title>
</head>
<body>
    <header>
        <nav aria-label="Customer Portal Navigation">
            <a href="/overview">Account Overview</a>
            <a href="/support">click here</a>
        </nav>
    </header>
    <div class="content-wrapper">
        <h1>Welcome Back, Alex Morgan</h1>
        <section>
            <h2>Current Subscription Plan</h2>
            <img src="badge-pro.png" alt="Pro enterprise tier certified customer badge">
            <img src="promo-banner.jpg">
        </section>
        <h4></h4>
        <form>
            <label for="user-phone">Phone Number</label>
            <input type="tel" id="user-phone" name="phone" autocomplete="tel">
            <input type="text" id="referral-code" placeholder="Enter Referral Code">
            <button type="submit">Save Changes</button>
            <button type="button" class="btn-refresh"><svg width="16" height="16"><circle cx="8" cy="8" r="7"/></svg></button>
        </form>
        <table>
            <tr><th>Service Name</th><th>Cost</th></tr>
            <tr><td>Database Cluster</td><td>$48.00</td></tr>
        </table>
    </div>
</body>
</html>`;
        }
    }
};

window.A11yAPI = A11yAPI;
