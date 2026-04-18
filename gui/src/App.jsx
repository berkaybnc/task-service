import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  Trash2, 
  Plus, 
  LogOut, 
  Clock, 
  Circle,
  AlertCircle,
  MoreHorizontal,
  Layout,
  ChevronRight,
  Monitor
} from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:3000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [newTask, setNewTask] = useState({ title: '', description: '' });

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error('Fetch tasks failed', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      const newToken = res.data.token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    try {
      await axios.post(`${API_URL}/tasks`, { ...newTask, status: 'todo' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTask({ title: '', description: '' });
      setShowAddForm(false);
      fetchTasks();
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/tasks/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', icon: <Circle size={16} /> },
    { id: 'doing', title: 'In Progress', icon: <Clock size={16} /> },
    { id: 'done', title: 'Done', icon: <CheckCircle2 size={16} /> }
  ];

  if (!token) {
    return (
      <div className="container">
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        <div className="glass-card auth-container">
          <div className="auth-logo">
             <Layout size={32} color="var(--primary)" />
             <h1>Task Manager</h1>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="e.g. admin"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required
              />
            </div>
            {error && <div className="error-msg"><AlertCircle size={14} /> {error}</div>}
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="nav-left">
          <Layout size={20} color="var(--primary)" />
          <span className="logo-text">Trello Board</span>
        </div>
        <div className="nav-right">
          <div className="user-info">
            <div className="avatar">{username[0]?.toUpperCase() || 'A'}</div>
            <span>{username}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main className="board-container">
        <div className="board-header">
           <div className="board-title">
             <h2>My Digital Board</h2>
             <span className="badge">Public</span>
           </div>
           <button className="add-board-btn" onClick={() => setShowAddForm(true)}>
             <Plus size={16} /> Add Card
           </button>
        </div>

        <div className="kanban-board">
          {columns.map(col => (
            <div key={col.id} className="kanban-column">
              <div className="column-header">
                <div className="column-title">
                  {col.icon}
                  <h3>{col.title}</h3>
                  <span className="count">{tasks.filter(t => t.status === col.id).length}</span>
                </div>
                <MoreHorizontal size={16} className="more-btn" />
              </div>

              <div className="task-list">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div key={task.id} className="kanban-card">
                    <div className="card-content">
                      <h4>{task.title}</h4>
                      {task.description && <p>{task.description}</p>}
                    </div>
                    
                    <div className="card-footer">
                      <div className="card-actions">
                         {col.id === 'todo' && (
                           <button onClick={() => handleUpdateStatus(task.id, 'doing')} title="Start Task">
                             <Clock size={14} />
                           </button>
                         )}
                         {col.id === 'doing' && (
                           <button onClick={() => handleUpdateStatus(task.id, 'done')} title="Complete Task">
                             <CheckCircle2 size={14} />
                           </button>
                         )}
                         <button className="del-btn" onClick={() => handleDeleteTask(task.id)} title="Delete">
                           <Trash2 size={14} />
                         </button>
                      </div>
                      <div className="card-meta">
                        <Monitor size={12} />
                      </div>
                    </div>
                  </div>
                ))}
                
                {col.id === 'todo' && !showAddForm && (
                  <button className="add-inline-btn" onClick={() => setShowAddForm(true)}>
                    <Plus size={14} /> Add a card
                  </button>
                )}
                
                {col.id === 'todo' && showAddForm && (
                  <div className="inline-add-card">
                    <form onSubmit={handleCreateTask}>
                      <input 
                        autoFocus
                        placeholder="Enter card title..."
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      />
                      <textarea 
                        placeholder="Description (optional)..."
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      />
                      <div className="inline-actions">
                        <button type="submit" className="save-btn">Add Card</button>
                        <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                          <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
