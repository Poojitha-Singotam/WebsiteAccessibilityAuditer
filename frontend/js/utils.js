/**
 * Web Accessibility Auditor - Utility Functions
 * Safe DOM parsing, code snippet sanitization, and score helpers.
 */

const A11yUtils = {
    /**
     * Parse HTML string safely into a DOM Document without script execution.
     * DOMParser does NOT execute <script> tags or inline event handlers when parsed.
     */
    parseHTML(htmlString) {
        if (!htmlString || typeof htmlString !== 'string') {
            htmlString = '';
        }
        const parser = new DOMParser();
        return parser.parseFromString(htmlString, 'text/html');
    },

    /**
     * Escape HTML characters for safe UI rendering.
     */
    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Clean element snippet for display.
     * Truncates huge elements while preserving the essential tag and attributes.
     */
    getElementSnippet(element, maxLen = 160) {
        if (!element) return '';
        if (typeof element === 'string') return element;

        try {
            // Clone without deep children to avoid huge trees
            const clone = element.cloneNode(false);
            let snippet = clone.outerHTML || '';
            
            // If it's a self-closing or empty representation, check if original has text
            const textPreview = (element.textContent || '').trim().slice(0, 40);
            if (element.children.length === 0 && textPreview) {
                const tag = element.tagName.toLowerCase();
                const opening = snippet.replace(new RegExp(`</${tag}>$`), '');
                snippet = `${opening}${textPreview}</${tag}>`;
            }

            if (snippet.length > maxLen) {
                snippet = snippet.substring(0, maxLen) + '...>';
            }
            return snippet;
        } catch (e) {
            return `<${element.tagName ? element.tagName.toLowerCase() : 'element'}>`;
        }
    },

    /**
     * Calculate accessibility score based on issue counts and severity deductions.
     * Weights: CRITICAL = 15, ERROR = 8, WARNING = 3, INFO = 1
     */
    calculateScore(summary) {
        const crit = summary.critical_count || 0;
        const err = summary.error_count || 0;
        const warn = summary.warning_count || 0;
        const info = summary.info_count || 0;

        const deductions = (crit * 15) + (err * 8) + (warn * 3) + (info * 1);
        const score = Math.max(0, 100 - deductions);
        return score;
    },

    /**
     * Return score health grade / tier
     */
    getScoreGrade(score) {
        if (score >= 90) return { label: 'Excellent', class: 'grade-excellent', color: '#10b981' };
        if (score >= 75) return { label: 'Good', class: 'grade-good', color: '#3b82f6' };
        if (score >= 50) return { label: 'Needs Improvement', class: 'grade-warning', color: '#f59e0b' };
        return { label: 'Poor / Inaccessible', class: 'grade-poor', color: '#ef4444' };
    },

    /**
     * Format a timestamp to readable date and time.
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    },

    /**
     * Highlight a substring or problematic attribute in code
     */
    highlightCode(codeSnippet, highlightTarget = '') {
        const escaped = this.escapeHTML(codeSnippet);
        if (!highlightTarget) return escaped;

        const escapedTarget = this.escapeHTML(highlightTarget);
        return escaped.split(escapedTarget).join(`<mark class="code-highlight">${escapedTarget}</mark>`);
    }
};

// Export to window
window.A11yUtils = A11yUtils;
