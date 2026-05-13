import { useState, useEffect, useRef, useCallback } from 'react';
import { StoreProvider, useStore } from './store';
import './App.css';
import Dashboard from './Dashboard.jsx';


/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

/* ─────────────────────────────────────────────
   Calendar Picker Component
───────────────────────────────────────────── */
function CalendarPicker({ value, onChange, onClose, minDate = null }) {
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  
  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }
  
  function selectDay(day) {
    const selected = new Date(year, month, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (minDate === 'today' && selected < now) return;
    
    const h = value ? new Date(value).getHours() : 9;
    const m = value ? new Date(value).getMinutes() : 0;
    selected.setHours(h, m);
    
    onChange(selected.getTime());
  }
  
  function confirmSelection() {
    if (onClose) onClose();
  }
  
  function clearSelection() {
    onChange(null);
    if (onClose) onClose();
  }
  
  function isToday(day) {
    const d = new Date(year, month, day);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }
  
  function isSelected(day) {
    if (!value) return false;
    const d = new Date(year, month, day);
    return d.toDateString() === new Date(value).toDateString();
  }
  
  function isPast(day) {
    if (minDate !== 'today') return false;
    const d = new Date(year, month, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d < now;
  }
  
  return (
    <div className="calendar-picker">
      <div className="cal-header">
        <button onClick={prevMonth}>◀</button>
        <span>{months[month]} {year}</span>
        <button onClick={nextMonth}>▶</button>
      </div>
      <div className="cal-days">
        {days.map(d => <span key={d}>{d}</span>)}
        {cells.map((day, i) => (
          <button
            key={i}
            className={`cal-day ${day ? '' : 'empty'} ${day && isToday(day) ? 'today' : ''} ${day && isSelected(day) ? 'selected' : ''} ${day && isPast(day) ? 'past' : ''}`}
            onClick={() => day && !isPast(day) && selectDay(day)}
            disabled={!day || isPast(day)}
          >
            {day}
          </button>
        ))}
      </div>
      {value && (
        <div className="cal-time-row">
          <span className="cal-time-label">Time:</span>
          <input
            type="time"
            className="cal-time-input"
            value={new Date(value).toTimeString().slice(0, 5)}
            onChange={e => {
              const [h, m] = e.target.value.split(':');
              const d = new Date(value);
              d.setHours(Number(h), Number(m));
              onChange(d.getTime());
            }}
          />
        </div>
      )}
      <div className="cal-actions">
        {value ? (
          <>
            <button className="cal-confirm-btn" onClick={confirmSelection}>Confirm</button>
            <button className="cal-clear-btn" onClick={clearSelection}>Clear</button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sidebar
───────────────────────────────────────────── */
function Sidebar() {
  const { state, dispatch } = useStore();
  const [showNewWs, setShowNewWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsIcon, setNewWsIcon] = useState('📁');
  const [newWsColor, setNewWsColor] = useState('#7c3aed');
  const activeWorkspaces = state.workspaces.filter(ws => !ws.archivedAt);

  function handleAddWorkspace() {
    const name = newWsName.trim();
    if (!name) return;
    dispatch({ type: 'ADD_WORKSPACE', name, color: newWsColor, icon: newWsIcon });
    setNewWsName('');
    setNewWsIcon('📁');
    setNewWsColor('#7c3aed');
    setShowNewWs(false);
  }

  const taskCountFor = (wsId) =>
    state.tasks.filter(t => t.workspaceId === wsId && t.status !== 'done').length;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div>
          <h2>FocusDesk</h2>
          <span>Productivity OS</span>
        </div>
      </div>

      {/* Workspaces */}
      <div className="sidebar-section-label">Workspaces</div>
      <nav className="workspace-list">
        {activeWorkspaces.map(ws => {
          const count = taskCountFor(ws.id);
          return (
            <button
              key={ws.id}
              id={`ws-btn-${ws.id}`}
              className={`workspace-item ${state.settings.activeWorkspaceId === ws.id && state.activeView === 'tasks' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_WORKSPACE', id: ws.id })}
              style={{ '--ws-color': ws.color }}
              title={ws.name}
            >
              <span className="ws-icon">{ws.icon}</span>
              <span className="ws-name">{ws.name}</span>
              {count > 0 && <span className="ws-count">{count}</span>}
            </button>
          );
        })}
        {showNewWs ? (
          <div className="add-workspace-form">
            <input
              className="add-workspace-input"
              type="text"
              placeholder="Workspace name"
              value={newWsName}
              onChange={e => setNewWsName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddWorkspace(); if (e.key === 'Escape') setShowNewWs(false); }}
              autoFocus
            />
            <div className="add-workspace-section">
              <label className="add-workspace-label">Pick an icon</label>
              <div className="icon-picker">
                {['🎯','💼','🚀','🎨','📚','💡','🌿','⚡','🔥','✨','💪','🎮'].map(icon => (
                  <button key={icon} className={`icon-option ${newWsIcon === icon ? 'selected' : ''}`} onClick={() => setNewWsIcon(icon)} title={`Icon: ${icon}`}>{icon}</button>
                ))}
              </div>
            </div>
            <div className="add-workspace-section">
              <label className="add-workspace-label">Choose a color</label>
              <div className="color-picker">
                {[{color: '#7c3aed', name: 'Purple'}, {color: '#0ea5e9', name: 'Blue'}, {color: '#10b981', name: 'Green'}, {color: '#f59e0b', name: 'Amber'}, {color: '#ef4444', name: 'Red'}, {color: '#ec4899', name: 'Pink'}].map(({color, name}) => (
                  <button key={color} className={`color-option ${newWsColor === color ? 'selected' : ''}`} style={{ background: color }} onClick={() => setNewWsColor(color)} title={name} data-color={name} />
                ))}
              </div>
            </div>
            <div className="add-workspace-btns">
              <button className="btn btn-primary" onClick={handleAddWorkspace}>✓ Add Workspace</button>
              <button className="btn btn-secondary" onClick={() => setShowNewWs(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="add-workspace" id="add-workspace-btn" onClick={() => setShowNewWs(true)}>
            <span style={{ fontSize: 16 }}>＋</span> New Workspace
          </button>
        )}
      </nav>

      {/* Footer nav */}
      <div className="sidebar-footer">
        {state.settings.streakDays > 0 && (
          <div className="streak-badge">
            🔥 {state.settings.streakDays} day streak
          </div>
        )}
          <button
            id="nav-dashboard"
            className={state.activeView === 'dashboard' ? 'active' : ''}
            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'dashboard' })}
          >
            📊 <span>Dashboard</span>
          </button>
          <button
            id="nav-coach"
            className={state.activeView === 'coach' ? 'active' : ''}
            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'coach' })}
          >
            🧠 <span>Coach</span>
          </button>
        <button
          id="nav-ideas"
          className={state.activeView === 'ideas' ? 'active' : ''}
          onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'ideas' })}
        >
          💡 <span>Ideas</span>
        </button>
        <button
          id="nav-pomodoro"
          className={state.activeView === 'pomodoro' ? 'active' : ''}
          onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'pomodoro' })}
        >
          🍅 <span>Pomodoro</span>
        </button>
        <button
          id="nav-settings"
          className={state.activeView === 'settings' ? 'active' : ''}
          onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'settings' })}
        >
          ⚙️ <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   Task List
───────────────────────────────────────────── */
function TaskList() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState('all');
  const [newPriority, setNewPriority] = useState('normal');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showDueCal, setShowDueCal] = useState(false);
  const [showSchedCal, setShowSchedCal] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newReminder, setNewReminder] = useState(30);
  const [editingTask, setEditingTask] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(null);
  const [breakdownInput, setBreakdownInput] = useState('');
  const [completingTask, setCompletingTask] = useState(null);
  const inputRef = useRef(null);

  const activeWs = state.workspaces.find(w => w.id === state.settings.activeWorkspaceId);
  const allTasks = state.tasks.filter(t => t.workspaceId === state.settings.activeWorkspaceId);
  const todoTasks = allTasks.filter(t => t.status === 'todo');
  const doneTasks = allTasks.filter(t => t.status === 'done');
  const progress = allTasks.length ? Math.round((doneTasks.length / allTasks.length) * 100) : 0;
  
  const parentTasks = todoTasks.filter(t => !t.parentId);
  const childTasks = allTasks.filter(t => t.parentId);
  
  const getChildren = (parentId) => childTasks.filter(c => c.parentId === parentId);
  
  const sortedParentTasks = parentTasks.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));

  function handleToggle(taskId) {
    setCompletingTask(taskId);
    dispatch({ type: 'TOGGLE_TASK', id: taskId });
    setTimeout(() => setCompletingTask(null), 400);
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('.cal-popup')) {
        setShowDueCal(false);
        setShowSchedCal(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = Date.now();
    const timeouts = [];
    state.tasks.forEach(t => {
      if (!t.status || t.status === 'done') return;

      if (t.scheduledDate && !t.remindAt && t.scheduledDate > now) {
        const remindAt = t.scheduledDate - (t.reminderMinutes || 30) * 60000;
        const timeout = remindAt - now;
        if (timeout > 0 && timeout < 86400000) {
          timeouts.push(setTimeout(() => {
            new Notification('📌 Upcoming Task', { body: `${t.title} starts in ${t.reminderMinutes || 30} minutes`, icon: '⚡' });
            dispatch({ type: 'UPDATE_TASK', id: t.id, patch: { remindAt: Date.now() } });
          }, timeout));
        }
      }

      if (t.dueDate && !t.remindAt && t.dueDate > now && t.dueDate - now <= 3600000) {
        const timeout = t.dueDate - now;
        if (timeout > 0) {
          timeouts.push(setTimeout(() => {
            new Notification('⏰ Task due soon', { body: t.title, icon: '⚡' });
            dispatch({ type: 'UPDATE_TASK', id: t.id, patch: { remindAt: Date.now() } });
          }, timeout));
        }
      }
    });
    return () => timeouts.forEach(clearTimeout);
  }, [state.tasks, dispatch]);

  if (!activeWs) {
    return (
      <main className="main-content">
        <div className="no-workspace">
          <div className="no-workspace-icon">🗂️</div>
          <h2>No workspace selected</h2>
          <p>Pick a workspace from the sidebar or create a new one.</p>
        </div>
      </main>
    );
  }

  function handleAdd(e) {
    if (e.key === 'Enter') {
      const input = e.target;
      const val = input.value.trim();
      if (val) {
        dispatch({ type: 'ADD_TASK', title: val, workspaceId: activeWs.id, priority: newPriority, dueDate: newDueDate || null, scheduledDate: newScheduledDate || null, duration: newDuration ? Number(newDuration) : null, reminderMinutes: newReminder });
        input.value = '';
        setNewDueDate('');
        setNewScheduledDate('');
        setNewDuration('');
        setShowDueCal(false);
        setShowSchedCal(false);
        setShowSchedule(false);
      }
    }
  }

  function formatDue(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.ceil((d - now) / 86400000);
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, urgent: true };
    if (diff === 0) return { text: 'Today', urgent: true };
    if (diff === 1) return { text: 'Tomorrow', urgent: true };
    return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false };
  }
  
  function handleBreakdown(parentTask) {
    const subs = breakdownInput.split('\n').filter(s => s.trim());
    if (subs.length === 0) return;
    const newSubs = subs.map(title => ({
      id: 'id-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now() + Math.random(),
      title: title.trim(),
      workspaceId: parentTask.workspaceId,
      priority: parentTask.priority,
      dueDate: parentTask.dueDate,
      remindAt: null,
      status: 'todo',
      recurRule: null,
      notes: '',
      createdAt: Date.now(),
      parentId: parentTask.id
    }));
    dispatch({ type: 'ADD_BATCH_TASKS', tasks: newSubs });
    setShowBreakdown(null);
    setBreakdownInput('');
  }
  
  function startFocus(task) {
    setFocusMode(true);
    setFocusTaskId(task.id);
  }
  
  function exitFocus() {
    setFocusMode(false);
    setFocusTaskId(null);
  }

  return (
    <main className="main-content">
      <header className="content-header">
        <div className="content-header-left">
          <span style={{ fontSize: 24 }}>{activeWs.icon}</span>
          <h1>{activeWs.name}</h1>
          <span className="header-ws-badge" style={{ background: activeWs.color + '22', color: activeWs.color }}>
            {todoTasks.length} tasks
          </span>
          {focusMode && (
            <button className="exit-focus-btn" onClick={exitFocus}>✕ Exit Focus</button>
          )}
          {!focusMode && parentTasks.length > 2 && (
            <button className="focus-mode-btn" onClick={() => { setFocusMode(true); setFocusTaskId(parentTasks[0]?.id); }}>
              🎯 Focus
            </button>
          )}
        </div>
      </header>

      <div className="content-body">
        {allTasks.length > 0 && (
          <div className="tasks-progress-bar" title={`${progress}% complete`}>
            <div className="tasks-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Input */}
        <div className="task-input-wrapper" onClick={e => e.stopPropagation()}>
          <span className="task-input-icon">+</span>
          <input ref={inputRef} id="task-input" type="text" placeholder="Add a task..." onKeyDown={handleAdd} onClick={e => e.stopPropagation()} />
          <select id="new-task-priority" className="priority-select" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
            <option value="urgent">🔴</option>
            <option value="high">🟠</option>
            <option value="normal">🔵</option>
            <option value="low">🟢</option>
          </select>
          
          {newDueDate ? (
            <div className="date-badge due-badge" onClick={() => setShowDueCal(!showDueCal)}>
              {(() => {
                const dd = new Date(newDueDate);
                const dateStr = dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = dd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                return <>{dateStr} {timeStr}</>;
              })()}
              <span onClick={e => { e.stopPropagation(); setNewDueDate(''); setShowDueCal(false); }}>×</span>
            </div>
          ) : (
            <button className="date-btn" onClick={e => { e.stopPropagation(); setShowDueCal(!showDueCal); setShowSchedCal(false); }} title="Set deadline">📅</button>
          )}
          
          {newScheduledDate ? (
            <div className="date-badge sched-badge" onClick={() => setShowSchedCal(!showSchedCal)}>
              {(() => {
                const sd = new Date(newScheduledDate);
                const dateStr = sd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = sd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                return <>{dateStr} {timeStr}</>;
              })()}
              <span onClick={e => { e.stopPropagation(); setNewScheduledDate(''); setShowSchedCal(false); }}>×</span>
            </div>
          ) : (
            <button className="date-btn" onClick={e => { e.stopPropagation(); setShowSchedCal(!showSchedCal); setShowDueCal(false); }} title="Schedule">📆</button>
          )}
          
          {newScheduledDate && (
            <input type="number" className="duration-input" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="Min" min="5" max="480" />
          )}
          
          {newScheduledDate && showSchedule && (
            <select className="reminder-select" value={newReminder} onChange={e => setNewReminder(Number(e.target.value))}>
              <option value={15}>🔔 15m</option>
              <option value={30}>🔔 30m</option>
              <option value={60}>🔔 1h</option>
              <option value={120}>🔔 2h</option>
            </select>
          )}
          
          {newScheduledDate && !showSchedule && (
            <button className="reminder-toggle" onClick={e => { e.stopPropagation(); setShowSchedule(true); }}>🔔</button>
          )}
          
          <span className="task-input-hint" onClick={(e) => { e.stopPropagation(); const input = document.getElementById('task-input'); if (input) handleAdd({ key: 'Enter', target: input }); }}>↵ Enter</span>
          
          {(showDueCal || showSchedCal) && (
            <div className="cal-popup" onClick={e => e.stopPropagation()}>
              {showDueCal && (
                <CalendarPicker value={newDueDate} onChange={v => setNewDueDate(v)} onClose={() => setShowDueCal(false)} minDate="today" />
              )}
              {showSchedCal && (
                <CalendarPicker value={newScheduledDate} onChange={v => setNewScheduledDate(v)} onClose={() => setShowSchedCal(false)} />
              )}
            </div>
          )}
        </div>

        {/* Filters & stats */}
        <div className="tasks-meta">
          <div className="tasks-stats">
            <span className="stat-pill">
              <span className="dot" style={{ background: 'var(--normal)' }} />
              {allTasks.filter(t => t.status === 'todo').length} todo
            </span>
            <span className="stat-pill">
              <span className="dot" style={{ background: 'var(--low)' }} />
              {doneTasks.length} done
            </span>
          </div>
          <div className="filter-tabs">
            {['all', 'todo', 'done'].map(f => (
              <button
                key={f}
                id={`filter-${f}`}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

{/* Task items */}
        {sortedParentTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{filter === 'done' ? '🎉' : '✅'}</div>
            <p>{filter === 'done' ? 'No completed tasks yet.' : focusMode ? 'No tasks match focus mode. Try adding a task or exiting focus.' : 'All clear! Add your first task.'}</p>
          </div>
        ) : (
          <ul className="tasks">
            {sortedParentTasks.map(task => (
              <li key={task.id} className={`task-item ${task.status} ${focusMode && task.id !== focusTaskId ? 'dimmed' : ''} ${completingTask === task.id ? 'just-done' : ''}`}>
                <input type="checkbox" className="task-checkbox" id={`task-cb-${task.id}`} checked={task.status === 'done'} onChange={() => handleToggle(task.id)} />
                <div className="task-body" onClick={() => setEditingTask(editingTask === task.id ? null : task.id)}>
                  {editingTask === task.id ? (
                    <div className="task-edit-form">
                      <input className="task-edit-input" defaultValue={task.title} onKeyDown={e => { if (e.key === 'Enter') { dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { title: e.target.value } }); setEditingTask(null); } if (e.key === 'Escape') setEditingTask(null); }} autoFocus />
                      <div className="task-edit-row">
                        <select className="priority-select" defaultValue={task.priority} onChange={e => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { priority: e.target.value } })}>
                          <option value="urgent">🔴 Urgent</option>
                          <option value="high">🟠 High</option>
                          <option value="normal">🔵 Normal</option>
                          <option value="low">🟢 Low</option>
                        </select>
                        <input type="datetime-local" className="cal-time-input" defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''} onChange={e => dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { dueDate: e.target.value ? new Date(e.target.value).getTime() : null } })} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="task-title">{task.title}</span>
                      <div className="task-meta-row">
                        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                        {task.dueDate && (() => { const d = formatDue(task.dueDate); return <span className={`task-due ${d.urgent ? 'urgent' : ''}`}>⏰ {d.text}</span>; })()}
                        {task.scheduledDate && (() => {
                          const sd = new Date(task.scheduledDate);
                          const timeStr = sd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                          return <span className="task-scheduled">📆 {sd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {timeStr}</span>;
                        })()}
                        {getChildren(task.id).length > 0 && <span className="subtask-count" title={`${getChildren(task.id).filter(c => c.status === 'done').length} of ${getChildren(task.id).length} steps completed`}>📋 {getChildren(task.id).filter(c => c.status === 'done').length}/{getChildren(task.id).length}</span>}
                      </div>
                    </>
                  )}
                </div>
                <div className="task-actions">
                  {!focusMode && (
                    <>
                      <button className="task-btn" title="Break into steps" onClick={() => setShowBreakdown(showBreakdown === task.id ? null : task.id)}>↳</button>
                      <button className="task-btn" title="Focus on this" onClick={() => startFocus(task)}>🎯</button>
                    </>
                  )}
                  <button className="delete-task" id={`delete-task-${task.id}`} title="Delete" onClick={() => dispatch({ type: 'DELETE_TASK', id: task.id })}>×</button>
                </div>
              </li>
            ))}
            {showBreakdown && (() => {
              const pt = sortedParentTasks.find(t => t.id === showBreakdown);
              return pt ? (
                <li className="breakdown-form">
                  <p>Break "{pt.title}" into steps (one per line):</p>
                  <textarea className="breakdown-input" placeholder="Step 1&#10;Step 2&#10;Step 3" value={breakdownInput} onChange={e => setBreakdownInput(e.target.value)} rows={4} autoFocus />
                  <div className="breakdown-actions">
                    <button className="btn btn-primary" onClick={() => handleBreakdown(pt)}>Split</button>
                    <button className="btn btn-secondary" onClick={() => { setShowBreakdown(null); setBreakdownInput(''); }}>Cancel</button>
                  </div>
                </li>
              ) : null;
            })()}
            {sortedParentTasks.map(parent => {
              const subs = getChildren(parent.id);
              return subs.map(sub => (
                <li key={sub.id} className={`task-item child-task ${sub.status} ${focusMode && parent.id !== focusTaskId ? 'dimmed' : ''} ${completingTask === sub.id ? 'just-done' : ''}`}>
                  <input type="checkbox" className="task-checkbox" id={`task-cb-${sub.id}`} checked={sub.status === 'done'} onChange={() => handleToggle(sub.id)} />
                  <div className="task-body">
                    <span className="task-title child-title">{sub.title}</span>
                  </div>
                  <button className="delete-task" id={`delete-task-${sub.id}`} title="Delete" onClick={() => dispatch({ type: 'DELETE_TASK', id: sub.id })}>×</button>
                </li>
              ));
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   Idea Board
───────────────────────────────────────────── */
function IdeaBoard() {
  const { state, dispatch } = useStore();
  const textareaRef = useRef(null);

  function handleCapture() {
    const val = textareaRef.current?.value?.trim();
    if (!val) return;
    dispatch({ type: 'ADD_IDEA', content: val });
    textareaRef.current.value = '';
  }

  return (
    <main className="main-content">
      <header className="content-header">
        <div className="content-header-left">
          <span style={{ fontSize: 24 }}>💡</span>
          <h1>Idea Capture</h1>
          <span className="header-ws-badge" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--accent)' }}>
            {state.ideas.length} ideas
          </span>
        </div>
      </header>

      <div className="content-body">
        <div className="idea-input-wrapper">
          <textarea
            ref={textareaRef}
            id="idea-input"
            placeholder="Capture a thought, insight, or anything on your mind…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCapture(); }
            }}
          />
          <div className="idea-input-footer">
            <span>Shift+Enter for new line · Enter to capture</span>
            <button id="capture-idea-btn" className="btn-capture" onClick={handleCapture}>
              ✦ Capture
            </button>
          </div>
        </div>

        {state.ideas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌱</div>
            <p>Your idea garden is empty. Start planting!</p>
          </div>
        ) : (
          <div className="ideas-grid">
            {state.ideas.map(idea => (
              <div key={idea.id} className="idea-card">
                <p>{idea.content}</p>
                <span className="idea-timestamp">{timeAgo(idea.createdAt)}</span>
                <div className="idea-actions">
                  <button
                    id={`convert-idea-${idea.id}`}
                    className="btn-convert"
                    onClick={() => dispatch({ type: 'CONVERT_IDEA_TO_TASK', id: idea.id })}
                  >
                    → Task
                  </button>
                  <button
                    id={`delete-idea-${idea.id}`}
                    className="btn-delete-idea"
                    onClick={() => dispatch({ type: 'DELETE_IDEA', id: idea.id })}
                  >
                    Delete
                  </button>
                </div>
              </div>
))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   Coach Tab
───────────────────────────────────────────── */
function CoachView() {
  const { state } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState(null);
  const chatEndRef = useRef(null);

  const moods = [
    { id: 'motivated', icon: '🚀', label: 'Motivated', color: 'var(--low)' },
    { id: 'stuck', icon: '🤯', label: 'Stuck', color: 'var(--high)' },
    { id: 'overwhelmed', icon: '😰', label: 'Overwhelmed', color: 'var(--urgent)' },
    { id: 'tired', icon: '😴', label: 'Tired', color: 'var(--accent)' },
  ];

  const quickActions = [
    { label: "I'm procrastinating", icon: '⏸️' },
    { label: 'I finished a task!', icon: '🎉' },
    { label: 'I feel scattered', icon: '🌪️' },
    { label: 'Need motivation', icon: '💪' },
  ];

  async function sendMessage(content) {
    if (!content.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = localStorage.getItem('groq_api_key');
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'assistant', content: "I need an API key to chat with you. Go to Settings and add your Groq API key (it's free!)." }]);
        return;
      }

      const { askCoach } = await import('./api/coach.js');
      const reply = await askCoach(messages.concat(userMsg), apiKey);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Oops! ${err.message}. Try again or check your API key in Settings.` }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleMoodClick(m) {
    setMood(m.id);
    const prompts = {
      motivated: "I'm feeling motivated today! Any tips to make the most of this energy?",
      stuck: "I'm completely stuck on something. I can't even think straight.",
      overwhelmed: "Everything feels overwhelming. I have so much to do and my brain is shutting down.",
      tired: "I'm so tired. How do I push through when my brain is fried?",
    };
    sendMessage(prompts[m.id]);
  }

  function handleQuickAction(action) {
    sendMessage(action.label);
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className="main-content">
      <header className="content-header">
        <div className="content-header-left">
          <span style={{ fontSize: 24 }}>🧠</span>
          <h1>Coach</h1>
          <span className="header-ws-badge" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--high)' }}>
            Your focus companion
          </span>
        </div>
      </header>

      <div className="content-body coach-body">
        {/* Mood check-in */}
        {!mood && messages.length === 0 && (
          <div className="coach-intro">
            <div className="coach-avatar">🤖</div>
            <h2>How are you feeling?</h2>
            <p>I'm here to help you stay focused and manage overwhelming tasks.</p>
            <div className="mood-buttons">
              {moods.map(m => (
                <button key={m.id} className="mood-btn" style={{ borderColor: m.color }} onClick={() => handleMoodClick(m)}>
                  <span className="mood-icon">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="quick-actions">
              <p>Or try:</p>
              {quickActions.map((a, i) => (
                <button key={i} className="quick-action-btn" onClick={() => handleQuickAction(a)}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats summary */}
        <div className="coach-stats">
          <div className="coach-stat">
            <span className="stat-value">{state.tasks.filter(t => t.status === 'done').length}</span>
            <span className="stat-label">Tasks done</span>
          </div>
          <div className="coach-stat">
            <span className="stat-value">{state.settings.streakDays}</span>
            <span className="stat-label">Day streak 🔥</span>
          </div>
          <div className="coach-stat">
            <span className="stat-value">{state.pomodoroSessions.length}</span>
            <span className="stat-label">Sessions</span>
          </div>
        </div>

        {/* Chat */}
        <div className="coach-chat">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <span className="chat-avatar">{msg.role === 'user' ? '👤' : '🤖'}</span>
              <div className="chat-content">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message assistant">
              <span className="chat-avatar">🤖</span>
              <div className="chat-content typing">Thinking...</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="coach-input">
          <input
            type="text"
            placeholder="Talk to your coach..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(input); }}
          />
          <button onClick={() => sendMessage(input)} disabled={isLoading}>Send</button>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   Pomodoro Timer
───────────────────────────────────────────── */
const MODE_LABELS = { focus: 'Focus', short: 'Short Break', long: 'Long Break' };

function PomodoroView() {
  const { state, dispatch } = useStore();
  const { pomodoroState, settings } = state;
  const { status, mode, timeLeft, breakDeadline, sessionStartedAt } = pomodoroState;
  const intervalRef = useRef(null);
  const timeLeftRef = useRef(timeLeft);
  const [sessionCount, setSessionCount] = useState(0);
  const [showAwayAlert, setShowAwayAlert] = useState(false);

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const totalTime = mode === 'focus'
    ? settings.pomodoroDuration * 60
    : mode === 'short'
    ? settings.shortBreak * 60
    : settings.longBreak * 60;

  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - timeLeft / totalTime);

  function playSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { console.warn('Audio failed:', e); }
  }

  const start = useCallback(() => {
    dispatch({ type: 'SET_POMODORO', patch: { status: 'running', isAway: false, sessionStartedAt: Date.now() } });
  }, [dispatch]);

  const pause = useCallback(() => {
    dispatch({ type: 'SET_POMODORO', patch: { status: 'paused' } });
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch({ type: 'SET_POMODORO', patch: { status: 'idle', timeLeft: totalTime, breakDeadline: null } });
  }, [dispatch, totalTime]);

  const switchMode = useCallback((m) => {
    const t = m === 'focus' ? settings.pomodoroDuration * 60 : m === 'short' ? settings.shortBreak * 60 : settings.longBreak * 60;
    dispatch({ type: 'SET_POMODORO', patch: { mode: m, status: 'idle', timeLeft: t, breakDeadline: null } });
  }, [dispatch, settings]);

  const startBreak = useCallback((type) => {
    dispatch({ type: 'START_BREAK', mode: type });
  }, [dispatch]);

  const exitBreak = useCallback(() => {
    dispatch({ type: 'SET_POMODORO', patch: { status: 'idle', mode: 'focus', timeLeft: settings.pomodoroDuration * 60, breakDeadline: null } });
  }, [dispatch, settings]);

  const stepOut = useCallback(() => {
    if (status === 'running') {
      if (confirm('Step out? Your Pomodoro session will be paused.')) {
        dispatch({ type: 'SET_POMODORO', patch: { status: 'paused' } });
      }
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (status !== 'running' && status !== 'break') return;
    intervalRef.current = setInterval(() => {
      dispatch({ type: 'SET_POMODORO', patch: { timeLeft: Math.max(0, timeLeftRef.current - 1) } });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [status, dispatch]);

  useEffect(() => {
    if (status === 'running' && timeLeft === 0) {
      clearInterval(intervalRef.current);
      playSound();
      setSessionCount(c => c + 1); // eslint-disable-line react-hooks/set-state-in-effect
      dispatch({ type: 'LOG_POMODORO_SESSION', taskId: null, startedAt: sessionStartedAt, durationMin: settings.pomodoroDuration });
      dispatch({ type: 'SET_POMODORO', patch: { status: 'idle', timeLeft: 0, sessionStartedAt: null } });
    }
  }, [timeLeft, status, dispatch, sessionStartedAt, settings.pomodoroDuration]);

  useEffect(() => {
    if (status === 'break' && timeLeft === 0) {
      playSound();
      dispatch({ type: 'SET_POMODORO', patch: { status: 'overbreak' } });
    }
  }, [timeLeft, status, dispatch]);

  useEffect(() => {
    if (status === 'overbreak' && breakDeadline && Date.now() > breakDeadline) {
      playSound();
    }
  }, [status, breakDeadline]);

  useEffect(() => {
    if (status === 'running') {
      const handleVisibility = () => {
        if (document.hidden) {
          dispatch({ type: 'USER_AWAY' });
          setShowAwayAlert(true);
        } else {
          dispatch({ type: 'USER_BACK' });
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }
  }, [status, dispatch]);

  return (
    <main className="main-content">
      <header className="content-header">
        <div className="content-header-left">
          <span style={{ fontSize: 24 }}>🍅</span>
          <h1>Pomodoro</h1>
          {sessionCount > 0 && <span className="session-count">{sessionCount} done</span>}
        </div>
      </header>

      <div className="content-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }}>
        {/* Away alert */}
        {showAwayAlert && status === 'running' && (
          <div className="away-alert">
            <span>👋 You stepped away. Session is paused.</span>
            <button onClick={() => { setShowAwayAlert(false); start(); }}>Resume</button>
          </div>
        )}

        <div className="pomodoro-widget">
          {/* Mode tabs */}
          <div className="pomodoro-mode-tabs">
            {['focus', 'short', 'long'].map(m => (
              <button key={m} id={`pomodoro-mode-${m}`} className={`pomodoro-mode-tab ${mode === m ? 'active' : ''}`} onClick={() => switchMode(m)}>
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* SVG ring */}
          <div className="pomodoro-ring-wrap">
            <svg className="pomodoro-ring-svg" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={status === 'overbreak' ? '#ef4444' : '#7c3aed'} />
                  <stop offset="100%" stopColor={status === 'overbreak' ? '#f87171' : '#6366f1'} />
                </linearGradient>
              </defs>
              <circle className="pomodoro-ring-bg" cx="100" cy="100" r={radius} />
              <circle className="pomodoro-ring-progress" cx="100" cy="100" r={radius} strokeDasharray={circumference} strokeDashoffset={dashOffset} />
            </svg>
            <div className="pomodoro-ring-center">
              <div className="pomodoro-time">{formatTime(timeLeft)}</div>
              <div className="pomodoro-label">
                {status === 'overbreak' ? '⚠️ Overbreak!' : status === 'break' ? '☕ Break' : MODE_LABELS[mode]}
              </div>
              {status === 'break' && breakDeadline && (
                <div className="break-deadline">Resume by {new Date(breakDeadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="pomodoro-controls">
            {status === 'idle' && mode === 'focus' && (
              <button id="pomodoro-start" className="pomodoro-btn pomodoro-btn-main" onClick={start}>▶ Start</button>
            )}
            {status === 'idle' && (mode === 'short' || mode === 'long') && (
              <button className="pomodoro-btn pomodoro-btn-break" onClick={() => startBreak(mode)}>☕ Start Break</button>
            )}
            {status === 'running' && (
              <>
                <button id="pomodoro-pause" className="pomodoro-btn pomodoro-btn-main" onClick={pause}>⏸</button>
                <button className="pomodoro-btn pomodoro-btn-secondary" onClick={stepOut}>🚪</button>
              </>
            )}
            {status === 'paused' && (
              <>
                <button className="pomodoro-btn pomodoro-btn-main" onClick={start}>▶ Resume</button>
                <button id="pomodoro-reset" className="pomodoro-btn pomodoro-btn-secondary" onClick={reset}>↺</button>
              </>
            )}
            {status === 'break' && (
              <>
                <button className="pomodoro-btn pomodoro-btn-resume" onClick={exitBreak}>✓ Done</button>
                <button className="pomodoro-btn pomodoro-btn-secondary" onClick={() => dispatch({ type: 'SET_POMODORO', patch: { status: 'idle', mode: 'focus', timeLeft: settings.pomodoroDuration * 60, breakDeadline: null } })}>Skip</button>
              </>
            )}
            {status === 'overbreak' && (
              <button className="pomodoro-btn pomodoro-btn-resume" onClick={exitBreak}>✓ Back to Work</button>
            )}
          </div>

          {/* Session dots */}
          <div className="pomodoro-sessions">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className={`session-dot ${i < sessionCount % 4 ? 'done' : 'pending'}`} />
            ))}
            <span>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Quick break buttons */}
        {status === 'running' && sessionCount > 0 && (
          <div className="quick-break">
            <span>Or take a break:</span>
            <button onClick={() => startBreak('short')}>☕ {settings.shortBreak}m</button>
            <button onClick={() => startBreak('long')}>🛋️ {settings.longBreak}m</button>
          </div>
        )}
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   Settings
───────────────────────────────────────────── */
function SettingsView() {
  const { state, dispatch } = useStore();
  const { settings } = state;
  const [editingWs, setEditingWs] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');

  function patch(p) {
    dispatch({ type: 'UPDATE_SETTINGS', patch: p });
  }

  function startEdit(ws) {
    setEditingWs(ws.id);
    setEditName(ws.name);
    setEditIcon(ws.icon);
    setEditColor(ws.color);
  }

  function saveEdit() {
    if (editName.trim()) {
      dispatch({ type: 'UPDATE_WORKSPACE', id: editingWs, patch: { name: editName.trim(), icon: editIcon, color: editColor } });
    }
    setEditingWs(null);
  }

  return (
    <main className="main-content">
      <header className="content-header">
        <div className="content-header-left">
          <span style={{ fontSize: 24 }}>⚙️</span>
          <h1>Settings</h1>
        </div>
      </header>

      <div className="content-body">
        <div className="settings-panel">
          {/* Pomodoro */}
          <div className="settings-section">
            <div className="settings-section-header">🍅 Pomodoro Durations</div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Focus Duration</div>
                <div className="settings-row-desc">Minutes per focus session</div>
              </div>
              <input
                id="setting-focus"
                type="number"
                className="settings-input"
                min={1} max={90}
                value={settings.pomodoroDuration}
                onChange={e => patch({ pomodoroDuration: Number(e.target.value) })}
              />
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Short Break</div>
                <div className="settings-row-desc">Minutes for short break</div>
              </div>
              <input
                id="setting-short"
                type="number"
                className="settings-input"
                min={1} max={30}
                value={settings.shortBreak}
                onChange={e => patch({ shortBreak: Number(e.target.value) })}
              />
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Long Break</div>
                <div className="settings-row-desc">Minutes for long break</div>
              </div>
              <input
                id="setting-long"
                type="number"
                className="settings-input"
                min={1} max={60}
                value={settings.longBreak}
                onChange={e => patch({ longBreak: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Workspaces management */}
          <div className="settings-section">
            <div className="settings-section-header">🗂️ Workspaces</div>
            {state.workspaces.filter(w => !w.archivedAt).map(ws => (
              <div key={ws.id} className="settings-row">
                {editingWs === ws.id ? (
                  <div className="ws-edit-form">
                    <div className="ws-edit-name-row">
                      <input className="ws-edit-name" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingWs(null); }} autoFocus />
                    </div>
                    <div className="ws-edit-section">
                      <label className="ws-edit-label">Pick an icon</label>
                      <div className="ws-edit-icons">
                        {['🎯','💼','🚀','🎨','📚','💡','🌿','⚡','🔥','✨','💪','🎮'].map(icon => (
                          <button key={icon} className={`icon-option ${editIcon === icon ? 'selected' : ''}`} onClick={() => setEditIcon(icon)} title={`Icon: ${icon}`}>{icon}</button>
                        ))}
                      </div>
                    </div>
                    <div className="ws-edit-section">
                      <label className="ws-edit-label">Choose a color</label>
                      <div className="ws-edit-colors">
                        {[{color: '#7c3aed', name: 'Purple'}, {color: '#0ea5e9', name: 'Blue'}, {color: '#10b981', name: 'Green'}, {color: '#f59e0b', name: 'Amber'}, {color: '#ef4444', name: 'Red'}, {color: '#ec4899', name: 'Pink'}].map(({color, name}) => (
                          <button key={color} className={`color-option ${editColor === color ? 'selected' : ''}`} style={{ background: color }} onClick={() => setEditColor(color)} title={name} data-color={name} />
                        ))}
                      </div>
                    </div>
                    <div className="ws-edit-btns">
                      <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                      <button className="btn btn-secondary" onClick={() => setEditingWs(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{ws.icon}</span>
                      <div>
                        <div className="settings-row-label">{ws.name}</div>
                        <div className="settings-row-desc">
                          <span style={{ background: ws.color + '22', color: ws.color, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{state.tasks.filter(t => t.workspaceId === ws.id).length} tasks</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-edit-ws" onClick={() => startEdit(ws)}>Edit</button>
                      <button className="btn-delete-ws" onClick={() => { if (confirm(`Delete "${ws.name}" and all its tasks?`)) dispatch({ type: 'DELETE_WORKSPACE', id: ws.id }); }}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* App info */}
          <div className="settings-section">
            <div className="settings-section-header">🔑 AI Coach</div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Groq API Key</div>
                <div className="settings-row-desc">Free at <a href="https://console.groq.com" target="_blank" style={{ color: 'var(--accent)' }}>console.groq.com</a></div>
              </div>
              <input
                id="setting-apikey"
                type="password"
                className="settings-input api-key-input"
                style={{ width: 240 }}
                placeholder="gsk_..."
                value={localStorage.getItem('groq_api_key') || ''}
                onChange={e => localStorage.setItem('groq_api_key', e.target.value)}
              />
            </div>
          </div>

          {/* App info */}
          <div className="settings-section">
            <div className="settings-section-header">ℹ️ About</div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">FocusDesk</div>
                <div className="settings-row-desc">Your personal productivity OS · v2.0</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {state.tasks.length} tasks · {state.ideas.length} ideas
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   App Root
───────────────────────────────────────────── */
function AppContent() {
  const { state } = useStore();

return (
    <div className={`app-container ${state.settings.theme}`}>
      <Sidebar />
      {state.activeView === 'dashboard' && <Dashboard />}
      {state.activeView === 'tasks'    && <TaskList />}
      {state.activeView === 'ideas'    && <IdeaBoard />}
      {state.activeView === 'coach'    && <CoachView />}
      {state.activeView === 'pomodoro' && <PomodoroView />}
      {state.activeView === 'settings' && <SettingsView />}
      {state.pomodoroState.status === 'running' && <FloatingTimer />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Floating Timer Widget
───────────────────────────────────────────── */
function FloatingTimer() {
  const { state, dispatch } = useStore();
  const { pomodoroState, settings } = state;
  const [isFloating, setIsFloating] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const totalTime = settings.pomodoroDuration * 60;
  const progress = (pomodoroState.timeLeft / totalTime) * 100;

  if (!isFloating) return null;

  const pause = () => dispatch({ type: 'SET_POMODORO', patch: { status: 'paused' } });
  const exitFocus = () => dispatch({ type: 'SET_POMODORO', patch: { status: 'idle', timeLeft: totalTime } });

  if (isExpanded) {
    return (
      <div className="floating-timer expanded">
        <div className="floating-header">
          <span>🍅 Focus</span>
          <div className="floating-header-btns">
            <button onClick={() => setIsExpanded(false)}>−</button>
            <button onClick={() => setIsFloating(false)}>×</button>
          </div>
        </div>
        <div className="floating-progress">
          <div className="floating-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="floating-time">{formatTime(pomodoroState.timeLeft)}</div>
        <div className="floating-btns">
          <button className="floating-pause" onClick={pause}>⏸</button>
          <button className="floating-stop" onClick={exitFocus}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="floating-timer" onClick={() => setIsExpanded(true)} title="Click to expand">
      <div className="floating-mini">
        <span className="floating-icon">🍅</span>
        <span className="floating-time-mini">{formatTime(pomodoroState.timeLeft)}</span>
        <div className="floating-mini-bar">
          <div className="floating-mini-progress" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}



