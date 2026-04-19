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
  UserCircle
} from 'lucide-react';

const Sidebar = ({ username, teams, projects, currentView, onViewChange, currentProjectId, onProjectSelect }) => {
  const [teamSpaceOpen, setTeamSpaceOpen] = useState(true);
  const [myTasksOpen, setMyTasksOpen] = useState(true);

  return (
    <>
      {/* 1. Slim Icon Sidebar */}
      <aside className="sidebar-slim">
        <div className="slim-logo">
           <div style={{width: '28px', height: '28px', background: 'linear-gradient(135deg, #ff00df, #7b68ee)', borderRadius: '8px'}}></div>
        </div>
        
        <div className="slim-item active"><Home size={20} /></div>
        <div className="slim-item"><Calendar size={20} /></div>
        <div className="slim-item"><Sparkles size={20} /></div>
        <div className="slim-item"><Users size={20} /></div>
        <div className="slim-item"><BarChart2 size={20} /></div>
        <div className="slim-item"><Grid size={20} /></div>
        
        <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div className="slim-item"><Plus size={20} /></div>
          <div className="slim-item"><Bell size={20} /></div>
          <div className="user-avatar-tiny" style={{width: '32px', height: '32px', border: '2px solid #2b2b2b'}}>
             {username?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </aside>

      {/* 2. Main Sidebar Content */}
      <aside className="sidebar-main">
        <div className="sidebar-main-header">
          <div className="team-name-row">
            <span>Berkay binici's Workspace</span>
            <ChevronDown size={14} className="text-muted" />
          </div>
          <div className="create-btn-container">
             <button className="create-btn-large" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}>
               <Plus size={16} /> Create
             </button>
          </div>
        </div>

        <div className="sidebar-scrollable">
          {/* Home Section */}
          <div className="nav-section">
            <div className={`nav-row ${currentView === 'home' ? 'active' : ''}`} onClick={() => onViewChange('home')}>
              <div className="nav-row-content">
                <Home size={16} /> <span>Home</span>
              </div>
            </div>
            <div className="nav-row">
              <div className="nav-row-content">
                <Inbox size={16} /> <span>Inbox</span>
              </div>
            </div>
            <div className="nav-row">
              <div className="nav-row-content">
                <MessageSquare size={16} /> <span>Replies</span>
              </div>
            </div>
            <div className="nav-row">
              <div className="nav-row-content">
                <MessageSquare size={16} /> <span>Assigned Comments</span>
              </div>
            </div>
            
            <div className="nav-row" onClick={() => setMyTasksOpen(!myTasksOpen)}>
              <div className="nav-row-content">
                {myTasksOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <CheckSquare size={16} /> <span>My Tasks</span>
              </div>
            </div>
            
            {myTasksOpen && (
              <div className="nav-sub-items">
                <div className="nav-row" style={{fontSize: '12px'}}>
                  <div className="nav-row-content">
                    <UserCircle size={14} className="text-muted" />
                    <span>Assigned to me</span>
                  </div>
                </div>
                <div className="nav-row" style={{fontSize: '12px'}}>
                  <div className="nav-row-content">
                    <Calendar size={14} className="text-muted" />
                    <span>Today & Overdue</span>
                    <span className="badge-count" style={{marginLeft: 'auto'}}>1</span>
                  </div>
                </div>
                <div className="nav-row" style={{fontSize: '12px'}}>
                  <div className="nav-row-content">
                    <Users size={14} className="text-muted" />
                    <span>Personal List</span>
                  </div>
                </div>
                <div className="nav-row" style={{fontSize: '12px'}}>
                  <div className="nav-row-content">
                    <MoreHorizontal size={14} className="text-muted" />
                    <span>More</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="nav-section">
            <div className="section-label">
              <span>Favorites</span>
              <ChevronRight size={14} className="text-muted" />
            </div>
          </div>

          {/* Spaces Section */}
          <div className="nav-section">
            <div className="section-label">
              <span>Spaces</span>
              <Plus size={14} cursor="pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-team-modal'))} />
            </div>
            
            <div className="nav-row" onClick={() => setTeamSpaceOpen(!teamSpaceOpen)}>
              <div className="nav-row-content">
                {teamSpaceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Users size={16} className="text-primary" />
                <span>All Tasks</span>
              </div>
            </div>

            <div className="nav-row">
              <div className="nav-row-content">
                 <ChevronRight size={14} />
                 <div style={{width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--primary)'}}></div>
                 <span>Team Space</span>
              </div>
              <MoreHorizontal size={14} className="text-muted nav-row-hover-only" />
              <Plus size={14} className="text-muted nav-row-hover-only" />
            </div>

            {teamSpaceOpen && (
              <div className="nav-sub-items" style={{paddingLeft: '24px'}}>
                 {projects.map(proj => (
                   <div 
                     key={proj.id} 
                     className={`nav-row ${currentProjectId === proj.id ? 'active' : ''}`}
                     onClick={() => onProjectSelect(proj.id)}
                     style={{fontSize: '13px'}}
                   >
                     <div className="nav-row-content">
                       <Hash size={14} className="text-muted" />
                       <span>{proj.title}</span>
                     </div>
                     <span className="badge-count" style={{marginLeft: 'auto'}}>{proj.taskCount || 3}</span>
                   </div>
                 ))}
                 <div className="nav-row" style={{fontSize: '12px', color: 'var(--text-muted)'}}>
                    <Plus size={14} /> <span>New Space</span>
                 </div>
              </div>
            )}
          </div>
          
          <div className="nav-section">
            <div className="section-label">Channels</div>
            <div className="nav-row">
               <div className="nav-row-content">
                 <Hash size={14} /> <span>Project 1</span>
               </div>
            </div>
          </div>

          <div className="nav-section">
            <div className="section-label">Direct Messages</div>
            <div className="nav-row">
               <div className="nav-row-content">
                 <div className="user-avatar-tiny" style={{width: '18px', height: '18px', fontSize: '10px'}}>B</div>
                 <span>berkay binici</span>
                 <span style={{fontSize: '10px', color: 'var(--text-muted)'}}>— You</span>
               </div>
            </div>
            <div className="nav-row" style={{fontSize: '12px', color: 'var(--text-muted)'}}>
               <Plus size={14} /> <span>New message</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer-new">
          <div className="nav-row" onClick={() => window.dispatchEvent(new CustomEvent('logout'))}>
             <div className="nav-row-content">
               <div className="user-avatar-tiny" style={{width: '24px', height: '24px', fontSize: '11px'}}>{username?.[0] || 'B'}</div>
               <span>{username}</span>
             </div>
          </div>
          <div className="footer-btn-row" style={{display: 'flex', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px'}}>
             <div className="footer-icon-btn"><ArrowUpCircle size={16} /> Upgrade</div>
             <div className="footer-icon-btn"><UserPlus size={16} /> Invite</div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
