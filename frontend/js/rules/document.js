/**
 * Rule Category: Document
 * Checks for html lang, title presence/content, viewport meta tag, and doctype.
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    window.A11yRules.document = {
        name: 'Document',
        category: 'Document',

        analyze(doc, rawHtml) {
            const results = [];
            const htmlEl = doc.documentElement;

            // 1. Check HTML lang attribute
            const lang = htmlEl ? htmlEl.getAttribute('lang') : null;
            if (!lang || !lang.trim()) {
                results.push({
                    ruleId: 'DOC_LANG_001',
                    category: 'Document',
                    severity: 'ERROR',
                    message: 'Document language is missing on <html> element',
                    element: '<html>',
                    explanation: 'Without a lang attribute on <html>, screen readers cannot select the correct voice synthesizer or pronunciation dictionary for the language.',
                    recommendation: 'Add a valid BCP 47 language code attribute to the html tag, e.g., <html lang="en">.',
                    currentCode: '<html>',
                    recommendedCode: '<html lang="en">',
                    highlightTarget: '<html>',
                    wcag: '3.1.1 Language of Page'
                });
            } else {
                // Validate basic language tag format (e.g. en, en-US, es, fr-CA)
                const isValidLang = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(lang.trim());
                if (!isValidLang) {
                    results.push({
                        ruleId: 'DOC_LANG_INVALID',
                        category: 'Document',
                        severity: 'WARNING',
                        message: `Document language code "${lang}" does not follow BCP 47 standard`,
                        element: `<html lang="${lang}">`,
                        explanation: 'Language codes should follow standard format like "en", "en-US", "es", or "de".',
                        recommendation: 'Use a standard BCP 47 primary language code like lang="en".',
                        currentCode: `<html lang="${lang}">`,
                        recommendedCode: '<html lang="en">',
                        highlightTarget: `lang="${lang}"`,
                        wcag: '3.1.1 Language of Page'
                    });
                } else {
                    results.push({
                        ruleId: 'DOC_LANG_PASS',
                        category: 'Document',
                        severity: 'PASS',
                        message: `Document specifies primary language (${lang})`,
                        element: `<html lang="${lang}">`,
                        explanation: 'The html tag correctly defines the primary human language of the page content.',
                        recommendation: 'Ensure all pages on your site include a valid lang attribute.',
                        currentCode: `<html lang="${lang}">`,
                        recommendedCode: `<html lang="${lang}">`,
                        wcag: '3.1.1 Language of Page'
                    });
                }
            }

            // 2. Check <title> element
            const titleEl = doc.querySelector('title');
            const titleText = titleEl ? (titleEl.textContent || '').trim() : '';

            if (!titleEl || !titleText) {
                results.push({
                    ruleId: 'DOC_TITLE_001',
                    category: 'Document',
                    severity: 'ERROR',
                    message: 'Document <title> element is missing or empty',
                    element: titleEl ? '<title></title>' : '<head>',
                    explanation: 'The page title is the first item announced by screen readers when navigating to a new page or tab, orienting users immediately.',
                    recommendation: 'Add a descriptive <title> tag inside the <head> element representing the specific page.',
                    currentCode: '<head>\n  <!-- Missing or empty <title> -->\n</head>',
                    recommendedCode: '<head>\n  <title>Descriptive Page Title - Organization Name</title>\n</head>',
                    highlightTarget: '<head>',
                    wcag: '2.4.2 Page Titled'
                });
            } else {
                results.push({
                    ruleId: 'DOC_TITLE_PASS',
                    category: 'Document',
                    severity: 'PASS',
                    message: `Document has page title: "${titleText}"`,
                    element: `<title>${titleText}</title>`,
                    explanation: 'The page title is properly defined and announced to assistive technologies.',
                    recommendation: 'Ensure page titles remain unique and descriptive across site sections.',
                    currentCode: `<title>${titleText}</title>`,
                    recommendedCode: `<title>${titleText}</title>`,
                    wcag: '2.4.2 Page Titled'
                });
            }

            // 3. Check Viewport Meta Tag
            const viewportMeta = doc.querySelector('meta[name="viewport"]');
            if (!viewportMeta) {
                results.push({
                    ruleId: 'DOC_VIEWPORT_001',
                    category: 'Document',
                    severity: 'WARNING',
                    message: 'Mobile viewport meta tag is missing',
                    element: '<head>',
                    explanation: 'Without a viewport meta tag, mobile browsers will render pages at desktop scale, reducing readability for low-vision users.',
                    recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> inside <head>.',
                    currentCode: '<head>',
                    recommendedCode: '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
                    highlightTarget: '<head>',
                    wcag: '1.4.4 Resize Text'
                });
            } else {
                const content = (viewportMeta.getAttribute('content') || '').toLowerCase();
                const disablesScalable = content.includes('user-scalable=no') || content.includes('user-scalable=0');
                const restrictsMaxScale = content.includes('maximum-scale=1') && !content.includes('maximum-scale=10');

                if (disablesScalable || restrictsMaxScale) {
                    results.push({
                        ruleId: 'DOC_VIEWPORT_RESTRICT',
                        category: 'Document',
                        severity: 'ERROR',
                        message: 'Viewport meta tag restricts zoom or disables user scalability',
                        element: A11yUtils.getElementSnippet(viewportMeta),
                        explanation: 'Disabling user zooming (user-scalable=no or maximum-scale=1.0) severely hinders users with visual impairments who require magnification.',
                        recommendation: 'Remove user-scalable=no and maximum-scale=1 from the viewport content attribute.',
                        currentCode: A11yUtils.getElementSnippet(viewportMeta),
                        recommendedCode: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                        highlightTarget: disablesScalable ? 'user-scalable=no' : 'maximum-scale=1',
                        wcag: '1.4.4 Resize Text'
                    });
                } else {
                    results.push({
                        ruleId: 'DOC_VIEWPORT_PASS',
                        category: 'Document',
                        severity: 'PASS',
                        message: 'Viewport meta tag is properly configured allowing user zoom',
                        element: A11yUtils.getElementSnippet(viewportMeta),
                        explanation: 'The viewport settings allow responsive scaling without blocking assistive magnification.',
                        recommendation: 'Maintain standard scalable viewport settings.',
                        currentCode: A11yUtils.getElementSnippet(viewportMeta),
                        recommendedCode: A11yUtils.getElementSnippet(viewportMeta),
                        wcag: '1.4.4 Resize Text'
                    });
                }
            }

            // 4. Doctype Check
            if (rawHtml && !rawHtml.trim().toLowerCase().startsWith('<!doctype html>')) {
                results.push({
                    ruleId: 'DOC_DOCTYPE_001',
                    category: 'Document',
                    severity: 'WARNING',
                    message: 'Document is missing standard HTML5 <!DOCTYPE html> declaration',
                    element: 'N/A',
                    explanation: 'A missing DOCTYPE forces browsers into quirks mode, which can cause erratic rendering of semantic elements and styles.',
                    recommendation: 'Prepend <!DOCTYPE html> to the very beginning of the HTML document.',
                    currentCode: rawHtml.trim().slice(0, 40) + '...',
                    recommendedCode: '<!DOCTYPE html>\n' + rawHtml.trim().slice(0, 40),
                    highlightTarget: 'DOCTYPE',
                    wcag: '4.1.1 Parsing'
                });
            }

            return results;
        }
    };
})();
