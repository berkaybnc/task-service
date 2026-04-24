import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

const CalendarView = ({ tasks, t }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthNames = t.monthNames;
  const dayNames = t.dayNames;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);
  const calendarDays = [];

  // Previous month padding
  for (let i = 0; i < startDay; i++) {
    calendarDays.push({ day: null, currentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
    calendarDays.push({ day: i, currentMonth: true, tasks: dayTasks });
  }

  return (
    <div className="calendar-container-v3">
      <div className="calendar-header-v3">
        <div className="calendar-title-group">
          <CalendarIcon size={20} className="text-primary" />
          <h2>{monthNames[month]} {year}</h2>
        </div>
        <div className="calendar-nav-btns">
          <button onClick={prevMonth}><ChevronLeft size={18} /></button>
          <button className="today-btn" onClick={() => setCurrentDate(new Date())}>{t.today}</button>
          <button onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="calendar-grid-v3">
        {dayNames.map(d => (
          <div key={d} className="calendar-weekday-v3">{d}</div>
        ))}
        {calendarDays.map((item, idx) => (
          <div key={idx} className={`calendar-day-v3 ${!item.currentMonth ? 'empty' : ''} ${item.day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() ? 'today' : ''}`}>
            {item.day && (
              <>
                <span className="day-number">{item.day}</span>
                <div className="day-tasks-v3">
                  {item.tasks?.map(task => (
                    <div key={task.id} className="calendar-task-pill" title={task.title}>
                      <span className="task-dot" style={{backgroundColor: task.priority === 'high' ? '#ff4d4d' : '#28bb7c'}}></span>
                      <span className="task-title-text">{task.title}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
