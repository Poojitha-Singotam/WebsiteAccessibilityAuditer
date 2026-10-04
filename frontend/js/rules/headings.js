/**
 * Rule Category: Headings
 * Checks for H1 presence, multiple H1 warnings, empty headings, and heading level jumps.
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    window.A11yRules.headings = {
        name: 'Headings',
        category: 'Headings',

        analyze(doc, rawHtml) {
            const results = [];
            const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));

            // 1. Check for presence of H1
            const h1Elements = doc.querySelectorAll('h1');
            if (h1Elements.length === 0) {
                results.push({
                    ruleId: 'HEAD_H1_001',
                    category: 'Headings',
                    severity: 'ERROR',
                    message: 'Page is missing a top-level <h1> heading',
                    element: 'N/A',
                    explanation: 'A page should have an <h1> element to serve as the main title and starting point for screen reader document navigation.',
                    recommendation: 'Add a single <h1> heading representing the main subject of the page.',
                    currentCode: '<body>\n  <!-- Missing <h1> -->',
                    recommendedCode: '<body>\n  <h1>Main Page Heading</h1>',
                    highlightTarget: '<body>',
                    wcag: '1.3.1 Info and Relationships'
                });
            } else if (h1Elements.length > 1) {
                results.push({
                    ruleId: 'HEAD_H1_MULTI',
                    category: 'Headings',
                    severity: 'WARNING',
                    message: `Document contains ${h1Elements.length} <h1> headings`,
                    element: A11yUtils.getElementSnippet(h1Elements[1]),
                    explanation: 'While HTML5 permits multiple <h1> elements in sectioning roots, WCAG best practice recommends a single main <h1> per page for clearer navigation.',
                    recommendation: 'Consider reserving <h1> for the primary page title and using <h2> for major sections.',
                    currentCode: A11yUtils.getElementSnippet(h1Elements[1]),
                    recommendedCode: A11yUtils.getElementSnippet(h1Elements[1]).replace(/<h1/g, '<h2').replace(/<\/h1>/g, '</h2>'),
                    highlightTarget: '<h1',
                    wcag: '1.3.1 Info and Relationships'
                });
            } else {
                results.push({
                    ruleId: 'HEAD_H1_PASS',
                    category: 'Headings',
                    severity: 'PASS',
                    message: 'Page includes a single top-level <h1> heading',
                    element: A11yUtils.getElementSnippet(h1Elements[0]),
                    explanation: 'The page correctly defines one main <h1> heading.',
                    recommendation: 'Maintain a single descriptive <h1>.',
                    currentCode: A11yUtils.getElementSnippet(h1Elements[0]),
                    recommendedCode: A11yUtils.getElementSnippet(h1Elements[0]),
                    wcag: '1.3.1 Info and Relationships'
                });
            }

            // 2. Check for empty headings & heading jumps
            let prevLevel = 0;
            let hasJump = false;

            headings.forEach(h => {
                const tag = h.tagName.toLowerCase();
                const level = parseInt(tag.charAt(1), 10);
                const text = (h.textContent || '').trim();
                const snippet = A11yUtils.getElementSnippet(h);

                // Check for empty heading
                const hasImgAlt = h.querySelector('img[alt]:not([alt=""])');
                const hasAria = h.getAttribute('aria-label');
                if (!text && !hasImgAlt && !hasAria) {
                    results.push({
                        ruleId: 'HEAD_EMPTY_001',
                        category: 'Headings',
                        severity: 'ERROR',
                        message: `Heading <${tag}> is empty or contains no accessible text`,
                        element: snippet,
                        explanation: 'Empty headings create blank navigational stops for screen reader users browsing headings.',
                        recommendation: 'Provide meaningful text content inside the heading or remove the empty tag.',
                        currentCode: snippet,
                        recommendedCode: `<${tag}>Section Title</${tag}>`,
                        highlightTarget: snippet,
                        wcag: '1.3.1 Info and Relationships'
                    });
                    return;
                }

                // Check for heading level jump (e.g. 1 -> 3 or 2 -> 4)
                if (prevLevel > 0 && level > prevLevel + 1) {
                    hasJump = true;
                    results.push({
                        ruleId: 'HEAD_JUMP_001',
                        category: 'Headings',
                        severity: 'WARNING',
                        message: `Heading level jumps from <h${prevLevel}> directly to <h${level}>`,
                        element: snippet,
                        explanation: `Heading levels should increase sequentially by 1 (e.g., h1 to h2 to h3). Jumping from <h${prevLevel}> to <h${level}> breaks document outline hierarchy.`,
                        recommendation: `Change the heading to <h${prevLevel + 1}> or insert an intermediate heading.`,
                        currentCode: snippet,
                        recommendedCode: snippet.replace(new RegExp(`<h${level}`, 'g'), `<h${prevLevel + 1}`).replace(new RegExp(`</h${level}>`, 'g'), `</h${prevLevel + 1}>`),
                        highlightTarget: `<h${level}`,
                        wcag: '1.3.1 Info and Relationships'
                    });
                }

                prevLevel = level;
            });

            if (!hasJump && headings.length > 1) {
                results.push({
                    ruleId: 'HEAD_ORDER_PASS',
                    category: 'Headings',
                    severity: 'PASS',
                    message: 'Heading hierarchy follows logical sequential order without skips',
                    element: `${headings.length} headings evaluated`,
                    explanation: 'Heading levels progress in a logical hierarchy without skipped levels.',
                    recommendation: 'Continue using sequential heading levels.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '1.3.1 Info and Relationships'
                });
            }

            return results;
        }
    };
})();
