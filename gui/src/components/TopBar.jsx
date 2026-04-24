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
  Home
} from 'lucide-react';

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
  users
}) => {
  return (
    <div className="top-bar-container">
      {/* 1. Global Header Row */}
      <div className="top-bar-row row-global">
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <ChevronLeft size={18} className="text-muted" cursor="pointer" />
          <ChevronRight size={18} className="text-muted" cursor="pointer" />
          <Search size={16} className="text-muted" style={{marginLeft: '8px'}} />
        </div>

        <div className="search-pill">
          <Search size={14} />
          <input 
            type="text" 
            placeholder="Görevlerde ara..." 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)}
            style={{background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '13px', width: '100%'}}
          />
        </div>

        <div className="global-header-actions">
           <div className="badge-ask-ai" onClick={onAiAsk} style={{cursor: 'pointer'}}><Sparkles size={16} /> Yapay Zekaya Sor</div>
           <div className="toolbar-btn"><Share2 size={16} /> Paylaş</div>
           <div className="user-avatar-tiny" style={{width: '24px', height: '24px', fontSize: '11px', backgroundColor: '#444'}}>BB</div>
        </div>
      </div>

      {/* 2. Navigation & View Switcher Row */}
      <div className="top-bar-row row-nav">
        <div className="nav-breadcrumbs">
          <Users size={14} className="text-primary" />
          <span>Ekip Alanı</span>
          <ChevronRight size={14} />
          <Hash size={14} />
          <span className="breadcrumb-curr">{currentProject?.title || 'Tüm Görevler'}</span>
          <Star size={14} className="text-muted" style={{marginLeft: '4px'}} />
        </div>

        <nav className="view-switcher-tabs">
          <div className={`view-tab ${currentView === 'home' ? 'active' : ''}`} onClick={() => onViewChange('home')}>
            <Home size={14} /> Ana Sayfa
          </div>
          <div className={`view-tab ${currentView === 'list' ? 'active' : ''}`} onClick={() => onViewChange('list')}>
            <List size={14} /> Liste
          </div>
          <div className={`view-tab ${currentView === 'board' ? 'active' : ''}`} onClick={() => onViewChange('board')}>
            <BoardIcon size={14} /> Pano
          </div>
          <div className={`view-tab ${currentView === 'calendar' ? 'active' : ''}`} onClick={() => onViewChange('calendar')}>
            <Calendar size={14} /> Takvim
          </div>
          <div className={`view-tab ${currentView === 'table' ? 'active' : ''}`} onClick={() => onViewChange('table')}>
            <Table size={14} /> Tablo
          </div>
        </nav>
      </div>

      {/* 3. Filter & Action Toolbar Row */}
      <div className="top-bar-row row-toolbar">
         <div className="toolbar-left">
            <div className="toolbar-btn" style={{backgroundColor: 'rgba(255,255,255,0.05)', color: 'white'}}>
               <CircleDot size={12} className="text-muted" />
               <span style={{fontSize: '11px', opacity: 0.6}}>Grup:</span> Durum
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
                <option value="title">Ad (A-Z)</option>
                <option value="status">Durum</option>
                <option value="priority">Öncelik</option>
              </select>
              <ChevronDown size={12} className="text-muted" />
            </div>

            <div className="toolbar-btn">
              <Filter size={12} className="text-muted" />
              <select 
                className="toolbar-select" 
                onChange={(e) => onFilterPriority(e.target.value || null)}
              >
                <option value="">Öncelik (Hepsi)</option>
                <option value="high">Yüksek</option>
                <option value="medium">Orta</option>
                <option value="low">Düşük</option>
              </select>
              <ChevronDown size={12} className="text-muted" />
            </div>

            <div className="toolbar-btn">
              <UserCheck size={12} className="text-muted" />
              <select 
                className="toolbar-select" 
                onChange={(e) => onFilterAssignee(e.target.value || null)}
              >
                <option value="">Sorumlu (Hepsi)</option>
                {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
              </select>
              <ChevronDown size={12} className="text-muted" />
            </div>

            <button className="btn-add-task-blue" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}>
               Görev Ekle <Plus size={14} />
            </button>
          </div>
      </div>
    </div>
  );
};

export default TopBar;


