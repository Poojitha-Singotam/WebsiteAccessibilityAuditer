-- Web Accessibility Auditor Seed Data
USE `accessibility_auditor`;

-- Insert Demo User: auditor@a11y.dev / Password123!
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `created_at`)
VALUES (
    1,
    'Demo Auditor',
    'auditor@a11y.dev',
    'scrypt:32768:8:1$pZrdLwpmkOIPXXmd$c28fd92d39f7218d3fa7af565dca0b9187c0ee58f731733c79095497034177b5144d1077ba4135120a2fa805a4ad42954dad00fa61d803a7eaa83c260d58fbaf',
    NOW()
) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Insert Sample Baseline Audit for E-Commerce Landing Page
INSERT INTO `audits` (`id`, `user_id`, `page_name`, `score`, `created_at`)
VALUES (
    1,
    1,
    'Storefront Home - v1.0 Release Candidate',
    73,
    DATE_SUB(NOW(), INTERVAL 2 DAY)
) ON DUPLICATE KEY UPDATE `score`=VALUES(`score`);

INSERT INTO `audit_summary` (`id`, `audit_id`, `critical_count`, `error_count`, `warning_count`, `info_count`, `pass_count`)
VALUES (
    1,
    1,
    1,
    2,
    3,
    2,
    18
) ON DUPLICATE KEY UPDATE `pass_count`=VALUES(`pass_count`);

INSERT INTO `audit_issues` (`id`, `audit_id`, `rule_id`, `category`, `severity`, `message`, `element_html`, `explanation`, `recommendation`, `wcag_reference`)
VALUES
(
    1,
    1,
    'DOC_LANG_001',
    'Document',
    'CRITICAL',
    'Document language is missing on <html> element',
    '<html>',
    'Without a valid lang attribute on <html>, screen readers cannot determine the correct language profile or pronunciation rules for the document.',
    'Add a valid BCP 47 language code attribute to the html tag, e.g., <html lang="en">.',
    '3.1.1 Language of Page'
),
(
    2,
    1,
    'IMG_ALT_001',
    'Images',
    'ERROR',
    'Image is missing alternative text',
    '<img src="hero-banner.jpg">',
    'Screen readers require an alt attribute to convey the visual content of meaningful images to visually impaired users.',
    '<img src="hero-banner.jpg" alt="Spring fashion sale featuring model in blue coat">',
    '1.1.1 Non-text Content'
),
(
    3,
    1,
    'FORM_LBL_001',
    'Forms',
    'ERROR',
    'Form input control has no associated label',
    '<input type="email" id="newsletter-email" placeholder="Enter email">',
    'Placeholders are not persistent labels. Assistive technologies need an explicit <label for="..."> or aria-label.',
    '<label for="newsletter-email">Email Address</label>\n<input type="email" id="newsletter-email" name="email">',
    '1.3.1 Info and Relationships'
),
(
    4,
    1,
    'HEAD_ORDER_001',
    'Headings',
    'WARNING',
    'Heading level skips from <h1> to <h3>',
    '<h3>Featured Collections</h3>',
    'Heading hierarchy establishes page outline. Skipping heading levels confuses users navigating by section headings.',
    'Use an <h2> before <h3> or adjust the heading rank to <h2>.',
    '1.3.1 Info and Relationships'
),
(
    5,
    1,
    'BTN_NAME_001',
    'Buttons',
    'WARNING',
    'Button has empty or purely icon content without accessible name',
    '<button class="icon-btn"><i class="fa fa-shopping-cart"></i></button>',
    'Buttons without accessible names are announced as "button" with no purpose to screen reader users.',
    '<button class="icon-btn" aria-label="View Shopping Cart"><i class="fa fa-shopping-cart"></i></button>',
    '4.1.2 Name, Role, Value'
),
(
    6,
    1,
    'LINK_PURPOSE_001',
    'Links',
    'WARNING',
    'Link text is ambiguous or generic ("Click Here")',
    '<a href="/promotions">Click Here</a>',
    'Links should clearly describe their destination or purpose when read out of context by assistive technologies.',
    '<a href="/promotions">Explore current spring promotional discounts</a>',
    '2.4.4 Link Purpose (In Context)'
),
(
    7,
    1,
    'TBL_HEADER_001',
    'Tables',
    'INFO',
    'Table header cells lack scope attribute',
    '<th>Product</th><th>Price</th>',
    'Specifying scope="col" or scope="row" on <th> cells clarifies data relationships in complex data tables.',
    '<th scope="col">Product</th><th scope="col">Price</th>',
    '1.3.1 Info and Relationships'
),
(
    8,
    1,
    'MEDIA_TRACK_001',
    'Media',
    'INFO',
    'Video element does not contain a captions track',
    '<video src="intro.mp4" controls></video>',
    'Videos with dialogue or audio cues require closed captions for users who are deaf or hard of hearing.',
    '<video src="intro.mp4" controls>\n  <track kind="captions" src="intro-captions.vtt" srclang="en" label="English Captions">\n</video>',
    '1.2.2 Captions (Prerecorded)'
)
ON DUPLICATE KEY UPDATE `message`=VALUES(`message`);
