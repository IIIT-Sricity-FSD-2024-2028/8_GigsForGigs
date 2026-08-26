import React, { useState } from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';

interface ManagerDashboardProps {
  onNavigateToTask: (taskId: number) => void;
  onNavigateToQueue: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigateToTask, onNavigateToQueue }) => {
  const { profile, tasks, deliverables, reviewDeliverable, closeDeliverable } = useManager();
  const [showQueue, setShowQueue] = useState(false);

  const managerName = profile?.user?.name || 'Leo Hudson';
  const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'open');
  const pendingDeliverables = deliverables.filter(d => d.status === 'submitted');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Header */}
      <div>
        <h1 style={{ fontSize: '28px', color: '#0D568D', margin: 0, fontWeight: 700 }}>
          Welcome back, {managerName}!
        </h1>
        <p style={{ color: '#76594F', fontSize: '15px', marginTop: '6px', margin: 0 }}>
          Here's a summary of your hiring activity and assigned operational tasks.
        </p>
      </div>

      {/* 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {/* Active Projects */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px 24px',
            border: '1px solid #D9E0E3',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E4F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#55A99A' }}>
              ✓
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#55A99A', backgroundColor: '#E4F2EF', padding: '2px 8px', borderRadius: '10px' }}>
              +12%
            </span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#76594F', marginTop: '16px', letterSpacing: '0.5px' }}>
            ACTIVE PROJECTS
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#3A1F16', margin: '4px 0' }}>
            {activeTasks.length}
          </div>
          <div style={{ fontSize: '12px', color: '#927D74' }}>Currently in progress</div>
        </div>

        {/* Pending Applications / Deliverables */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px 24px',
            border: '1px solid #D9E0E3',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#F8EBD9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D47700' }}>
              📋
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#B86300', backgroundColor: '#F8EBD9', padding: '2px 8px', borderRadius: '10px' }}>
              Action Req.
            </span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#76594F', marginTop: '16px', letterSpacing: '0.5px' }}>
            PENDING DELIVERABLES
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#3A1F16', margin: '4px 0' }}>
            {pendingDeliverables.length}
          </div>
          <div style={{ fontSize: '12px', color: '#927D74' }}>Awaiting your review</div>
        </div>

        {/* Tasks Posted / Assigned */}
        <div
          onClick={onNavigateToQueue}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px 24px',
            border: '1px solid #D9E0E3',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E4EEF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D568D' }}>
              📅
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0D568D', backgroundColor: '#E4EEF5', padding: '2px 8px', borderRadius: '10px' }}>
              Assigned
            </span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#76594F', marginTop: '16px', letterSpacing: '0.5px' }}>
            TASKS ASSIGNED TO YOU
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#3A1F16', margin: '4px 0' }}>
            {tasks.length}
          </div>
          <div style={{ fontSize: '12px', color: '#927D74' }}>Delegated by client</div>
        </div>
      </div>

      {/* Recent Project Activity Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #D9E0E3',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', color: '#0D568D', margin: 0, fontWeight: 700 }}>
            Recent Project Activity
          </h2>
          <button
            onClick={() => setShowQueue(!showQueue)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#55A99A', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            {showQueue ? 'Hide Pending Queue ↑' : 'Go to Pending Queue →'}
          </button>
        </div>

        {/* Activity Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E4E7' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#76594F', letterSpacing: '0.5px' }}>PROJECT NAME</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#76594F', letterSpacing: '0.5px' }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#76594F', letterSpacing: '0.5px' }}>PROGRESS</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#76594F', letterSpacing: '0.5px' }}>BUDGET</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#76594F', letterSpacing: '0.5px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#76594F' }}>
                    No assigned tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.taskId} style={{ borderBottom: '1px solid #F0F4F6' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#3A1F16' }}>{task.title}</div>
                      <div style={{ fontSize: '12px', color: '#927D74', marginTop: '2px' }}>
                        {task.assignments?.[0]?.gigProfile?.user?.name ? `Assigned to: ${task.assignments[0].gigProfile.user.name}` : 'Client delegated'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          backgroundColor: task.status === 'in_progress' ? '#E4EEF5' : task.status === 'completed' ? '#E4F2EF' : '#F8EBD9',
                          color: task.status === 'in_progress' ? '#0D568D' : task.status === 'completed' ? '#438F82' : '#B86300'
                        }}
                      >
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', width: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#D9E0E3', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${task.progress || (task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 10)}%`,
                              backgroundColor: task.status === 'completed' ? '#55A99A' : '#0D568D',
                              borderRadius: '3px'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: '#76594F', fontWeight: 600 }}>
                          {task.progress || (task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 10)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, color: '#3A1F16', fontSize: '14px' }}>
                      ₹{typeof task.budget === 'number' ? task.budget.toLocaleString() : task.budget}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => onNavigateToTask(task.taskId)}
                        title="View Task Details & Deliverables"
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#0D568D',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        👁
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pending Queue Expandable Section */}
        {showQueue && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #D9E0E3' }}>
            <h3 style={{ fontSize: '16px', color: '#0D568D', marginBottom: '12px' }}>
              Pending Deliverables Awaiting Review ({pendingDeliverables.length})
            </h3>
            {pendingDeliverables.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#76594F' }}>No deliverables currently awaiting review.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingDeliverables.map(del => (
                  <div
                    key={`${del.taskId}-${del.deliverableNo}`}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#EFF6F7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#3A1F16' }}>
                        Deliverable #{del.deliverableNo}: {del.description}
                      </div>
                      <div style={{ fontSize: '12px', color: '#76594F', marginTop: '2px' }}>
                        Link: <a href={del.submissionPath} target="_blank" rel="noreferrer" style={{ color: '#0D568D' }}>{del.submissionPath}</a>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => reviewDeliverable(del.taskId, del.deliverableNo, { status: 'approved' })}
                        style={{ backgroundColor: '#0D568D', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => closeDeliverable(del.taskId, del.deliverableNo)}
                        style={{ backgroundColor: '#55A99A', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
