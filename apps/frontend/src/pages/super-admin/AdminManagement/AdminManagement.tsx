<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> origin/main
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { PlusIcon } from '../../../components/super-admin/Icons';
<<<<<<< HEAD
import { adminApi } from '../../../services/api/super-admin/adminApi';
import { ApiError } from '../../../services/api/httpClient';
import type { AdminUser } from '../../../types/super-admin';
import { mockAuditLogs, type AuditLogEntry } from '../../../mock/adminMockData';

/**
 * @file AdminManagement.tsx
 * @description
 * "Staff" tab is real: it lists real USERS rows with role === 'admin' via
 * `/api/admin/users`, and invite/revoke map onto real
 * createUser({role:'admin'}) / deleteUser calls.
 *
 * The permission-bitmask, 2FA-enrolled, and tiered-role (OWNER/
 * FINANCIAL_ADMIN/SUPPORT_ADMIN/...) concepts from the old mock do NOT exist
 * on the schema — Role is a flat enum with a single "admin" value, no
 * per-admin permissions table. Those UI affordances have been dropped from
 * the invite form (no permission picker, no role-tier picker) since there is
 * nothing real to persist them to.
 *
 * The "Security & Audit Log Trail" tab has NO backing table anywhere in the
 * schema (no audit-log model) — it is left on its original mock data
 * unmodified; do not treat it as live data.
 */
=======
import { useToast } from '../../../components/super-admin/Toast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { adminApi } from '../../../services/api/admin/adminApi';

export interface AdminStaff {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'SUPER_ADMIN' | 'FINANCIAL_ADMIN' | 'SUPPORT_ADMIN' | 'CONTENT_MODERATOR' | 'AUDITOR';
  permissions: string[];
  isTwoFactorEnabled: boolean;
  lastLogin: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

export interface AuditLogEntry {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  diffSummary: string;
  ipAddress: string;
  createdAt: string;
}

interface GeneratedInvite {
  email: string;
  role: string;
  assignedPassword: string;
  inviteLink: string;
  token: string;
  expiresAt: string;
}
>>>>>>> origin/main

export const AdminManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');
<<<<<<< HEAD
  const [staffList, setStaffList] = useState<AdminUser[]>([]);
  const [auditLogs] = useState<AuditLogEntry[]>(mockAuditLogs); // unbacked — see file comment
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
=======
  const [staffList, setStaffList] = useState<AdminStaff[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
>>>>>>> origin/main

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

<<<<<<< HEAD
  const [targetStaff, setTargetStaff] = useState<AdminUser | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const users = await adminApi.listUsers();
        if (!cancelled) setStaffList(users.filter((u) => u.role === 'admin'));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load admin staff.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
=======
  // Generated Link Modal State
  const [generatedInvite, setGeneratedInvite] = useState<GeneratedInvite | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Revoke Dialog State
  const [targetStaff, setTargetStaff] = useState<AdminStaff | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStaffAndLogs() {
      const [staffData, logData] = await Promise.all([
        adminApi.getAdminStaff(),
        adminApi.getAuditLogs()
      ]);
      if (isMounted) {
        setStaffList(staffData);
        setAuditLogs(logData);
      }
    }
    loadStaffAndLogs();
    return () => { isMounted = false; };
  }, []);

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
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const res = await adminApi.inviteAdmin(inviteEmail, inviteRole, selectedPermissions);

    const newStaff: AdminStaff = {
      id: `adm-${Date.now()}`,
      name: inviteEmail.split('@')[0] || 'Admin',
      email: inviteEmail,
      role: inviteRole,
      permissions: selectedPermissions,
      isTwoFactorEnabled: false,
      lastLogin: 'Never (Invited)',
      status: 'INVITED'
>>>>>>> origin/main
    };
  }, []);

<<<<<<< HEAD
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim() || !invitePassword.trim()) return;
    setActionError(null);
    try {
      const created = await adminApi.createUser({
        name: inviteName,
        email: inviteEmail,
        password: invitePassword,
        role: 'admin'
      });
      setStaffList((prev) => [created, ...prev]);
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to create admin user.');
    }
  };

  const handleRevokeConfirm = async () => {
    if (!targetStaff) return;
    setActionError(null);
    try {
      await adminApi.deleteUser(targetStaff.userId);
      setStaffList((prev) => prev.filter((s) => s.userId !== targetStaff.userId));
      setIsRevokeDialogOpen(false);
      setTargetStaff(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to revoke admin access.');
      setIsRevokeDialogOpen(false);
    }
=======
    setStaffList([newStaff, ...staffList]);
    setIsInviteModalOpen(false);

    if (res) {
      setGeneratedInvite(res);
      setIsLinkModalOpen(true);
    }
    setInviteEmail('');
    toast.success('Invitation Token Dispatched', `Cryptographic 48h token issued for ${inviteEmail}`);
  };

  const handleCopyInviteDetails = () => {
    if (!generatedInvite) return;
    const text = `👑 GigsForGigs Administrative Invitation\n\nYou have been provisioned as a ${generatedInvite.role} on GigsForGigs.\n\n🔗 Activation Link: ${generatedInvite.inviteLink}\n📧 Email: ${generatedInvite.email}\n🔑 Assigned Password: ${generatedInvite.assignedPassword}\n\n*Note: This cryptographic activation link expires in 48 hours.*`;
    navigator.clipboard.writeText(text);
    toast.info('Copied to Clipboard', 'Invitation link and credentials copied.');
  };

  const handleRevokeConfirm = async () => {
    if (!targetStaff) return;
    await adminApi.revokeAdminSession(targetStaff.id);
    setStaffList(staffList.filter((s) => s.id !== targetStaff.id));
    toast.warning('Admin Access Revoked', `All active JWT sessions for ${targetStaff.name} were invalidated.`);
    setIsRevokeDialogOpen(false);
    setTargetStaff(null);
>>>>>>> origin/main
  };

  const staffColumns: ColumnDef<AdminUser>[] = [
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
<<<<<<< HEAD
      header: 'Joined',
      cell: (row) => new Date(row.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <button
          className="admin-btn admin-btn-danger admin-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            setActionError(null);
            setTargetStaff(row);
            setIsRevokeDialogOpen(true);
          }}
        >
          Revoke Access
        </button>
      )
    }
  ];

