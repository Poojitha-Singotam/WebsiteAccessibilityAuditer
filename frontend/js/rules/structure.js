/**
 * Rule Category: Structure & Landmarks
 * Checks for main, header, nav, footer landmarks and semantic structural hierarchy.
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    window.A11yRules.structure = {
        name: 'Structure',
        category: 'Structure',

        analyze(doc, rawHtml) {
            const results = [];
            const mains = doc.querySelectorAll('main, [role="main"]');
            const headers = doc.querySelectorAll('header, [role="banner"]');
            const navs = doc.querySelectorAll('nav, [role="navigation"]');
            const footers = doc.querySelectorAll('footer, [role="contentinfo"]');

            // 1. Check Main Landmark
            if (mains.length === 0) {
                results.push({
                    ruleId: 'STRUCT_MAIN_001',
                    category: 'Structure',
                    severity: 'WARNING',
                    message: 'Page is missing a <main> landmark',
                    element: '<body>',
                    explanation: 'The <main> element acts as the primary landmark for screen reader users to quickly bypass repetitive navigation and jump directly to page content.',
                    recommendation: 'Wrap the primary central content area of the page in a <main> element.',
                    currentCode: '<body>\n  <div>...content...</div>\n</body>',
                    recommendedCode: '<body>\n  <main id="main-content">\n    ...content...\n  </main>\n</body>',
                    highlightTarget: '<body>',
                    wcag: '1.3.1 Info and Relationships'
                });
            } else if (mains.length > 1) {
                results.push({
                    ruleId: 'STRUCT_MAIN_MULTI',
                    category: 'Structure',
                    severity: 'WARNING',
                    message: `Document contains ${mains.length} visible main landmarks`,
                    element: A11yUtils.getElementSnippet(mains[1]),
                    explanation: 'A document should contain only one visible <main> landmark at a time to prevent conflicting primary landmark navigation.',
                    recommendation: 'Ensure only one <main> tag is active and visible per page, or use <section> for secondary areas.',
                    currentCode: A11yUtils.getElementSnippet(mains[1]),
                    recommendedCode: A11yUtils.getElementSnippet(mains[1]).replace(/<main/g, '<section').replace(/<\/main>/g, '</section>'),
                    highlightTarget: '<main',
                    wcag: '1.3.1 Info and Relationships'
                });
            } else {
                results.push({
                    ruleId: 'STRUCT_MAIN_PASS',
                    category: 'Structure',
                    severity: 'PASS',
                    message: 'Page contains a single well-defined <main> landmark',
                    element: A11yUtils.getElementSnippet(mains[0]),
                    explanation: 'The primary content landmark is properly established.',
                    recommendation: 'Ensure all primary content stays inside <main>.',
                    currentCode: A11yUtils.getElementSnippet(mains[0]),
                    recommendedCode: A11yUtils.getElementSnippet(mains[0]),
                    wcag: '1.3.1 Info and Relationships'
                });
            }

            // 2. Check Multiple Navigation Landmark Labels
            if (navs.length > 1) {
                const unlabeledNavs = Array.from(navs).filter(nav => !nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby'));
                if (unlabeledNavs.length > 0) {
                    results.push({
                        ruleId: 'STRUCT_NAV_LABEL',
                        category: 'Structure',
                        severity: 'INFO',
                        message: 'Multiple <nav> landmarks exist without distinguishing aria-label attributes',
                        element: A11yUtils.getElementSnippet(unlabeledNavs[0]),
                        explanation: 'When multiple navigation landmarks exist (e.g. main navigation vs. footer navigation), screen readers announce each simply as "navigation" unless differentiated by an aria-label.',
                        recommendation: 'Add aria-label="Main" and aria-label="Footer" or similar labels to clarify navigation roles.',
                        currentCode: A11yUtils.getElementSnippet(unlabeledNavs[0]),
                        recommendedCode: A11yUtils.getElementSnippet(unlabeledNavs[0]).replace('<nav', '<nav aria-label="Main Navigation"'),
                        highlightTarget: '<nav',
                        wcag: '1.3.1 Info and Relationships'
                    });
                }
            }

            // 3. General Semantic Structure Check
            const hasSemanticLandmarks = (headers.length > 0 || mains.length > 0 || footers.length > 0);
            if (hasSemanticLandmarks) {
                results.push({
                    ruleId: 'STRUCT_LANDMARKS_PASS',
                    category: 'Structure',
                    severity: 'PASS',
                    message: 'Document uses semantic landmarks (header, nav, main, or footer)',
                    element: `Landmarks: ${headers.length} header(s), ${navs.length} nav(s), ${mains.length} main(s), ${footers.length} footer(s)`,
                    explanation: 'Semantic landmark elements provide a clear structural skeleton for assistive technology navigation.',
                    recommendation: 'Maintain semantic landmark tags across pages.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '1.3.1 Info and Relationships'
                });
            }

            return results;
        }
    };
})();
