import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { PlusIcon } from '../../../components/super-admin/Icons';
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

export const AdminManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');
  const [staffList, setStaffList] = useState<AdminUser[]>([]);
  const [auditLogs] = useState<AuditLogEntry[]>(mockAuditLogs); // unbacked — see file comment
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

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
    };
  }, []);

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
  };

  const staffColumns: ColumnDef<AdminUser>[] = [
    {
      header: 'Admin Name',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-dark)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 'var(--font-size-xs)'
            }}
          >
            {row.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{row.name}</span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.email}</span>
          </div>
        </div>
      )
    },
    {
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

  const auditColumns: ColumnDef<AuditLogEntry>[] = [
    { header: 'Timestamp', accessorKey: 'createdAt', width: '160px' },
    {
      header: 'Admin Actor',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{row.adminName}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.adminEmail}</span>
        </div>
      )
    },
    {
      header: 'Action Taken',
      cell: (row) => <span className="admin-badge badge-purple">{row.action}</span>
    },
    { header: 'Target Type', accessorKey: 'targetType' },
    { header: 'State Diff Summary', accessorKey: 'diffSummary' },
    { header: 'IP Address', accessorKey: 'ipAddress' }
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
        />
      )}

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
            </label>
            <input
              type="email"
              className="admin-input"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div>
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
          </div>
        </form>
      </ActionModal>

      <ConfirmDialog
        isOpen={isRevokeDialogOpen}
        onClose={() => setIsRevokeDialogOpen(false)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Admin Access"
        message={`Are you sure you want to permanently delete the admin account for ${targetStaff?.name} (${targetStaff?.email})?`}
        confirmLabel="Revoke & Delete"
        isDangerous={true}
      />
    </div>
  );
};

export default AdminManagement;
