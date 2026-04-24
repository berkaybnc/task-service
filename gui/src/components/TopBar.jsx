import React from 'react';
import { 
  Search, 
  Bot,
  Zap, 
  Sparkles,
  ChevronRight,
  Filter,
  ArrowUpDown,
  List,
  Columns as BoardIcon,
  Calendar,
  Layers,
  MessageSquare,
  Users,
  Table,
  Plus,
  MoreHorizontal,
  Share2,
  ChevronLeft,
  Settings,
  UserCheck,
  EyeOff,
  SlidersHorizontal,
  ChevronDown,
  Star,
  Clock,
  Hash,
  CircleDot,
  Home,
  Sun,
  Moon
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const TopBar = ({ 
  currentView, 
  onViewChange, 
  currentProject, 
  onSearchChange, 
  searchTerm, 
  onAiAsk,
  sortBy,
  onSortChange,
  onFilterPriority,
  onFilterAssignee,
  users,
  theme,
  onToggleTheme,
  t,
  lang,
  onToggleLang,
  token,
  username,
  onTaskClick
}) => {
  return (
    <div className="top-bar-container">
      {/* 1. Global Header Row */}
      <div className="top-bar-row row-global">
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <ChevronLeft size={18} className="text-muted" cursor="pointer" />
          <ChevronRight size={18} className="text-muted" cursor="pointer" />
          <div className="toolbar-btn" onClick={onToggleTheme} style={{marginLeft: '8px'}}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </div>
          <div className="toolbar-btn" onClick={onToggleLang} style={{marginLeft: '4px', fontWeight: 'bold', fontSize: '12px'}}>
            {lang.toUpperCase()}
          </div>
        </div>

        <div className="search-pill">
          <Search size={14} />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)}
            style={{background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '13px', width: '100%'}}
          />
        </div>

        <div className="global-header-actions">
           <div className="badge-ask-ai" onClick={onAiAsk} style={{cursor: 'pointer'}}><Sparkles size={16} /> {t.askAi}</div>
           <NotificationCenter 
             token={token} 
             username={username} 
             onTaskClick={onTaskClick} 
             t={t} 
             lang={lang} 
           />
           <div className="toolbar-btn"><Share2 size={16} /> {t.share}</div>
           <div className="user-avatar-tiny" style={{width: '24px', height: '24px', fontSize: '11px', backgroundColor: 'var(--primary)', fontWeight: '700'}}>{username ? username[0].toUpperCase() : 'U'}</div>
        </div>
      </div>

      {/* 2. Navigation & View Switcher Row */}
      <div className="top-bar-row row-nav">
        <div className="nav-breadcrumbs">
          <Users size={14} className="text-primary" />
          <span>{t.teamWorkspace}</span>
          <ChevronRight size={14} />
          <Hash size={14} />
          <span className="breadcrumb-curr">{currentProject?.title || 'Tüm Görevler'}</span>
          <Star size={14} className="text-muted" style={{marginLeft: '4px'}} />
        </div>

        <nav className="view-switcher-tabs">
          <div className={`view-tab ${currentView === 'home' ? 'active' : ''}`} onClick={() => onViewChange('home')}>
            <Home size={14} /> {t.home}
          </div>
          <div className={`view-tab ${currentView === 'list' ? 'active' : ''}`} onClick={() => onViewChange('list')}>
            <List size={14} /> {t.list}
          </div>
          <div className={`view-tab ${currentView === 'board' ? 'active' : ''}`} onClick={() => onViewChange('board')}>
            <BoardIcon size={14} /> {t.board}
          </div>
          <div className={`view-tab ${currentView === 'calendar' ? 'active' : ''}`} onClick={() => onViewChange('calendar')}>
            <Calendar size={14} /> {t.calendar}
          </div>
          <div className={`view-tab ${currentView === 'table' ? 'active' : ''}`} onClick={() => onViewChange('table')}>
            <Table size={14} /> {t.table}
          </div>
          <div className={`view-tab ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => onViewChange('dashboard')}>
            <Layers size={14} /> {lang === 'tr' ? 'Dashboard' : 'Dashboard'}
          </div>
        </nav>
      </div>

      {/* 3. Filter & Action Toolbar Row */}
      <div className="top-bar-row row-toolbar">
         <div className="toolbar-left">
            <div className="toolbar-btn" style={{backgroundColor: 'rgba(255,255,255,0.05)', color: 'white'}}>
               <CircleDot size={12} className="text-muted" />
               <span style={{fontSize: '11px'}}>{t.groupStatus}</span>
               <ChevronDown size={12} />
            </div>
         </div>

          <div className="toolbar-right">
            <div className="toolbar-btn">
              <ArrowUpDown size={12} className="text-muted" />
              <select 
                className="toolbar-select" 
                value={sortBy} 
                onChange={(e) => onSortChange(e.target.value)}
              >
                <option value="title">{t.title} (A-Z)</option>
                <option value="status">{t.status}</option>
                <option value="priority">{t.priority}</option>
              </select>
              <ChevronDown size={12} className="text-muted" />
            </div>

            <div className="toolbar-btn">
              <Filter size={12} className="text-muted" />
              <select 
                className="toolbar-select" 
                onChange={(e) => onFilterPriority(e.target.value || null)}
              >
                <option value="">{t.priority} ({t.all})</option>
                <option value="high">{t.high}</option>
                <option value="medium">{t.medium}</option>
                <option value="low">{t.low}</option>
              </select>
              <ChevronDown size={12} className="text-muted" />
            </div>

            <div className="toolbar-btn">
              <UserCheck size={12} className="text-muted" />
              <select 
                className="toolbar-select" 
                onChange={(e) => onFilterAssignee(e.target.value || null)}
              >
                <option value="">{t.assignee} ({t.all})</option>
                {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
              </select>
              <ChevronDown size={12} className="text-muted" />
            </div>

            <button className="btn-add-task-blue" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}>
               {t.addTask} <Plus size={14} />
            </button>
          </div>
      </div>
    </div>
  );
};

export default TopBar;


