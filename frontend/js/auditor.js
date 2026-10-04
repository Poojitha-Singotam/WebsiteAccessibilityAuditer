/**
 * Web Accessibility Auditor - Core Audit Engine
 * Coordinates all modular rule checks, scores the DOM, and prepares structured reports.
 */

(function () {
    const A11yAuditor = {
        /**
         * Run a complete accessibility audit on an HTML string.
         * @param {string} rawHtml - The raw HTML markup to inspect
         * @param {string} pageName - Optional label for the page or component
         * @returns {Object} Structured audit result
         */
        runAudit(rawHtml, pageName = 'Untitled Analysis') {
            if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.trim()) {
                throw new Error('Please enter or upload valid HTML markup to analyze.');
            }

            // 1. Safe DOM Parsing
            const doc = A11yUtils.parseHTML(rawHtml);

            // 2. Execute all registered rule modules
            const allIssues = [];
            const ruleModules = window.A11yRules || {};

            const moduleKeys = [
                'document',
                'structure',
                'headings',
                'images',
                'forms',
                'links',
                'buttons',
                'tables',
                'media',
                'aria'
            ];

            moduleKeys.forEach(key => {
                const mod = ruleModules[key];
                if (mod && typeof mod.analyze === 'function') {
                    try {
                        const res = mod.analyze(doc, rawHtml);
                        if (Array.isArray(res)) {
                            allIssues.push(...res);
                        }
                    } catch (err) {
                        console.error(`Error running accessibility rule module [${key}]:`, err);
                    }
                }
            });

            // 3. Count summary statistics by severity
            const summary = {
                critical_count: 0,
                error_count: 0,
                warning_count: 0,
                info_count: 0,
                pass_count: 0,
                total_checks: allIssues.length
            };

            allIssues.forEach(issue => {
                const sev = (issue.severity || 'INFO').toUpperCase();
                if (sev === 'CRITICAL') summary.critical_count++;
                else if (sev === 'ERROR') summary.error_count++;
                else if (sev === 'WARNING') summary.warning_count++;
                else if (sev === 'INFO') summary.info_count++;
                else if (sev === 'PASS') summary.pass_count++;
            });

            // 4. Calculate Audit Score (Weights: CRITICAL=15, ERROR=8, WARNING=3, INFO=1)
            const score = A11yUtils.calculateScore(summary);

            const auditResult = {
                pageName: (pageName || 'Analysis Report').trim(),
                score: score,
                grade: A11yUtils.getScoreGrade(score),
                summary: summary,
                issues: allIssues,
                rawHtml: rawHtml,
                timestamp: new Date().toISOString()
            };

            // Save to sessionStorage for seamless report viewing
            try {
                sessionStorage.setItem('current_audit_report', JSON.stringify(auditResult));
            } catch (e) {
                console.warn('Could not cache audit in sessionStorage (payload may be large):', e);
            }

            return auditResult;
        },

        /**
         * Get the current active audit report from sessionStorage
         */
        getCurrentReport() {
            try {
                const data = sessionStorage.getItem('current_audit_report');
                return data ? JSON.parse(data) : null;
            } catch (e) {
                return null;
            }
        },

        /**
         * Store an active audit report in sessionStorage
         */
        setCurrentReport(report) {
            try {
                sessionStorage.setItem('current_audit_report', JSON.stringify(report));
            } catch (e) {
                console.error('Failed to store report in session:', e);
            }
        }
    };

    window.A11yAuditor = A11yAuditor;
})();
