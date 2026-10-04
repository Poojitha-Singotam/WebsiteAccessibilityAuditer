# Web Accessibility Auditor

> A production-quality developer tool for automated web accessibility analysis using pure JavaScript DOM APIs, Python Flask RESTful backend, and MySQL database persistence.

---

## 1. Project Title

**Web Accessibility Auditor** (Automated WCAG 2.1 DOM Analysis & Management Platform)

---

## 2. Problem Statement

Modern web development frequently suffers from undetected accessibility (a11y) barriers—such as missing alternative text, unlabeled form controls, broken heading hierarchies, empty interactive buttons/links, and misused ARIA roles. These barriers hinder millions of individuals with visual, motor, auditory, or cognitive disabilities from accessing digital services.

While accessibility audits are essential, existing enterprise scanning tools can be complex, heavy, or rely on opaque cloud services. **Web Accessibility Auditor** solves this by providing developers with an instant, interactive, and transparent client-side DOM rule engine paired with a secure relational backend to audit, score, inspect, and track website accessibility over time.

---

## 3. Features

- **Real DOM Analysis**: Uses native browser `DOMParser` APIs to build a safe DOM tree without executing scripts or exposing users to malicious code.
- **10 Modular Accessibility Rule Engines**: Independent rule packages covering Images, Forms, Headings, Links, Buttons, Document metadata, Landmarks/Structure, Tables, Media, and ARIA attributes.
- **Dual Input Methods**:
  - Code Editor for pasting raw HTML markup with character counters and syntax styling.
  - File Dropzone supporting `.html` and `.htm` file uploads via the JavaScript `FileReader` API.
- **Realistic Benchmarking Samples**: Built-in Poor, Mixed, and Good accessibility templates demonstrating real detectable differences.
- **Weighted Audit Scoring**: Deductive scoring engine deducting points by severity (Critical: -15, Error: -8, Warning: -3, Info: -1) bounded from 0 to 100.
- **Interactive Report Dashboard**:
  - Live client-side category filtering (Images, Forms, Headings, Links, Buttons, Structure, ARIA, Tables, Media, Document).
  - Severity-based filtering (Critical, Error, Warning, Info, Pass).
  - Keyword and WCAG reference search.
  - Sorting by Severity, Category, or DOM order.
- **Before / After Fix View**: Side-by-side code blocks showing current markup versus recommended accessible code.
- **Element Inspection Modal**: In-depth modal with highlighted problematic attributes and explanations.
- **Persistent MySQL Audit History**: Save audits, retrieve past reports by ID, and delete obsolete audits via Flask REST APIs.
- **Secure Authentication**: Register and login with secure password hashing (`scrypt`), JWT session tokens, and protected user histories.
- **Accessible by Design**: The auditor itself complies with WCAG AA guidelines with keyboard skip links, high-contrast dark themes, focus outlines, and semantic HTML structure.

---

## 4. Technology Stack

### Frontend
- **HTML5**: Semantic tags (`<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`, `<article>`)
- **CSS3**: Vanilla CSS with modern custom properties (CSS variables), CSS Grid, Flexbox, high-contrast palette, and responsive breakpoints.
- **Vanilla JavaScript (ES6+)**: Modular rule architecture, DOM APIs, `DOMParser`, `FileReader`, Fetch API.
- *Strictly Zero Heavy Frameworks*: No React, Vue, Angular, Bootstrap, or Tailwind.

### Backend
- **Python 3.10+ / 3.13**
- **Flask**: Application framework and RESTful API routing.
- **Flask-CORS**: Cross-Origin Resource Sharing configuration.
- **PyMySQL**: High-performance MySQL database connector.
- **PyJWT**: Secure JSON Web Token creation and verification.
- **Werkzeug**: Cryptographic password hashing (`generate_password_hash`, `check_password_hash`).
- **python-dotenv**: Environment configuration loader.

### Database
- **MySQL 8.0+**: Normalized relational schema with foreign key constraints, cascading deletes, and indexes.

---

## 5. Architecture

