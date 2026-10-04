from flask import Blueprint, request, jsonify
from auth.routes import token_required
from services.audit_service import AuditService

audits_bp = Blueprint('audits', __name__)

@audits_bp.route('', methods=['POST'])
@token_required
def create_audit(current_user):
    """Save an accessibility audit and its detected issues."""
    data = request.get_json() or {}
    
    if not data.get('page_name'):
        return jsonify({'success': False, 'message': 'Page name or URL label is required.'}), 400

    try:
        audit_id = AuditService.create_audit(current_user['id'], data)
        return jsonify({
            'success': True,
            'message': 'Audit results saved successfully to database.',
            'audit_id': audit_id
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to save audit: {str(e)}'}), 500

@audits_bp.route('', methods=['GET'])
@token_required
def get_audits(current_user):
    """Retrieve audit history list for the current user."""
    try:
        audits = AuditService.get_user_audits(current_user['id'])
        return jsonify({
            'success': True,
            'audits': audits,
            'count': len(audits)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch audits: {str(e)}'}), 500

@audits_bp.route('/<int:audit_id>', methods=['GET'])
@token_required
def get_audit(current_user, audit_id):
    """Retrieve single audit details and summary."""
    try:
        audit = AuditService.get_audit_by_id(audit_id, user_id=current_user['id'])
        if not audit:
            return jsonify({'success': False, 'message': 'Audit not found or access denied.'}), 404

        return jsonify({
            'success': True,
            'audit': audit
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to retrieve audit: {str(e)}'}), 500

@audits_bp.route('/<int:audit_id>/issues', methods=['GET'])
@token_required
def get_audit_issues(current_user, audit_id):
    """Retrieve all detected accessibility issues for a specific audit."""
    try:
        issues = AuditService.get_audit_issues(audit_id, user_id=current_user['id'])
        if issues is None:
            return jsonify({'success': False, 'message': 'Audit not found or access denied.'}), 404

        return jsonify({
            'success': True,
            'audit_id': audit_id,
            'issues': issues,
            'total': len(issues)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to retrieve audit issues: {str(e)}'}), 500

@audits_bp.route('/<int:audit_id>', methods=['DELETE'])
@token_required
def delete_audit(current_user, audit_id):
    """Delete an audit record and its associated summary and issues."""
    try:
        deleted = AuditService.delete_audit(audit_id, user_id=current_user['id'])
        if not deleted:
            return jsonify({'success': False, 'message': 'Audit not found or access denied.'}), 404

        return jsonify({
            'success': True,
            'message': 'Audit and associated issues deleted successfully.'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to delete audit: {str(e)}'}), 500
