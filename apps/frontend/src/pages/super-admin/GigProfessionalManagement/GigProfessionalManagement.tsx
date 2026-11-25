import React, { useEffect, useMemo, useState } from 'react';
import { Loader } from '../../../components/common/Loader';
import { ActionModal } from '../../../components/super-admin/ActionModal';
import { AdminTabs } from '../../../components/super-admin/AdminTabs';
import { ConfirmDialog } from '../../../components/super-admin/ConfirmDialog';
import { DataTable, type ColumnDef } from '../../../components/super-admin/DataTable';
import { FilterPillBar, type FilterPillOption } from '../../../components/super-admin/FilterPillBar';
import { GigProIcon, ReviewIcon } from '../../../components/super-admin/Icons';
import { KPICard } from '../../../components/super-admin/KPICard';
import { StatusBadge } from '../../../components/super-admin/StatusBadge';
import { useToast } from '../../../components/super-admin/useToast';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import type { GigProDetail } from '../../../services/api/admin/adminTypes';
import {
  fetchGigProDossier,
  fetchGigPros,
  moderateGigService,
  updateGigProBadge,
  updateGigProDetails,
  updateUserStatus,
} from '../../../store/admin/adminSlice';
import {
  selectGigProDossierById,
  selectGigProDossierRequest,
  selectGigPros,
  selectGigProsRequest,
} from '../../../store/admin/selectors';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { extractErrorMessage } from '../../../utils/adminAccess';
import { formatCurrency } from '../../../utils/format';
import { safeHttpUrl } from '../../../utils/safeUrl';

type GigProFilter = 'ALL' | 'TOP_RATED' | 'VERIFIED_PRO' | 'NONE' | 'SUSPENDED';
type GigProInspectTab = 'overview' | 'services' | 'edit';

interface EditProForm {
  name: string;
  email: string;
  headline: string;
}

