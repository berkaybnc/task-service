import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { LayoutDashboard, Users, CheckCircle, Clock } from 'lucide-react';

const DashboardView = ({ tasks, t, lang }) => {
  // 1. Data for Status Distribution
  const statusCounts = tasks.reduce((acc, task) => {
    const status = task.status || 'todo';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusData = [
    { name: t.status + ': TO DO', value: statusCounts.todo || 0, color: '#8884d8' },
    { name: 'DOING', value: statusCounts.doing || 0, color: '#2196f3' },
    { name: t.status + ': DONE', value: statusCounts.done || 0, color: '#28bb7c' }
  ].filter(d => d.value > 0);

  // 2. Data for Assignee Performance
  const assigneeCounts = tasks.reduce((acc, task) => {
    const assignee = task.assigneeId || (lang === 'tr' ? 'Atanmamış' : 'Unassigned');
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {});

  const assigneeData = Object.keys(assigneeCounts).map(name => ({
    name,
    count: assigneeCounts[name]
  }));

  const COLORS = ['#7b68ee', '#28bb7c', '#ff4d4d', '#f1c40f', '#0081ff'];

  return (
    <div className="dashboard-view" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Stats Cards */}
        <div className="stat-card" style={statCardStyle}>
          <div style={statIconStyle}><LayoutDashboard size={20} /></div>
          <div>
            <div style={statLabelStyle}>{lang === 'tr' ? 'Toplam Görev' : 'Total Tasks'}</div>
            <div style={statValueStyle}>{tasks.length}</div>
          </div>
        </div>
        <div className="stat-card" style={statCardStyle}>
          <div style={{...statIconStyle, color: '#28bb7c'}}><CheckCircle size={20} /></div>
          <div>
            <div style={statLabelStyle}>{lang === 'tr' ? 'Tamamlanan' : 'Completed'}</div>
            <div style={statValueStyle}>{statusCounts.done || 0}</div>
          </div>
        </div>
        <div className="stat-card" style={statCardStyle}>
          <div style={{...statIconStyle, color: '#2196f3'}}><Users size={20} /></div>
          <div>
            <div style={statLabelStyle}>{lang === 'tr' ? 'Devam Eden' : 'In Progress'}</div>
            <div style={statValueStyle}>{statusCounts.doing || 0}</div>
          </div>
        </div>
        <div className="stat-card" style={statCardStyle}>
          <div style={{...statIconStyle, color: '#f1c40f'}}><Clock size={20} /></div>
          <div>
            <div style={statLabelStyle}>{lang === 'tr' ? 'Bekleyen' : 'To Do'}</div>
            <div style={statValueStyle}>{statusCounts.todo || 0}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Pie Chart: Status Distribution */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>{lang === 'tr' ? 'Durum Dağılımı' : 'Status Distribution'}</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1f21', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Task by Assignee */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>{lang === 'tr' ? 'Kişi Başı Görev' : 'Tasks per User'}</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assigneeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#777" fontSize={12} />
                <YAxis stroke="#777" fontSize={12} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e1f21', border: '1px solid #333', borderRadius: '8px' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#7b68ee" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const statCardStyle = {
  background: 'var(--bg-card)',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: '1',
  minWidth: '200px'
};

const statIconStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  background: 'rgba(123, 104, 238, 0.1)',
  color: 'var(--primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const statLabelStyle = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  fontWeight: '600'
};

const statValueStyle = {
  fontSize: '24px',
  fontWeight: '700',
  color: 'var(--text-primary)'
};

const chartCardStyle = {
  background: 'var(--bg-card)',
  padding: '24px',
  borderRadius: '12px',
  border: '1px solid var(--border)'
};

const chartTitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '24px',
  color: 'var(--text-primary)'
};

export default DashboardView;