```text
                               ┌────────────────────────────────────────────────────────┐
                               │                    FRONTEND (UI)                       │
                               │   index.html | dashboard.html | auditor.html           │
                               │   report.html | history.html | login.html              │
                               └───────────────┬────────────────────────┬───────────────┘
                                               │                        │
                                   [Paste / File Upload]       [REST API Calls: JWT]
                                               ↓                        ↓
                               ┌───────────────────────────┐ ┌──────────────────────────┐
                               │   DOMParser (Safe Mode)   │ │      Flask Backend       │
                               └───────────────┬───────────┘ │   /api/auth & /api/audits│
                                               ↓             └──────────┬───────────────┘
                               ┌───────────────────────────┐            │
                               │ Accessibility Rule Engine │            ↓
                               │  images.js    forms.js    │ ┌──────────────────────────┐
                               │  headings.js  links.js    │ │      MySQL Database      │
                               │  buttons.js   document.js │ │  users | audits          │
                               │  structure.js tables.js   │ │  audit_summary           │
                               │  media.js     aria.js     │ │  audit_issues            │
                               └───────────────┬───────────┘ └──────────────────────────┘
                                               ↓
                               ┌───────────────────────────┐
                               │ Issue Detection & Scoring │
                               │  Critical: -15, Error: -8 │
                               │  Warning: -3,   Info: -1  │
                               └───────────────┬───────────┘
                                               ↓
                               ┌───────────────────────────┐
                               │ Detailed Report & Filters │
                               │ Before/After & Inspector  │
                               └───────────────────────────┘
```

---

## 6. Accessibility Rules

| Rule ID | Category | Severity | Description | WCAG Reference |
| :--- | :--- | :--- | :--- | :--- |
| `DOC_LANG_001` | Document | **ERROR** | Missing or empty `lang` attribute on `<html>` | 3.1.1 Language of Page |
| `DOC_TITLE_001` | Document | **ERROR** | Missing or empty `<title>` element | 2.4.2 Page Titled |
| `DOC_VIEWPORT_RESTRICT` | Document | **ERROR** | Viewport disables user zoom (`user-scalable=no`) | 1.4.4 Resize Text |
| `IMG_ALT_001` | Images | **ERROR** | `<img>` tag is missing `alt` attribute | 1.1.1 Non-text Content |
| `IMG_ALT_EMPTY_INTERACTIVE`| Images | **ERROR** | Image inside link/button has empty alt without label | 1.1.1 Non-text Content |
| `IMG_ALT_GENERIC` | Images | **WARNING** | Generic alt text (e.g., "image", "photo.png", "logo") | 1.1.1 Non-text Content |
| `IMG_ALT_DECORATIVE` | Images | **PASS** | Decorative image properly marked with `alt=""` | 1.1.1 Non-text Content |
| `FORM_LBL_001` | Forms | **ERROR** | Form control lacks associated label | 1.3.1 Info & Relationships |
| `FORM_LBL_EMPTY` | Forms | **ERROR** | `<label>` element is empty or has no accessible text | 1.3.1 Info & Relationships |
| `FORM_LBL_ORPHAN` | Forms | **ERROR** | `<label for="...">` references non-existent element ID | 1.3.1 Info & Relationships |
| `FORM_AUTO_001` | Forms | **INFO** | Common field missing `autocomplete` attribute | 1.3.5 Identify Input Purpose |
| `HEAD_H1_001` | Headings | **ERROR** | Document has no top-level `<h1>` heading | 1.3.1 Info & Relationships |
| `HEAD_H1_MULTI` | Headings | **WARNING** | Document contains multiple `<h1>` headings | 1.3.1 Info & Relationships |
| `HEAD_JUMP_001` | Headings | **WARNING** | Heading level jumps (e.g. `<h1>` directly to `<h3>`) | 1.3.1 Info & Relationships |
| `HEAD_EMPTY_001` | Headings | **ERROR** | Heading is empty with no accessible text | 1.3.1 Info & Relationships |
| `LINK_EMPTY_001` | Links | **ERROR** | `<a>` hyperlink is empty with no accessible name | 2.4.4 Link Purpose |
| `LINK_GENERIC_001` | Links | **WARNING** | Ambiguous link text ("click here", "read more") | 2.4.4 Link Purpose |
| `BTN_EMPTY_001` | Buttons | **ERROR** | `<button>` has no accessible text or label | 4.1.2 Name, Role, Value |
| `BTN_ICON_NOLABEL` | Buttons | **ERROR** | Icon-only button lacks `aria-label` | 4.1.2 Name, Role, Value |
| `STRUCT_MAIN_001` | Structure | **WARNING** | Document lacks a `<main>` landmark | 1.3.1 Info & Relationships |
| `STRUCT_MAIN_MULTI` | Structure | **WARNING** | Document contains multiple `<main>` landmarks | 1.3.1 Info & Relationships |
| `TBL_TH_001` | Tables | **WARNING** | Data table does not contain proper `<th>` headers | 1.3.1 Info & Relationships |
| `TBL_SCOPE_001` | Tables | **INFO** | Table header cells lack `scope="col"` or `"row"` | 1.3.1 Info & Relationships |
| `MEDIA_CAPTIONS_001` | Media | **WARNING** | `<video>` element lacks `<track kind="captions">` | 1.2.2 Captions (Prerecorded) |
| `MEDIA_AUTOPLAY_UNMUTED`| Media | **ERROR** | Media plays audio automatically on load | 1.4.2 Audio Control |
| `ARIA_HIDDEN_FOCUS` | ARIA | **CRITICAL** | Focusable interactive element has `aria-hidden="true"` | 4.1.2 Name, Role, Value |
| `ARIA_LABEL_EMPTY` | ARIA | **ERROR** | Empty `aria-label=""` on interactive element | 4.1.2 Name, Role, Value |
| `ARIA_ROLE_BTN_TABINDEX`| ARIA | **WARNING** | Element with `role="button"` missing `tabindex="0"` | 2.1.1 Keyboard |

