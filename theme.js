// ThemeManager: Manages 6 Ultra-Professional Website Color Schemes with Full-Part Adaptability
export class ThemeManager {
    constructor() {
        this.themes = {
            slate: {
                primary: '#6366f1',
                accent: '#818cf8',
                soft: 'rgba(99, 102, 241, 0.08)',
                bodyBg: '#0f172a',
                adminBg: 'rgba(30, 41, 59, 0.7)',
                textPrimary: '#f8fafc',
                textSecondary: '#94a3b8',
                border: 'rgba(255, 255, 255, 0.1)',
                glass: 'rgba(255, 255, 255, 0.03)'
            },
            ocean: {
                primary: '#0ea5e9',
                accent: '#38bdf8',
                soft: 'rgba(14, 165, 233, 0.08)',
                bodyBg: '#020617',
                adminBg: 'rgba(15, 23, 42, 0.7)',
                textPrimary: '#f0f9ff',
                textSecondary: '#7dd3fc',
                border: 'rgba(14, 165, 233, 0.2)',
                glass: 'rgba(14, 165, 233, 0.05)'
            },
            sage: {
                primary: '#10b981',
                accent: '#34d399',
                soft: 'rgba(16, 185, 129, 0.08)',
                bodyBg: '#06110d',
                adminBg: 'rgba(20, 31, 26, 0.7)',
                textPrimary: '#ecfdf5',
                textSecondary: '#6ee7b7',
                border: 'rgba(16, 185, 129, 0.2)',
                glass: 'rgba(16, 185, 129, 0.05)'
            },
            velvet: {
                primary: '#f59e0b',
                accent: '#fbbf24',
                soft: 'rgba(245, 158, 11, 0.08)',
                bodyBg: '#1c0c0c',
                adminBg: 'rgba(60, 26, 26, 0.7)',
                textPrimary: '#fff7ed',
                textSecondary: '#fdba74',
                border: 'rgba(245, 158, 11, 0.15)',
                glass: 'rgba(245, 158, 11, 0.05)'
            },
            rose: {
                primary: '#fb7185',
                accent: '#fda4af',
                soft: 'rgba(251, 113, 133, 0.08)',
                bodyBg: '#1a0b12',
                adminBg: 'rgba(50, 21, 35, 0.7)',
                textPrimary: '#fff1f2',
                textSecondary: '#fecdd3',
                border: 'rgba(251, 113, 133, 0.2)',
                glass: 'rgba(251, 113, 133, 0.05)'
            },
            amber: {
                primary: '#f59e0b',
                accent: '#d97706',
                soft: 'rgba(245, 158, 11, 0.08)',
                bodyBg: '#0a0a0a',
                adminBg: 'rgba(24, 24, 27, 0.7)',
                textPrimary: '#fafafa',
                textSecondary: '#a1a1aa',
                border: 'rgba(255, 255, 255, 0.05)',
                glass: 'rgba(255, 255, 255, 0.02)'
            }
        };
    }

    applyTheme(themeName, customColors = null) {
        const theme = this.themes[themeName] || this.themes.slate;
        const root = document.documentElement;

        const primary = customColors?.customPrimary || theme.primary;
        const accent = customColors?.customAccent || theme.accent;
        const soft = customColors?.customSoft || theme.soft;
        const bodyBg = customColors?.customBodyBg || theme.bodyBg;
        const adminBg = customColors?.customAdminBg || theme.adminBg;

        root.style.setProperty('--primary', primary);
        root.style.setProperty('--primary-glow', primary + '35');
        root.style.setProperty('--accent', accent);
        root.style.setProperty('--soft', soft);
        root.style.setProperty('--bg-main', bodyBg);
        root.style.setProperty('--bg-card', adminBg);
        
        // Full part transformations
        root.style.setProperty('--text-primary', theme.textPrimary);
        root.style.setProperty('--text-secondary', theme.textSecondary);
        root.style.setProperty('--border-glass', theme.border);
        root.style.setProperty('--bg-glass', theme.glass);

        document.body.setAttribute('data-theme', themeName);
    }
}
