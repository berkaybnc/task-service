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

const TaskCard = ({ task, onDelete }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Custom ghost image effect: lower opacity of original card after a tiny delay
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
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
    >
      <div className="card-title-v3">{task.title}</div>
      
      <div className="card-footer-v3">
        <div className="footer-icon-group" title="Subtasks">
           <Layout size={12} />
        </div>
        
        <div className="footer-icon-group" title="Due Date">
          <Calendar size={12} />
        </div>

        <div className="footer-icon-group" title="Priority">
          <Flag size={12} style={{ color: getPriorityColor(task.priority) }} />
        </div>

        <div className="footer-actions-right">
          <div className="user-avatar-tiny" style={{width: '20px', height: '20px', fontSize: '9px', backgroundColor: '#555', border: '1px solid var(--border)'}}>
            {task.assignee?.[0]?.toUpperCase() || <User size={10} />}
          </div>
          <Trash2 
            size={12} 
            className="delete-task-btn" 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            style={{marginLeft: '4px'}}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
