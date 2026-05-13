/* eslint-disable react-refresh/only-export-components */
// FocusDesk – Zustand-style lightweight store using React context + localStorage
import { createContext, useContext, useReducer, useEffect } from 'react';

const STORAGE_KEY = 'focusdesk_v2';

const ACHIEVEMENTS_META = {
  first_task:    { name: 'First Task',      icon: '✅', desc: 'Complete your first task' },
  task_machine:  { name: 'Task Machine',    icon: '⚡', desc: 'Complete 50 tasks' },
  centurion:     { name: 'Centurion',       icon: '💯', desc: 'Complete 100 tasks' },
  streak_7:      { name: 'Streak Master',   icon: '🔥', desc: 'Maintain a 7-day streak' },
  streak_30:     { name: 'Streak Legend',   icon: '💪', desc: 'Maintain a 30-day streak' },
  pomo_25:       { name: 'Pomodoro Pro',    icon: '🍅', desc: 'Complete 25 pomodoro sessions' },
  pomo_100:      { name: 'Pomodoro Master', icon: '🏆', desc: 'Complete 100 pomodoro sessions' },
  idea_20:       { name: 'Idea Generator',  icon: '💡', desc: 'Capture 20 ideas' },
  breakdown_10:  { name: 'Breakdown Artist',icon: '↳',  desc: 'Create subtasks 10 times' },
  organizer:     { name: 'Organizer',       icon: '🗂️', desc: 'Create 5 workspaces' },
  early_bird:    { name: 'Early Bird',      icon: '🌅', desc: 'Complete a task before 7 AM' },
  night_owl:     { name: 'Night Owl',       icon: '🦉', desc: 'Complete a task after 10 PM' },
  level_5:       { name: 'Silver Star',     icon: '⭐', desc: 'Reach level 5' },
  level_10:      { name: 'Gold Glory',      icon: '🌟', desc: 'Reach level 10' },
  level_20:      { name: 'Platinum Elite',  icon: '👑', desc: 'Reach level 20' },
};

function buildAchievements() {
  const a = {};
  for (const key of Object.keys(ACHIEVEMENTS_META)) {
    a[key] = { unlocked: false, unlockedAt: null };
  }
  return a;
}

const defaultState = {
  workspaces: [
    { id: 'ws-1', name: 'My Workspace', color: '#7C3AED', icon: '🎯', order: 0, archivedAt: null },
  ],
  tasks: [],
  ideas: [],
  pomodoroSessions: [],
  settings: {
    theme: 'dark',
    pomodoroDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    activeWorkspaceId: 'ws-1',
    streakDays: 0,
    lastCompletedDate: null,
  },
  activeView: 'tasks',
  pomodoroState: {
    status: 'idle',
    mode: 'focus',
    timeLeft: 25 * 60,
    activeTaskId: null,
    breakDeadline: null,
    lastActiveTime: null,
    isAway: false,
  },
  gamification: {
    totalPoints: 0,
    level: 1,
    currentXp: 0,
    xpToNextLevel: 100,
    tier: 'bronze',
    achievements: buildAchievements(),
    stats: { tasksCompleted: 0, pomodorosCompleted: 0, ideasCaptured: 0, subtasksCreated: 0 },
    recentActivity: [],
  },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    const merged = { ...defaultState, ...parsed };
    merged.pomodoroState = defaultState.pomodoroState;
    merged.activeView = 'tasks';
    merged.gamification = { ...defaultState.gamification, ...parsed.gamification };
    merged.gamification.achievements = { ...defaultState.gamification.achievements, ...parsed.gamification?.achievements };
    return merged;
  } catch {
    return defaultState;
  }
}

function save(state) {
  const persistable = { ...state };
  delete persistable.pomodoroState;
  delete persistable.activeView;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
}

function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
}

function getDateStr(ts) {
  return new Date(ts).toDateString();
}

