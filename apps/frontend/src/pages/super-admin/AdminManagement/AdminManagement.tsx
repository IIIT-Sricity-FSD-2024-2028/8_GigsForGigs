import React, { useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { PlusIcon } from '../../../components/super-admin/Icons';
import {
  mockAdminStaff,
  mockAuditLogs,
  type AdminStaff,
  type AuditLogEntry
} from '../../../mock/adminMockData';

/**
 * @file AdminManagement.tsx
 * @description
 * Multi-tier administrative staff governance view.
 * Features cryptographic time-limited invitation engine, permission bitmask editor,
 * session revocation, and an immutable SOC-2 compliant audit log inspector.
 */

import { useToast } from '../../../components/super-admin/Toast';

export const AdminManagement: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');
  const [staffList, setStaffList] = useState<AdminStaff[]>(mockAdminStaff);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);

  // Invitation Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminStaff['role']>('SUPPORT_ADMIN');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'disputes:read',
    'disputes:resolve',
    'reviews:moderate'
  ]);

  // Revoke Dialog State
  const [targetStaff, setTargetStaff] = useState<AdminStaff | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);

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

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newStaff: AdminStaff = {
      id: `adm-${Date.now()}`,
      name: inviteEmail.split('@')[0] || 'Admin',
      email: inviteEmail,
      role: inviteRole,
      permissions: selectedPermissions,
      isTwoFactorEnabled: false,
      lastLogin: 'Never (Invited)',
      status: 'INVITED'
    };

    setStaffList([newStaff, ...staffList]);
    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        adminName: 'Chaitanya Anand',
        adminEmail: 'chaitanya.admin@gigsforgigs.internal',
        action: 'INVITE_ADMIN_STAFF',
        targetType: 'ADMIN_INVITATION',
        targetId: newStaff.id,
        diffSummary: `Invited ${inviteEmail} as ${inviteRole}`,
        ipAddress: '192.168.1.42',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      },
      ...auditLogs
    ]);

    setIsInviteModalOpen(false);
    setInviteEmail('');
    toast.success('Invitation Token Dispatched', `Cryptographic 48h token issued for ${inviteEmail}`);
  };

  const handleRevokeConfirm = () => {
    if (!targetStaff) return;
    setStaffList(staffList.filter((s) => s.id !== targetStaff.id));
    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        adminName: 'Chaitanya Anand',
        adminEmail: 'chaitanya.admin@gigsforgigs.internal',
        action: 'REVOKE_ADMIN_ACCESS',
        targetType: 'USER',
        targetId: targetStaff.id,
        diffSummary: `Revoked access and invalidated sessions for ${targetStaff.name}`,
        ipAddress: '192.168.1.42',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      },
      ...auditLogs
    ]);
    toast.warning('Admin Access Revoked', `All active JWT sessions for ${targetStaff.name} were invalidated.`);
    setIsRevokeDialogOpen(false);
    setTargetStaff(null);
  };

  // Staff Table Columns
  const staffColumns: ColumnDef<AdminStaff>[] = [
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
      header: 'Tier & Role',
      cell: (row) => <StatusBadge status={row.role} />
    },
    {
      header: '2FA Status',
      cell: (row) => (
        <span className={`admin-badge ${row.isTwoFactorEnabled ? 'badge-success' : 'badge-warning'}`}>
          {row.isTwoFactorEnabled ? '2FA Active' : 'Unenrolled'}
        </span>
      )
    },
    {
      header: 'Account Status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Last Session',
      accessorKey: 'lastLogin'
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        row.role !== 'OWNER' ? (
          <button
            className="admin-btn admin-btn-danger admin-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setTargetStaff(row);
              setIsRevokeDialogOpen(true);
            }}
          >
            Revoke Access
          </button>
        ) : (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Root Authority
          </span>
        )
      )
    }
  ];

  // Audit Logs Columns
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <AdminTabs
        tabs={[
          { id: 'staff', label: 'Admin Staff Directory', count: staffList.length },
          { id: 'audit', label: 'Security & Audit Log Trail', count: auditLogs.length }
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      {/* ── Staff Tab Content ───────────────────────────────────────────── */}
      {activeTab === 'staff' && (
        <DataTable
          title="Administrative Staff & Privilege Bitmasks"
          columns={staffColumns}
          data={staffList}
          pageSize={6}
          searchPlaceholder="Search admin staff by name or email..."
          actions={
            <button
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <PlusIcon size={16} /> Invite Admin Staff
            </button>
          }
        />
      )}

      {/* ── Audit Trail Tab Content ─────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <DataTable
          title="Immutable Administrative Audit Trail"
          columns={auditColumns}
          data={auditLogs}
          pageSize={8}
          searchPlaceholder="Filter audit records..."
        />
      )}

      {/* ── Invite Admin Staff Modal ────────────────────────────────────── */}
      <ActionModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Delegate Administrator"
        subtitle="Dispatches a cryptographically signed 48-hour invitation token."
        width="560px"
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleSendInvite}
            >
              Send Signed Invitation
            </button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              STAFF EMAIL ADDRESS
            </label>
            <input
              type="email"
              className="admin-input"
              placeholder="e.g. colleague.admin@gigsforgigs.internal"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              ADMINISTRATIVE ROLE TIER
            </label>
            <select
              className="admin-select"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
            >
              <option value="FINANCIAL_ADMIN">Financial Admin (Escrow, Ledger, Payouts)</option>
              <option value="SUPPORT_ADMIN">Support Admin (Disputes, Arbitration, User Oversight)</option>
              <option value="CONTENT_MODERATOR">Content Moderator (Reviews, Verification Badges)</option>
              <option value="AUDITOR">Auditor (Read-only Compliance & Logs)</option>
              <option value="SUPER_ADMIN">Super Admin (Full Operational Access)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              GRANULAR PERMISSION BITMASK
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {availablePermissions.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isChecked ? 'rgba(8, 75, 131, 0.06)' : 'var(--color-bg-light)',
                      border: `1px solid ${isChecked ? 'var(--color-primary-dark)' : 'var(--color-border)'}`,
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePermission(perm.key)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: isChecked ? 600 : 400 }}>{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </ActionModal>

      {/* ── Revoke Access Confirm Dialog ────────────────────────────────── */}
      <ConfirmDialog
        isOpen={isRevokeDialogOpen}
        onClose={() => setIsRevokeDialogOpen(false)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Admin Access"
        message={`Are you sure you want to revoke administrative credentials for ${targetStaff?.name} (${targetStaff?.email})? All active JWT tokens will be invalidated immediately via tokenVersion increment.`}
        confirmLabel="Revoke & Invalidate Sessions"
        isDangerous={true}
      />
    </div>
  );
};

export default AdminManagement;
