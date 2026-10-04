/**
 * Web Accessibility Auditor - History Page Controller
 * Fetches and displays persistent audit history from MySQL,
 * allows reopening audits and deleting past records.
 */

document.addEventListener('DOMContentLoaded', async () => {
    A11yAuth.requireAuth();
    await loadAuditHistory();
});

async function loadAuditHistory() {
    const tableBody = document.getElementById('history-table-body');
    const loadingState = document.getElementById('history-loading');
    const emptyState = document.getElementById('history-empty');
    const tableWrapper = document.getElementById('history-table-wrapper');

    if (loadingState) loadingState.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (tableWrapper) tableWrapper.style.display = 'none';

    try {
        const resp = await A11yAPI.getAudits();
        const audits = resp.audits || [];

        if (loadingState) loadingState.style.display = 'none';

        if (audits.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (tableWrapper) tableWrapper.style.display = 'block';
        if (tableBody) {
            tableBody.innerHTML = audits.map(audit => {
                const score = audit.score || 0;
                let scoreClass = 'poor';
                if (score >= 90) scoreClass = 'excellent';
                else if (score >= 75) scoreClass = 'good';
                else if (score >= 50) scoreClass = 'warning';

                return `
                    <tr id="audit-row-${audit.id}">
                        <td>
                            <strong style="color: #f8fafc;">${A11yUtils.escapeHTML(audit.page_name)}</strong>
                        </td>
                        <td>
                            <span class="score-pill ${scoreClass}">${score}</span>
                        </td>
                        <td>
                            <div class="issue-counts-compact">
                                <span class="badge badge-critical" title="Critical Issues">${audit.critical_count || 0}</span>
                                <span class="badge badge-error" title="Errors">${audit.error_count || 0}</span>
                                <span class="badge badge-warning" title="Warnings">${audit.warning_count || 0}</span>
                            </div>
                        </td>
                        <td>${A11yUtils.formatDate(audit.created_at)}</td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <a href="report.html?id=${audit.id}" class="btn btn-outline btn-sm" aria-label="View Report for ${A11yUtils.escapeHTML(audit.page_name)}">
                                    View Report
                                </a>
                                <button type="button" class="btn btn-danger btn-sm btn-delete-audit" data-id="${audit.id}" data-name="${A11yUtils.escapeHTML(audit.page_name)}" aria-label="Delete audit for ${A11yUtils.escapeHTML(audit.page_name)}">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Attach delete listeners
            tableBody.querySelectorAll('.btn-delete-audit').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const name = btn.getAttribute('data-name');
                    if (confirm(`Are you sure you want to permanently delete the audit record for "${name}"?`)) {
                        try {
                            btn.disabled = true;
                            btn.textContent = 'Deleting...';
                            await A11yAPI.deleteAudit(id);
                            const row = document.getElementById(`audit-row-${id}`);
                            if (row) row.remove();

                            // If no rows remain, show empty state
                            if (tableBody.children.length === 0) {
                                tableWrapper.style.display = 'none';
                                emptyState.style.display = 'block';
                            }
                        } catch (err) {
                            alert('Failed to delete audit: ' + err.message);
                            btn.disabled = false;
                            btn.textContent = 'Delete';
                        }
                    }
                });
            });
        }
    } catch (err) {
        console.error('Failed to load audit history:', err);
        if (loadingState) loadingState.style.display = 'none';
        alert('Could not load audit history: ' + err.message);
    }
}
