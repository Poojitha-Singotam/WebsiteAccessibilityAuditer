/**
 * Rule Category: Tables
 * Checks for table headers (th), scope attributes, empty header cells, and captions.
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    window.A11yRules.tables = {
        name: 'Tables',
        category: 'Tables',

        analyze(doc, rawHtml) {
            const results = [];
            const tables = doc.querySelectorAll('table');

            if (tables.length === 0) {
                results.push({
                    ruleId: 'TBL_NONE',
                    category: 'Tables',
                    severity: 'PASS',
                    message: 'No data table elements found requiring verification',
                    element: 'N/A',
                    explanation: 'The analyzed document contains no <table> elements.',
                    recommendation: 'Ensure future data tables include proper <th> headers.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '1.3.1 Info and Relationships'
                });
                return results;
            }

            tables.forEach(table => {
                const snippet = A11yUtils.getElementSnippet(table);
                const role = table.getAttribute('role');

                // If marked as presentation / layout table
                if (role === 'presentation' || role === 'none') {
                    results.push({
                        ruleId: 'TBL_ROLE_PRESENTATION',
                        category: 'Tables',
                        severity: 'INFO',
                        message: 'Table explicitly marked with role="presentation"',
                        element: snippet,
                        explanation: 'Tables used strictly for layout should avoid data semantics, though modern CSS Grid/Flexbox is preferred for layout.',
                        recommendation: 'Consider replacing layout tables with CSS Flexbox or CSS Grid.',
                        currentCode: snippet,
                        recommendedCode: '<div class="layout-grid">...</div>',
                        wcag: '1.3.1 Info and Relationships'
                    });
                    return;
                }

                const thCells = table.querySelectorAll('th');
                const caption = table.querySelector('caption');

                // Check 1: Missing <th> header cells
                if (thCells.length === 0) {
                    results.push({
                        ruleId: 'TBL_TH_001',
                        category: 'Tables',
                        severity: 'WARNING',
                        message: 'Data table does not contain proper header (<th>) cells',
                        element: snippet,
                        explanation: 'Tables presenting tabular data must designate header cells using <th> so screen reader users can understand row and column associations.',
                        recommendation: 'Replace header <td> cells in the first row or column with <th> elements.',
                        currentCode: snippet,
                        recommendedCode: '<table>\n  <thead>\n    <tr>\n      <th scope="col">Header 1</th>\n      <th scope="col">Header 2</th>\n    </tr>\n  </thead>\n  <tbody>...</tbody>\n</table>',
                        highlightTarget: '<table',
                        wcag: '1.3.1 Info and Relationships'
                    });
                } else {
                    // Check 2: Empty <th> cells
                    let emptyThFound = false;
                    thCells.forEach(th => {
                        const text = (th.textContent || '').trim();
                        const img = th.querySelector('img[alt]:not([alt=""])');
                        if (!text && !img && !emptyThFound) {
                            emptyThFound = true;
                            results.push({
                                ruleId: 'TBL_EMPTY_TH',
                                category: 'Tables',
                                severity: 'WARNING',
                                message: 'Table header (<th>) cell is empty or contains no accessible text',
                                element: A11yUtils.getElementSnippet(th),
                                explanation: 'An empty header cell will leave data cells in its column or row without a recognizable announced title.',
                                recommendation: 'Add descriptive text inside the <th> header cell.',
                                currentCode: A11yUtils.getElementSnippet(th),
                                recommendedCode: '<th scope="col">Column Title</th>',
                                highlightTarget: A11yUtils.getElementSnippet(th),
                                wcag: '1.3.1 Info and Relationships'
                            });
                        }
                    });

                    // Check 3: Scope attributes on <th> cells
                    const missingScope = Array.from(thCells).some(th => !th.hasAttribute('scope'));
                    if (missingScope) {
                        results.push({
                            ruleId: 'TBL_SCOPE_001',
                            category: 'Tables',
                            severity: 'INFO',
                            message: 'Table header cells (<th>) lack explicit "scope" attribute',
                            element: snippet,
                            explanation: 'Adding scope="col" for column headers and scope="row" for row headers clarifies directionality in data tables.',
                            recommendation: 'Add scope="col" or scope="row" to all <th> cells.',
                            currentCode: '<th>Header Title</th>',
                            recommendedCode: '<th scope="col">Header Title</th>',
                            highlightTarget: '<th',
                            wcag: '1.3.1 Info and Relationships'
                        });
                    }

                    // Check 4: Caption
                    if (!caption && !table.getAttribute('aria-label') && !table.getAttribute('aria-labelledby')) {
                        results.push({
                            ruleId: 'TBL_CAPTION_INFO',
                            category: 'Tables',
                            severity: 'INFO',
                            message: 'Data table does not include a <caption> or aria-label',
                            element: snippet,
                            explanation: 'A <caption> helps users quickly understand the purpose of the data table before navigating through its rows.',
                            recommendation: 'Add a <caption> element as the first child of the <table>.',
                            currentCode: snippet,
                            recommendedCode: '<table>\n  <caption>Summary of table data</caption>\n  ...',
                            highlightTarget: '<table',
                            wcag: '1.3.1 Info and Relationships'
                        });
                    }

                    if (!emptyThFound && !missingScope) {
                        results.push({
                            ruleId: 'TBL_VALID_PASS',
                            category: 'Tables',
                            severity: 'PASS',
                            message: 'Data table has properly structured header cells with scope attributes',
                            element: snippet,
                            explanation: 'The table follows accessibility best practices with header and scope definitions.',
                            recommendation: 'Maintain proper headers across all data tables.',
                            currentCode: snippet,
                            recommendedCode: snippet,
                            wcag: '1.3.1 Info and Relationships'
                        });
                    }
                }
            });

            return results;
        }
    };
})();