export const GigProfessionalManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const gigPros = useAppSelector(selectGigPros);
  const gigProsRequest = useAppSelector(selectGigProsRequest);
  const dossierRequest = useAppSelector(selectGigProDossierRequest);

  const [filter, setFilter] = useState<GigProFilter>('ALL');
  const [selectedPro, setSelectedPro] = useState<GigProDetail | null>(null);
  const [inspectTab, setInspectTab] = useState<GigProInspectTab>('overview');
  const [badgeSaving, setBadgeSaving] = useState(false);
  const [moderatingServiceId, setModeratingServiceId] = useState<number | null>(null);

  const [editForm, setEditForm] = useState<EditProForm>({ name: '', email: '', headline: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    pro: GigProDetail | null;
    nextStatus: 'ACTIVE' | 'SUSPENDED';
    loading: boolean;
  }>({ open: false, pro: null, nextStatus: 'SUSPENDED', loading: false });

  useEffect(() => {
    void dispatch(fetchGigPros());
  }, [dispatch]);

  const activeDossier = useAppSelector((state) =>
    selectedPro ? selectGigProDossierById(state, selectedPro.id) : null,
  );

  const liveSelectedPro = useMemo(() => {
    if (!selectedPro) return null;
    return gigPros.find((p) => p.id === selectedPro.id) ?? selectedPro;
  }, [gigPros, selectedPro]);

  const metrics = useMemo(() => {
    const topRated = gigPros.filter((p) => p.badge === 'TOP_RATED').length;
    const verified = gigPros.filter((p) => p.badge === 'VERIFIED_PRO').length;
    const unbadged = gigPros.filter((p) => !p.badge || p.badge === 'NONE').length;
    const suspended = gigPros.filter((p) => p.status === 'SUSPENDED').length;
    const active = gigPros.filter((p) => p.status === 'ACTIVE').length;
    const totalEarnings = gigPros.reduce((sum, p) => sum + Number(p.totalEarnings || 0), 0);
    const totalCompletedJobs = gigPros.reduce((sum, p) => sum + Number(p.completedJobs || 0), 0);
    const ratedPros = gigPros.filter((p) => typeof p.rating === 'number');
    const avgRating =
      ratedPros.length > 0
        ? ratedPros.reduce((sum, p) => sum + Number(p.rating ?? 0), 0) / ratedPros.length
        : null;
    const totalReviews = gigPros.reduce((sum, p) => sum + Number(p.reviewCount || 0), 0);

    return {
      total: gigPros.length,
      active,
      topRated,
      verified,
      certified: topRated + verified,
      unbadged,
      suspended,
      totalEarnings,
      totalCompletedJobs,
      avgRating,
      totalReviews,
    };
  }, [gigPros]);

  const filterOptions: FilterPillOption<GigProFilter>[] = useMemo(
    () => [
      { value: 'ALL', label: 'All Talent', count: metrics.total },
      { value: 'TOP_RATED', label: 'Top Rated', count: metrics.topRated },
      { value: 'VERIFIED_PRO', label: 'Verified Pro', count: metrics.verified },
      { value: 'NONE', label: 'Standard', count: metrics.unbadged },
      { value: 'SUSPENDED', label: 'Suspended', count: metrics.suspended },
    ],
    [metrics],
  );

  const filteredPros = useMemo(() => {
    switch (filter) {
      case 'TOP_RATED':
        return gigPros.filter((p) => p.badge === 'TOP_RATED');
      case 'VERIFIED_PRO':
        return gigPros.filter((p) => p.badge === 'VERIFIED_PRO');
      case 'NONE':
        return gigPros.filter((p) => !p.badge || p.badge === 'NONE');
      case 'SUSPENDED':
        return gigPros.filter((p) => p.status === 'SUSPENDED');
      default:
        return gigPros;
    }
  }, [gigPros, filter]);

  const canManageUsers = hasPermission('users:ban');
  const canModerateServices = hasPermission('reviews:moderate');

  const handleOpenReview = (pro: GigProDetail, tab: GigProInspectTab = 'overview') => {
    setSelectedPro(pro);
    setInspectTab(tab);
    setEditForm({
      name: pro.name,
      email: pro.email ?? '',
      headline: pro.headline ?? '',
    });
    setEditError(null);
    void dispatch(fetchGigProDossier(pro.id));
  };

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId as GigProInspectTab;
    if (nextTab === 'edit' && liveSelectedPro) {
      setEditForm({
        name: activeDossier?.name ?? liveSelectedPro.name,
        email: activeDossier?.email ?? liveSelectedPro.email ?? '',
        headline: activeDossier?.headline ?? liveSelectedPro.headline ?? '',
      });
      setEditError(null);
    }
    setInspectTab(nextTab);
  };

  const handleBadgeChange = async (pro: GigProDetail, badge: 'NONE' | 'VERIFIED_PRO' | 'TOP_RATED') => {
    setBadgeSaving(true);
    try {
      await dispatch(updateGigProBadge({ gigProId: pro.id, badge })).unwrap();
      toast.success('Badge Updated', `${pro.name} credential updated to ${badge.replace(/_/g, ' ')}.`);
    } catch (err) {
      toast.error('Badge Update Failed', extractErrorMessage(err, 'Could not update talent badge.'));
    } finally {
      setBadgeSaving(false);
    }
  };

  const handleServiceModeration = async (serviceId: number, status: 'active' | 'paused' | 'archived') => {
    setModeratingServiceId(serviceId);
    try {
      await dispatch(moderateGigService({ serviceId, status })).unwrap();
      toast.success('Service Status Updated', `Listing #${serviceId} set to ${status.toUpperCase()}.`);
    } catch (err) {
      toast.error('Moderation Failed', extractErrorMessage(err, 'Could not update service status.'));
    } finally {
      setModeratingServiceId(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSelectedPro) return;

    const resolvedUserId = liveSelectedPro.userId ?? (activeDossier ? String(activeDossier.userId) : '');
    if (!resolvedUserId) {
      setEditError('Talent user identifier is unavailable.');
      return;
    }

    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const headline = editForm.headline.trim();

    if (name.length < 2 || !email.includes('@')) {
      setEditError('Valid name and email address are required.');
      return;
    }

    setEditSaving(true);
    setEditError(null);
    try {
      await dispatch(
        updateGigProDetails({
          gigProfileId: liveSelectedPro.id,
          userId: resolvedUserId,
          name,
          email,
          headline,
        }),
      ).unwrap();
      toast.success('Profile Saved', `${name}'s talent profile was updated.`);
      setInspectTab('overview');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to save freelancer profile.');
      setEditError(msg);
      toast.error('Update Failed', msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmAccountStatus = async () => {
    if (!statusDialog.pro) return;
    const target = statusDialog.pro;
    const resolvedUserId =
      target.userId ?? (activeDossier?.gigProfileId === target.gigProfileId ? String(activeDossier?.userId ?? '') : target.id);

    setStatusDialog((prev) => ({ ...prev, loading: true }));
    try {
      await dispatch(
        updateUserStatus({
          userId: resolvedUserId,
          status: statusDialog.nextStatus,
          reason:
            statusDialog.nextStatus === 'SUSPENDED'
              ? 'Suspended from Gig Professional console'
              : 'Reactivated by Super Admin',
        }),
      ).unwrap();
      toast.success(
        statusDialog.nextStatus === 'SUSPENDED' ? 'Freelancer Suspended' : 'Freelancer Reactivated',
        `${target.name} is now ${statusDialog.nextStatus.toLowerCase()}.`,
      );
      setStatusDialog({ open: false, pro: null, nextStatus: 'SUSPENDED', loading: false });
    } catch (err) {
      toast.error('Status Update Failed', extractErrorMessage(err, 'Could not change account status.'));
      setStatusDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns: ColumnDef<GigProDetail>[] = [
    {
      header: 'Freelancer',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{row.name}</span>
            <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
              {row.id}
            </span>
          </div>
          {row.email && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.email}</span>
          )}
          {row.headline && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.headline}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Skills & Stack',
      cell: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '220px' }}>
          {row.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-light)',
                color: 'var(--color-text-dark)',
                border: '1px solid var(--color-border)',
              }}
            >
              {skill}
            </span>
          ))}
          {row.skills.length > 3 && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', padding: '2px 4px' }}>
              +{row.skills.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Jobs & Earnings',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-text-dark)' }}>{formatCurrency(row.totalEarnings)}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {row.completedJobs} completed · {row.portfolioCount} portfolio
          </span>
        </div>
      ),
    },
    {
      header: 'Rating',
      cell: (row) =>
        typeof row.rating === 'number' ? (
          <span style={{ fontWeight: 700, color: 'var(--color-primary-blue)' }}>
            {row.rating.toFixed(1)} ★ <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>({row.reviewCount})</span>
          </span>
        ) : (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>No ratings</span>
        ),
    },
    {
      header: 'Badge',
      cell: (row) =>
        row.badge === 'NONE' || !row.badge ? (
          <span className="admin-badge badge-neutral">Standard</span>
        ) : (
          <StatusBadge status={row.badge} />
        ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          type="button"
          className="admin-btn admin-btn-outline admin-btn-sm"
          onClick={() => handleOpenReview(row, 'overview')}
        >
          Review Talent
        </button>
      ),
    },
  ];

  if (gigProsRequest.status === 'loading' && gigPros.length === 0) {
    return <Loader label="Loading freelancer directory and verification queues..." />;
  }

  if (gigProsRequest.status === 'failed' && gigPros.length === 0) {
    return (
      <div className="admin-card" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center', color: 'var(--color-danger-text)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Freelancer Directory Error</h3>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
          {gigProsRequest.error || 'Could not load gig professionals.'}
        </p>
      </div>
    );
  }

  const drawerTabs = [
    { id: 'overview', label: 'Profile & Badging' },
    {
      id: 'services',
      label: 'Services & Deliverables',
      count: activeDossier ? activeDossier.services.length + activeDossier.deliverables.length : undefined,
    },
    ...(canManageUsers ? [{ id: 'edit', label: 'Edit Profile' }] : []),
  ];

  const displayTools = activeDossier?.tools ?? liveSelectedPro?.tools ?? [];
  const displayPortfolio = activeDossier?.portfolioUrls ?? liveSelectedPro?.portfolioUrls ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Executive Talent KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--spacing-lg)' }}>
        <KPICard
          title="Total Freelancers"
          value={metrics.total}
          subtitle={`${metrics.active} active · ${metrics.suspended} suspended`}
          icon={<GigProIcon size={20} />}
          accentColor="var(--color-primary-dark)"
        />
        <KPICard
          title="Certified Talent"
          value={metrics.certified}
          subtitle={`${metrics.topRated} Top Rated · ${metrics.verified} Verified Pro`}
          icon={<GigProIcon size={20} />}
          accentColor="var(--color-primary-blue)"
        />
        <KPICard
          title="Avg Platform Rating"
          value={metrics.avgRating !== null ? `${metrics.avgRating.toFixed(2)} ★` : '—'}
          subtitle={`${metrics.totalReviews} published ratings`}
          icon={<ReviewIcon size={20} />}
          accentColor="var(--color-warning-text)"
        />
        <KPICard
          title="Lifetime Pro Payouts"
          value={formatCurrency(metrics.totalEarnings)}
          subtitle={`${metrics.totalCompletedJobs} completed jobs`}
          icon={<GigProIcon size={20} />}
          accentColor="var(--color-success-text)"
        />
      </div>

      {/* Badge / Status Filter Bar */}
      <FilterPillBar
        options={filterOptions}
        selected={filter}
        onSelect={setFilter}
        summaryText={`Showing ${filteredPros.length} of ${gigPros.length} professionals`}
      />

      {/* Talent Table */}
      <DataTable
        title="Gig Professionals Directory"
        columns={columns}
        data={filteredPros}
        searchPlaceholder="Search freelancer name, skill, email, or badge..."
        pageSize={8}
      />

      {/* Review Talent Drawer */}
      <ActionModal
        isOpen={Boolean(liveSelectedPro)}
        onClose={() => setSelectedPro(null)}
        isDrawer
        width="660px"
        title={liveSelectedPro?.name ?? 'Freelancer Profile'}
        subtitle={
          liveSelectedPro
            ? `${liveSelectedPro.email ?? activeDossier?.email ?? liveSelectedPro.id} · ${liveSelectedPro.completedJobs} completed jobs`
            : undefined
        }
        footer={
          <button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedPro(null)}>
            Close Profile
          </button>
        }
      >
        {liveSelectedPro && (
          <div>
            <AdminTabs tabs={drawerTabs} activeTab={inspectTab} onChange={handleTabChange} />

            {inspectTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {/* Performance Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Lifetime Earnings</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text-dark)', marginTop: '4px' }}>
                      {formatCurrency(liveSelectedPro.totalEarnings)}
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Rating & Volume</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-primary-blue)', marginTop: '4px' }}>
                      {liveSelectedPro.rating !== null ? `${liveSelectedPro.rating.toFixed(1)} ★` : '—'}{' '}
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        ({liveSelectedPro.reviewCount})
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-light)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Account Status</div>
                    <div style={{ marginTop: '6px' }}>
                      <StatusBadge status={liveSelectedPro.status} />
                    </div>
                  </div>
                </div>

                {/* Headline */}
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                    Professional Bio
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)', lineHeight: 1.5, backgroundColor: 'var(--color-bg-light)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    {activeDossier?.headline || liveSelectedPro.headline || 'No headline or bio supplied yet.'}
                  </p>
                </div>

                {/* Skills & Tools */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                      Verified Skills
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {liveSelectedPro.skills.length === 0 ? (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>None declared</span>
                      ) : (
                        liveSelectedPro.skills.map((s) => (
                          <span key={s} className="admin-badge badge-info">
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                      Primary Tools
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {displayTools.length === 0 ? (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>None declared</span>
                      ) : (
                        displayTools.map((t) => (
                          <span key={t} className="admin-badge badge-neutral">
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Portfolio Links */}
                {displayPortfolio.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                      Portfolio Evidence
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {displayPortfolio.map((url, idx) => {
                        const safe = safeHttpUrl(url);
                        return safe ? (
                          <a
                            key={`${url}-${idx}`}
                            href={safe}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-dark)', textDecoration: 'underline', wordBreak: 'break-all' }}
                          >
                            {safe}
                          </a>
                        ) : (
                          <span key={`${url}-${idx}`} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                            {url}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Badging & Status Governance */}
                {canManageUsers && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-dark)', display: 'block' }}>
                          Credential Tiering
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Promotes marketplace ranking and verified badge display.
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          disabled={badgeSaving || liveSelectedPro.badge === 'VERIFIED_PRO'}
                          onClick={() => handleBadgeChange(liveSelectedPro, 'VERIFIED_PRO')}
                        >
                          Verified Pro
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary admin-btn-sm"
                          disabled={badgeSaving || liveSelectedPro.badge === 'TOP_RATED'}
                          onClick={() => handleBadgeChange(liveSelectedPro, 'TOP_RATED')}
                        >
                          Top Rated
                        </button>
                        {liveSelectedPro.badge && liveSelectedPro.badge !== 'NONE' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            disabled={badgeSaving}
                            onClick={() => handleBadgeChange(liveSelectedPro, 'NONE')}
                          >
                            Clear Badge
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {liveSelectedPro.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() =>
                            setStatusDialog({ open: true, pro: liveSelectedPro, nextStatus: 'SUSPENDED', loading: false })
                          }
                        >
                          Suspend Freelancer
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() =>
                            setStatusDialog({ open: true, pro: liveSelectedPro, nextStatus: 'ACTIVE', loading: false })
                          }
                        >
                          Reactivate Freelancer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {inspectTab === 'services' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {dossierRequest.status === 'loading' && !activeDossier && (
                  <Loader label="Loading service listings and deliverables..." />
                )}
                {dossierRequest.status === 'failed' && !activeDossier && (
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', fontSize: 'var(--font-size-xs)' }}>
                    {dossierRequest.error || 'Could not load freelancer services.'}
                  </div>
                )}

                {activeDossier && (
                  <>
                    {/* Published Services Moderation */}
                    <div>
                      <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                        Published Service Catalog ({activeDossier.services.length})
                      </h4>
                      {activeDossier.services.length === 0 ? (
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', padding: '12px', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                          No packaged service listings published yet.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {activeDossier.services.map((svc) => (
                            <div
                              key={svc.serviceId}
                              style={{
                                padding: '12px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <div>
                                  <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-dark)' }}>{svc.title}</strong>
                                  {svc.category && (
                                    <span style={{ marginLeft: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                      {svc.category}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-dark)' }}>
                                    {formatCurrency(svc.price)}
                                  </strong>
                                  <StatusBadge status={svc.status} />
                                </div>
                              </div>

                              {svc.description && (
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                                  {svc.description}
                                </p>
                              )}

                              {canModerateServices && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--color-border)' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Listed {svc.createdAt}</span>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    {svc.status !== 'active' && (
                                      <button
                                        type="button"
                                        className="admin-btn admin-btn-secondary admin-btn-sm"
                                        disabled={moderatingServiceId === svc.serviceId}
                                        onClick={() => handleServiceModeration(svc.serviceId, 'active')}
                                      >
                                        Activate
                                      </button>
                                    )}
                                    {svc.status !== 'paused' && (
                                      <button
                                        type="button"
                                        className="admin-btn admin-btn-outline admin-btn-sm"
                                        disabled={moderatingServiceId === svc.serviceId}
                                        onClick={() => handleServiceModeration(svc.serviceId, 'paused')}
                                      >
                                        Pause
                                      </button>
                                    )}
                                    {svc.status !== 'archived' && (
                                      <button
                                        type="button"
                                        className="admin-btn admin-btn-danger admin-btn-sm"
                                        disabled={moderatingServiceId === svc.serviceId}
                                        onClick={() => handleServiceModeration(svc.serviceId, 'archived')}
                                      >
                                        Archive
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submitted Deliverables */}
                    <div>
                      <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                        Submitted Deliverables ({activeDossier.deliverables.length})
                      </h4>
                      {activeDossier.deliverables.length === 0 ? (
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', padding: '12px', backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)' }}>
                          No milestone deliverables submitted yet.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {activeDossier.deliverables.map((del) => {
                            const safeLink = safeHttpUrl(del.submissionPath);
                            return (
                              <div
                                key={`${del.taskId}-${del.deliverableNo}`}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--color-border)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                                    #TSK-{del.taskId} · Deliverable #{del.deliverableNo}
                                  </span>
                                  <StatusBadge status={del.status} />
                                </div>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dark)', margin: 0 }}>{del.description}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                  {safeLink ? (
                                    <a href={safeLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-blue)' }}>
                                      Inspect Submission
                                    </a>
                                  ) : (
                                    <span>Artifact: {del.submissionPath}</span>
                                  )}
                                  <span>{del.createdAt}</span>
                                </div>
                                {del.feedback && (
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-light)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
                                    Reviewer feedback: {del.feedback}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {inspectTab === 'edit' && canManageUsers && (
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {editError && (
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                    {editError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="admin-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px' }}>
                    Professional Headline / Bio
                  </label>
                  <textarea
                    className="admin-textarea"
                    rows={4}
                    placeholder="Concise summary of skills, specialization, and delivery background"
                    value={editForm.headline}
                    onChange={(e) => setEditForm((p) => ({ ...p, headline: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={() => setInspectTab('overview')}
                    disabled={editSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={editSaving}>
                    {editSaving ? 'Saving...' : 'Save Talent Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </ActionModal>

      {/* Suspend / Reactivate Dialog */}
      <ConfirmDialog
        isOpen={statusDialog.open}
        onCancel={() => !statusDialog.loading && setStatusDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmAccountStatus}
        isLoading={statusDialog.loading}
        isDangerous={statusDialog.nextStatus === 'SUSPENDED'}
        confirmLabel={statusDialog.nextStatus === 'SUSPENDED' ? 'Suspend Freelancer' : 'Reactivate Freelancer'}
        title={`${statusDialog.nextStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} ${statusDialog.pro?.name ?? 'Freelancer'}`}
        message={
          statusDialog.nextStatus === 'SUSPENDED'
            ? 'Suspending blocks this professional from submitting deliverables or applying to new gigs.'
            : 'Restores full marketplace sign-in and active proposal capabilities.'
        }
      />
    </div>
  );
};

export default GigProfessionalManagement;
