import requests
import json
import sys

BASE_URL = 'http://127.0.0.1:5000/api'

def test_all():
    print("[1] Testing Health Endpoint...")
    r = requests.get(f'{BASE_URL}/health')
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print(" -> Health check PASS:", r.json())

    print("\n[2] Testing Demo User Login...")
    login_payload = {
        'email': 'auditor@a11y.dev',
        'password': 'Password123!'
    }
    r = requests.post(f'{BASE_URL}/auth/login', json=login_payload)
    assert r.status_code == 200, f"Login failed: {r.text}"
    login_data = r.json()
    assert login_data.get('success') is True
    token = login_data.get('token')
    assert token, "Token missing in login response"
    print(" -> Demo login PASS. User:", login_data['user']['email'])

    headers = {'Authorization': f'Bearer {token}'}

    print("\n[3] Testing GET /api/auth/me...")
    r = requests.get(f'{BASE_URL}/auth/me', headers=headers)
    assert r.status_code == 200, f"Get me failed: {r.text}"
    me_data = r.json()
    assert me_data.get('success') is True
    print(" -> Profile retrieved PASS. Audits:", me_data['stats']['total_audits'])

    print("\n[4] Testing User Registration...")
    import random
    rand_email = f"testuser_{random.randint(1000, 9999)}@example.com"
    reg_payload = {
        'name': 'Test Engineer',
        'email': rand_email,
        'password': 'TestPassword123!'
    }
    r = requests.post(f'{BASE_URL}/auth/register', json=reg_payload)
    assert r.status_code == 201, f"Registration failed: {r.text}"
    reg_data = r.json()
    new_token = reg_data.get('token')
    assert new_token, "Token missing in registration"
    new_headers = {'Authorization': f'Bearer {new_token}'}
    print(f" -> Registration PASS for {rand_email}")

    print("\n[5] Testing POST /api/audits (Create Audit)...")
    audit_payload = {
        'page_name': 'Automated Test Verification Page',
        'score': 78,
        'summary': {
            'critical_count': 1,
            'error_count': 2,
            'warning_count': 1,
            'info_count': 1,
            'pass_count': 12
        },
        'issues': [
            {
                'rule_id': 'IMG_ALT_001',
                'category': 'Images',
                'severity': 'ERROR',
                'message': 'Image is missing alternative text',
                'element_html': '<img src="sample.jpg">',
                'explanation': 'Screen reader users cannot identify image content.',
                'recommendation': '<img src="sample.jpg" alt="Sample photograph">',
                'wcag_reference': '1.1.1 Non-text Content'
            },
            {
                'rule_id': 'FORM_LBL_001',
                'category': 'Forms',
                'severity': 'ERROR',
                'message': 'Input control has no associated label',
                'element_html': '<input type="text" id="uname">',
                'explanation': 'Unlabeled form controls are inaccessible to screen readers.',
                'recommendation': '<label for="uname">Username</label><input type="text" id="uname">',
                'wcag_reference': '1.3.1 Info and Relationships'
            }
        ]
    }
    r = requests.post(f'{BASE_URL}/audits', json=audit_payload, headers=new_headers)
    assert r.status_code == 201, f"Create audit failed: {r.text}"
    audit_res = r.json()
    created_id = audit_res.get('audit_id')
    assert created_id, "audit_id missing"
    print(f" -> Create audit PASS. Created ID: {created_id}")

    print("\n[6] Testing GET /api/audits (List Audits)...")
    r = requests.get(f'{BASE_URL}/audits', headers=new_headers)
    assert r.status_code == 200, f"List audits failed: {r.text}"
    list_res = r.json()
    assert list_res.get('count') == 1, f"Expected 1 audit, got {list_res.get('count')}"
    print(" -> List audits PASS. Count:", list_res['count'])

    print(f"\n[7] Testing GET /api/audits/{created_id}...")
    r = requests.get(f'{BASE_URL}/audits/{created_id}', headers=new_headers)
    assert r.status_code == 200, f"Get audit failed: {r.text}"
    single_audit = r.json().get('audit')
    assert single_audit['score'] == 78, f"Score mismatch: {single_audit['score']}"
    print(" -> Get single audit PASS. Score:", single_audit['score'])

    print(f"\n[8] Testing GET /api/audits/{created_id}/issues...")
    r = requests.get(f'{BASE_URL}/audits/{created_id}/issues', headers=new_headers)
    assert r.status_code == 200, f"Get audit issues failed: {r.text}"
    issues_res = r.json()
    assert len(issues_res.get('issues', [])) == 2, f"Expected 2 issues, got {len(issues_res.get('issues', []))}"
    print(" -> Get audit issues PASS. Total issues retrieved:", len(issues_res['issues']))

    print(f"\n[9] Testing DELETE /api/audits/{created_id}...")
    r = requests.delete(f'{BASE_URL}/audits/{created_id}', headers=new_headers)
    assert r.status_code == 200, f"Delete audit failed: {r.text}"
    print(" -> Delete audit PASS.")

    # Verify deletion
    r = requests.get(f'{BASE_URL}/audits/{created_id}', headers=new_headers)
    assert r.status_code == 404, f"Expected 404 after deletion, got {r.status_code}"
    print(" -> Verified audit deleted (404 PASS).")

    print("\n==================================================")
    print("ALL REST API ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == '__main__':
    try:
        test_all()
    except Exception as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