function updateStreak(settings) {
  const today = getDateStr(Date.now());
  const yesterday = getDateStr(Date.now() - 86400000);
  const lastDay = settings.lastCompletedDate;
  if (lastDay === today) return settings;
  if (lastDay === yesterday) {
    return { ...settings, streakDays: settings.streakDays + 1, lastCompletedDate: today };
  }
  return { ...settings, streakDays: 1, lastCompletedDate: today };
}

function calcLevel(totalPoints) {
  let level = 1;
  let remaining = totalPoints;
  let needed = 100;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = level * 100;
  }
  return { level, currentXp: remaining, xpToNextLevel: needed };
}

function getTier(level) {
  if (level >= 35) return 'diamond';
  if (level >= 20) return 'platinum';
  if (level >= 10) return 'gold';
  if (level >= 5) return 'silver';
  return 'bronze';
}

const TIER_CONFIG = {
  bronze:   { icon: '🥉', color: '#cd7f32', label: 'Bronze' },
  silver:   { icon: '🥈', color: '#c0c0c0', label: 'Silver' },
  gold:     { icon: '🥇', color: '#ffd700', label: 'Gold' },
  platinum: { icon: '💎', color: '#e5e4e2', label: 'Platinum' },
  diamond:  { icon: '👑', color: '#b9f2ff', label: 'Diamond' },
};

function awardXp(g, points, activity) {
  const newTotal = g.totalPoints + points;
  const l = calcLevel(newTotal);
  const tier = getTier(l.level);
  const entry = { ...activity, points, timestamp: Date.now() };
  const recent = [entry, ...g.recentActivity].slice(0, 50);
  return { ...g, totalPoints: newTotal, ...l, tier, recentActivity: recent };
}

function checkAchievements(g, state) {
  const a = { ...g.achievements };
  const now = Date.now();
  const s = g.stats;
  let changed = false;

  function unlock(id) {
    if (!a[id]?.unlocked) {
      a[id] = { ...a[id], unlocked: true, unlockedAt: now };
      changed = true;
    }
  }

  if (s.tasksCompleted >= 1) unlock('first_task');
  if (s.tasksCompleted >= 50) unlock('task_machine');
  if (s.tasksCompleted >= 100) unlock('centurion');
  if (s.pomodorosCompleted >= 25) unlock('pomo_25');
  if (s.pomodorosCompleted >= 100) unlock('pomo_100');
  if (s.ideasCaptured >= 20) unlock('idea_20');
  if (s.subtasksCreated >= 10) unlock('breakdown_10');
  if (state.settings.streakDays >= 7) unlock('streak_7');
  if (state.settings.streakDays >= 30) unlock('streak_30');
  if (state.workspaces.filter(w => !w.archivedAt).length >= 5) unlock('organizer');
  if (g.level >= 5) unlock('level_5');
  if (g.level >= 10) unlock('level_10');
  if (g.level >= 20) unlock('level_20');

  if (changed) return { ...g, achievements: a };
  return g;
}