---

## 7. Scoring Methodology

The evaluation engine calculates an **Audit Score** ranging between **0** and **100**:

$$\text{Audit Score} = \max\Big(0, 100 - \sum (\text{Issues} \times \text{Weight})\Big)$$

### Deduction Weights
- **CRITICAL**: **15 points** (e.g. Invisible focus traps with `aria-hidden="true"`)
- **ERROR**: **8 points** (e.g. Missing `alt`, missing form labels, missing `<title>`, empty buttons)
- **WARNING**: **3 points** (e.g. Skipped heading levels `<h1>` $\rightarrow$ `<h3>`, uncaptioned video, ambiguous "click here" links)
- **INFO**: **1 point** (e.g. Missing autocomplete on common inputs, missing table `scope`)

### Score Tiers & Visual Status
- **90 – 100**: *Excellent* (Green `#10b981`)
- **75 – 89**: *Good* (Blue `#3b82f6`)
- **50 – 74**: *Needs Improvement* (Yellow `#eab308`)
- **0 – 49**: *Poor / Inaccessible* (Red `#ef4444`)

> **Important**: This metric is an internal *Audit Score* based on automated heuristics. It is never presented as an official WCAG compliance certification.

---

## 8. Database Schema

The relational database `accessibility_auditor` uses InnoDB with strict foreign key constraints:

### 1. `users`
- `id` (INT PK AUTO_INCREMENT)
- `name` (VARCHAR(100) NOT NULL)
- `email` (VARCHAR(150) NOT NULL UNIQUE)
- `password_hash` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### 2. `audits`
- `id` (INT PK AUTO_INCREMENT)
- `user_id` (INT FK $\rightarrow$ `users.id` ON DELETE CASCADE)
- `page_name` (VARCHAR(255) NOT NULL)
- `score` (INT NOT NULL DEFAULT 100)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### 3. `audit_summary`
- `id` (INT PK AUTO_INCREMENT)
- `audit_id` (INT UNIQUE FK $\rightarrow$ `audits.id` ON DELETE CASCADE)
- `critical_count` (INT NOT NULL DEFAULT 0)
- `error_count` (INT NOT NULL DEFAULT 0)
- `warning_count` (INT NOT NULL DEFAULT 0)
- `info_count` (INT NOT NULL DEFAULT 0)
- `pass_count` (INT NOT NULL DEFAULT 0)

### 4. `audit_issues`
- `id` (INT PK AUTO_INCREMENT)
- `audit_id` (INT FK $\rightarrow$ `audits.id` ON DELETE CASCADE)
- `rule_id` (VARCHAR(50) NOT NULL)
- `category` (VARCHAR(50) NOT NULL)
- `severity` (ENUM: 'CRITICAL', 'ERROR', 'WARNING', 'INFO', 'PASS')
- `message` (VARCHAR(255) NOT NULL)
- `element_html` (TEXT)
- `explanation` (TEXT)
- `recommendation` (TEXT)
- `wcag_reference` (VARCHAR(100))

---

## 9. API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/auth/me` | Retrieve profile and aggregate audit statistics | **Yes** |
| `POST` | `/api/audits` | Save audit snapshot, summary, and issues | **Yes** |
| `GET` | `/api/audits` | List user's saved audit records | **Yes** |
| `GET` | `/api/audits/<id>` | Fetch single audit metadata and summary | **Yes** |
| `GET` | `/api/audits/<id>/issues` | Fetch all detected issues for an audit | **Yes** |
| `DELETE` | `/api/audits/<id>` | Delete an audit and cascade all child records | **Yes** |
| `GET` | `/api/health` | Health check endpoint | No |

