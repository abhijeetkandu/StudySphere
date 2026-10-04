/**
 * Tab-Isolated Authentication Utility for StudySphere
 * 
 * Uses sessionStorage so that login sessions are strictly isolated per browser tab:
 * - Admin in Tab 1 remains Admin
 * - Student in Tab 2 remains Student
 * - Teacher in Tab 3 remains Teacher
 * - Page refresh inside the same tab persists the session
 * - Logging out in one tab does not affect other tabs
 */

export const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    sessionStorage.setItem('user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('user');
  }
};

export const removeStoredUser = () => {
  sessionStorage.removeItem('user');
};
