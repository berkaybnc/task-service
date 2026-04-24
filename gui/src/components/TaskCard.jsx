import React from 'react';
import { 
  MessageSquare, 
  CheckSquare, 
  Calendar, 
  Flag, 
  User, 
  Trash2,
  Clock,
  Layout
} from 'lucide-react';

const TaskCard = ({ task, onDelete, onUpdateAssignee, users = [] }) => {
  const handleDragStart = (e) => {
    const taskId = task.id || task._id;
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Custom ghost image effect: lower opacity of original card after a tiny delay
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#ff4d4d';
      case 'medium': return '#f1c40f';
      case 'low': return '#28bb7c';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div 
      className="task-card-v3" 
      draggable 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="card-title-v3">{task.title}</div>
      
      <div className="card-footer-v3">
        <div className="footer-icon-group" title="Alt Görevler">
           <Layout size={12} />
        </div>
        
        <div className="footer-icon-group" title="Teslim Tarihi">
          <Calendar size={12} />
          {task.dueDate && <span style={{fontSize: '10px', marginLeft: '4px'}}>{new Date(task.dueDate).toLocaleDateString('tr-TR')}</span>}
        </div>

        <div className="footer-icon-group" title="Öncelik">
          <Flag size={12} style={{ color: getPriorityColor(task.priority) }} />
        </div>

        <div className="footer-actions-right">
          <div className="assignee-select-wrapper" style={{ position: 'relative' }}>
            <select 
              className="task-card-assignee-select"
              value={task.assigneeId || ''}
              onChange={(e) => onUpdateAssignee(task.id || task._id, e.target.value)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '20px',
                height: '20px',
                opacity: 0,
                cursor: 'pointer',
                zIndex: 2
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Sorumlu Yok</option>
              {users.map(u => (
                <option key={u.id} value={u.username}>{u.username}</option>
              ))}
            </select>
            <div className="user-avatar-tiny" style={{width: '20px', height: '20px', fontSize: '9px', backgroundColor: task.assigneeId ? 'var(--primary)' : '#555', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1}}>
              {task.assigneeId ? task.assigneeId[0].toUpperCase() : <User size={10} />}
            </div>
          </div>
          <Trash2 
            size={16} 
            className="delete-task-btn" 
            title="Görevi Sil"
            onClick={(e) => { 
              e.stopPropagation(); 
              const tid = task.id || task._id;
              console.log('Deleting task:', tid);
              onDelete(tid); 
            }}
            style={{marginLeft: '8px', cursor: 'pointer', color: 'var(--text-muted)'}}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
