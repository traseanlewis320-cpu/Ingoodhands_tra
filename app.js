import { StorageManager } from './storage.js';
import { ThemeManager } from './theme.js';

class App {
    constructor() {
        this.storage = new StorageManager();
        this.theme = new ThemeManager();
        this.isAdmin = sessionStorage.getItem('adminToken') === 'true';
        this.selectedDate = new Date();
        this.currentMonth = new Date();
        
        const biz = this.storage.getItem('business');
        if (biz.password === '') this.isAdmin = true;

        this.init();
    }

    init() {
        this.applyBranding();
        this.renderHorizontalGallery();
        this.renderServices();
        this.renderCalendar();
        this.bindEvents();
    }

    applyBranding() {
        const biz = this.storage.getItem('business');
        document.getElementById('main-biz-name').innerText = biz.name;
        document.getElementById('main-biz-tagline').innerText = biz.tagline;
        this.theme.applyTheme(biz.theme);
        
        if (biz.logo) {
            document.getElementById('main-logo-box').innerHTML = `<img src="${biz.logo}" style="width:100%; height:100%; object-fit:cover; border-radius:28px;">`;
        }
    }

    renderHorizontalGallery() {
        const track = document.getElementById('home-gallery-track');
        const images = this.storage.getItem('gallery');
        if (!track) return;
        track.innerHTML = '';
        const content = images.map(src => `<div class="gallery-card-item"><img src="${src}"></div>`).join('');
        track.innerHTML = content + content; // Duplicate for infinite scroll
    }

    renderServices() {
        const services = this.storage.getItem('services');
        const container = document.getElementById('service-list-container');
        container.innerHTML = services.map(s => `
            <div class="service-card-btn" onclick="window.app.selectService(${s.id})">
                <h3>${s.name}</h3>
                <span>$${s.price} &bull; ${s.duration} min</span>
            </div>
        `).join('');
    }

    // Add other methods like handleLogin, renderCalendar, etc. from your provided snippets...
}

document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
