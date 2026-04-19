import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { Plus, MoreHorizontal, ChevronDown, CircleDot } from 'lucide-react';

const BoardView = ({ tasks, onUpdateStatus, onDelete, onAddTask }) => {
  const [dragOverCol, setDragOverCol] = useState(null);

  const columns = [
    { id: 'todo', title: 'TO DO', badgeClass: 'badge-todo', color: '#888' },
    { id: 'doing', title: 'IN PROGRESS', badgeClass: 'badge-doing', color: '#0081ff' },
    { id: 'done', title: 'COMPLETE', badgeClass: 'badge-green', color: '#28bb7c' }
  ];

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, colId) => {
    setDragOverCol(colId);
  };

  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isOutside = 
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom;
    
    if (isOutside) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateStatus(taskId, colId);
    }
  };

  return (
    <div className="board-view">
      {columns.map(col => (
        <div 
          key={col.id} 
          className={`board-column ${dragOverCol === col.id ? 'drag-over' : ''}`}
          onDragOver={(e) => handleDragOver(e, col.id)}
          onDragEnter={(e) => handleDragEnter(e, col.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className="column-header-v3">
            <div className="header-status-group">
               <CircleDot size={14} style={{color: col.color}} />
               <span className={`status-pill-header ${col.badgeClass}`}>
                 {col.title}
               </span>
               <span style={{fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600'}}>
                 {tasks.filter(t => t.status.toLowerCase() === col.id).length}
               </span>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
               <Plus size={14} className="text-muted" cursor="pointer" onClick={() => onAddTask(col.id)} />
               <MoreHorizontal size={14} className="text-muted" cursor="pointer" />
            </div>
          </div>

          <div className="task-list">
            {tasks
              .filter(task => task.status.toLowerCase() === col.id)
              .map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdateStatus={onUpdateStatus} 
                  onDelete={onDelete} 
                />
              ))}
            
            <div className="add-task-ghost" onClick={() => onAddTask(col.id)}>
              <Plus size={14} /> Add Task
            </div>
          </div>
        </div>
      ))}
      
      <div style={{minWidth: '200px', paddingTop: '8px'}}>
         <button className="add-group-btn" style={{width: '100%', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', borderRadius: '8px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
           <Plus size={16} /> Add group
         </button>
      </div>
    </div>
  );
};

export default BoardView;
