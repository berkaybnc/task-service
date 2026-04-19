import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  MessageSquare, 
  Flag, 
  Plus, 
  MoreHorizontal,
  Calendar,
  Circle
} from 'lucide-react';

const ListView = ({ tasks, onUpdateStatus, onDelete }) => {
  const [expandedGroups, setExpandedGroups] = useState({
    todo: true,
    in_progress: true,
    complete: true
  });

  const toggleGroup = (status) => {
    setExpandedGroups(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const statusConfig = {
    todo: { label: 'TO DO', color: '#888', iconColor: '#888' },
    in_progress: { label: 'IN PROGRESS', color: '#2196f3', iconColor: '#2196f3' },
    complete: { label: 'COMPLETE', color: '#4caf50', iconColor: '#4caf50' }
  };

  const groupedTasks = {
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    todo: tasks.filter(t => t.status === 'todo'),
    complete: tasks.filter(t => t.status === 'complete')
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
              <div className="col-task">Name</div>
              <div className="col-assignee">Assignee</div>
              <div className="col-date">Due Date</div>
              <div className="col-priority">Priority</div>
              <div className="col-status-pill">Status</div>
              <div className="col-comments"></div>
            </div>

            {groupTasks.map(task => (
              <div key={task.id} className="list-task-row">
                <div className="col-task">
                  <Circle 
                    size={16} 
                    className="task-check-icon" 
                    style={{ color: task.status === 'complete' ? '#4caf50' : '#444', cursor: 'pointer' }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(task.id, task.status === 'complete' ? 'todo' : 'complete');
                    }}
                  />
                  <span className="task-title" style={{ opacity: task.status === 'complete' ? 0.5 : 1 }}>
                    {task.title}
                  </span>
                </div>
                <div className="col-assignee">
                  <div className="assignee-avatar-mini" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                    {task.assigneeId ? task.assigneeId[0].toUpperCase() : '-'}
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
                <div className="col-comments">
                   <MessageSquare size={14} />
                </div>
              </div>
            ))}

            <div className="add-task-btn-list" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}>
              <Plus size={14} />
              <span>Add Task</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="list-view-container">
      {renderGroup('in_progress')}
      {renderGroup('todo')}
      {renderGroup('complete')}
    </div>
  );
};

export default ListView;
