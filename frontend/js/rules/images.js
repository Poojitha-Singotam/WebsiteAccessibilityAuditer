/**
 * Rule Category: Images
 * Checks for alt attributes, decorative image handling, input type=image, and descriptive text.
 */

(function () {
    window.A11yRules = window.A11yRules || {};

    window.A11yRules.images = {
        name: 'Images',
        category: 'Images',

        analyze(doc, rawHtml) {
            const results = [];
            const images = doc.querySelectorAll('img');
            const imageInputs = doc.querySelectorAll('input[type="image"]');

            // 1. Analyze <img> elements
            if (images.length === 0) {
                results.push({
                    ruleId: 'IMG_NONE',
                    category: 'Images',
                    severity: 'PASS',
                    message: 'No images found requiring alt text verification',
                    element: 'N/A',
                    explanation: 'The analyzed document contains no <img> elements.',
                    recommendation: 'Ensure future images are provided with meaningful alternative text.',
                    currentCode: '',
                    recommendedCode: '',
                    wcag: '1.1.1 Non-text Content'
                });
            }

            images.forEach((img, idx) => {
                const hasAlt = img.hasAttribute('alt');
                const altVal = img.getAttribute('alt');
                const src = img.getAttribute('src') || '';
                const snippet = A11yUtils.getElementSnippet(img);

                // Case 1: Missing alt attribute entirely
                if (!hasAlt) {
                    const recommendedAlt = src ? `Photo illustrating ${src.split('/').pop().split('.')[0].replace(/[-_]/g, ' ')}` : 'Descriptive alternative text';
                    results.push({
                        ruleId: 'IMG_ALT_001',
                        category: 'Images',
                        severity: 'ERROR',
                        message: 'Image is missing alternative text (alt attribute)',
                        element: snippet,
                        explanation: 'Without an alt attribute, screen readers will read the raw image URL or file path, causing confusion for visually impaired users.',
                        recommendation: 'Add an alt attribute describing the image content or purpose. If purely decorative, use alt="".',
                        currentCode: snippet,
                        recommendedCode: snippet.includes('>') ? snippet.replace(/>$/, ` alt="${recommendedAlt}">`) : `<img src="${src}" alt="${recommendedAlt}">`,
                        highlightTarget: '<img',
                        wcag: '1.1.1 Non-text Content'
                    });
                    return;
                }

                // Case 2: Empty alt attribute (alt="")
                if (altVal.trim() === '') {
                    // Check if inside an interactive element (a or button) without other accessible name
                    const parentInteractive = img.closest('a, button');
                    if (parentInteractive) {
                        const parentText = (parentInteractive.textContent || '').trim();
                        const parentAria = parentInteractive.getAttribute('aria-label') || parentInteractive.getAttribute('aria-labelledby');
                        if (!parentText && !parentAria) {
                            results.push({
                                ruleId: 'IMG_ALT_EMPTY_INTERACTIVE',
                                category: 'Images',
                                severity: 'ERROR',
                                message: 'Image inside link or button has empty alt, leaving the action without an accessible name',
                                element: snippet,
                                explanation: 'An interactive element (link or button) containing only a decorative image cannot be identified by screen readers.',
                                recommendation: 'Provide descriptive alt text for the image or an aria-label on the enclosing interactive control.',
                                currentCode: snippet,
                                recommendedCode: snippet.replace('alt=""', 'alt="Navigate to page / perform action"'),
                                highlightTarget: 'alt=""',
                                wcag: '1.1.1 Non-text Content'
                            });
                            return;
                        }
                    }

                    // Otherwise, empty alt is valid for decorative images
                    results.push({
                        ruleId: 'IMG_ALT_DECORATIVE',
                        category: 'Images',
                        severity: 'PASS',
                        message: 'Decorative image appropriately marked with empty alt (alt="")',
                        element: snippet,
                        explanation: 'Empty alt="" instructs assistive technologies to safely ignore decorative or presentation-only images.',
                        recommendation: 'Verify that this image is purely decorative and conveys no essential informational meaning.',
                        currentCode: snippet,
                        recommendedCode: snippet,
                        wcag: '1.1.1 Non-text Content'
                    });
                    return;
                }

                // Case 3: Generic or placeholder alt text
                const trimmedAlt = altVal.trim().toLowerCase();
                const genericWords = ['image', 'picture', 'photo', 'graphic', 'logo', 'icon', 'img', 'banner', 'placeholder'];
                const isFileExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(trimmedAlt);

                if (genericWords.includes(trimmedAlt) || isFileExtension) {
                    results.push({
                        ruleId: 'IMG_ALT_GENERIC',
                        category: 'Images',
                        severity: 'WARNING',
                        message: `Image alternative text "${altVal}" is non-descriptive or repetitive`,
                        element: snippet,
                        explanation: 'Screen readers announce that an element is an image. Words like "image", "photo", or filename extensions provide little descriptive value.',
                        recommendation: 'Replace generic words with descriptive text conveying what the image actually portrays.',
                        currentCode: snippet,
                        recommendedCode: snippet.replace(`alt="${altVal}"`, 'alt="Detailed description of subject or action"'),
                        highlightTarget: `alt="${altVal}"`,
                        wcag: '1.1.1 Non-text Content'
                    });
                    return;
                }

                // Case 4: Meaningful alt text present
                results.push({
                    ruleId: 'IMG_ALT_VALID',
                    category: 'Images',
                    severity: 'PASS',
                    message: 'Image has descriptive alternative text',
                    element: snippet,
                    explanation: `Image has descriptive alt text: "${altVal}".`,
                    recommendation: 'Ensure the alt text remains accurate if the visual image is updated.',
                    currentCode: snippet,
                    recommendedCode: snippet,
                    wcag: '1.1.1 Non-text Content'
                });
            });

            // 2. Analyze <input type="image">
            imageInputs.forEach(input => {
                const snippet = A11yUtils.getElementSnippet(input);
                const alt = input.getAttribute('alt');
                const ariaLabel = input.getAttribute('aria-label');
                const ariaLabelledby = input.getAttribute('aria-labelledby');

                if (!alt && !ariaLabel && !ariaLabelledby) {
                    results.push({
                        ruleId: 'IMG_INPUT_001',
                        category: 'Images',
                        severity: 'ERROR',
                        message: 'Graphical form submit button (input type=image) missing accessible alternative',
                        element: snippet,
                        explanation: 'Graphical buttons require an alt attribute or aria-label so screen readers can announce the submit action.',
                        recommendation: 'Add alt="Submit Search" or an equivalent descriptive label.',
                        currentCode: snippet,
                        recommendedCode: snippet.replace('type="image"', 'type="image" alt="Submit Form"'),
                        highlightTarget: 'type="image"',
                        wcag: '1.1.1 Non-text Content'
                    });
                } else {
                    results.push({
                        ruleId: 'IMG_INPUT_VALID',
                        category: 'Images',
                        severity: 'PASS',
                        message: 'Graphical form button has accessible alternative label',
                        element: snippet,
                        explanation: 'The graphical button properly supplies an accessible name.',
                        recommendation: 'None needed.',
                        currentCode: snippet,
                        recommendedCode: snippet,
                        wcag: '1.1.1 Non-text Content'
                    });
                }
            });

            return results;
        }
    };
})();
