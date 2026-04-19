import React from 'react';
import { MoreHorizontal, MessageSquare, Flag, Calendar } from 'lucide-react';

const TableView = ({ tasks, onUpdateStatus, onDelete }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'todo': return { label: 'TO DO', color: '#888' };
      case 'in_progress': return { label: 'IN PROGRESS', color: '#2196f3' };
      case 'complete': return { label: 'COMPLETE', color: '#4caf50' };
      default: return { label: status.toUpperCase(), color: '#666' };
    }
  };

  return (
    <div className="table-view-container">
      <table className="clickup-table">
        <thead>
          <tr>
            <th className="index-col">#</th>
            <th>Name</th>
            <th>Assignee</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Priority</th>
            <th style={{ width: '50px' }}></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => {
            const config = getStatusConfig(task.status);
            return (
              <tr key={task.id}>
                <td className="index-col">{index + 1}</td>
                <td className="task-name-cell">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      style={{ cursor: 'pointer' }}
                      checked={task.status === 'complete'} 
                      onChange={() => onUpdateStatus(task.id, task.status === 'complete' ? 'todo' : 'complete')}
                    />
                    <span style={{ color: task.status === 'complete' ? '#666' : '#eee' }}>{task.title}</span>
                  </div>
                </td>
                <td>
                  <div className="assignee-avatar-mini" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                    {task.assigneeId ? task.assigneeId[0].toUpperCase() : '-'}
                  </div>
                </td>
                <td>
                  <span className="table-status-pill" style={{ backgroundColor: config.color }}>
                    {config.label}
                  </span>
                </td>
                <td style={{ color: '#666', fontSize: '12px' }}>
                   <Calendar size={12} style={{ display: 'inline', marginRight: '5px' }} />
                   -
                </td>
                <td>
                   <Flag size={14} color="#444" />
                </td>
                <td>
                  <button className="row-action-btn" onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                    <MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No tasks found.
        </div>
      )}
    </div>
  );
};

export default TableView;
