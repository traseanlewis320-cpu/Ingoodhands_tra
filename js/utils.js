// Utility Functions & Color Adaptation Engine

function formatTime12h(time24) {
    if (!time24 || time24 === 'ALL') return time24;
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
}

function showNotification(msg, type) {
    const el = document.createElement('div'); el.className = `notification p-5 rounded-2xl text-white font-bold shadow-2xl flex items-center ${type==='error'?'bg-red-500':'bg-gradient-to-r from-purple-600 to-indigo-600'}`;
    el.innerHTML = `<i class="fas ${type==='error'?'fa-exclamation-circle':'fa-check-circle'} mr-3"></i> ${msg}`;
    const container = document.getElementById('notification-container');
    if (container) {
        container.appendChild(el); 
        setTimeout(() => el.style.opacity = '0', 3500); 
        setTimeout(() => el.remove(), 4000);
    }
}

function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return `${r}, ${g}, ${b}`;
}

function hexToRgbObj(hex) {
    const h = hex.replace('#','');
    if (h.length === 3) {
        return { r: parseInt(h[0]+h[0],16), g: parseInt(h[1]+h[1],16), b: parseInt(h[2]+h[2],16) };
    }
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}

function rgbToHex({r,g,b}) {
    return '#' + [r,g,b].map(v => Math.round(Math.min(255,Math.max(0,v))).toString(16).padStart(2,'0')).join('');
}

function relativeLuminance({r,g,b}) {
    const srgb = [r,g,b].map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(hex1, hex2) {
    const l1 = relativeLuminance(hexToRgbObj(hex1));
    const l2 = relativeLuminance(hexToRgbObj(hex2));
    const lighter = Math.max(l1, l2);
    const darker  = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHsl({r,g,b}) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return rgbToHex({ r: r*255, g: g*255, b: b*255 });
}

function ensureContrast(fg, bg, threshold = 4.5) {
    if (!fg || !bg || fg.length < 4 || bg.length < 4) return fg;
    if (contrastRatio(fg, bg) >= threshold) return fg; 

    const bgLum = relativeLuminance(hexToRgbObj(bg));
    const { h, s, l } = rgbToHsl(hexToRgbObj(fg));

    const shouldLighten = bgLum < 0.5;
    let adjustedL = l;

    for (let i = 0; i < 100; i++) {
        adjustedL = shouldLighten ? Math.min(100, adjustedL + 1) : Math.max(0, adjustedL - 1);
        const candidate = hslToHex(h, s, adjustedL);
        if (contrastRatio(candidate, bg) >= threshold) return candidate;
        if (adjustedL === 100 || adjustedL === 0) break;
    }
    return fg; 
}

function enforceWCAGContrast() {
    const style = getComputedStyle(document.documentElement);
    const body  = getComputedStyle(document.body);
    const getVar = (name) => {
        const val = (style.getPropertyValue(name) || body.getPropertyValue(name)).trim();
        return cssColorToHex(val);
    };

    const bg     = getVar('--global-bg')   || '#f9fafb';
    const accent = getVar('--primary-accent') || '#764ba2';
    const card   = cssColorToHex(body.backgroundColor) || bg;

    const fixedAccentOnCard = ensureContrast(accent, card === 'transparent' ? bg : card, 4.5);

    if (fixedAccentOnCard !== accent) {
        document.documentElement.style.setProperty('--primary-accent', fixedAccentOnCard);
        const existing = style.getPropertyValue('--primary-gradient').trim();
        if (existing && existing.includes('135deg')) {
            const match = existing.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/);
            if (match) {
                document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${match[0]} 0%, ${fixedAccentOnCard} 100%)`);
            }
        }
    }
}

function cssColorToHex(color) {
    if (!color || color === 'transparent' || color === 'none') return null;
    if (color.startsWith('#')) return color;
    if (color.startsWith('rgb')) {
        const parts = color.match(/[\d.]+/g);
        if (parts && parts.length >= 3) return rgbToHex({ r: +parts[0], g: +parts[1], b: +parts[2] });
    }
    try {
        const c = document.createElement('canvas'); c.width = c.height = 1;
        const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0,0,1,1);
        const [r,g,b] = ctx.getImageData(0,0,1,1).data;
        return rgbToHex({r,g,b});
    } catch(e) { return null; }
}
