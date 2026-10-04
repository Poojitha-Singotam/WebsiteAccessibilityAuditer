from database import get_db

class AuditService:
    @staticmethod
    def create_audit(user_id, data):
        page_name = (data.get('page_name') or 'Untitled Audit').strip()[:255]
        score = max(0, min(100, int(data.get('score', 100))))
        summary = data.get('summary', {})
        issues = data.get('issues', [])

        db = get_db()
        try:
            with db.cursor() as cursor:
                # 1. Insert audit record
                cursor.execute(
                    "INSERT INTO audits (user_id, page_name, score) VALUES (%s, %s, %s)",
                    (user_id, page_name, score)
                )
                audit_id = cursor.lastrowid

                # 2. Insert summary
                crit = int(summary.get('critical_count', 0))
                err = int(summary.get('error_count', 0))
                warn = int(summary.get('warning_count', 0))
                info = int(summary.get('info_count', 0))
                passed = int(summary.get('pass_count', 0))

                cursor.execute("""
                    INSERT INTO audit_summary (audit_id, critical_count, error_count, warning_count, info_count, pass_count)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (audit_id, crit, err, warn, info, passed))

                # 3. Bulk insert issues
                if issues:
                    issue_records = []
                    for issue in issues:
                        issue_records.append((
                            audit_id,
                            str(issue.get('rule_id', 'UNKNOWN'))[:50],
                            str(issue.get('category', 'General'))[:50],
                            str(issue.get('severity', 'INFO')).upper(),
                            str(issue.get('message', ''))[:255],
                            str(issue.get('element_html', '')),
                            str(issue.get('explanation', '')),
                            str(issue.get('recommendation', '')),
                            str(issue.get('wcag_reference', ''))[:100]
                        ))
                    
                    cursor.executemany("""
                        INSERT INTO audit_issues 
                        (audit_id, rule_id, category, severity, message, element_html, explanation, recommendation, wcag_reference)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, issue_records)

                return audit_id
        finally:
            db.close()

    @staticmethod
    def get_user_audits(user_id):
        db = get_db()
        try:
            with db.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        a.id,
                        a.page_name,
                        a.score,
                        a.created_at,
                        s.critical_count,
                        s.error_count,
                        s.warning_count,
                        s.info_count,
                        s.pass_count
                    FROM audits a
                    LEFT JOIN audit_summary s ON a.id = s.audit_id
                    WHERE a.user_id = %s
                    ORDER BY a.created_at DESC
                """, (user_id,))
                rows = cursor.fetchall()
                for r in rows:
                    if r.get('created_at'):
                        r['created_at'] = r['created_at'].isoformat()
                return rows
        finally:
            db.close()

    @staticmethod
    def get_audit_by_id(audit_id, user_id=None):
        db = get_db()
        try:
            with db.cursor() as cursor:
                if user_id:
                    cursor.execute("""
                        SELECT 
                            a.id,
                            a.user_id,
                            a.page_name,
                            a.score,
                            a.created_at,
                            s.critical_count,
                            s.error_count,
                            s.warning_count,
                            s.info_count,
                            s.pass_count
                        FROM audits a
                        LEFT JOIN audit_summary s ON a.id = s.audit_id
                        WHERE a.id = %s AND a.user_id = %s
                    """, (audit_id, user_id))
                else:
                    cursor.execute("""
                        SELECT 
                            a.id,
                            a.user_id,
                            a.page_name,
                            a.score,
                            a.created_at,
                            s.critical_count,
                            s.error_count,
                            s.warning_count,
                            s.info_count,
                            s.pass_count
                        FROM audits a
                        LEFT JOIN audit_summary s ON a.id = s.audit_id
                        WHERE a.id = %s
                    """, (audit_id,))
                
                audit = cursor.fetchone()
                if audit and audit.get('created_at'):
                    audit['created_at'] = audit['created_at'].isoformat()
                return audit
        finally:
            db.close()

    @staticmethod
    def get_audit_issues(audit_id, user_id=None):
        db = get_db()
        try:
            with db.cursor() as cursor:
                # Validate ownership if user_id given
                if user_id:
                    cursor.execute("SELECT id FROM audits WHERE id = %s AND user_id = %s", (audit_id, user_id))
                    if not cursor.fetchone():
                        return None

                cursor.execute("""
                    SELECT 
                        id,
                        audit_id,
                        rule_id,
                        category,
                        severity,
                        message,
                        element_html,
                        explanation,
                        recommendation,
                        wcag_reference
                    FROM audit_issues
                    WHERE audit_id = %s
                    ORDER BY 
                        CASE severity 
                            WHEN 'CRITICAL' THEN 1
                            WHEN 'ERROR' THEN 2
                            WHEN 'WARNING' THEN 3
                            WHEN 'INFO' THEN 4
                            WHEN 'PASS' THEN 5
                            ELSE 6
                        END,
                        id ASC
                """, (audit_id,))
                return cursor.fetchall()
        finally:
            db.close()

    @staticmethod
    def delete_audit(audit_id, user_id):
        db = get_db()
        try:
            with db.cursor() as cursor:
                cursor.execute("SELECT id FROM audits WHERE id = %s AND user_id = %s", (audit_id, user_id))
                if not cursor.fetchone():
                    return False

                cursor.execute("DELETE FROM audits WHERE id = %s AND user_id = %s", (audit_id, user_id))
                return True
        finally:
            db.close()
