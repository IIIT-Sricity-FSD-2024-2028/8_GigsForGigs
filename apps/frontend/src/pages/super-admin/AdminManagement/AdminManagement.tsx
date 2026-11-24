import React, { useState, useEffect } from 'react';
import { Loader } from '../../../components/common/Loader';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { PlusIcon } from '../../../components/super-admin/Icons';
import { useToast } from '../../../components/super-admin/useToast';
import { TIER_PERMISSIONS, useAuth } from '../../../context/AuthContext/AuthContext';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  clearAdminInvite,
  fetchAdminStaff,
  fetchAuditLogs,
  inviteAdmin,
  removeAdmin
} from '../../../store/admin/adminSlice';
import {
  selectAdminStaff,
  selectAuditLogs,
  selectAdminStaffRequest,
  selectAuditLogsRequest,
  selectLatestCreatedInvite
} from '../../../store/admin/selectors';
import type { AdminStaff, AuditLogEntry } from '../../../store/admin/types';
import { extractErrorMessage } from '../../../utils/adminAccess';

export type { AdminStaff, AuditLogEntry };

export const AdminManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const staffList = useAppSelector(selectAdminStaff);
  const auditLogs = useAppSelector(selectAuditLogs);
  const staffRequest = useAppSelector(selectAdminStaffRequest);
  const auditRequest = useAppSelector(selectAuditLogsRequest);
  const generatedInvite = useAppSelector(selectLatestCreatedInvite);

  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'SUPER_ADMIN' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR'>('SUPER_ADMIN');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(TIER_PERMISSIONS.SUPER_ADMIN);

  // Generated Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Revoke Dialog State
  const [targetStaff, setTargetStaff] = useState<AdminStaff | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminStaff());
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  const availablePermissions = [
    { key: 'users:read', label: 'View Users & Profiles' },
    { key: 'users:ban', label: 'Suspend & Ban Users' },
    { key: 'payments:read', label: 'View Financial Ledger' },
    { key: 'payments:refund', label: 'Execute Escrow Refunds' },
    { key: 'payments:release', label: 'Force Release Escrow' },
    { key: 'disputes:resolve', label: 'Arbitrate Disputes' },
    { key: 'reviews:moderate', label: 'Moderate & Hide Reviews' },
    { key: 'settings:manage', label: 'Modify Platform Settings' },
    { key: 'admins:invite', label: 'Invite Delegate Admins' }
  ];

  const handleTogglePermission = (key: string) => {
    setSelectedPermissions((prev: string[]) =>
      prev.includes(key) ? prev.filter((p: string) => p !== key) : [...prev, key]
    );
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const targetEmail = inviteEmail.trim();
    try {
      await dispatch(
        inviteAdmin({
          email: targetEmail,
          role: inviteRole,
          permissions: selectedPermissions
        })
      ).unwrap();

      setIsInviteModalOpen(false);
      setIsLinkModalOpen(true);
      setInviteEmail('');
      toast.success('Invitation Created', `Signed 48h link issued for ${targetEmail}. Share it yourself; nothing is emailed.`);
    } catch (err: unknown) {
      toast.error('Invite Failed', extractErrorMessage(err, 'Could not create the invitation.'));
    }
  };

  const handleCopyInviteDetails = () => {
    if (!generatedInvite) return;
    const text = `👑 GigsForGigs Administrative Invitation\n\nYou have been provisioned as a ${generatedInvite.role} on GigsForGigs.\n\n🔗 Activation Link: ${generatedInvite.inviteLink}\n📧 Email: ${generatedInvite.email}\n🔑 Assigned Password: ${generatedInvite.assignedPassword}\n\n*Note: This cryptographic activation link expires in 48 hours.*`;
    navigator.clipboard.writeText(text);
    toast.info('Copied to Clipboard', 'Invitation link and credentials copied.');
  };

  const handleRevokeConfirm = async () => {
    if (!targetStaff) return;
    try {
      await dispatch(removeAdmin(targetStaff.id)).unwrap();
      toast.warning('Admin Access Revoked', `${targetStaff.name} was removed and their sessions no longer work.`);
      setIsRevokeDialogOpen(false);
      setTargetStaff(null);
    } catch (err: unknown) {
      toast.error('Revoke Failed', extractErrorMessage(err, 'Could not remove this admin.'));
    }
  };

  const staffColumns: ColumnDef<AdminStaff>[] = [
    {
      header: 'Admin Name',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.email}</span>
        </div>
      )
    },
    {
      header: 'Tier / Role',
      cell: (row) => <StatusBadge status={row.role} />
    },
    {
      header: 'Permissions Granted',
      cell: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
          {row.permissions.includes('*') ? (
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>★ Full Root Platform Authority</span>
          ) : (
            row.permissions.slice(0, 3).map((p: string) => (
              <span
                key={p}
                style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  backgroundColor: 'var(--color-bg-light)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-dark)'
                }}
              >
                {p}
              </span>
            ))
          )}
          {row.permissions.length > 3 && !row.permissions.includes('*') && (
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>+{row.permissions.length - 3} more</span>
          )}
        </div>
      )
    },
    {
      header: '2FA Security',
      cell: (row) => (
        <span style={{ fontSize: '11px', fontWeight: 700, color: row.isTwoFactorEnabled ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
          {row.isTwoFactorEnabled ? '🛡️ Enabled' : '⚠️ Disabled'}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      cell: (row) => {
        if (row.role === 'OWNER') {
          return <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Immutable</span>;
        }
        if (!hasPermission('admins:invite')) {
          return <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Read Only (Auditor)</span>;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {row.status === 'INVITED' && generatedInvite?.email === row.email && (
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
              >
                🔗 View Link & Password
              </button>
            )}
            <button
              onClick={() => {
                setTargetStaff(row);
                setIsRevokeDialogOpen(true);
              }}
              className="admin-btn admin-btn-danger"
              style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              Revoke
            </button>
          </div>
        );
      }
    }
  ];

  // Audit Logs Table Columns
  const auditColumns: ColumnDef<AuditLogEntry>[] = [
    {
      header: 'Timestamp',
      accessorKey: 'createdAt'
    },
    {
      header: 'Actor',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.adminEmail}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.ipAddress ?? '—'}</span>
        </div>
      )
    },
    {
      header: 'Action Executed',
      cell: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>{row.action}</span>
    },
    {
      header: 'Target Entity',
      cell: (row) => (
        <span style={{ fontSize: '11px', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
          {row.target}
        </span>
      )
    },
    {
      header: 'Details',
      cell: (row) => row.details ?? '—'
    }
  ];

  const isLoading = (activeTab === 'staff' ? staffRequest.status === 'loading' : auditRequest.status === 'loading') &&
    (activeTab === 'staff' ? staffList.length === 0 : auditLogs.length === 0);

  const error = activeTab === 'staff' ? staffRequest.error : auditRequest.error;

  if (isLoading) {
    return <Loader label="Loading admin data..." />;
  }

  if (error && (activeTab === 'staff' ? staffList.length === 0 : auditLogs.length === 0)) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Tab Switcher & Invite Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <AdminTabs
          tabs={[
            { id: 'staff', label: 'Admin Staff & Provisioning', count: staffList.length },
            { id: 'audit', label: 'Append-Only Audit Trail', count: auditLogs.length }
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'staff' | 'audit')}
        />

        {activeTab === 'staff' && hasPermission('admins:invite') && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="admin-btn admin-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusIcon size={16} />
            <span>Invite Delegate Admin</span>
          </button>
        )}
      </div>

      {/* Persistent Active Generated Credentials Banner on the page */}
      {generatedInvite && (
        <div
          className="admin-card"
          style={{
            padding: 'var(--spacing-lg)',
            borderLeft: '4px solid var(--color-success, #519e8a)',
            backgroundColor: '#F0F9F6',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#084875', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔗 Active Cryptographic Access Link & Generated Password</span>
                <span style={{ fontSize: '11px', backgroundColor: '#519e8a', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Active (Expires in 48h)</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555' }}>
                Share these one-time administrative credentials with the delegate administrator:
              </p>
            </div>
            <button
              onClick={() => dispatch(clearAdminInvite())}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontWeight: 700, fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px', backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #DCE3E8' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Recipient Email</span>
              <div style={{ fontWeight: 700, color: '#111', fontSize: '13px' }}>{generatedInvite.email}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Role</span>
              <div><StatusBadge status={generatedInvite.role} /></div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>One-Time Password</span>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '15px', color: '#084875' }}>
                {generatedInvite.assignedPassword}
              </div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Signed One-Time Access Link</span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                type="text"
                readOnly
                className="admin-input"
                value={generatedInvite.inviteLink}
                style={{ fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#fafafa' }}
              />
              <button
                onClick={handleCopyInviteDetails}
                className="admin-btn admin-btn-primary"
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                📋 Copy Link & Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      {activeTab === 'staff' ? (
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <DataTable
            data={staffList}
            columns={staffColumns}
            pageSize={10}
            searchPlaceholder="Search admin staff by name or email..."
          />
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 'var(--spacing-lg)' }}>
          <DataTable
            data={auditLogs}
            columns={auditColumns}
            pageSize={10}
            searchPlaceholder="Filter audit trail by action or actor..."
          />
        </div>
      )}

      {/* Cryptographic Invitation Modal */}
      <ActionModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Issue Cryptographic Delegate Admin Invitation"
      >
        <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Delegate Email Address
            </label>
            <input
              type="email"
              required
              className="admin-input"
              placeholder="e.g. finance.lead@gigsforgigs.internal"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Administrative Role Tier
            </label>
            <select
              className="admin-select"
              value={inviteRole}
              onChange={(e) => {
                const newRole = e.target.value as typeof inviteRole;
                setInviteRole(newRole);
                setSelectedPermissions(TIER_PERMISSIONS[newRole]);
              }}
            >
              <option value="SUPER_ADMIN">👑 Super Admin (Full Governance)</option>
              <option value="FINANCIAL_ADMIN">💳 Financial Admin (Escrow & Ledgers)</option>
              <option value="SUPPORT_ADMIN">🎧 Support Admin (Disputes & Arbitration)</option>
              <option value="CONTENT_MODERATOR">🛡️ Content Moderator (Reviews & Profiles)</option>
              <option value="AUDITOR">📋 Auditor (Read-Only Compliance)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '6px' }}>
              Granular Permissions
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
              {availablePermissions.map((p) => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(p.key)}
                    onChange={() => handleTogglePermission(p.key)}
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="admin-btn admin-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
            >
              Generate Cryptographic Link
            </button>
          </div>
        </form>
      </ActionModal>

      {/* Shareable Cryptographic Invite Link Display Modal */}
      <ActionModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="🔗 Shareable Admin Activation Link & Credentials"
        maxWidth="640px"
      >
        {generatedInvite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div
              style={{
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-success-text)',
                fontWeight: 600
              }}
            >
              ✓ Admin seat created with status INVITED. The invited user must use this activation link and assigned password to activate their Super Admin seat.
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-light)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Recipient Email</span>
                <div style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{generatedInvite.email}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Assigned Role</span>
                <div><StatusBadge status={generatedInvite.role} /></div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>One-Time Password</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '15px', color: 'var(--color-primary-dark)' }}>
                  {generatedInvite.assignedPassword}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Shareable Activation Link (Contains Email & Token Hash)</span>
                <input
                  type="text"
                  readOnly
                  className="admin-input"
                  value={generatedInvite.inviteLink}
                  style={{ fontFamily: 'monospace', fontSize: '11px', marginTop: '2px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="admin-btn admin-btn-secondary"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleCopyInviteDetails}
                className="admin-btn admin-btn-primary"
              >
                📋 Copy Invite Link & Credentials
              </button>
            </div>
          </div>
        )}
      </ActionModal>

      {/* Revoke Session Confirmation */}
      <ConfirmDialog
        isOpen={isRevokeDialogOpen}
        title={`Remove ${targetStaff?.name}?`}
        message="This deletes the admin account. Its sessions stop working on the next request because authGuard re-reads the account every time. Its audit trail is kept."
        confirmLabel="Remove Admin"
        isDanger={true}
        onConfirm={handleRevokeConfirm}
        onCancel={() => setIsRevokeDialogOpen(false)}
      />
    </div>
  );
};

export default AdminManagement;
