export class ThemeManager {
    constructor() {
        this.themes = {
            slate: { primary: '#6366f1', accent: '#818cf8', bodyBg: '#0f172a', textPrimary: '#f8fafc' },
            ocean: { primary: '#0ea5e9', accent: '#38bdf8', bodyBg: '#020617', textPrimary: '#f0f9ff' },
            sage: { primary: '#10b981', accent: '#34d399', bodyBg: '#06110d', textPrimary: '#ecfdf5' },
            velvet: { primary: '#f59e0b', accent: '#fbbf24', bodyBg: '#1c0c0c', textPrimary: '#fff7ed' },
            rose: { primary: '#fb7185', accent: '#fda4af', bodyBg: '#1a0b12', textPrimary: '#fff1f2' },
            amber: { primary: '#f59e0b', accent: '#d97706', bodyBg: '#0a0a0a', textPrimary: '#fafafa' }
        };
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName] || this.themes.slate;
        const root = document.documentElement;
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--primary-glow', theme.primary + '35');
        root.style.setProperty('--bg-main', theme.bodyBg);
        root.style.setProperty('--text-primary', theme.textPrimary);
        document.body.setAttribute('data-theme', themeName);
    }
}
