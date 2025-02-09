import React, { useState, useEffect } from 'react';
import moment from 'moment';
import CustomMonthView from './CustomMonthView';
import WeekView from './WeekView';
import QuarterView from './QuarterView';
import TaskView from './TaskView';
import SearchResults from './SearchResults';

const TaskManagerCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // "month", "week", or "quarter"
  const [events, setEvents] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState({});
  const [dailyGoals] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Load persistent data from localStorage
  useEffect(() => {
    const storedEvents = localStorage.getItem('events');
    if (storedEvents) {
      // Convert start/end back to Date objects
      const parsed = JSON.parse(storedEvents).map((ev) => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));
      setEvents(parsed);
    }
    const storedGoals = localStorage.getItem('weeklyGoals');
    if (storedGoals) setWeeklyGoals(JSON.parse(storedGoals));
  }, []);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('weeklyGoals', JSON.stringify(weeklyGoals));
  }, [weeklyGoals]);

  // Navigation: adjust the currentDate based on view and direction.
  const navigate = (direction) => {
    let newDate = moment(currentDate);
    if (direction === 'today') {
      newDate = moment();
    } else {
      if (currentView === 'month') {
        newDate = direction === 'prev' ? newDate.subtract(1, 'month') : newDate.add(1, 'month');
      } else if (currentView === 'week') {
        newDate = direction === 'prev' ? newDate.subtract(1, 'week') : newDate.add(1, 'week');
      } else if (currentView === 'quarter') {
        newDate = direction === 'prev' ? newDate.subtract(3, 'month') : newDate.add(3, 'month');
      }
    }
    setCurrentDate(newDate.toDate());
  };

  // Open TaskView when a task is shift-clicked.
  const handleTaskShiftClick = (task) => {
    setSelectedTask(task);
  };

  const exportData = () => {
    // Gather all data to export
    const dataToExport = {
      events,         // your tasks (with subtasks and comments)
      weeklyGoals,    // your weekly goals
      // You could also include dailyGoals if needed:
      dailyGoals,
    };
  
    // Convert data to a formatted JSON string.
    const jsonStr = JSON.stringify(dataToExport, null, 2);
  
    // Create a Blob from the JSON string.
    const blob = new Blob([jsonStr], { type: "application/json" });
  
    // Create a temporary URL for the Blob.
    const url = URL.createObjectURL(blob);
  
    // Create a temporary anchor element to trigger the download.
    const link = document.createElement("a");
    link.href = url;
    link.download = "task-manager-data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    // Revoke the object URL after a short delay.
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };  

  return (
    <div style={{ background: '#121212', color: '#fff', minHeight: '100vh' }}>
    <header
    style={{
        background: '#1f1f1f',
        padding: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
    }}
    >
    <div>
        <button onClick={() => navigate('prev')} style={{ margin: '0.25rem', background: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Prev</button>
        <button onClick={() => navigate('today')} style={{ margin: '0.25rem', background: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Today</button>
        <button onClick={() => navigate('next')} style={{ margin: '0.25rem', background: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Next</button>
    </div>
    <div>
        <button onClick={() => setCurrentView('month')} style={{ margin: '0.25rem', background: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Month View</button>
        <button onClick={() => setCurrentView('week')} style={{ margin: '0.25rem', background: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Week View</button>
        <button onClick={() => setCurrentView('quarter')} style={{ margin: '0.25rem', background: '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Quarter View</button>
    </div>
    <div>
        <input
        type="text"
        placeholder="Search..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: 'none',
            outline: 'none',
            background: '#333',
            color: '#fff',
            margin: '0.25rem',
        }}
        />
        {/* New Export Data button */}
        <button onClick={exportData} style={{ margin: '0.25rem', background: '#555', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>
        Export Data
        </button>
    </div>
    </header>

      <main style={{ padding: '1rem' }}>
        {currentView === 'month' && (
          <CustomMonthView
            events={events}
            weeklyGoals={weeklyGoals}
            setWeeklyGoals={setWeeklyGoals}
            currentDate={currentDate}
            setEvents={setEvents}
            onTaskShiftClick={handleTaskShiftClick}
          />
        )}
        {currentView === 'week' && (
          <WeekView
            events={events}
            dailyGoals={dailyGoals}
            currentDate={currentDate}
            setEvents={setEvents}
            onTaskShiftClick={handleTaskShiftClick}
          />
        )}
        {currentView === 'quarter' && (
          <QuarterView
            events={events}
            weeklyGoals={weeklyGoals}
            currentDate={currentDate}
          />
        )}
      </main>
      {selectedTask && (
        <TaskView
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={(updatedTask) => {
            setEvents((prev) =>
              prev.map((ev) => (ev.id === updatedTask.id ? updatedTask : ev))
            );
          }}
        />
      )}
      {searchText && (
        <SearchResults
          searchText={searchText}
          events={events}
          weeklyGoals={weeklyGoals}
          onClose={() => setSearchText('')}
          onTaskShiftClick={(task) => {
            setSelectedTask(task);
            setSearchText('');
          }}
        />
      )}
    </div>
  );
};

export default TaskManagerCalendar;
