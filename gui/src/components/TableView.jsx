import React from 'react';
import { Trash2, MessageSquare, Flag, Calendar } from 'lucide-react';

const TableView = ({ tasks, onUpdateStatus, onDelete, onUpdateAssignee, onTaskClick, users = [], t }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'todo': return { label: t.status.toUpperCase() + ': ' + t.all, color: '#888' };
      case 'doing': return { label: 'DEVAM EDİYOR', color: '#2196f3' };
      case 'done': return { label: t.status.toUpperCase() + ': DONE', color: '#4caf50' };
      default: return { label: status.toUpperCase(), color: '#666' };
    }
  };

  return (
    <div className="table-view-container">
      <table className="clickup-table">
        <thead>
          <tr>
            <th className="index-col">#</th>
            <th>{t.title}</th>
            <th>{t.assignee}</th>
            <th>{t.status}</th>
            <th>{t.dueDate}</th>
            <th>{t.priority}</th>
            <th style={{ width: '50px' }}></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => {
            const config = getStatusConfig(task.status);
            return (
              <tr key={task.id} onClick={() => onTaskClick(task)} style={{cursor: 'pointer'}}>
                <td className="index-col">{index + 1}</td>
                <td className="task-name-cell">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      style={{ cursor: 'pointer' }}
                      checked={task.status === 'done'} 
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onUpdateStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                    />
                    <span style={{ color: task.status === 'done' ? '#666' : '#eee' }}>{task.title}</span>
                  </div>
                </td>
                <td>
                  <div className="assignee-select-wrapper" style={{ position: 'relative', width: '24px', height: '24px' }}>
                    <select 
                      className="table-assignee-select"
                      value={task.assigneeId || ''}
                      onChange={(e) => onUpdateAssignee(task.id || task._id, e.target.value)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">{t.noAssignee}</option>
                      {users.map(u => (
                        <option key={u.id} value={u.username}>{u.username}</option>
                      ))}
                    </select>
                    <div className="assignee-avatar-mini" style={{ width: '24px', height: '24px', fontSize: '10px', backgroundColor: task.assigneeId ? 'var(--primary)' : '#444', position: 'relative', zIndex: 1 }}>
                      {task.assigneeId ? task.assigneeId[0].toUpperCase() : '-'}
                    </div>
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
                  <button className="row-action-btn" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          {t.noTasks}
        </div>
      )}
    </div>
  );
};

export default TableView;
