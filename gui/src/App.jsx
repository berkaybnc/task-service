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
  LayoutDashboard
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
      await axios.post(`${API_URL}/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTask({ title: '', description: '' });
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

  if (!token) {
    return (
      <div className="container">
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        <div className="glass-card auth-container">
          <h1>Task Manager</h1>
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
            {error && <div className="error-msg" style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '1rem' }}><AlertCircle size={14} style={{ marginRight: 4 }} /> {error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="dashboard">
        <div className="task-section">
          <div className="header">
            <div>
              <h1 style={{ textAlign: 'left', marginBottom: '0.5rem' }}>Dashboard</h1>
              <div className="stats">
                <div className="stat-pill"><Clock size={14} inline /> {tasks.filter(t => t.status !== 'done').length} Pending</div>
                <div className="stat-pill"><CheckCircle2 size={14} inline /> {tasks.filter(t => t.status === 'done').length} Completed</div>
              </div>
            </div>
            <button onClick={handleLogout} className="icon-btn" style={{ width: 'auto', padding: '0 1rem', marginTop: 0 }}>
              <LogOut size={16} style={{ marginRight: 8 }} /> Logout
            </button>
          </div>

          <div className="task-grid">
            {tasks.map(task => (
              <div key={task.id} className={`task-card ${task.status}`}>
                <div className="task-title">{task.title}</div>
                <div className="task-desc">{task.description || 'No description provided.'}</div>
                <div className="task-footer">
                  <div className="actions">
                    <button className="icon-btn delete" onClick={() => handleDeleteTask(task.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                    {task.status !== 'done' && (
                      <button className="icon-btn success" onClick={() => handleUpdateStatus(task.id, 'done')} title="Complete">
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    {task.status === 'todo' && (
                      <button className="icon-btn" onClick={() => handleUpdateStatus(task.id, 'doing')} title="Start">
                        <Clock size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {task.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No tasks found. Get started by adding one!</div>}
          </div>
        </div>

        <div className="panel">
          <div className="glass-card add-task-form">
            <h2><Plus size={18} style={{ marginRight: 8 }} inline /> New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <input 
                  type="text" 
                  value={newTask.title} 
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Task title..."
                  required
                />
              </div>
              <div className="form-group">
                <textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Details..."
                  style={{ 
                    width: '100%', 
                    background: 'rgba(15, 23, 42, 0.5)', 
                    border: '1px solid var(--border)', 
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    color: 'white',
                    height: '100px',
                    resize: 'none'
                  }}
                />
              </div>
              <button type="submit">Create Task</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
