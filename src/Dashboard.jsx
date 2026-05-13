import { useMemo } from 'react';
import { useStore, TIER_CONFIG, ACHIEVEMENTS_META } from './store';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const { state } = useStore();
  const { gamification, settings, tasks, pomodoroSessions } = state;
  const { level, currentXp, xpToNextLevel, tier, totalPoints, stats, achievements, recentActivity } = gamification;
  const tierInfo = TIER_CONFIG[tier] || TIER_CONFIG.bronze;

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayStats = useMemo(() => {
    const doneToday = tasks.filter(t => t.status === 'done' && t.completedAt && t.completedAt >= todayStart).length;
    const pomosToday = pomodoroSessions.filter(s => s.endedAt >= todayStart).length;
    const pointsToday = recentActivity.filter(a => a.timestamp >= todayStart).reduce((sum, a) => sum + a.points, 0);
    return { tasksDone: doneToday, pomodorosDone: pomosToday, pointsEarned: pointsToday };
  }, [tasks, pomodoroSessions, recentActivity, todayStart]);

  const unlockedAchievements = useMemo(() =>
    Object.entries(achievements).filter(([, v]) => v.unlocked),
  [achievements]);

  const lockedAchievements = useMemo(() =>
    Object.entries(achievements).filter(([, v]) => !v.unlocked),
  [achievements]);

  const xpPercent = Math.min(100, Math.round((currentXp / xpToNextLevel) * 100));

  function getActivityIcon(type) {
    const icons = { task_done: '✅', pomodoro_done: '🍅', idea_captured: '💡', idea_converted: '📋', subtask_created: '↳' };
    return icons[type] || '⭐';
  }

  return (
    <main className="main-content">
      <header className="content-header">
        <div className="content-header-left">
          <span style={{ fontSize: 24 }}>📊</span>
          <h1>Dashboard</h1>
        </div>
      </header>

      <div className="content-body dashboard-body">
        {/* Welcome + Level Card */}
        <div className="dash-welcome" style={{ background: `linear-gradient(135deg, ${tierInfo.color}22, ${tierInfo.color}44)` }}>
          <div className="dash-welcome-info">
            <div className="dash-tier-icon">{tierInfo.icon}</div>
            <div>
              <h2>Level {level} {tierInfo.label}</h2>
              <p>{totalPoints.toLocaleString()} total XP earned</p>
            </div>
          </div>
          <div className="dash-level-bar-wrap">
            <div className="dash-level-bar-label">
              <span>Level {level}</span>
              <span>{currentXp} / {xpToNextLevel} XP</span>
            </div>
            <div className="dash-level-bar">
              <div className="dash-level-bar-fill" style={{ width: `${xpPercent}%`, background: `linear-gradient(90deg, ${tierInfo.color}, ${tierInfo.color}dd)` }} />
              <div className="dash-level-bar-glow" style={{ left: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="dash-section">
          <h3 className="dash-section-title">Today</h3>
          <div className="dash-stats-grid">
            <div className="dash-stat-card">
              <div className="dash-stat-icon">✅</div>
              <div className="dash-stat-value">{todayStats.tasksDone}</div>
              <div className="dash-stat-label">Tasks Done</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-icon">🍅</div>
              <div className="dash-stat-value">{todayStats.pomodorosDone}</div>
              <div className="dash-stat-label">Pomodoros</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-icon">🔥</div>
              <div className="dash-stat-value">{settings.streakDays}</div>
              <div className="dash-stat-label">Day Streak</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-icon">⭐</div>
              <div className="dash-stat-value">+{todayStats.pointsEarned}</div>
              <div className="dash-stat-label">XP Today</div>
            </div>
          </div>
        </div>

        {/* Lifetime Stats */}
        <div className="dash-section">
          <h3 className="dash-section-title">All Time</h3>
          <div className="dash-stats-grid">
            <div className="dash-stat-card">
              <div className="dash-stat-icon">📋</div>
              <div className="dash-stat-value">{stats.tasksCompleted}</div>
              <div className="dash-stat-label">Tasks Done</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-icon">🍅</div>
              <div className="dash-stat-value">{stats.pomodorosCompleted}</div>
              <div className="dash-stat-label">Pomodoros</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-icon">💡</div>
              <div className="dash-stat-value">{stats.ideasCaptured}</div>
              <div className="dash-stat-label">Ideas</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-icon">↳</div>
              <div className="dash-stat-value">{stats.subtasksCreated}</div>
              <div className="dash-stat-label">Subtasks</div>
            </div>
          </div>
        </div>

        {/* Next Level */}
        {xpToNextLevel - currentXp > 0 && (
          <div className="dash-section">
            <h3 className="dash-section-title">Next Level</h3>
            <div className="dash-next-level">
              <span>{xpToNextLevel - currentXp} XP to Level {level + 1}</span>
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="dash-section">
          <h3 className="dash-section-title">
            Achievements
            <span className="dash-ach-count">{unlockedAchievements.length} / {Object.keys(achievements).length}</span>
          </h3>
          <div className="dash-achievements">
            {unlockedAchievements.map(([id]) => {
              const meta = ACHIEVEMENTS_META[id];
              return (
                <div key={id} className="dash-ach-badge unlocked" title={meta?.desc}>
                  <div className="dash-ach-icon">{meta?.icon || '🏅'}</div>
                  <div className="dash-ach-name">{meta?.name || id}</div>
                </div>
              );
            })}
            {lockedAchievements.map(([id]) => {
              const meta = ACHIEVEMENTS_META[id];
              return (
                <div key={id} className="dash-ach-badge locked" title={meta?.desc}>
                  <div className="dash-ach-icon">🔒</div>
                  <div className="dash-ach-name">{meta?.name || id}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="dash-section">
            <h3 className="dash-section-title">Recent Activity</h3>
            <div className="dash-activity">
              {recentActivity.slice(0, 20).map((a, i) => (
                <div key={i} className="dash-activity-item">
                  <span className="dash-activity-icon">{getActivityIcon(a.type)}</span>
                  <span className="dash-activity-text">{a.title}</span>
                  <span className="dash-activity-points">+{a.points} XP</span>
                  <span className="dash-activity-time">{timeAgo(a.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
