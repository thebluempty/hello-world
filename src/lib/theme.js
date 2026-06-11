// 테마 모드: 'system' | 'light' | 'dark' (localStorage 'themeMode')
export const THEME_MODES = ['system', 'light', 'dark'];

export const getThemeMode = () => {
    const saved = localStorage.getItem('themeMode');
    return THEME_MODES.includes(saved) ? saved : 'system';
};

export const setThemeMode = (mode) => {
    try { localStorage.setItem('themeMode', mode); } catch (e) {}
};

export const resolveTheme = (mode) =>
    mode === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode;

export function applyTheme(mode) {
    const theme = resolveTheme(mode);
    document.documentElement.dataset.theme = theme;
    // 상태바/브라우저 UI 색상도 테마에 맞춤
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#1e1b4b' : '#4f46e5');
}
