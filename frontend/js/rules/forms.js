/**
 * Rule Category: Forms
 * Checks for input labels, label association, empty labels, and autocomplete attributes.
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    window.A11yRules.forms = {
        name: 'Forms',
        category: 'Forms',

        analyze(doc, rawHtml) {
            const results = [];
            // Target input, textarea, select
            const controls = doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]), textarea, select');
            const allLabels = doc.querySelectorAll('label');

            // 1. Verify all <label for="..."> targets exist
            allLabels.forEach(label => {
                const forAttr = label.getAttribute('for');
                const labelText = (label.textContent || '').trim();
                const snippet = A11yUtils.getElementSnippet(label);

                // Check for empty label
                const hasImgWithAlt = label.querySelector('img[alt]:not([alt=""])');
                if (!labelText && !hasImgWithAlt && !label.getAttribute('aria-label')) {
                    results.push({
                        ruleId: 'FORM_LBL_EMPTY',
                        category: 'Forms',
                        severity: 'ERROR',
                        message: 'Form <label> element is empty or lacks accessible text',
                        element: snippet,
                        explanation: 'Empty label tags provide no meaningful description when assistive technology announces form fields.',
                        recommendation: 'Add concise, descriptive text inside the <label> element.',
                        currentCode: snippet,
                        recommendedCode: `<label for="${forAttr || 'control-id'}">Descriptive Label</label>`,
                        highlightTarget: snippet,
                        wcag: '1.3.1 Info and Relationships'
                    });
                    return;
                }

                if (forAttr) {
                    const targetEl = doc.getElementById(forAttr);
                    if (!targetEl) {
                        results.push({
                            ruleId: 'FORM_LBL_ORPHAN',
                            category: 'Forms',
                            severity: 'ERROR',
                            message: `Label 'for' attribute references non-existent ID "${forAttr}"`,
                            element: snippet,
                            explanation: 'When a label specifies a for attribute that matches no element ID, screen readers cannot connect the label to any input control.',
                            recommendation: `Ensure an input control has id="${forAttr}" or correct the label's for attribute.`,
                            currentCode: snippet,
                            recommendedCode: snippet,
                            highlightTarget: `for="${forAttr}"`,
                            wcag: '1.3.1 Info and Relationships'
                        });
                    }
                }
            });

            // 2. Check each form control for accessible label
            if (controls.length === 0) {
                results.push({
                    ruleId: 'FORM_NONE',
                    category: 'Forms',
                    severity: 'PASS',
                    message: 'No interactive form controls requiring labels found',
                    element: 'N/A',
                    explanation: 'The analyzed document has no interactive input, textarea, or select elements.',
                    recommendation: 'Ensure future form fields have associated labels.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '1.3.1 Info and Relationships'
                });
                return results;
            }

            controls.forEach(ctrl => {
                const snippet = A11yUtils.getElementSnippet(ctrl);
                const tag = ctrl.tagName.toLowerCase();
                const type = ctrl.getAttribute('type') || (tag === 'textarea' ? 'textarea' : tag === 'select' ? 'select' : 'text');
                const id = ctrl.getAttribute('id');
                const ariaLabel = ctrl.getAttribute('aria-label');
                const ariaLabelledby = ctrl.getAttribute('aria-labelledby');
                const title = ctrl.getAttribute('title');

                // Check 1: Explicit label via for="id"
                let hasExplicitLabel = false;
                if (id) {
                    const matchingLabel = doc.querySelector(`label[for="${id}"]`);
                    if (matchingLabel && (matchingLabel.textContent.trim() || matchingLabel.querySelector('img[alt]'))) {
                        hasExplicitLabel = true;
                    }
                }

                // Check 2: Wrapped in <label>
                const parentLabel = ctrl.closest('label');
                let hasWrappingLabel = false;
                if (parentLabel && (parentLabel.textContent.trim() || parentLabel.querySelector('img[alt]'))) {
                    hasWrappingLabel = true;
                }

                // Check 3: ARIA label
                const hasAriaLabel = !!(ariaLabel && ariaLabel.trim());
                let hasAriaLabelledby = false;
                if (ariaLabelledby) {
                    const ids = ariaLabelledby.split(/\s+/);
                    hasAriaLabelledby = ids.some(lblId => {
                        const el = doc.getElementById(lblId);
                        return el && el.textContent.trim();
                    });
                }

                const hasTitle = !!(title && title.trim());

                const isLabeled = hasExplicitLabel || hasWrappingLabel || hasAriaLabel || hasAriaLabelledby || hasTitle;

                if (!isLabeled) {
                    const suggestedId = id || `${type}-${Math.floor(Math.random() * 900 + 100)}`;
                    const labelText = type.charAt(0).toUpperCase() + type.slice(1);
                    results.push({
                        ruleId: 'FORM_LBL_001',
                        category: 'Forms',
                        severity: 'ERROR',
                        message: `Form control <${tag}> has no associated accessible label`,
                        element: snippet,
                        explanation: 'Form controls must have an associated <label>, aria-label, or aria-labelledby so screen reader users know what data is expected.',
                        recommendation: `Provide a <label for="${suggestedId}"> element or add an aria-label attribute.`,
                        currentCode: snippet,
                        recommendedCode: `<label for="${suggestedId}">${labelText}</label>\n` + (id ? snippet : snippet.replace(`<${tag}`, `<${tag} id="${suggestedId}"`)),
                        highlightTarget: `<${tag}`,
                        wcag: '1.3.1 Info and Relationships'
                    });
                } else {
                    results.push({
                        ruleId: 'FORM_LBL_PASS',
                        category: 'Forms',
                        severity: 'PASS',
                        message: `Form control <${tag}> has accessible label`,
                        element: snippet,
                        explanation: 'Control is correctly associated with an accessible label via for/id, nesting, or ARIA attribute.',
                        recommendation: 'Ensure label text accurately conveys the required input.',
                        currentCode: snippet,
                        recommendedCode: snippet,
                        wcag: '1.3.1 Info and Relationships'
                    });
                }

                // 3. Autocomplete opportunities for common inputs
                if (tag === 'input') {
                    const inputType = (ctrl.getAttribute('type') || 'text').toLowerCase();
                    const nameAttr = (ctrl.getAttribute('name') || '').toLowerCase();
                    const idAttr = (id || '').toLowerCase();
                    const hasAutocomplete = ctrl.hasAttribute('autocomplete');

                    const commonFields = [
                        { keys: ['email', 'mail'], expected: 'email' },
                        { keys: ['name', 'fullname', 'first_name', 'fname'], expected: 'name' },
                        { keys: ['phone', 'tel', 'mobile'], expected: 'tel' },
                        { keys: ['username', 'user'], expected: 'username' },
                        { keys: ['password', 'pwd'], expected: 'current-password' },
                        { keys: ['address', 'street', 'city', 'zip', 'postal'], expected: 'street-address' }
                    ];

                    const matched = commonFields.find(field => 
                        field.keys.some(k => nameAttr.includes(k) || idAttr.includes(k) || inputType === k)
                    );

                    if (matched && !hasAutocomplete) {
                        results.push({
                            ruleId: 'FORM_AUTO_001',
                            category: 'Forms',
                            severity: 'INFO',
                            message: `Input field for "${matched.expected}" is missing autocomplete attribute`,
                            element: snippet,
                            explanation: 'Specifying autocomplete helps users with motor disabilities and cognitive impairments fill in forms automatically.',
                            recommendation: `Add autocomplete="${matched.expected}" to the input element.`,
                            currentCode: snippet,
                            recommendedCode: snippet.replace('<input', `<input autocomplete="${matched.expected}"`),
                            highlightTarget: '<input',
                            wcag: '1.3.5 Identify Input Purpose'
                        });
                    }
                }
            });

            return results;
        }
    };
})();
