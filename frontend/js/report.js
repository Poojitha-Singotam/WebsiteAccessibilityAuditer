/**
 * Web Accessibility Auditor - Report Page Controller
 * Handles report rendering, client-side filtering, searching, sorting,
 * before/after fix view, element inspection modal, and MySQL saving.
 */

(function () {
    let activeReport = null;
    let filteredIssues = [];
    let currentCategory = 'ALL';
    let currentSeverity = 'ALL';
    let searchQuery = '';
    let currentSort = 'severity';

    document.addEventListener('DOMContentLoaded', async () => {
        await initReport();
        setupEventListeners();
    });

    async function initReport() {
        const urlParams = new URLSearchParams(window.location.search);
        const auditId = urlParams.get('id');

        if (auditId) {
            // Load from Backend MySQL
            try {
                showLoading(true);
                const auditResp = await A11yAPI.getAudit(auditId);
                const issuesResp = await A11yAPI.getAuditIssues(auditId);

                const auditData = auditResp.audit;
                const issues = issuesResp.issues.map(iss => ({
                    ruleId: iss.rule_id,
                    category: iss.category,
                    severity: iss.severity,
                    message: iss.message,
                    element: iss.element_html,
                    explanation: iss.explanation,
                    recommendation: iss.recommendation,
                    wcag: iss.wcag_reference,
                    currentCode: iss.element_html,
                    recommendedCode: iss.recommendation
                }));

                activeReport = {
                    id: auditData.id,
                    pageName: auditData.page_name,
                    score: auditData.score,
                    grade: A11yUtils.getScoreGrade(auditData.score),
                    summary: {
                        critical_count: auditData.critical_count || 0,
                        error_count: auditData.error_count || 0,
                        warning_count: auditData.warning_count || 0,
                        info_count: auditData.info_count || 0,
                        pass_count: auditData.pass_count || 0
                    },
                    issues: issues,
                    timestamp: auditData.created_at,
                    isSaved: true
                };
            } catch (err) {
                console.error('Failed to load audit by ID from API:', err);
                alert('Could not load saved audit report: ' + err.message);
                window.location.href = 'dashboard.html';
                return;
            } finally {
                showLoading(false);
            }
        } else {
            // Load from SessionStorage
            activeReport = A11yAuditor.getCurrentReport();
            if (!activeReport) {
                // If neither exists, redirect to auditor input
                window.location.href = 'auditor.html';
                return;
            }
        }

        renderOverview();
        applyFiltersAndRender();
    }

    function showLoading(isLoading) {
        const loader = document.getElementById('report-loading');
        if (loader) loader.style.display = isLoading ? 'flex' : 'none';
    }

    function renderOverview() {
        if (!activeReport) return;

        // Page title & meta
        const titleEl = document.getElementById('report-page-title');
        const metaEl = document.getElementById('report-timestamp');
        if (titleEl) titleEl.textContent = activeReport.pageName || 'Analysis Report';
        if (metaEl) metaEl.textContent = `Analyzed on ${A11yUtils.formatDate(activeReport.timestamp)}`;

        // Score circle & grade
        const scoreEl = document.getElementById('score-number');
        const gradeEl = document.getElementById('score-grade');
        const circleEl = document.getElementById('score-circle');

        const score = activeReport.score || 0;
        const grade = activeReport.grade || A11yUtils.getScoreGrade(score);

        if (scoreEl) scoreEl.textContent = score;
        if (gradeEl) {
            gradeEl.textContent = grade.label;
            gradeEl.style.backgroundColor = `${grade.color}25`;
            gradeEl.style.color = grade.color;
            gradeEl.style.border = `1px solid ${grade.color}60`;
        }
        if (circleEl) {
            circleEl.style.borderColor = grade.color;
            circleEl.style.boxShadow = `0 0 25px ${grade.color}35`;
        }

        // Summary Counters
        const summary = activeReport.summary || {};
        setCounter('count-critical', summary.critical_count || 0);
        setCounter('count-error', summary.error_count || 0);
        setCounter('count-warning', summary.warning_count || 0);
        setCounter('count-info', summary.info_count || 0);
        setCounter('count-pass', summary.pass_count || 0);

        // Save Button State
        const saveBtn = document.getElementById('btn-save-audit');
        if (saveBtn) {
            if (activeReport.isSaved) {
                saveBtn.innerHTML = '&#10003; Saved in MySQL';
                saveBtn.classList.remove('btn-primary');
                saveBtn.classList.add('btn-secondary');
                saveBtn.disabled = true;
            } else {
                saveBtn.innerHTML = '&#128190; Save Audit to MySQL';
                saveBtn.disabled = false;
            }
        }
    }

    function setCounter(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function applyFiltersAndRender() {
        if (!activeReport || !activeReport.issues) return;

        let issues = [...activeReport.issues];

        // 1. Filter by Category
        if (currentCategory !== 'ALL') {
            issues = issues.filter(iss => (iss.category || '').toUpperCase() === currentCategory);
        }

        // 2. Filter by Severity
        if (currentSeverity !== 'ALL') {
            issues = issues.filter(iss => (iss.severity || '').toUpperCase() === currentSeverity);
        }

        // 3. Search query filter
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            issues = issues.filter(iss => 
                (iss.message || '').toLowerCase().includes(q) ||
                (iss.ruleId || '').toLowerCase().includes(q) ||
                (iss.element || '').toLowerCase().includes(q) ||
                (iss.explanation || '').toLowerCase().includes(q) ||
                (iss.wcag || '').toLowerCase().includes(q)
            );
        }

        // 4. Sort
        const severityRank = { 'CRITICAL': 1, 'ERROR': 2, 'WARNING': 3, 'INFO': 4, 'PASS': 5 };
        if (currentSort === 'severity') {
            issues.sort((a, b) => {
                const rankA = severityRank[(a.severity || '').toUpperCase()] || 99;
                const rankB = severityRank[(b.severity || '').toUpperCase()] || 99;
                return rankA - rankB;
            });
        } else if (currentSort === 'category') {
            issues.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        }
        // 'dom' maintains original detection order

        filteredIssues = issues;
        renderIssuesFeed(issues);
    }

    function renderIssuesFeed(issues) {
        const feedContainer = document.getElementById('issues-feed');
        const countDisplay = document.getElementById('filtered-count-display');
        if (!feedContainer) return;

        if (countDisplay) {
            countDisplay.textContent = `Showing ${issues.length} of ${activeReport.issues.length} evaluated items`;
        }

        if (issues.length === 0) {
            feedContainer.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-state-icon">&#128269;</div>
                    <h3>No matching issues found</h3>
                    <p>Try adjusting your category filter, severity selection, or search keywords.</p>
                </div>
            `;
            return;
        }

        const cardsHTML = issues.map((issue, idx) => {
            const sev = (issue.severity || 'INFO').toUpperCase();
            const sevClass = `sev-${sev.toLowerCase()}`;
            const badgeClass = `badge-${sev.toLowerCase()}`;

            const escapedElement = A11yUtils.escapeHTML(issue.element || '');
            const hasFixComparison = issue.currentCode && issue.recommendedCode && issue.currentCode !== issue.recommendedCode;

            return `
                <article class="issue-card ${sevClass}" data-index="${idx}">
                    <div class="issue-header">
                        <div>
                            <div class="issue-meta-tags">
                                <span class="badge ${badgeClass}">${sev}</span>
                                <span class="issue-rule-id">${issue.ruleId || ''}</span>
                                <span class="badge" style="background: rgba(255,255,255,0.05); color: #cbd5e1;">${issue.category || 'General'}</span>
                                ${issue.wcag ? `<span class="issue-wcag-badge">WCAG ${issue.wcag}</span>` : ''}
                            </div>
                            <h3 class="issue-title">${A11yUtils.escapeHTML(issue.message || '')}</h3>
                        </div>
                        <button type="button" class="btn btn-outline btn-sm btn-inspect-element" data-index="${idx}" aria-label="Inspect element code">
                            &lt;/&gt; View Element
                        </button>
                    </div>

                    ${issue.element && issue.element !== 'N/A' ? `
                        <div class="issue-section-label">Affected Element</div>
                        <div class="issue-code-box"><code>${escapedElement}</code></div>
                    ` : ''}

                    <div class="issue-section-label">Why this matters</div>
                    <p class="issue-explanation">${A11yUtils.escapeHTML(issue.explanation || '')}</p>

                    ${hasFixComparison ? `
                        <div class="issue-section-label">Before / After Recommended Fix</div>
                        <div class="fix-comparison-grid">
                            <div class="fix-box box-current">
                                <div class="fix-box-title">Current HTML</div>
                                <div class="code-block">${A11yUtils.escapeHTML(issue.currentCode)}</div>
                            </div>
                            <div class="fix-box box-recommended">
                                <div class="fix-box-title">Recommended Accessible Fix</div>
                                <div class="code-block">${A11yUtils.escapeHTML(issue.recommendedCode)}</div>
                            </div>
                        </div>
                    ` : `
                        <div class="issue-section-label">Recommended Action</div>
                        <p class="issue-explanation" style="color: #6ee7b7;">${A11yUtils.escapeHTML(issue.recommendation || '')}</p>
                    `}
                </article>
            `;
        }).join('');

        feedContainer.innerHTML = cardsHTML;

        // Attach inspect element listeners
        feedContainer.querySelectorAll('.btn-inspect-element').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                openInspectModal(filteredIssues[idx]);
            });
        });
    }

    function openInspectModal(issue) {
        if (!issue) return;
        const modal = document.getElementById('inspect-modal');
        const modalTitle = document.getElementById('modal-issue-title');
        const modalCode = document.getElementById('modal-code-display');
        const modalFix = document.getElementById('modal-recommended-fix');
        const modalRule = document.getElementById('modal-rule-info');

        if (!modal) return;

        if (modalTitle) modalTitle.textContent = issue.message;
        if (modalRule) modalRule.textContent = `Rule: ${issue.ruleId} | Category: ${issue.category} | WCAG: ${issue.wcag || 'N/A'}`;

        if (modalCode) {
            const rawElement = issue.element || '';
            const highlightTarget = issue.highlightTarget || '';
            modalCode.innerHTML = A11yUtils.highlightCode(rawElement, highlightTarget);
        }

        if (modalFix) {
            modalFix.textContent = issue.recommendation || 'No automated fix specified.';
        }

        modal.style.display = 'flex';
        modal.focus();
    }

    function closeInspectModal() {
        const modal = document.getElementById('inspect-modal');
        if (modal) modal.style.display = 'none';
    }

    function setupEventListeners() {
        // Category Chips
        const chips = document.querySelectorAll('.category-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentCategory = (chip.getAttribute('data-category') || 'ALL').toUpperCase();
                applyFiltersAndRender();
            });
        });

        // Severity Counter Tile Filters
        const counterTiles = document.querySelectorAll('.counter-tile');
        counterTiles.forEach(tile => {
            tile.addEventListener('click', () => {
                const sev = (tile.getAttribute('data-severity') || '').toUpperCase();
                if (currentSeverity === sev) {
                    currentSeverity = 'ALL';
                    tile.classList.remove('active-filter');
                } else {
                    counterTiles.forEach(t => t.classList.remove('active-filter'));
                    tile.classList.add('active-filter');
                    currentSeverity = sev;
                }
                applyFiltersAndRender();
            });
        });

        // Search Input
        const searchInput = document.getElementById('issue-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                applyFiltersAndRender();
            });
        }

        // Sort Select
        const sortSelect = document.getElementById('issue-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                applyFiltersAndRender();
            });
        }

        // Save Audit to MySQL
        const saveBtn = document.getElementById('btn-save-audit');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                if (!A11yAuth.isAuthenticated()) {
                    if (confirm('Saving audit history to MySQL requires logging in. Would you like to log in now?')) {
                        window.location.href = 'login.html?redirect=report.html';
                    }
                    return;
                }

                try {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '&#9203; Saving to MySQL...';

                    const resp = await A11yAPI.saveAudit(activeReport);
                    activeReport.isSaved = true;
                    activeReport.id = resp.audit_id;
                    A11yAuditor.setCurrentReport(activeReport);

                    saveBtn.innerHTML = '&#10003; Saved in MySQL';
                    saveBtn.classList.remove('btn-primary');
                    saveBtn.classList.add('btn-secondary');
                    alert('Audit report successfully saved to MySQL database!');
                } catch (err) {
                    console.error('Failed to save audit:', err);
                    alert('Error saving audit: ' + err.message);
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '&#128190; Save Audit to MySQL';
                }
            });
        }

        // Print Report
        const printBtn = document.getElementById('btn-print-report');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        // Modal Close Buttons
        const closeModalBtn = document.getElementById('btn-close-modal');
        const modalCloseIcon = document.getElementById('modal-close-icon');
        const modal = document.getElementById('inspect-modal');

        if (closeModalBtn) closeModalBtn.addEventListener('click', closeInspectModal);
        if (modalCloseIcon) modalCloseIcon.addEventListener('click', closeInspectModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeInspectModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
                closeInspectModal();
            }
        });
    }
})();