=======
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
            row.permissions.slice(0, 3).map((p) => (
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
          <button
            onClick={() => {
              setTargetStaff(row);
              setIsRevokeDialogOpen(true);
            }}
            className="admin-btn admin-btn-danger"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            Revoke Access
          </button>
        );
      }
    }
  ];

  // Audit Logs Table Columns
>>>>>>> origin/main
  const auditColumns: ColumnDef<AuditLogEntry>[] = [
    {
      header: 'Timestamp',
      accessorKey: 'createdAt'
    },
    {
      header: 'Actor',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.adminName}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.ipAddress}</span>
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
          {row.targetType} ({row.targetId})
        </span>
      )
    },
    {
      header: 'Diff Summary',
      accessorKey: 'diffSummary'
    }
  ];

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>Loading admin staff…</div>;
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-lg)', color: 'var(--color-danger-text, #c5221f)' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
<<<<<<< HEAD
      {actionError && (
        <div className="admin-badge badge-danger" style={{ width: '100%', padding: '8px 12px' }}>
          {actionError}
        </div>
      )}

      <AdminTabs
        tabs={[
          { id: 'staff', label: 'Admin Staff Directory', count: staffList.length },
          { id: 'audit', label: 'Security & Audit Log Trail (unbacked, mock)', count: auditLogs.length }
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as 'staff' | 'audit')}
      />

      {activeTab === 'staff' && (
        <DataTable
          title="Administrative Staff"
          columns={staffColumns}
          data={staffList}
          pageSize={6}
          searchPlaceholder="Search admin staff by name or email..."
          actions={
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setIsInviteModalOpen(true)}>
              <PlusIcon size={16} /> Add Admin User
            </button>
          }
=======
      {/* Tab Switcher & Invite Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <AdminTabs
          tabs={[
            { id: 'staff', label: 'Admin Staff & Provisioning', count: staffList.length },
            { id: 'audit', label: 'SOC-2 Immutable Audit Trail', count: auditLogs.length }
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
>>>>>>> origin/main
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

<<<<<<< HEAD
      {activeTab === 'audit' && (
        <DataTable
          title="Administrative Audit Trail (mock data — no backing table)"
          columns={auditColumns}
          data={auditLogs}
          pageSize={8}
          searchPlaceholder="Filter audit records..."
        />
      )}

      <ActionModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Create Admin User"
        subtitle="Creates a real USERS row with role = admin."
        width="480px"
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleSendInvite}>
              Create
            </button>
          </>
        }
      >
        <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              NAME
            </label>
            <input className="admin-input" value={inviteName} onChange={(e) => setInviteName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              EMAIL
=======
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
>>>>>>> origin/main
            </label>
            <input
              type="email"
              required
              className="admin-input"
<<<<<<< HEAD
=======
              placeholder="e.g. finance.lead@gigsforgigs.internal"
>>>>>>> origin/main
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
<<<<<<< HEAD
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              TEMPORARY PASSWORD
            </label>
            <input
              type="password"
              className="admin-input"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              minLength={6}
              required
            />
=======
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '4px' }}>
              Administrative Role Tier
            </label>
            <select
              className="admin-select"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
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
              Granular Permission Bitmask
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
>>>>>>> origin/main
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

<<<<<<< HEAD
=======
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
              ✓ Cryptographic invitation token recorded in database. The invited user must use this activation link and assigned password to activate their Super Admin seat.
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
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Assigned Master Password</span>
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
>>>>>>> origin/main
      <ConfirmDialog
        isOpen={isRevokeDialogOpen}
        title={`Revoke Access for ${targetStaff?.name}?`}
        message="This action will immediately invalidate all active JWT tokens for this user via tokenVersion increment, terminating all existing browser sessions and API keys."
        confirmLabel="Revoke All Access"
        isDanger={true}
        onConfirm={handleRevokeConfirm}
<<<<<<< HEAD
        title="Revoke Admin Access"
        message={`Are you sure you want to permanently delete the admin account for ${targetStaff?.name} (${targetStaff?.email})?`}
        confirmLabel="Revoke & Delete"
        isDangerous={true}
=======
        onCancel={() => setIsRevokeDialogOpen(false)}
>>>>>>> origin/main
      />
    </div>
  );
};

export default AdminManagement;
