/**
 * Rule Category: Buttons
 * Checks for empty buttons, icon-only buttons without accessible names, and input buttons.
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    window.A11yRules.buttons = {
        name: 'Buttons',
        category: 'Buttons',

        analyze(doc, rawHtml) {
            const results = [];
            const buttons = doc.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]');

            if (buttons.length === 0) {
                results.push({
                    ruleId: 'BTN_NONE',
                    category: 'Buttons',
                    severity: 'PASS',
                    message: 'No button elements found requiring verification',
                    element: 'N/A',
                    explanation: 'The analyzed document contains no <button> or input button elements.',
                    recommendation: 'Ensure future buttons have clear accessible names.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '4.1.2 Name, Role, Value'
                });
                return results;
            }

            buttons.forEach(btn => {
                const snippet = A11yUtils.getElementSnippet(btn);
                const tag = btn.tagName.toLowerCase();

                // 1. If it's an <input type="submit|button|reset">
                if (tag === 'input') {
                    const value = (btn.getAttribute('value') || '').trim();
                    const ariaLabel = (btn.getAttribute('aria-label') || '').trim();
                    const type = btn.getAttribute('type') || 'button';

                    if (!value && !ariaLabel) {
                        // Standard default values exist in browsers for submit/reset, but best practice is explicit
                        if (type === 'button') {
                            results.push({
                                ruleId: 'BTN_INPUT_EMPTY',
                                category: 'Buttons',
                                severity: 'ERROR',
                                message: 'Input button has no value or aria-label attribute',
                                element: snippet,
                                explanation: 'An <input type="button"> without a value attribute renders as an empty button with no accessible name.',
                                recommendation: 'Add a value="Button Action" attribute.',
                                currentCode: snippet,
                                recommendedCode: snippet.replace('type="button"', 'type="button" value="Perform Action"'),
                                highlightTarget: snippet,
                                wcag: '4.1.2 Name, Role, Value'
                            });
                            return;
                        }
                    }

                    results.push({
                        ruleId: 'BTN_INPUT_PASS',
                        category: 'Buttons',
                        severity: 'PASS',
                        message: `Input button has accessible label "${value || ariaLabel || type}"`,
                        element: snippet,
                        explanation: 'The input button control has an accessible text representation.',
                        recommendation: 'Ensure button label clearly identifies the action.',
                        currentCode: snippet,
                        recommendedCode: snippet,
                        wcag: '4.1.2 Name, Role, Value'
                    });
                    return;
                }

                // 2. It's a <button> element
                const text = (btn.textContent || '').trim();
                const ariaLabel = (btn.getAttribute('aria-label') || '').trim();
                const ariaLabelledby = btn.getAttribute('aria-labelledby');
                const title = (btn.getAttribute('title') || '').trim();
                const imgAlt = btn.querySelector('img[alt]:not([alt=""])');
                const svgTitle = btn.querySelector('svg title');

                let accessibleName = text || ariaLabel || title || (imgAlt ? imgAlt.getAttribute('alt') : '') || (svgTitle ? svgTitle.textContent.trim() : '');
                if (ariaLabelledby) {
                    const el = doc.getElementById(ariaLabelledby);
                    if (el && el.textContent.trim()) {
                        accessibleName = el.textContent.trim();
                    }
                }

                // Case A: Completely empty button or nested empty tags (<button></button>, <button><span></span></button>)
                if (!accessibleName) {
                    results.push({
                        ruleId: 'BTN_EMPTY_001',
                        category: 'Buttons',
                        severity: 'ERROR',
                        message: 'Button element is empty or has no discernible accessible name',
                        element: snippet,
                        explanation: 'Buttons without text or an accessible label are announced only as "button" by screen readers, with no explanation of their function.',
                        recommendation: 'Add visible text inside the button or provide an aria-label attribute describing the action.',
                        currentCode: snippet,
                        recommendedCode: `<button type="${btn.getAttribute('type') || 'button'}" aria-label="Perform Action">Action Name</button>`,
                        highlightTarget: snippet,
                        wcag: '4.1.2 Name, Role, Value'
                    });
                    return;
                }

                // Case B: Button contains only icon/symbols without aria-label
                const hasSvg = !!btn.querySelector('svg');
                const hasIconClass = !!btn.querySelector('[class*="icon"], [class*="fa-"], [class*="material-"]');
                const isShortSymbol = text.length <= 2 && !/[a-zA-Z0-9]{2,}/.test(text); // e.g. "X", "✕", "☰", "⚙"

                if ((hasSvg || hasIconClass || isShortSymbol) && !ariaLabel && !ariaLabelledby && !imgAlt && !svgTitle) {
                    results.push({
                        ruleId: 'BTN_ICON_NOLABEL',
                        category: 'Buttons',
                        severity: 'ERROR',
                        message: 'Icon-only button lacks an aria-label attribute',
                        element: snippet,
                        explanation: 'Buttons relying solely on icons or visual glyphs (such as "X" or a magnifying glass) must provide an aria-label for non-sighted users.',
                        recommendation: `Add aria-label="Close menu" (or the appropriate description) to the <button> tag.`,
                        currentCode: snippet,
                        recommendedCode: snippet.replace('<button', `<button aria-label="Descriptive action name"`),
                        highlightTarget: '<button',
                        wcag: '4.1.2 Name, Role, Value'
                    });
                    return;
                }

                // Case C: Accessible button passed
                results.push({
                    ruleId: 'BTN_NAME_PASS',
                    category: 'Buttons',
                    severity: 'PASS',
                    message: `Button has accessible name "${accessibleName}"`,
                    element: snippet,
                    explanation: `Button provides an accessible name: "${accessibleName}".`,
                    recommendation: 'Ensure button label clearly distinguishes its action.',
                    currentCode: snippet,
                    recommendedCode: snippet,
                    wcag: '4.1.2 Name, Role, Value'
                });
            });

            return results;
        }
    };
})();
