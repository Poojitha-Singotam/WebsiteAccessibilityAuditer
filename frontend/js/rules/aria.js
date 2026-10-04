/**
 * Rule Category: ARIA
 * Safe, focused ARIA analysis: empty aria-labels, aria-hidden on focusable elements,
 * custom button keyboard accessibility, and redundant or invalid roles.
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    const VALID_ARIA_ROLES = new Set([
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
        'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog',
        'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group',
        'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee',
        'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'navigation',
        'none', 'note', 'option', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region',
        'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
        'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term',
        'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ]);

    window.A11yRules.aria = {
        name: 'ARIA',
        category: 'ARIA',

        analyze(doc, rawHtml) {
            const results = [];
            const elementsWithAria = doc.querySelectorAll('[aria-label], [aria-labelledby], [aria-hidden], [role]');

            if (elementsWithAria.length === 0) {
                results.push({
                    ruleId: 'ARIA_NONE',
                    category: 'ARIA',
                    severity: 'PASS',
                    message: 'Native semantic HTML elements used without custom ARIA overrides',
                    element: 'N/A',
                    explanation: 'First rule of ARIA: If you can use a native HTML element with the semantics and behavior you need, do so instead of re-purposing an element and adding ARIA.',
                    recommendation: 'Prioritize native semantic HTML elements over custom ARIA widgets.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '4.1.2 Name, Role, Value'
                });
                return results;
            }

            // 1. Check aria-hidden="true" on focusable elements (CRITICAL)
            const focusableWithAriaHidden = doc.querySelectorAll('[aria-hidden="true"] a[href], [aria-hidden="true"] button, [aria-hidden="true"] input, [aria-hidden="true"] select, [aria-hidden="true"] textarea, a[href][aria-hidden="true"], button[aria-hidden="true"], input[aria-hidden="true"]');
            focusableWithAriaHidden.forEach(el => {
                const snippet = A11yUtils.getElementSnippet(el);
                results.push({
                    ruleId: 'ARIA_HIDDEN_FOCUS',
                    category: 'ARIA',
                    severity: 'CRITICAL',
                    message: 'Interactive focusable element is marked with aria-hidden="true"',
                    element: snippet,
                    explanation: 'Marking an interactive focusable element with aria-hidden="true" hides it from screen readers, while keyboard users still land on it. This creates a confusing invisible focus trap.',
                    recommendation: 'Remove aria-hidden="true", or add tabindex="-1" and inert if the element should truly be disabled.',
                    currentCode: snippet,
                    recommendedCode: snippet.replace('aria-hidden="true"', ''),
                    highlightTarget: 'aria-hidden="true"',
                    wcag: '4.1.2 Name, Role, Value'
                });
            });

            // 2. Check empty aria-label=""
            const emptyAriaLabels = doc.querySelectorAll('[aria-label=""], [aria-label="   "]');
            emptyAriaLabels.forEach(el => {
                const snippet = A11yUtils.getElementSnippet(el);
                results.push({
                    ruleId: 'ARIA_LABEL_EMPTY',
                    category: 'ARIA',
                    severity: 'ERROR',
                    message: 'Element has an empty aria-label attribute',
                    element: snippet,
                    explanation: 'An empty aria-label can wipe out an element\'s accessible name or confuse screen readers.',
                    recommendation: 'Provide meaningful descriptive text in the aria-label or remove the attribute.',
                    currentCode: snippet,
                    recommendedCode: snippet.replace('aria-label=""', 'aria-label="Descriptive Label"'),
                    highlightTarget: 'aria-label=""',
                    wcag: '4.1.2 Name, Role, Value'
                });
            });

            // 3. Check role="button" without tabindex="0"
            const customButtons = doc.querySelectorAll('[role="button"]:not(button):not(input[type="button"]):not(input[type="submit"])');
            customButtons.forEach(btn => {
                const snippet = A11yUtils.getElementSnippet(btn);
                const tabindex = btn.getAttribute('tabindex');

                if (tabindex === null || tabindex === undefined) {
                    results.push({
                        ruleId: 'ARIA_ROLE_BTN_TABINDEX',
                        category: 'ARIA',
                        severity: 'WARNING',
                        message: 'Custom element with role="button" is missing tabindex="0"',
                        element: snippet,
                        explanation: 'Custom elements styled as buttons cannot be reached via the Tab key by keyboard users unless tabindex="0" is specified.',
                        recommendation: 'Add tabindex="0" and keyboard event handlers (Enter/Space), or preferably replace with a native <button> element.',
                        currentCode: snippet,
                        recommendedCode: `<button type="button"${snippet.slice(4)}`,
                        highlightTarget: 'role="button"',
                        wcag: '2.1.1 Keyboard'
                    });
                }
            });

            // 4. Check for invalid or redundant roles
            const elementsWithRole = doc.querySelectorAll('[role]');
            elementsWithRole.forEach(el => {
                const role = (el.getAttribute('role') || '').trim().toLowerCase();
                const tag = el.tagName.toLowerCase();
                const snippet = A11yUtils.getElementSnippet(el);

                if (!VALID_ARIA_ROLES.has(role)) {
                    results.push({
                        ruleId: 'ARIA_ROLE_INVALID',
                        category: 'ARIA',
                        severity: 'ERROR',
                        message: `Element specifies unrecognized ARIA role "${role}"`,
                        element: snippet,
                        explanation: 'Assistive technologies will ignore or misinterpret invalid or misspelled ARIA roles.',
                        recommendation: 'Use a recognized W3C WAI-ARIA role.',
                        currentCode: snippet,
                        recommendedCode: snippet.replace(`role="${role}"`, ''),
                        highlightTarget: `role="${role}"`,
                        wcag: '4.1.2 Name, Role, Value'
                    });
                    return;
                }

                // Redundant native roles
                const isRedundant = (tag === 'button' && role === 'button') ||
                                   (tag === 'nav' && role === 'navigation') ||
                                   (tag === 'a' && el.hasAttribute('href') && role === 'link');

                if (isRedundant) {
                    results.push({
                        ruleId: 'ARIA_ROLE_REDUNDANT',
                        category: 'ARIA',
                        severity: 'INFO',
                        message: `Redundant ARIA role="${role}" on native <${tag}> element`,
                        element: snippet,
                        explanation: `Native HTML <${tag}> already provides implicit semantic role of "${role}". Redundant ARIA roles add unnecessary code complexity.`,
                        recommendation: `Remove role="${role}" and rely on the native HTML element.`,
                        currentCode: snippet,
                        recommendedCode: snippet.replace(`role="${role}"`, '').replace(/\s{2,}/g, ' '),
                        highlightTarget: `role="${role}"`,
                        wcag: '4.1.2 Name, Role, Value'
                    });
                }
            });

            // 5. Valid ARIA usage note
            if (results.filter(r => r.severity === 'CRITICAL' || r.severity === 'ERROR').length === 0) {
                results.push({
                    ruleId: 'ARIA_PASS',
                    category: 'ARIA',
                    severity: 'PASS',
                    message: 'ARIA attributes comply with accessible naming and role conventions',
                    element: `${elementsWithAria.length} ARIA attributes evaluated`,
                    explanation: 'ARIA attributes present in the document follow supported usage patterns.',
                    recommendation: 'Maintain accessible ARIA implementation.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '4.1.2 Name, Role, Value'
                });
            }

            return results;
        }
    };
})();
