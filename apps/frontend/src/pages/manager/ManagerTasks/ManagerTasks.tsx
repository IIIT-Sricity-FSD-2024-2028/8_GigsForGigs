import React from 'react';
import { useManager } from '../../../context/ManagerContext/ManagerContext';

interface ManagerTasksProps {
  onSelectTask: (taskId: number) => void;
}

export const ManagerTasks: React.FC<ManagerTasksProps> = ({ onSelectTask }) => {
  const { tasks, profile, loading } = useManager();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', color: '#0D568D', margin: 0, fontWeight: 700 }}>
          Assigned Tasks
        </h1>
        <p style={{ color: '#76594F', fontSize: '15px', marginTop: '6px', margin: 0 }}>
          View and manage operational tasks delegated to you by the Client.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#76594F' }}>Loading assigned tasks...</div>
      ) : tasks.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #D9E0E3' }}>
          <h3 style={{ color: '#0D568D' }}>No Assigned Tasks</h3>
          <p style={{ color: '#76594F', fontSize: '14px', marginTop: '8px' }}>
            You currently have no tasks assigned by your Client.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {tasks.map(task => {
            const assignedPro = task.assignments?.[0]?.gigProfile;
            return (
              <div
                key={task.taskId}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid #D9E0E3',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <h3 style={{ fontSize: '18px', color: '#0D568D', margin: 0, fontWeight: 700 }}>
                      {task.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: task.status === 'in_progress' ? '#E4EEF5' : task.status === 'completed' ? '#E4F2EF' : '#F8EBD9',
                        color: task.status === 'in_progress' ? '#0D568D' : task.status === 'completed' ? '#438F82' : '#B86300',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', color: '#3A1F16', marginTop: '10px', lineHeight: 1.5 }}>
                    {task.description || 'No detailed description provided.'}
                  </p>

                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#76594F' }}>Client: </span>
                      <strong style={{ color: '#3A1F16' }}>{task.client?.clientName || profile?.client?.clientName || 'Client Organization'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#76594F' }}>Assigned Gig Pro: </span>
                      <strong style={{ color: '#3A1F16' }}>
                        {assignedPro?.user?.name || 'Unassigned / Pending'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#76594F' }}>Budget: </span>
                      <strong style={{ color: '#3A1F16' }}>
                        ₹{typeof task.budget === 'number' ? task.budget.toLocaleString() : task.budget}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Progress & Action */}
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#76594F', marginBottom: '4px' }}>
                      <span>Progress</span>
                      <span>{task.progress || (task.status === 'completed' ? 100 : 50)}%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#D9E0E3', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${task.progress || (task.status === 'completed' ? 100 : 50)}%`,
                          backgroundColor: task.status === 'completed' ? '#55A99A' : '#0D568D',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectTask(task.taskId)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0D568D',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    View Task & Deliverables
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;
