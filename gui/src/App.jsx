import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  AlertCircle,
  Layout,
  Plus,
  List as ListIcon,
  Table as TableIcon,
  Columns as BoardIcon,
  Sparkles
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import BoardView from './components/BoardView';
import ListView from './components/ListView';
import TableView from './components/TableView';
import CalendarView from './components/CalendarView';
import './App.css';

const API_URL = 'http://127.0.0.1:5001/api';

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

  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', assigneeId: '', dueDate: '' });
  
  const [view, setView] = useState('board');
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all'); 
  const [sortBy, setSortBy] = useState('title'); 
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const normalized = res.data.map(t => ({ ...t, id: t.id || t._id }));
      setTasks(normalized);
      return normalized;
    } catch (err) {
      console.error('Görevleri getirme hatası', err);
      return null;
    }
  }, [token]);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const normalized = res.data.map(p => ({ ...p, id: p.id || p._id }));
      setProjects(normalized);
      return normalized;
    } catch (err) {
      console.error('Projeleri getirme hatası', err);
      return null;
    }
  }, [token]);

  const fetchTeams = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const normalized = res.data.map(t => ({ ...t, id: t.id || t._id }));
      setTeams(normalized);
      return normalized;
    } catch (err) {
      console.error('Ekipleri getirme hatası', err);
      return null;
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const normalized = res.data.map(u => ({ ...u, id: u.id || u._id }));
      setUsers(normalized);
      return normalized;
    } catch (err) {
      console.error('Kullanıcıları getirme hatası', err);
      return null;
    }
  }, [token]);





  const currentProjectIdRef = useRef(currentProjectId);
  useEffect(() => {
    currentProjectIdRef.current = currentProjectId;
  }, [currentProjectId]);

  const handleLogout = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  }, []);

  // Veri yükleme efekti
  useEffect(() => {
    const loadAllData = async () => {
      if (token) {
        await fetchTasks();
        await fetchProjects();
        await fetchTeams();
        await fetchUsers();
      }
    };
    loadAllData();
  }, [token, fetchTasks, fetchProjects, fetchTeams, fetchUsers]);


  // Event listener efekti
  useEffect(() => {
    const onLogout = () => handleLogout();
    const onProjModal = () => setShowProjectModal(true);
    const onTeamModal = () => setShowTeamModal(true);
    const onTaskModal = () => { 
      setTargetColumn('todo'); 
      setNewTask(prev => ({ ...prev, projectId: currentProjectIdRef.current || '' }));
      setShowAddForm(true); 
    };

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
  }, [handleLogout]);



  const isUserAssignedToTask = (task) => {
    if (!user) return false;
    return task.assigneeId === user.username;
  };

  const computedTasks = tasks
    .filter(task => {
      const matchesProject = !currentProjectId || task.projectId === currentProjectId;
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPriority = !filterPriority || task.priority === filterPriority;
      const matchesAssignee = !filterAssignee || task.assigneeId === filterAssignee;
      const matchesMine = taskFilter === 'mine' ? isUserAssignedToTask(task) : true;
      return matchesProject && matchesSearch && matchesPriority && matchesAssignee && matchesMine;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'priority') {
        const pMap = { high: 3, medium: 2, low: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      }
      return 0;
    });


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
      setError(err.response?.data?.error || err.response?.data?.message || 'Giriş başarısız');
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
      setSuccess('Kayıt başarılı! Lütfen giriş yapın.');
      setIsRegistering(false);
      setLoginUser(registerData.username);
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };


  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    try {
      await axios.post(`${API_URL}/tasks`, { 
        ...newTask, 
        status: targetColumn,
        projectId: newTask.projectId || undefined,
        assigneeId: newTask.assigneeId || user.username
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTask({ title: '', description: '', projectId: currentProjectId || '', assigneeId: '', dueDate: '' });
      setShowAddForm(false);
      fetchTasks();
    } catch (err) {
      console.error('Görev oluşturma hatası', err);
      setError('Görev oluşturulamadı');
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
    } catch (err) {
      console.error('Create project failed', err);
      setError('Project creation failed');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    try {
      await axios.post(`${API_URL}/teams`, { name: newTeamName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTeamName('');
      setShowTeamModal(false);
      fetchTeams();
    } catch (err) {
      console.error('Ekip oluşturma hatası', err);
      setError('Ekip oluşturulamadı');
    }
  };

  const handleAddMemberToTeam = async (teamId) => {
    if (!memberToAdd) return;
    try {
      await axios.post(`${API_URL}/teams/${teamId}/members`, { username: memberToAdd }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMemberToAdd('');
      fetchTeams();
    } catch (err) {
      console.error('Add member failed', err);
    }
  };




  const handleUpdateStatus = async (id, status) => {
    if (!id || id === 'undefined') {
      console.error('Invalid Task ID for update');
      return;
    }
    try {
      await axios.patch(`${API_URL}/tasks/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleUpdateAssignee = async (id, assigneeId) => {
    if (!id || id === 'undefined') return;
    try {
      await axios.patch(`${API_URL}/tasks/${id}`, { assigneeId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Assignee update failed:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      // Optimistic Update
      setTasks(prev => prev.filter(t => t.id !== taskId));

      await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Görev silme hatası', err);
      setError('Görev silinemedi');
      fetchTasks(); // Restore if failed
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (currentProjectId === id) setCurrentProjectId(null);
      fetchProjects();
    } catch (err) {
      console.error('Project delete failed', err);
    }
  };

  const handleAiAsk = async () => {
    setIsAiLoading(true);
    setAiSummary('');
    setShowAiModal(true);
    try {
      const taskTexts = tasks
        .filter(t => !currentProjectId || t.projectId === currentProjectId)
        .map(t => `${t.title}: ${t.description || 'No description'}`)
        .join('\n');
      
      const res = await axios.post(`${API_URL}/ai/summarize`, { text: taskTexts }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiSummary(res.data.summary);
    } catch (err) {
      console.error('AI Summary failed', err);
      setAiSummary('Yapay zeka özeti alınamadı. Lütfen bağlantınızı kontrol edin.');
    } finally {
      setIsAiLoading(false);
    }
  };


  const renderView = () => {
    switch (view) {
      case 'list': return <ListView tasks={computedTasks} onUpdateStatus={handleUpdateStatus} onDelete={handleDeleteTask} onUpdateAssignee={handleUpdateAssignee} users={users} />;
      case 'table': return <TableView tasks={computedTasks} onUpdateStatus={handleUpdateStatus} onDelete={handleDeleteTask} onUpdateAssignee={handleUpdateAssignee} users={users} />;
      case 'calendar': return <CalendarView tasks={computedTasks} />;
      case 'gantt': return <div className="p-4 text-center">Gantt Görünümü Yakında...</div>;
      case 'home': return (
        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Hoş geldin, {displayName}!</h2>
          <p className="text-muted">Bugün yapacak çok işin var. Hadi başlayalım!</p>
        </div>
      );
      default: return (
        <BoardView 
          tasks={computedTasks} 
          onUpdateStatus={handleUpdateStatus} 
          onDelete={handleDeleteTask}
          onAddTask={(col) => { setTargetColumn(col); setShowAddForm(true); }}
          onUpdateAssignee={handleUpdateAssignee}
          users={users}
        />
      );
    }
  };


  if (!token) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-large">
              <Layout size={24} color="white" />
            </div>
             <h1 className="auth-title">{isRegistering ? 'Hesap Oluştur' : 'Tekrar Hoş Geldiniz'}</h1>
             <p className="auth-subtitle">
               {isRegistering ? 'En gelişmiş görev yöneticisine katılın' : 'İş akışınızı yönetmek için giriş yapın'}
             </p>
          </div>
          
          {isRegistering ? (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-row-modern">
                <div className="form-group-modern">
                  <label>Ad</label>
                  <input type="text" className="input-modern" placeholder="John" onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})} required/>
                </div>
                <div className="form-group-modern">
                  <label>Soyad</label>
                  <input type="text" className="input-modern" placeholder="Doe" onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})} required/>
                </div>
              </div>
              
              <div className="form-group-modern">
                <label>Kullanıcı Adı</label>
                <input type="text" className="input-modern" placeholder="johndoe" onChange={(e) => setRegisterData({...registerData, username: e.target.value})} required/>
              </div>

              <div className="form-group-modern">
                <label>E-posta</label>
                <input type="email" className="input-modern" placeholder="john@example.com" onChange={(e) => setRegisterData({...registerData, email: e.target.value})} required/>
              </div>

              <div className="form-row-modern">
                <div className="form-group-modern">
                  <label>Şifre</label>
                  <input type="password" className="input-modern" placeholder="••••••••" onChange={(e) => setRegisterData({...registerData, password: e.target.value})} required/>
                </div>
                <div className="form-group-modern">
                  <label>Şifre Tekrar</label>
                  <input type="password" className="input-modern" placeholder="••••••••" onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})} required/>
                </div>
              </div>

              {error && <div className="error-modern"><AlertCircle size={16} /> {error}</div>}
              
              <button type="submit" disabled={loading} className="primary-btn-modern">
                {loading ? 'Hesap Oluşturuluyor...' : 'Ücretsiz Hesap Oluştur'}
              </button>
              
              <div className="auth-footer">
                Zaten bir hesabınız var mı? <button type="button" onClick={() => setIsRegistering(false)}>Giriş Yap</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group-modern">
                <label>Kullanıcı Adı</label>
                <input type="text" className="input-modern" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="Kullanıcı adınızı girin" required/>
              </div>
              
              <div className="form-group-modern">
                <label>Şifre</label>
                <input type="password" className="input-modern" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required/>
              </div>

              {error && <div className="error-modern"><AlertCircle size={16} /> {error}</div>}
              {success && <div className="success-modern">{success}</div>}
              
              <button type="submit" disabled={loading} className="primary-btn-modern">
                {loading ? 'Giriş Yapılıyor...' : 'Çalışma Alanına Giriş Yap'}
              </button>
              
              <div className="auth-footer">
                Task Service'te yeni misiniz? <button type="button" onClick={() => setIsRegistering(true)}>Hesap oluşturun</button>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Kullanıcı';

  const currentProject = projects.find(p => p.id === currentProjectId);

  return (
    <div className="app-shell">
      <div className="sidebar-wrapper">
        <Sidebar 
          username={displayName} 
          projects={projects}
          teams={teams}
          currentView={view}
          onViewChange={setView}
          currentProjectId={currentProjectId}
          onProjectSelect={setCurrentProjectId}
          taskFilter={taskFilter}
          onTaskFilterChange={setTaskFilter}
          onDeleteProject={handleDeleteProject}
        />
      </div>
      
      <div className="main-wrapper">
        <TopBar 
          currentProject={currentProject} 
          currentView={view}
          onViewChange={setView}
          onSearchChange={setSearchTerm}
          searchTerm={searchTerm}
          onAiAsk={handleAiAsk}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onFilterPriority={setFilterPriority}
          onFilterAssignee={setFilterAssignee}
          users={users}
        />
        
        <main style={{ flex: 1, overflow: 'auto' }}>
           {renderView()}
        </main>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{targetColumn.toUpperCase()} Sütununa Yeni Görev Ekle</h3>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Görev Adı</label>
                <input autoFocus placeholder="Görev Adı" className="form-input" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} required/>
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea placeholder="Açıklama..." className="form-input" style={{minHeight: '80px'}} value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})}/>
              </div>
              <div className="form-row-modern" style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Sorumlu</label>
                  <select className="form-input" value={newTask.assigneeId} onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}>
                    <option value="">Sorumlu Yok</option>
                    {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Proje</label>
                  <select className="form-input" value={newTask.projectId} onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}>
                    <option value="">Proje Yok</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Teslim Tarihi</label>
                  <input type="date" className="form-input" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn-modal" onClick={() => setShowAddForm(false)}>İptal</button>
                <button type="submit" className="save-btn-modal">Görev Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Yeni Proje Oluştur</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Proje Adı</label>
                <input className="form-input" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Proje adı..." required />
              </div>
              <div className="form-group">
                <label>Ekip Seçin</label>
                <select className="form-input" value={projectTeamId} onChange={(e) => setProjectTeamId(e.target.value)} required>
                  <option value="">Ekip Seçin...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {teams.length === 0 && (
                  <p style={{fontSize: '11px', color: 'var(--primary)', marginTop: '4px', cursor: 'pointer'}} onClick={() => { setShowProjectModal(false); setShowTeamModal(true); }}>
                    Henüz bir ekibiniz yok mu? Buradan oluşturun.
                  </p>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn-modal" onClick={() => setShowProjectModal(false)}>İptal</button>
                <button type="submit" className="save-btn-modal">Proje Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Ekip Yönetimi</h3>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label>Yeni Ekip Adı</label>
                <input className="form-input" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Ekip adı..." required />
              </div>
              <button type="submit" className="save-btn-modal" style={{width:'100%', marginBottom: '20px'}}>Ekip Oluştur</button>
            </form>
            <hr style={{borderColor: 'rgba(255,255,255,0.1)', marginBottom: '20px'}} />
            <div className="form-group">
              <label>Mevcut Ekiplere Üye Ekle</label>
              {teams.map(team => (
                <div key={team.id} style={{marginBottom: '10px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
                  <div style={{fontWeight: 'bold', marginBottom: '5px'}}>{team.name}</div>
                  <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                    Üyeler: {team.members?.length > 0 ? team.members.map(m => m.username).join(', ') : 'Henüz üye yok'}
                  </div>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <input className="form-input" placeholder="Kullanıcı adı..." value={memberToAdd} onChange={(e) => setMemberToAdd(e.target.value)} />
                    <button type="button" className="save-btn-modern" style={{padding: '4px 12px', fontSize: '12px'}} onClick={() => handleAddMemberToTeam(team.id)}>Ekle</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-btn-modal" onClick={() => setShowTeamModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{maxWidth: '500px'}}>
            <h3><Sparkles size={18} style={{color: 'var(--primary)', marginRight: '8px'}} /> Yapay Zeka Özeti</h3>
            <div className="ai-summary-content" style={{minHeight: '150px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap'}}>
              {isAiLoading ? 'Yapay zeka düşünüyor...' : aiSummary}
            </div>
            <div className="modal-actions" style={{marginTop: '20px'}}>
              <button className="primary-btn-modern" onClick={() => setShowAiModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
