import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import { Plus, MoreHorizontal, ChevronDown, CircleDot, Trash2 } from 'lucide-react';

const BoardView = ({ tasks, onUpdateStatus, onDelete, onAddTask, onUpdateAssignee, onTaskClick, users, t }) => {
  const [dragOverCol, setDragOverCol] = useState(null);

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('board_columns');
    return saved ? JSON.parse(saved) : [
      { id: 'todo', title: t.status.toUpperCase() + ': ' + t.all, badgeClass: 'badge-todo', color: '#888' },
      { id: 'doing', title: 'DEVAM EDİYOR', badgeClass: 'badge-doing', color: '#0081ff' },
      { id: 'done', title: t.status.toUpperCase() + ': DONE', badgeClass: 'badge-green', color: '#28bb7c' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('board_columns', JSON.stringify(columns));
  }, [columns]);

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const handleDeleteColumn = (id) => {
    if (['todo', 'doing', 'done'].includes(id)) {
      alert('Varsayılan gruplar silinemez!');
      return;
    }
    if (!window.confirm('Bu grubu silmek istediğinize emin misiniz?')) return;
    setColumns(columns.filter(c => c.id !== id));
  };

  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!newColumnTitle) return;
    const id = newColumnTitle.toLowerCase().replace(/\s+/g, '-');
    if (columns.find(c => c.id === id)) {
      alert('Bu grup zaten mevcut!');
      return;
    }
    const newCol = {
      id,
      title: newColumnTitle.toUpperCase(),
      badgeClass: 'badge-todo',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setColumns([...columns, newCol]);
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, colId) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the column element, not just a child
    if (!e.currentTarget.contains(e.relatedTarget)) {
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
            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
               <Plus size={14} className="text-muted" cursor="pointer" onClick={() => onAddTask(col.id)} />
               {!['todo', 'doing', 'done'].includes(col.id) && (
                 <Trash2 size={13} className="text-danger" cursor="pointer" onClick={() => handleDeleteColumn(col.id)} />
               )}
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
                  onUpdateAssignee={onUpdateAssignee}
                  onClick={() => onTaskClick(task)}
                  users={users}
                />
              ))}
            
            <div className="add-task-ghost" onClick={() => onAddTask(col.id)}>
              <Plus size={14} /> {t.addTask}
            </div>
          </div>
        </div>
      ))}
      
      <div style={{minWidth: '240px', paddingTop: '8px'}}>
        {isAddingColumn ? (
          <form onSubmit={handleAddColumn} style={{width: '100%'}}>
            <input 
              autoFocus
              className="form-input"
              placeholder="Grup Başlığı..."
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              onBlur={() => { if(!newColumnTitle) setIsAddingColumn(false); }}
              style={{marginBottom: '8px', border: '1px solid var(--primary)'}}
            />
            <div style={{display: 'flex', gap: '8px'}}>
              <button type="submit" className="save-btn-modern" style={{padding: '4px 12px', fontSize: '12px'}}>Ekle</button>
              <button type="button" className="cancel-btn-modal" style={{padding: '4px 12px', fontSize: '12px'}} onClick={() => setIsAddingColumn(false)}>İptal</button>
            </div>
          </form>
        ) : (
          <button 
            className="add-group-btn" 
            onClick={() => setIsAddingColumn(true)}
            style={{width: '100%', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', borderRadius: '8px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
          >
            <Plus size={16} /> {t.group} {t.addTask}
          </button>
        )}
      </div>
    </div>
  );
};

export default BoardView;
