/**
 * Rule Category: Links
 * Checks for empty links, links without accessible names, and generic ambiguous text ("click here", "read more").
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    window.A11yRules.links = {
        name: 'Links',
        category: 'Links',

        analyze(doc, rawHtml) {
            const results = [];
            const links = doc.querySelectorAll('a[href]');

            if (links.length === 0) {
                results.push({
                    ruleId: 'LINK_NONE',
                    category: 'Links',
                    severity: 'PASS',
                    message: 'No hyperlink anchors found requiring link verification',
                    element: 'N/A',
                    explanation: 'The analyzed document contains no <a> elements with href attributes.',
                    recommendation: 'Ensure future links contain descriptive text.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '2.4.4 Link Purpose (In Context)'
                });
                return results;
            }

            const genericPhrases = [
                'click here', 'click this', 'here', 'read more', 'learn more', 
                'more', 'link', 'go', 'view', 'details', 'continue', 'this link'
            ];

            links.forEach(link => {
                const snippet = A11yUtils.getElementSnippet(link);
                const href = link.getAttribute('href') || '';
                const text = (link.textContent || '').trim();
                const ariaLabel = (link.getAttribute('aria-label') || '').trim();
                const ariaLabelledby = link.getAttribute('aria-labelledby');
                const title = (link.getAttribute('title') || '').trim();
                const imgAlt = link.querySelector('img[alt]:not([alt=""])');
                const svgTitle = link.querySelector('svg title');

                // Determine effective accessible name
                let accessibleName = text || ariaLabel || title || (imgAlt ? imgAlt.getAttribute('alt') : '') || (svgTitle ? svgTitle.textContent.trim() : '');
                if (ariaLabelledby) {
                    const el = doc.getElementById(ariaLabelledby);
                    if (el && el.textContent.trim()) {
                        accessibleName = el.textContent.trim();
                    }
                }

                // Check 1: Empty link with no accessible name
                if (!accessibleName) {
                    results.push({
                        ruleId: 'LINK_EMPTY_001',
                        category: 'Links',
                        severity: 'ERROR',
                        message: 'Link (<a>) is empty and contains no accessible text or image alt',
                        element: snippet,
                        explanation: 'Screen readers identify links from their text or label. An empty link provides no indication of where it leads.',
                        recommendation: 'Add clear, descriptive link text or provide an aria-label attribute.',
                        currentCode: snippet,
                        recommendedCode: `<a href="${href || '#'}">Descriptive Link Destination</a>`,
                        highlightTarget: '<a',
                        wcag: '2.4.4 Link Purpose (In Context)'
                    });
                    return;
                }

                // Check 2: Generic / Ambiguous link text
                const lowerName = accessibleName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
                if (genericPhrases.includes(lowerName)) {
                    results.push({
                        ruleId: 'LINK_GENERIC_001',
                        category: 'Links',
                        severity: 'WARNING',
                        message: `Link text "${accessibleName}" is ambiguous when read out of context`,
                        element: snippet,
                        explanation: 'Screen reader users often browse a list of all links on a page. Phrases like "click here" or "read more" fail to explain the destination.',
                        recommendation: 'Replace generic phrases with text describing the specific destination or topic.',
                        currentCode: snippet,
                        recommendedCode: snippet.replace(`>${text}<`, `>Read our detailed documentation<`),
                        highlightTarget: text,
                        wcag: '2.4.4 Link Purpose (In Context)'
                    });
                    return;
                }

                // Check 3: target="_blank" without security/accessibility notice
                const target = link.getAttribute('target');
                const rel = link.getAttribute('rel') || '';
                if (target === '_blank') {
                    const hasNoopener = rel.includes('noopener') || rel.includes('noreferrer');
                    const announcesNewTab = accessibleName.toLowerCase().includes('opens in a new window') || 
                                           accessibleName.toLowerCase().includes('new tab') ||
                                           link.querySelector('.sr-only');

                    if (!hasNoopener || !announcesNewTab) {
                        results.push({
                            ruleId: 'LINK_TARGET_BLANK',
                            category: 'Links',
                            severity: 'INFO',
                            message: 'Link opens in a new tab without explicit notice to screen reader users',
                            element: snippet,
                            explanation: 'Opening links in a new window unexpectedly can disorient users. It is best practice to notify users and include rel="noopener".',
                            recommendation: 'Add rel="noopener noreferrer" and append an audible notice such as "(opens in new tab)".',
                            currentCode: snippet,
                            recommendedCode: snippet.replace('target="_blank"', 'target="_blank" rel="noopener noreferrer" aria-label="' + accessibleName + ' (opens in a new tab)"'),
                            highlightTarget: 'target="_blank"',
                            wcag: '3.2.5 Change on Request'
                        });
                        return;
                    }
                }

                // Check 4: Valid link
                results.push({
                    ruleId: 'LINK_VALID',
                    category: 'Links',
                    severity: 'PASS',
                    message: 'Link has descriptive and meaningful accessible text',
                    element: snippet,
                    explanation: `Link clearly announces destination: "${accessibleName}".`,
                    recommendation: 'Maintain meaningful link texts.',
                    currentCode: snippet,
                    recommendedCode: snippet,
                    wcag: '2.4.4 Link Purpose (In Context)'
                });
            });

            return results;
        }
    };
})();