---

## 10. Installation

### Prerequisites
- Python 3.10+
- MySQL 8.0+

### Clone / Navigate to Project
```bash
cd "C:\Users\Poojitha\WebsiteAccessibilityAuditer"
```

### Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

---

## 11. MySQL Setup

1. Open MySQL CLI or Workbench and run the schema and seed scripts:
```bash
mysql -u root -p accessibility_auditor < database/schema.sql
mysql -u root -p accessibility_auditor < database/seed.sql
```

2. Seed Data includes a ready-to-use demo auditor account:
   - **Email**: `auditor@a11y.dev`
   - **Password**: `Password123!`

---

## 12. Environment Variables

Create or review `backend/.env` (and template in `.env.example`):

```env
# Database Configuration
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=accessibility_auditor

# Application Security
JWT_SECRET=a11y-auditor-super-secret-jwt-key-2026-prod
FLASK_ENV=development
PORT=5000
```
*(The connector automatically tries port `3307` and falls back to `3306` if configured).*

---

## 13. Running Frontend & 14. Running Backend

### One-Click Launch (Windows)
Double-click **`start_all.bat`** in the project root. It will:
1. Ensure the MySQL server is running.
2. Launch the Flask backend server.
3. Open `http://127.0.0.1:5000` in your default web browser.

### Manual Backend Launch
```bash
cd backend
python app.py
```
*API and static web pages will serve on `http://127.0.0.1:5000/`.*

---

## 15. Test Cases

The application includes automated integration test suites validating all 12 mandatory accessibility conditions and end-to-end user journeys:

### Running API Tests
```bash
python tests/test_api.py
```
*Validates registration, login, JWT token auth, audit creation, listing, retrieval, and deletion.*

### Running Full E2E Selenium Tests
```bash
python tests/test_e2e_selenium.py
```
*Executes headless Chrome browser automation testing:*
- **Test 1**: Image without `alt` $\rightarrow$ `ERROR` (`IMG_ALT_001`)
- **Test 2**: Image with meaningful `alt` $\rightarrow$ `PASS` (`IMG_ALT_VALID`)
- **Test 3**: Input without label $\rightarrow$ `ERROR` (`FORM_LBL_001`)
- **Test 4**: Input with associated `<label for="...">` $\rightarrow$ `PASS` (`FORM_LBL_PASS`)
- **Test 5**: Heading jump `<h1>` $\rightarrow$ `<h3>` $\rightarrow$ `WARNING` (`HEAD_JUMP_001`)
- **Test 6**: Missing `html lang` $\rightarrow$ `ERROR` (`DOC_LANG_001`)
- **Test 7**: Missing `<title>` $\rightarrow$ `ERROR` (`DOC_TITLE_001`)
- **Test 8**: Empty button `<button></button>` $\rightarrow$ `ERROR` (`BTN_EMPTY_001`)
- **Test 9**: Empty link `<a href="..."></a>` $\rightarrow$ `ERROR` (`LINK_EMPTY_001`)
- **Test 10**: Table without `<th>` $\rightarrow$ `WARNING` (`TBL_TH_001`)
- **Test 11**: Video without captions $\rightarrow$ `WARNING` (`MEDIA_CAPTIONS_001`)
- **Test 12**: Accessible sample page $\rightarrow$ mostly `PASS` (Score $\ge$ 90)
- **UI Tests**: Sample loading, score calculation, category filtering, element inspection modal, authentication, MySQL saving, and reopening reports from history.

---

## 16. Limitations

> **Important Testing Notice**:
> "Automated accessibility testing identifies common detectable issues but cannot determine complete accessibility. Manual testing, keyboard testing, screen reader testing, visual inspection, and user testing may still be required."

- Automated checks evaluate syntactic presence and known patterns; they cannot judge whether image descriptions are contextually artistic or whether video captions are accurate.
- Color contrast checking in raw pasted HTML without loaded external stylesheets is heuristic and requires browser rendering inspection for live sites.

---

## 17. Future Enhancements

- Live URL crawler with automated headless rendering of single-page applications.
- Full WCAG Color Contrast ratio calculator for embedded CSS variables and stylesheets.
- Export audit reports as standalone PDF documents and CSV files.
- CI/CD GitHub Actions integration for automated accessibility pull request checks.
