import React from 'react';
import { Trash2, MessageSquare, Flag, Calendar } from 'lucide-react';

const TableView = ({ tasks, onUpdateStatus, onDelete, onUpdateAssignee, users = [] }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'todo': return { label: 'YAPILACAKLAR', color: '#888' };
      case 'doing': return { label: 'DEVAM EDİYOR', color: '#2196f3' };
      case 'done': return { label: 'TAMAMLANDI', color: '#4caf50' };
      default: return { label: status.toUpperCase(), color: '#666' };
    }
  };

  return (
    <div className="table-view-container">
      <table className="clickup-table">
        <thead>
          <tr>
            <th className="index-col">#</th>
            <th>Ad</th>
            <th>Sorumlu</th>
            <th>Durum</th>
            <th>Teslim Tarihi</th>
            <th>Öncelik</th>
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
                      checked={task.status === 'done'} 
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
                    >
                      <option value="">Sorumlu Yok</option>
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
                  <button className="row-action-btn" onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
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
          Görev bulunamadı.
        </div>
      )}
    </div>
  );
};

export default TableView;
