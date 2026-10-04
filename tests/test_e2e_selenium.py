import sys
import time
sys.stdout.reconfigure(encoding='utf-8')
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_tests():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1440,900")
    options.binary_location = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    def safe_click(elem):
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elem)
        time.sleep(0.2)
        driver.execute_script("arguments[0].click();", elem)

    try:
        print("=== TEST SUITE: WEB ACCESSIBILITY AUDITOR E2E ===")
        
        # 1. Open Auditor Page
        print("\n[Step 1] Navigating to http://127.0.0.1:5000/auditor.html...")
        driver.get("http://127.0.0.1:5000/auditor.html")
        assert "New Audit" in driver.title or "Web Accessibility Auditor" in driver.title
        print(" -> Page loaded successfully. Title:", driver.title)

        # 2. Test 12 Rules Directly in Auditor Engine via JavaScript injection
        print("\n[Step 2] Testing All 12 Mandatory Rules in Engine...")
        test_script = """
        const runRuleTest = (html) => {
            return A11yAuditor.runAudit(html, 'Rule Test');
        };

        return {
            test1: runRuleTest('<img src="test.jpg">'), // Image without alt -> ERROR
            test2: runRuleTest('<img src="test.jpg" alt="A golden retriever dog">'), // Image with alt -> PASS
            test3: runRuleTest('<input type="text" id="uname">'), // Input without label -> ERROR
            test4: runRuleTest('<label for="uname">Username</label><input type="text" id="uname">'), // Input with label -> PASS
            test5: runRuleTest('<h1>Main</h1><h3>Sub</h3>'), // H1 -> H3 -> WARNING
            test6: runRuleTest('<html><head><title>Title</title></head><body><h1>Hi</h1></body></html>'), // Missing lang -> ERROR
            test7: runRuleTest('<html lang="en"><head></head><body><h1>Hi</h1></body></html>'), // Missing title -> ERROR
            test8: runRuleTest('<button></button>'), // Empty button -> ERROR
            test9: runRuleTest('<a href="/home"></a>'), // Empty link -> ERROR
            test10: runRuleTest('<table><tr><td>Row</td></tr></table>'), // Table without th -> WARNING
            test11: runRuleTest('<video src="test.mp4" controls></video>'), // Video without captions -> WARNING
            test12: runRuleTest(`
                <!DOCTYPE html>
                <html lang="en">
                <head><title>Accessible Page</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body>
                    <header><nav aria-label="Main"><a href="/">Home</a></nav></header>
                    <main>
                        <h1>Main Section</h1>
                        <img src="logo.png" alt="Company Logo">
                        <label for="search">Search</label>
                        <input type="text" id="search" autocomplete="off">
                        <button type="submit">Submit</button>
                    </main>
                </body>
                </html>
            `) // Accessible sample page -> mostly PASS
        };
        """
        results = driver.execute_script(test_script)

        # Verify Test 1: Image without alt -> ERROR
        t1_issues = results['test1']['issues']
        has_img_err = any(i['ruleId'] == 'IMG_ALT_001' and i['severity'] == 'ERROR' for i in t1_issues)
        assert has_img_err, f"Test 1 failed: {t1_issues}"
        print(" -> Test 1 PASS: Image without alt produces ERROR (IMG_ALT_001)")

        # Verify Test 2: Image with meaningful alt -> PASS
        t2_issues = results['test2']['issues']
        has_img_pass = any(i['severity'] == 'PASS' and i['category'] == 'Images' for i in t2_issues)
        assert has_img_pass, f"Test 2 failed: {t2_issues}"
        print(" -> Test 2 PASS: Image with alt produces PASS")

        # Verify Test 3: Input without label -> ERROR
        t3_issues = results['test3']['issues']
        has_form_err = any(i['ruleId'] == 'FORM_LBL_001' and i['severity'] == 'ERROR' for i in t3_issues)
        assert has_form_err, f"Test 3 failed: {t3_issues}"
        print(" -> Test 3 PASS: Input without label produces ERROR (FORM_LBL_001)")

        # Verify Test 4: Input with associated label -> PASS
        t4_issues = results['test4']['issues']
        has_form_pass = any(i['ruleId'] == 'FORM_LBL_PASS' and i['severity'] == 'PASS' for i in t4_issues)
        assert has_form_pass, f"Test 4 failed: {t4_issues}"
        print(" -> Test 4 PASS: Input with associated label produces PASS (FORM_LBL_PASS)")

        # Verify Test 5: H1 -> H3 -> WARNING
        t5_issues = results['test5']['issues']
        has_jump_warn = any(i['ruleId'] == 'HEAD_JUMP_001' and i['severity'] == 'WARNING' for i in t5_issues)
        assert has_jump_warn, f"Test 5 failed: {t5_issues}"
        print(" -> Test 5 PASS: H1 -> H3 produces WARNING (HEAD_JUMP_001)")

        # Verify Test 6: Missing lang -> ERROR
        t6_issues = results['test6']['issues']
        has_lang_err = any(i['ruleId'] == 'DOC_LANG_001' and i['severity'] == 'ERROR' for i in t6_issues)
        assert has_lang_err, f"Test 6 failed: {t6_issues}"
        print(" -> Test 6 PASS: Missing lang produces ERROR (DOC_LANG_001)")

        # Verify Test 7: Missing title -> ERROR
        t7_issues = results['test7']['issues']
        has_title_err = any(i['ruleId'] == 'DOC_TITLE_001' and i['severity'] == 'ERROR' for i in t7_issues)
        assert has_title_err, f"Test 7 failed: {t7_issues}"
        print(" -> Test 7 PASS: Missing title produces ERROR (DOC_TITLE_001)")

        # Verify Test 8: Empty button -> ERROR
        t8_issues = results['test8']['issues']
        has_btn_err = any(i['ruleId'] == 'BTN_EMPTY_001' and i['severity'] == 'ERROR' for i in t8_issues)
        assert has_btn_err, f"Test 8 failed: {t8_issues}"
        print(" -> Test 8 PASS: Empty button produces ERROR (BTN_EMPTY_001)")

        # Verify Test 9: Empty link -> ERROR
        t9_issues = results['test9']['issues']
        has_link_err = any(i['ruleId'] == 'LINK_EMPTY_001' and i['severity'] == 'ERROR' for i in t9_issues)
        assert has_link_err, f"Test 9 failed: {t9_issues}"
        print(" -> Test 9 PASS: Empty link produces ERROR (LINK_EMPTY_001)")

        # Verify Test 10: Table without th -> WARNING
        t10_issues = results['test10']['issues']
        has_table_warn = any(i['ruleId'] == 'TBL_TH_001' and i['severity'] == 'WARNING' for i in t10_issues)
        assert has_table_warn, f"Test 10 failed: {t10_issues}"
        print(" -> Test 10 PASS: Table without th produces WARNING (TBL_TH_001)")

        # Verify Test 11: Video without captions -> WARNING
        t11_issues = results['test11']['issues']
        has_media_warn = any(i['ruleId'] == 'MEDIA_CAPTIONS_001' and i['severity'] == 'WARNING' for i in t11_issues)
        assert has_media_warn, f"Test 11 failed: {t11_issues}"
        print(" -> Test 11 PASS: Video without captions produces WARNING (MEDIA_CAPTIONS_001)")

        # Verify Test 12: Accessible sample page -> mostly PASS
        t12_summary = results['test12']['summary']
        t12_score = results['test12']['score']
        assert t12_summary['pass_count'] >= 5, f"Expected high pass count: {t12_summary}"
        assert t12_score >= 85, f"Expected score >= 85 for accessible page, got {t12_score}"
        print(f" -> Test 12 PASS: Accessible page score {t12_score}/100 with {t12_summary['pass_count']} passed checks")

        # 3. Test Sample Loader Buttons on UI
        print("\n[Step 3] Testing Poor Accessibility Sample Button in UI...")
        btn_poor = driver.find_element(By.ID, "btn-sample-poor")
        safe_click(btn_poor)
        time.sleep(0.5)

        editor = driver.find_element(By.ID, "html-input-editor")
        editor_text = editor.get_attribute("value")
        assert "TechSolutions Portal" in editor_text
        assert "hero-banner.jpg" in editor_text
        print(" -> Poor sample loaded into editor successfully (Length:", len(editor_text), "chars)")

        # 4. Click [Analyze HTML] and Navigate to Report Page
        print("\n[Step 4] Clicking [Analyze HTML]...")
        btn_analyze = driver.find_element(By.ID, "btn-analyze")
        safe_click(btn_analyze)
        time.sleep(1.0)

        # Should redirect to report.html
        assert "report.html" in driver.current_url
        print(" -> Navigated to Report page:", driver.current_url)

        # Verify score and issues on report page
        wait.until(lambda d: d.find_element(By.ID, "score-number").text.strip() != "--")
        score_el = driver.find_element(By.ID, "score-number")
        score_val = int(score_el.text.strip())
        print(f" -> Poor Sample Audit Score displayed: {score_val}/100")
        assert score_val < 60, f"Poor sample score should be low, got {score_val}"

        # Test Category Filter
        print("\n[Step 5] Testing Category Filtering on Report Page...")
        forms_chip = driver.find_element(By.XPATH, "//button[@data-category='Forms']")
        safe_click(forms_chip)
        time.sleep(0.5)

        # Count cards
        cards = driver.find_elements(By.CSS_SELECTOR, ".issue-card")
        print(f" -> Displaying {len(cards)} issue cards under Forms category.")
        assert len(cards) >= 1

        # Test Inspect Modal
        print("\n[Step 6] Testing Element Inspection Modal...")
        inspect_btn = driver.find_element(By.CSS_SELECTOR, ".btn-inspect-element")
        safe_click(inspect_btn)
        time.sleep(0.5)

        modal = driver.find_element(By.ID, "inspect-modal")
        assert modal.is_displayed()
        print(" -> Code inspect modal opened successfully.")

        close_modal_btn = driver.find_element(By.ID, "btn-close-modal")
        safe_click(close_modal_btn)
        time.sleep(0.3)
        assert not modal.is_displayed()
        print(" -> Code inspect modal closed successfully.")

        # 5. Test Authentication Flow (Login & History)
        print("\n[Step 7] Testing Sign In Flow...")
        driver.get("http://127.0.0.1:5000/login.html")
        btn_auto_fill = driver.find_element(By.ID, "btn-demo-fill")
        safe_click(btn_auto_fill)
        time.sleep(0.3)

        btn_login = driver.find_element(By.ID, "btn-login-submit")
        safe_click(btn_login)
        time.sleep(1.0)

        # Verify redirected to dashboard or authenticated
        print(" -> Login submitted. Current URL:", driver.current_url)
        assert "dashboard.html" in driver.current_url

        # Check user profile name displayed
        user_name_display = driver.find_element(By.ID, "user-name-display")
        print(" -> Authenticated as:", user_name_display.text)

        # 6. Save an Audit to MySQL via UI
        print("\n[Step 8] Running and Saving a New Audit to MySQL...")
        driver.get("http://127.0.0.1:5000/auditor.html")
        btn_good = driver.find_element(By.ID, "btn-sample-good")
        safe_click(btn_good)
        time.sleep(0.5)

        safe_click(driver.find_element(By.ID, "btn-analyze"))
        time.sleep(1.0)
        assert "report.html" in driver.current_url

        btn_save = driver.find_element(By.ID, "btn-save-audit")
        safe_click(btn_save)
        time.sleep(1.0)

        # Accept confirmation alert if present
        try:
            alert = driver.switch_to.alert
            print(" -> Handled browser alert:", alert.text)
            alert.accept()
        except:
            pass

        time.sleep(0.5)
        print(" -> Save button status:", btn_save.text)
        assert "Saved in MySQL" in btn_save.text

        # 7. Verify Saved Audit in History Page
        print("\n[Step 9] Verifying Saved Audit in Audit History Page...")
        driver.get("http://127.0.0.1:5000/history.html")
        time.sleep(1.0)

        rows = driver.find_elements(By.CSS_SELECTOR, "#history-table-body tr")
        print(f" -> Found {len(rows)} audit rows in MySQL history table.")
        assert len(rows) >= 2, f"Expected at least 2 saved audits in MySQL, found {len(rows)}"

        # 8. Reopen Saved Report from History
        print("\n[Step 10] Reopening Saved Report from History...")
        view_link = rows[0].find_element(By.LINK_TEXT, "View Report")
        view_url = view_link.get_attribute("href")
        driver.get(view_url)
        time.sleep(1.0)

        assert "id=" in driver.current_url
        reopened_score = driver.find_element(By.ID, "score-number").text
        print(f" -> Successfully reopened saved MySQL report with ID! Score: {reopened_score}/100")

        print("\n==================================================")
        print("ALL 12 TEST CASES AND E2E BROWSER FLOWS PASSED!")
        print("==================================================")

    finally:
        driver.quit()

if __name__ == '__main__':
    try:
        run_tests()
    except Exception as e:
        print(f"E2E TEST FAILURE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
