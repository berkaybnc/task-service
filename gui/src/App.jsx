import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertCircle,
  Layout,
  Plus,
  List as ListIcon,
  Table as TableIcon,
  Columns as BoardIcon
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import BoardView from './components/BoardView';
import ListView from './components/ListView';
import TableView from './components/TableView';
import './App.css';

const API_URL = 'http://localhost:3000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [loginUser, setLoginUser] = useState('');
  const [password, setPassword] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetColumn, setTargetColumn] = useState('todo');

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', assigneeId: '' });
  
  // New States
  const [view, setView] = useState('board'); // board, list, table
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [projectTeamId, setProjectTeamId] = useState('');
  const [memberToAdd, setMemberToAdd] = useState('');

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchProjects();
      fetchTeams();
      fetchUsers();
    }

    const onLogout = () => handleLogout();
    const onProjModal = () => setShowProjectModal(true);
    const onTeamModal = () => setShowTeamModal(true);
    const onTaskModal = () => { setTargetColumn('todo'); setShowAddForm(true); };

    window.addEventListener('logout', onLogout);
    window.addEventListener('open-project-modal', onProjModal);
    window.addEventListener('open-team-modal', onTeamModal);
    window.addEventListener('open-task-modal', onTaskModal);

    return () => {
      window.removeEventListener('logout', onLogout);
      window.removeEventListener('open-project-modal', onProjModal);
      window.removeEventListener('open-team-modal', onTeamModal);
      window.removeEventListener('open-task-modal', onTaskModal);
    };
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error('Fetch tasks failed', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects`);
      setProjects(res.data);
    } catch (err) {}
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_URL}/teams`);
      setTeams(res.data);
    } catch (err) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users`);
      setUsers(res.data);
    } catch (err) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username: loginUser, password });
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/register`, {
        username: registerData.username,
        email: registerData.email,
        phoneNumber: registerData.phone,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName
      });
      setSuccess('Registration successful! Please login.');
      setIsRegistering(false);
      setLoginUser(registerData.username);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    try {
      await axios.post(`${API_URL}/tasks`, { 
        ...newTask, 
        status: targetColumn,
        projectId: newTask.projectId || undefined,
        assigneeId: newTask.assigneeId || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTask({ title: '', description: '', projectId: currentProjectId || '', assigneeId: '' });
      setShowAddForm(false);
      fetchTasks();
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName || !projectTeamId) return;
    try {
      await axios.post(`${API_URL}/projects`, { 
        title: newProjectName, 
        teamId: projectTeamId 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewProjectName('');
      setProjectTeamId('');
      setShowProjectModal(false);
      fetchProjects();
    } catch (err) {}
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    try {
      await axios.post(`${API_URL}/teams`, { name: newTeamName });
      setNewTeamName('');
      setShowTeamModal(false);
      fetchTeams();
    } catch (err) {}
  };

  const handleAddMemberToTeam = async (teamId) => {
    if (!memberToAdd) return;
    try {
      await axios.post(`${API_URL}/teams/${teamId}/members`, { userId: memberToAdd });
      setMemberToAdd('');
      fetchTeams();
    } catch (err) {}
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

  const renderView = () => {
    const filteredTasks = currentProjectId 
      ? tasks.filter(t => t.projectId === currentProjectId)
      : tasks;

    switch (view) {
      case 'list': return <ListView tasks={filteredTasks} onUpdateStatus={handleUpdateStatus} onDelete={handleDeleteTask} />;
      case 'table': return <TableView tasks={filteredTasks} onUpdateStatus={handleUpdateStatus} onDelete={handleDeleteTask} />;
      default: return (
        <BoardView 
          tasks={filteredTasks} 
          onUpdateStatus={handleUpdateStatus} 
          onDelete={handleDeleteTask}
          onAddTask={(col) => { setTargetColumn(col); setShowAddForm(true); }}
        />
      );
    }
  };

  if (!token) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card">
          <div className="auth-header">
             <div className="auth-logo-large"></div>
             <h1 className="auth-title">{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
             <p className="auth-subtitle">
               {isRegistering ? 'Join the most advanced task manager' : 'Login to manage your workflow'}
             </p>
          </div>
          
          {isRegistering ? (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-row-modern">
                <div className="form-group-modern">
                  <label>First Name</label>
                  <input type="text" className="input-modern" placeholder="John" onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})} required/>
                </div>
                <div className="form-group-modern">
                  <label>Last Name</label>
                  <input type="text" className="input-modern" placeholder="Doe" onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})} required/>
                </div>
              </div>
              
              <div className="form-group-modern">
                <label>Username</label>
                <input type="text" className="input-modern" placeholder="johndoe" onChange={(e) => setRegisterData({...registerData, username: e.target.value})} required/>
              </div>

              <div className="form-group-modern">
                <label>Email</label>
                <input type="email" className="input-modern" placeholder="john@example.com" onChange={(e) => setRegisterData({...registerData, email: e.target.value})} required/>
              </div>

              <div className="form-row-modern">
                <div className="form-group-modern">
                  <label>Password</label>
                  <input type="password" className="input-modern" placeholder="••••••••" onChange={(e) => setRegisterData({...registerData, password: e.target.value})} required/>
                </div>
                <div className="form-group-modern">
                  <label>Confirm</label>
                  <input type="password" className="input-modern" placeholder="••••••••" onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})} required/>
                </div>
              </div>

              {error && <div className="error-modern"><AlertCircle size={16} /> {error}</div>}
              
              <button type="submit" disabled={loading} className="primary-btn-modern">
                {loading ? 'Creating Account...' : 'Create Free Account'}
              </button>
              
              <div className="auth-footer">
                Already have an account? <button type="button" onClick={() => setIsRegistering(false)}>Sign In</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group-modern">
                <label>Username</label>
                <input type="text" className="input-modern" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="Enter your username" required/>
              </div>
              
              <div className="form-group-modern">
                <label>Password</label>
                <input type="password" className="input-modern" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required/>
              </div>

              {error && <div className="error-modern"><AlertCircle size={16} /> {error}</div>}
              {success && <div className="success-modern">{success}</div>}
              
              <button type="submit" disabled={loading} className="primary-btn-modern">
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              </button>
              
              <div className="auth-footer">
                New to Task Service? <button type="button" onClick={() => setIsRegistering(true)}>Create an account</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'User';

  const currentProject = projects.find(p => p.id === currentProjectId);

  return (
    <div className="app-shell">
      <div className="sidebar-wrapper">
        <Sidebar 
          username={displayName} 
          teams={teams}
          projects={projects}
          currentView={view}
          onViewChange={setView}
          currentProjectId={currentProjectId}
          onProjectSelect={setCurrentProjectId}
        />
      </div>
      
      <div className="main-wrapper">
        <TopBar 
          currentProject={currentProject} 
          currentView={view}
          onViewChange={setView}
        />
        
        <main style={{ flex: 1, overflow: 'auto' }}>
           {renderView()}
        </main>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Add New Task to {targetColumn.toUpperCase()}</h3>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <input autoFocus placeholder="Task Name" className="form-input" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})}/>
              </div>
              <div className="form-group">
                <textarea placeholder="Description..." className="form-input" style={{minHeight: '80px'}} value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})}/>
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Assignee</label>
                  <select className="form-input" value={newTask.assigneeId} onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}>
                    <option value="">No Assignee</option>
                    {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Project</label>
                  <select className="form-input" value={newTask.projectId} onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}>
                    <option value="">No Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn-modal" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="save-btn-modal">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Select Team</label>
                <select className="form-input" value={projectTeamId} onChange={(e) => setProjectTeamId(e.target.value)} required>
                  <option value="">Choose Team...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Project Title</label>
                <input className="form-input" placeholder="Project Title" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required/>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn-modal" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="save-btn-modal">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Team Management</h3>
            <div style={{marginBottom: '20px'}}>
              <div className="teams-list-mini">
                {teams.map(t => (
                  <div key={t.id} style={{padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>{t.name}</span>
                    <div style={{display: 'flex', gap: '5px'}}>
                       <select value={memberToAdd} onChange={(e) => setMemberToAdd(e.target.value)} className="form-input" style={{padding: '4px', width: '120px', fontSize: '11px'}}>
                         <option value="">Invite User</option>
                         {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                       </select>
                       <button onClick={() => handleAddMemberToTeam(t.id)} className="save-btn-modal" style={{padding: '4px 8px', fontSize: '11px'}}>Add</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <input className="form-input" placeholder="New Team Name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required/>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn-modal" onClick={() => setShowTeamModal(false)}>Close</button>
                <button type="submit" className="save-btn-modal">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
