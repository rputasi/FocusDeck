const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startPomodoro: () => {
    const btn = document.getElementById('pomodoro-start');
    if (btn) btn.click();
  },
  navigateTo: (view) => {
    const navBtn = document.getElementById(`nav-${view}`);
    if (navBtn) navBtn.click();
  },
  getActiveView: () => {
    const active = document.querySelector('.sidebar-footer button.active');
    return active?.id?.replace('nav-', '') || null;
  },
});
