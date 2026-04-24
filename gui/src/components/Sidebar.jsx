import React, { useState } from 'react';
import { 
  Home, 
  Inbox, 
  MessageSquare,
  CheckSquare,
  ChevronRight, 
  ChevronDown,
  Plus, 
  Users, 
  Search,
  LogOut,
  Hash,
  Sparkles,
  Zap,
  MoreHorizontal,
  Calendar,
  Grid,
  BarChart2,
  Bell,
  Star,
  UserPlus,
  ArrowUpCircle,
  Layout,
  UserCircle,
  Trash2
} from 'lucide-react';

const Sidebar = ({ 
  username, 
  projects, 
  currentView, 
  onViewChange, 
  currentProjectId,
  onProjectSelect,
  taskFilter,
  onTaskFilterChange,
  onDeleteProject,
  teams = [],
  t
}) => {
  const [myTasksOpen, setMyTasksOpen] = useState(true);

  return (
    <>
      <aside className="sidebar-slim">
        <div className="slim-logo">
           <div style={{width: '28px', height: '28px', background: 'linear-gradient(135deg, #ff00df, #7b68ee)', borderRadius: '8px'}}></div>
        </div>
        
        <div className={`slim-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => onViewChange('home')}><Home size={20} /></div>
        <div className={`slim-item ${currentView === 'calendar' ? 'active' : ''}`} onClick={() => onViewChange('calendar')}><Calendar size={20} /></div>
        <div className="slim-item"><Sparkles size={20} /></div>
        <div className="slim-item"><Users size={20} /></div>
        <div className="slim-item"><BarChart2 size={20} /></div>
        <div className="slim-item" onClick={() => onViewChange('board')}><Grid size={20} /></div>
        
        <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div className="slim-item" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}><Plus size={20} /></div>
          <div className="slim-item"><Bell size={20} /></div>
          <div className="user-avatar-tiny" style={{width: '32px', height: '32px', border: '2px solid #2b2b2b'}}>
             {username?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </aside>

      <aside className="sidebar-main">
        <div className="sidebar-main-header">
          <div className="team-name-row">
            <span>{username}</span>
            <ChevronDown size={14} className="text-muted" />
          </div>
          <div className="create-btn-container">
             <button className="create-btn-large" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}>
                <Plus size={16} /> {t.create}
             </button>
          </div>
        </div>

        <div className="sidebar-scrollable">
          <div className="nav-section">
            <div className={`nav-row ${currentView === 'home' ? 'active' : ''}`} onClick={() => onViewChange('home')}>
              <div className="nav-row-content">
                <Home size={16} /> <span>{t.home}</span>
              </div>
            </div>
            <div className="nav-row">
              <div className="nav-row-content">
                <Inbox size={16} /> <span>{t.inbox}</span>
              </div>
            </div>
            <div className="nav-row">
              <div className="nav-row-content">
                <MessageSquare size={16} /> <span>{t.replies}</span>
              </div>
            </div>
            
            <div className="nav-row" onClick={() => setMyTasksOpen(!myTasksOpen)}>
              <div className="nav-row-content">
                {myTasksOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <CheckSquare size={16} /> <span>{t.myTasks}</span>
              </div>
            </div>
            
            {myTasksOpen && (
              <div className="nav-sub-items">
                <div className={`nav-row ${taskFilter === 'mine' ? 'active' : ''}`} onClick={() => onTaskFilterChange('mine')} style={{fontSize: '12px'}}>
                  <div className="nav-row-content">
                    <UserCircle size={14} className="text-muted" />
                    <span>{t.assignedToMe}</span>
                  </div>
                </div>
                <div className={`nav-row ${taskFilter === 'all' && !currentProjectId ? 'active' : ''}`} onClick={() => { onProjectSelect(null); onTaskFilterChange('all'); }} style={{fontSize: '12px'}}>
                  <div className="nav-row-content">
                    <Layout size={14} className="text-muted" />
                    <span>{t.allMyTasks}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="nav-section">
            <div className="section-label">
              <span>{t.teams}</span>
              <Plus size={14} cursor="pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-team-modal'))} />
            </div>
            
            <div className={`nav-row ${!currentProjectId && currentView !== 'home' ? 'active' : ''}`} onClick={() => { onProjectSelect(null); onTaskFilterChange('all'); }}>
              <div className="nav-row-content">
                <Users size={16} className="text-primary" />
                <span>{t.allTeams}</span>
              </div>
            </div>

            <div className="nav-sub-items">
               {teams.map(team => (
                 <div key={team.id} className="nav-row" style={{fontSize: '12px', opacity: 0.8}} onClick={() => window.dispatchEvent(new CustomEvent('open-team-modal'))}>
                   <div className="nav-row-content">
                     <Users size={12} /> <span>{team.name}</span>
                   </div>
                 </div>
               ))}
               <div className="nav-row" style={{fontSize: '12px', color: 'var(--primary)', fontWeight: '600'}} onClick={() => window.dispatchEvent(new CustomEvent('open-team-modal'))}>
                  <UserPlus size={14} /> <span>{t.createTeam}</span>
               </div>
            </div>
          </div>

          <div className="nav-section" style={{marginTop: '16px'}}>
            <div className="section-label">
              <span>{t.projects}</span>
              <Plus size={14} cursor="pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-project-modal'))} />
            </div>

            {projects.map(proj => (
              <div 
                key={proj.id} 
                className={`nav-row project-row ${currentProjectId === proj.id ? 'active' : ''}`}
                onClick={() => onProjectSelect(proj.id)}
                style={{fontSize: '13px'}}
              >
                <div className="nav-row-content">
                  <Hash size={14} className="text-muted" />
                  <span>{proj.title}</span>
                </div>
                <Trash2 
                  size={14} 
                  className="nav-row-hover-only text-danger" 
                  onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }}
                  style={{cursor: 'pointer'}}
                />
              </div>
            ))}
            
            <div className="nav-row" style={{fontSize: '12px', color: 'var(--text-muted)'}} onClick={() => window.dispatchEvent(new CustomEvent('open-project-modal'))}>
               <Plus size={14} /> <span>{t.newProject}</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer-new">
          <div className="nav-row" onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>
             <div className="nav-row-content">
                <LogOut size={16} className="text-muted" />
                <span>{t.logout}</span>
             </div>
          </div>
          <div className="footer-btn-row" style={{display: 'flex', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px'}}>
             <div className="footer-icon-btn"><ArrowUpCircle size={16} /> {t.upgrade}</div>
             <div className="footer-icon-btn" onClick={() => window.dispatchEvent(new CustomEvent('open-team-modal'))}><UserPlus size={16} /> {t.invite}</div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
