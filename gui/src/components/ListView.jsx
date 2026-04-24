import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  MessageSquare, 
  Flag, 
  Plus, 
  MoreHorizontal,
  Calendar,
  Circle,
  Trash2
} from 'lucide-react';

const ListView = ({ tasks, onUpdateStatus, onDelete, onUpdateAssignee, onTaskClick, users = [], t }) => {
  const [expandedGroups, setExpandedGroups] = useState({
    todo: true,
    doing: true,
    done: true
  });

  const toggleGroup = (status) => {
    setExpandedGroups(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const statusConfig = {
    todo: { label: t.status.toUpperCase() + ': ' + t.all, color: '#888', iconColor: '#888' },
    doing: { label: 'DEVAM EDİYOR', color: '#2196f3', iconColor: '#2196f3' },
    done: { label: t.status.toUpperCase() + ': DONE', color: '#4caf50', iconColor: '#4caf50' }
  };

  const groupedTasks = {
    doing: tasks.filter(t => t.status === 'doing'),
    todo: tasks.filter(t => t.status === 'todo'),
    done: tasks.filter(t => t.status === 'done')
  };

  const renderGroup = (status) => {
    const config = statusConfig[status];
    const groupTasks = groupedTasks[status];
    const isExpanded = expandedGroups[status];

    return (
      <div key={status} className="list-group">
        <div className="list-group-header" onClick={() => toggleGroup(status)}>
          {isExpanded ? <ChevronDown size={14} color="#666" /> : <ChevronRight size={14} color="#666" />}
          <span className="status-label" style={{ backgroundColor: config.color }}>{config.label}</span>
          <span className="group-count">{groupTasks.length}</span>
        </div>

        {isExpanded && (
          <div className="group-content">
            <div className="list-table-header">
              <div className="col-task">{t.title}</div>
              <div className="col-assignee">{t.assignee}</div>
              <div className="col-date">{t.dueDate}</div>
              <div className="col-priority">{t.priority}</div>
              <div className="col-status-pill">{t.status}</div>
              <div className="col-comments"></div>
            </div>

            {groupTasks.map(task => (
              <div key={task.id} className="list-task-row" onClick={() => onTaskClick(task)} style={{cursor: 'pointer'}}>
                <div className="col-task">
                  <Circle 
                    size={16} 
                    className="task-check-icon" 
                    style={{ color: task.status === 'done' ? '#4caf50' : '#444', cursor: 'pointer' }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(task.id, task.status === 'done' ? 'todo' : 'done');
                    }}
                  />
                  <span className="task-title" style={{ opacity: task.status === 'done' ? 0.5 : 1 }}>
                    {task.title}
                  </span>
                </div>
                <div className="col-assignee">
                  <div className="assignee-select-wrapper" style={{ position: 'relative', width: '24px', height: '24px' }}>
                    <select 
                      className="list-assignee-select"
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
                </div>
                <div className="col-date">
                   <Calendar size={12} style={{ marginRight: '4px' }} />
                   <span>-</span>
                </div>
                <div className="col-priority">
                   <Flag size={14} color="#444" />
                </div>
                <div className="col-status-pill">
                   <span className="status-pill" style={{ backgroundColor: config.color }}>
                     {config.label}
                   </span>
                </div>
                <div className="col-comments" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                   <MessageSquare size={14} />
                   <Trash2 
                     size={14} 
                     className="text-danger" 
                     cursor="pointer" 
                     onClick={(e) => {
                       e.stopPropagation();
                       onDelete(task.id);
                     }} 
                   />
                </div>
              </div>
            ))}

            <div className="add-task-btn-list" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}>
              <Plus size={14} />
              <span>{t.addTask}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="list-view-container">
      {renderGroup('doing')}
      {renderGroup('todo')}
      {renderGroup('done')}
    </div>
  );
};

export default ListView;
