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
  CircleDot
} from 'lucide-react';

const TopBar = ({ currentView, onViewChange, currentProject }) => {
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
          <span>Search</span>
        </div>

        <div className="global-header-actions">
           <div className="toolbar-btn"><Bot size={18} /> Agents</div>
           <div className="toolbar-btn"><Zap size={18} /> Automate</div>
           <div className="badge-ask-ai"><Sparkles size={16} /> Ask AI</div>
           <div className="toolbar-btn"><Share2 size={16} /> Share</div>
           <div className="user-avatar-tiny" style={{width: '24px', height: '24px', fontSize: '11px', backgroundColor: '#444'}}>BB</div>
        </div>
      </div>

      {/* 2. Navigation & View Switcher Row */}
      <div className="top-bar-row row-nav">
        <div className="nav-breadcrumbs">
          <Users size={14} className="text-primary" />
          <span>Team Space</span>
          <ChevronRight size={14} />
          <Hash size={14} />
          <span className="breadcrumb-curr">{currentProject?.title || 'Project 1'}</span>
          <Star size={14} className="text-muted" style={{marginLeft: '4px'}} />
        </div>

        <nav className="view-switcher-tabs">
          <div className="view-tab"><MessageSquare size={14} /> Channel</div>
          <div className={`view-tab ${currentView === 'list' ? 'active' : ''}`} onClick={() => onViewChange('list')}>
            <List size={14} /> List
          </div>
          <div className={`view-tab ${currentView === 'board' ? 'active' : ''}`} onClick={() => onViewChange('board')}>
            <BoardIcon size={14} /> Board
          </div>
          <div className="view-tab"><Calendar size={14} /> Calendar</div>
          <div className="view-tab"><Layers size={14} /> Gantt</div>
          <div className="view-tab"><Table size={14} /> Table</div>
          <div className="view-tab"><Plus size={14} /> View</div>
        </nav>

        <div className="row-right-icons" style={{display: 'flex', gap: '12px'}}>
           <MoreHorizontal size={18} className="text-muted" />
        </div>
      </div>

      {/* 3. Filter & Action Toolbar Row */}
      <div className="top-bar-row row-toolbar">
         <div className="toolbar-left">
            <div className="toolbar-btn" style={{backgroundColor: 'rgba(255,255,255,0.05)', color: 'white'}}>
               <CircleDot size={12} className="text-muted" />
               <span style={{fontSize: '11px', opacity: 0.6}}>Group:</span> Status
               <ChevronDown size={12} />
            </div>
            <div className="toolbar-btn">
               Subtasks <ChevronDown size={12} />
            </div>
         </div>

         <div className="toolbar-right">
            <div className="toolbar-btn"><ArrowUpDown size={14} /> Sort</div>
            <div className="toolbar-btn"><Filter size={14} /> Filter</div>
            <div className="toolbar-btn"><EyeOff size={14} /> Closed</div>
            <div className="toolbar-btn"><UserCheck size={14} /> Assignee</div>
            <div className="toolbar-btn"><SlidersHorizontal size={14} /> Customize</div>
            <button className="btn-add-task-blue" onClick={() => window.dispatchEvent(new CustomEvent('open-task-modal'))}>
               Add Task <ChevronDown size={14} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default TopBar;