function reducer(state, action) {
  switch (action.type) {
    // ── Workspaces ──────────────────────────────────────────────────
    case 'ADD_WORKSPACE': {
      const ws = { id: uid(), name: action.name, color: action.color, icon: action.icon || '📁', order: state.workspaces.length, archivedAt: null };
      return { ...state, workspaces: [...state.workspaces, ws], settings: { ...state.settings, activeWorkspaceId: ws.id } };
    }
    case 'UPDATE_WORKSPACE': {
      return { ...state, workspaces: state.workspaces.map(w => w.id === action.id ? { ...w, ...action.patch } : w) };
    }
    case 'DELETE_WORKSPACE': {
      const remaining = state.workspaces.filter(w => w.id !== action.id);
      const nextActive = remaining.find(w => !w.archivedAt)?.id || null;
      const g = checkAchievements(state.gamification, { ...state, workspaces: remaining });
      return { ...state, workspaces: remaining, tasks: state.tasks.filter(t => t.workspaceId !== action.id), settings: { ...state.settings, activeWorkspaceId: state.settings.activeWorkspaceId === action.id ? nextActive : state.settings.activeWorkspaceId }, gamification: g };
    }
    case 'ARCHIVE_WORKSPACE': {
      const remaining = state.workspaces.map(w => w.id === action.id ? { ...w, archivedAt: Date.now() } : w);
      const nextActive = remaining.find(w => !w.archivedAt)?.id || null;
      return { ...state, workspaces: remaining, settings: { ...state.settings, activeWorkspaceId: state.settings.activeWorkspaceId === action.id ? nextActive : state.settings.activeWorkspaceId } };
    }
    case 'REORDER_WORKSPACES': {
      return { ...state, workspaces: action.workspaces };
    }
    case 'SET_ACTIVE_WORKSPACE': {
      return { ...state, settings: { ...state.settings, activeWorkspaceId: action.id }, activeView: 'tasks' };
    }

    // ── Tasks ────────────────────────────────────────────────────────
    case 'ADD_TASK': {
      const task = { id: uid(), title: action.title, workspaceId: action.workspaceId, priority: action.priority || 'normal', dueDate: action.dueDate || null, remindAt: action.remindAt || null, status: 'todo', recurRule: action.recurRule || null, notes: action.notes || '', createdAt: Date.now(), parentId: null, scheduledDate: action.scheduledDate || null, duration: action.duration || null, reminderMinutes: action.reminderMinutes || 30 };
      return { ...state, tasks: [...state.tasks, task] };
    }
    case 'UPDATE_TASK': {
      return { ...state, tasks: state.tasks.map(t => t.id === action.id ? { ...t, ...action.patch } : t) };
    }
    case 'DELETE_TASK': {
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id && t.parentId !== action.id) };
    }
    case 'TOGGLE_TASK': {
      const toggled = state.tasks.find(t => t.id === action.id);
      const isCompleting = toggled && toggled.status !== 'done';
      const updatedTasks = state.tasks.map(t => t.id === action.id ? { ...t, status: t.status === 'done' ? 'todo' : 'done', completedAt: t.status !== 'done' ? Date.now() : t.completedAt } : t);

      let g = state.gamification;
      let newSettings = state.settings;

      if (isCompleting) {
        newSettings = updateStreak(state.settings);
        const hour = new Date().getHours();
        let points = 10;
        if (hour < 7) points = 15;
        else if (hour >= 22) points = 15;

        g = awardXp(g, points, { type: 'task_done', title: `Completed: ${toggled.title}` });
        g = { ...g, stats: { ...g.stats, tasksCompleted: g.stats.tasksCompleted + 1 } };
        g = checkAchievements(g, { ...state, settings: newSettings });

        // Check early_bird / night_owl achievements
        const a = { ...g.achievements };
        let achChanged = false;
        if (hour < 7 && !a.early_bird?.unlocked) { a.early_bird = { unlocked: true, unlockedAt: Date.now() }; achChanged = true; }
        if (hour >= 22 && !a.night_owl?.unlocked) { a.night_owl = { unlocked: true, unlockedAt: Date.now() }; achChanged = true; }
        if (achChanged) g = { ...g, achievements: a };
      }

      return { ...state, tasks: updatedTasks, settings: newSettings, gamification: g };
    }

    // ── Batch Tasks (for breakdowns) ─────────────────────────────
    case 'ADD_BATCH_TASKS': {
      const subCount = action.tasks.filter(t => t.parentId).length;
      let g = state.gamification;
      if (subCount > 0) {
        g = awardXp(g, subCount * 2, { type: 'subtask_created', title: `Created ${subCount} subtask${subCount > 1 ? 's' : ''}` });
        g = { ...g, stats: { ...g.stats, subtasksCreated: g.stats.subtasksCreated + subCount } };
        g = checkAchievements(g, state);
      }
      return { ...state, tasks: [...state.tasks, ...action.tasks], gamification: g };
    }

    // ── Ideas ────────────────────────────────────────────────────────
    case 'ADD_IDEA': {
      const idea = { id: uid(), content: action.content, workspaceId: action.workspaceId || null, createdAt: Date.now(), convertedToTaskId: null };
      let g = awardXp(state.gamification, 3, { type: 'idea_captured', title: `Idea: ${action.content.slice(0, 50)}` });
      g = { ...g, stats: { ...g.stats, ideasCaptured: g.stats.ideasCaptured + 1 } };
      g = checkAchievements(g, state);
      return { ...state, ideas: [idea, ...state.ideas], gamification: g };
    }
    case 'DELETE_IDEA': {
      return { ...state, ideas: state.ideas.filter(i => i.id !== action.id) };
    }
    case 'CONVERT_IDEA_TO_TASK': {
      const idea = state.ideas.find(i => i.id === action.id);
      if (!idea) return state;
      const task = { id: uid(), title: idea.content, workspaceId: idea.workspaceId || state.settings.activeWorkspaceId, priority: 'normal', dueDate: null, remindAt: null, status: 'todo', recurRule: null, notes: '', createdAt: Date.now(), parentId: null, scheduledDate: null, duration: null, reminderMinutes: 30 };
      let g = awardXp(state.gamification, 5, { type: 'idea_converted', title: `Converted idea to task: ${idea.content.slice(0, 50)}` });
      return { ...state, tasks: [...state.tasks, task], ideas: state.ideas.map(i => i.id === action.id ? { ...i, convertedToTaskId: task.id } : i), gamification: g };
    }

    // ── Pomodoro ─────────────────────────────────────────────────────
    case 'SET_POMODORO': {
      return { ...state, pomodoroState: { ...state.pomodoroState, ...action.patch } };
    }
    case 'START_BREAK': {
      const breakDuration = action.mode === 'short' ? state.settings.shortBreak * 60 : state.settings.longBreak * 60;
      return { ...state, pomodoroState: { ...state.pomodoroState, status: 'break', mode: action.mode, timeLeft: breakDuration, breakDeadline: Date.now() + breakDuration * 1000 } };
    }
    case 'USER_AWAY': {
      if (state.pomodoroState.status === 'running') {
        return { ...state, pomodoroState: { ...state.pomodoroState, isAway: true, lastActiveTime: Date.now() } };
      }
      return state;
    }
    case 'USER_BACK': {
      if (state.pomodoroState.isAway) {
        return { ...state, pomodoroState: { ...state.pomodoroState, isAway: false } };
      }
      return state;
    }
    case 'LOG_POMODORO_SESSION': {
      const session = { id: uid(), taskId: action.taskId, startedAt: action.startedAt, endedAt: Date.now(), durationMin: action.durationMin };
      let g = awardXp(state.gamification, 5, { type: 'pomodoro_done', title: `Pomodoro session completed${action.taskId ? '' : ''}` });
      g = { ...g, stats: { ...g.stats, pomodorosCompleted: g.stats.pomodorosCompleted + 1 } };
      g = checkAchievements(g, state);
      return { ...state, pomodoroSessions: [...state.pomodoroSessions, session], gamification: g };
    }

    // ── Settings ─────────────────────────────────────────────────────
    case 'UPDATE_SETTINGS': {
      return { ...state, settings: { ...state.settings, ...action.patch } };
    }
    case 'SET_ACTIVE_VIEW': {
      return { ...state, activeView: action.view };
    }

    // ── Gamification (internal) ──────────────────────────────────────
    case 'AWARD_XP': {
      return { ...state, gamification: awardXp(state.gamification, action.points, action.activity) };
    }

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => { save(state); }, [state]);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

export { uid, ACHIEVEMENTS_META, TIER_CONFIG };
