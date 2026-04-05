import { StorageManager } from './storage.js';
import { ThemeManager } from './theme.js';

async function hashStr(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class App {
    constructor() {
        this.storage = new StorageManager();
        this.theme = new ThemeManager();
        this.currentView = 'home';
        this.currentMonth = new Date();
        this.selectedService = null;
        this.selectedDate = new Date();
        this.selectedTime = null;
        this.isAdmin = sessionStorage.getItem('adminToken') === 'true';
        
        // If password is unset (''), allow direct admin access
        const biz = this.storage.getItem('business');
        if (biz && biz.password === '') {
            this.isAdmin = true;
            sessionStorage.setItem('adminToken', 'true');
        }

        // Cropper state
        this.cropper = null;
        this.pendingFiles = [];

        this.init();
    }

    init() {
        this.bindEvents();
        this.applyBranding();
        this.renderHorizontalGallery();
        this.renderServices();
        this.renderCalendar();
        this.updateAuthUI();

        // Start in home view
        this.showView('home');
        if (window.lucide) lucide.createIcons();
    }

    bindEvents() {
        // Global access
        window.app = this;

        // Admin Auth
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) loginForm.onsubmit = async (e) => await this.handleLogin(e);

        // Logo & Branding
        const logoInp = document.getElementById('logo-upload');
        if (logoInp) logoInp.onchange = (e) => this.handleLogoUpload(e);

        // Gallery
        const uploadTrigger = document.getElementById('gallery-upload-trigger');
        if (uploadTrigger) uploadTrigger.onchange = (e) => this.handleBulkUpload(e);

        // Theme switching
        document.querySelectorAll('.theme-button-opt').forEach(btn => {
            btn.onclick = () => this.updateTheme(btn.dataset.theme);
        });

        // Branding Inputs Live Update
        const adminNameInp = document.getElementById('admin-name');
        const adminTaglineInp = document.getElementById('admin-tagline');
        
        if (adminNameInp) {
            adminNameInp.oninput = () => {
                const biz = this.storage.getItem('business');
                biz.name = adminNameInp.value;
                this.storage.setItem('business', biz);
                document.getElementById('main-biz-name').innerText = biz.name;
            };
        }

        if (adminTaglineInp) {
            adminTaglineInp.oninput = () => {
                const biz = this.storage.getItem('business');
                biz.tagline = adminTaglineInp.value;
                this.storage.setItem('business', biz);
                document.getElementById('main-biz-tagline').innerText = biz.tagline;
            };
        }

        // Admin Password Update
        const adminPassInp = document.getElementById('admin-password-edit');
        if (adminPassInp) {
            adminPassInp.oninput = async () => {
                const biz = this.storage.getItem('business');
                if (adminPassInp.value === '') {
                    biz.password = '';
                } else {
                    if (adminPassInp.value.length < 4) return;
                    biz.password = await hashStr(adminPassInp.value);
                }
                this.storage.setItem('business', biz);
            };
        }

        // Service Form submit
        const serviceForm = document.getElementById('admin-service-form');
        if (serviceForm) serviceForm.onsubmit = (e) => this.handleServiceSubmit(e);

        // Admin SMS Settings
        const adminSmsInp = document.getElementById('admin-sms-phone');
        const clientSmsTgl = document.getElementById('client-sms-toggle');
        if (adminSmsInp) {
            adminSmsInp.oninput = () => {
                const biz = this.storage.getItem('business');
                biz.admin_sms_phone = adminSmsInp.value;
                this.storage.setItem('business', biz);
            };
        }
        if (clientSmsTgl) {
            clientSmsTgl.onchange = () => {
                const biz = this.storage.getItem('business');
                biz.client_sms_enabled = clientSmsTgl.checked;
                this.storage.setItem('business', biz);
            }
        }

        // Calendar Nav
        const prevMonth = document.getElementById('prev-month');
        const nextMonth = document.getElementById('next-month');
        if (prevMonth) prevMonth.onclick = () => this.changeMonth(-1);
        if (nextMonth) nextMonth.onclick = () => this.changeMonth(1);
    }

    // --- VIEW MANAGEMENT ---
    showView(v) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`view-${v}`);
    if (target) {
        target.classList.add('active');
        this.currentView = v;
    }
    
    // Force check if admin access should be granted
    if (v === 'admin') {
        const biz = this.storage.getItem('business');
        if (biz && biz.password === '') {
            this.isAdmin = true;
            sessionStorage.setItem('adminToken', 'true');
        }
    }
    
    if (v === 'admin' && !this.isAdmin) {
        this.showView('login');
        return;
    }
    if (v === 'admin') this.initAdminDashboard();
    window.scrollTo(0,0);
}
    showAdmin() { this.showView('admin'); }

    // --- BRANDING ---
    applyBranding() {
        const biz = this.storage.getItem('business');
        document.getElementById('main-biz-name').innerText = biz.name;
        document.getElementById('main-biz-tagline').innerText = biz.tagline;
        
        // Admin fields
        document.getElementById('admin-name').value = biz.name;
        document.getElementById('admin-tagline').value = biz.tagline;
        
        // Don't show hash
        if (biz.password === '') {
            document.getElementById('admin-password-edit').value = '';
            document.getElementById('admin-password-edit').placeholder = 'Status: Public Access. Enter password to lock.';
        } else {
            document.getElementById('admin-password-edit').value = '';
            document.getElementById('admin-password-edit').placeholder = 'Status: Locked. Enter NEW password to change.';
        }

        const logoBox = document.getElementById('main-logo-box');
        const adminPrev = document.getElementById('admin-logo-preview');
        
        if (biz.logo) {
            const imgHtml = `<img src="${biz.logo}" alt="Logo">`;
            logoBox.innerHTML = imgHtml;
            adminPrev.src = biz.logo;
        }

        // Apply theme
        this.theme.applyTheme(biz.theme, {
            customPrimary: biz.customPrimary,
            customAccent: biz.customAccent,
            customBodyBg: biz.customBodyBg
        });

        // Update active theme btn in admin
        document.querySelectorAll('.theme-button-opt').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === biz.theme);
        });

        // SMS Settings
        if (document.getElementById('admin-sms-phone')) {
            document.getElementById('admin-sms-phone').value = biz.admin_sms_phone || '';
            document.getElementById('client-sms-toggle').checked = biz.client_sms_enabled !== false;
        }
    }

    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            const biz = this.storage.getItem('business');
            biz.logo = f.target.result;
            this.storage.setItem('business', biz);
            this.applyBranding();
        };
        reader.readAsDataURL(file);
    }

    updateTheme(t) {
        const biz = this.storage.getItem('business');
        biz.theme = t;
        this.storage.setItem('business', biz);
        this.applyBranding();
    }

    // --- CONSISTENT FLOATING GALLERY ---
    renderHorizontalGallery() {
        const track = document.getElementById('home-gallery-track');
        const gallery = this.storage.getItem('gallery');
        if (!track) return;
        
        // Double up for seamless loop
        const drawItems = () => {
            gallery.forEach(src => {
                const item = document.createElement('div');
                item.className = 'gallery-card-item';
                item.innerHTML = `<img src="${src}">`;
                track.appendChild(item);
            });
        };

        track.innerHTML = '';
        drawItems();
        drawItems(); // The loop
    }

    openFullGallery() { alert('Portfolio Showcase: Work in Progress!'); }

    // --- BULK UPLOAD + CROPPER ---
    handleBulkUpload(e) {
        this.pendingFiles = Array.from(e.target.files);
        this.processNextPendingPhoto();
    }

    processNextPendingPhoto() {
        if (this.pendingFiles.length === 0) {
            this.renderAdminGallery();
            this.renderHorizontalGallery();
            return;
        }
        
        const file = this.pendingFiles.shift();
        const reader = new FileReader();
        reader.onload = (f) => {
            const imgToCrop = document.getElementById('image-to-crop');
            imgToCrop.src = f.target.result;
            document.getElementById('overlay-crop').classList.add('active');
            
            if (this.cropper) this.cropper.destroy();
            this.cropper = new Cropper(imgToCrop, {
                aspectRatio: 220 / 280,
                viewMode: 1,
                dragMode: 'move',
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
        };
        reader.readAsDataURL(file);
    }

    completeCrop() {
        const dataUrl = this.cropper.getCroppedCanvas({ width: 440, height: 560 }).toDataURL('image/jpeg', 0.85);
        const gallery = this.storage.getItem('gallery');
        gallery.push(dataUrl);
        this.storage.setItem('gallery', gallery);
        
        document.getElementById('overlay-crop').classList.remove('active');
        this.processNextPendingPhoto();
    }

    cancelCrop() {
        document.getElementById('overlay-crop').classList.remove('active');
        this.processNextPendingPhoto();
    }

    renderAdminGallery() {
        const grid = document.getElementById('admin-gallery-preview-grid');
        const gallery = this.storage.getItem('gallery');
        if (!grid) return;
        
        grid.innerHTML = gallery.map((src, idx) => `
            <div class="gallery-card-item" style="height: 150px; width: 100px;">
                <img src="${src}">
                <button onclick="window.app.deletePhoto(${idx})" style="position: absolute; top:5px; right:5px; background: rgba(0,0,0,0.5); border:none; color:white; border-radius:50%; width:20px; height:20px; cursor:pointer;">&times;</button>
            </div>
        `).join('');
    }

    deletePhoto(idx) {
        if (!confirm('Remove this photo?')) return;
        const gallery = this.storage.getItem('gallery');
        gallery.splice(idx, 1);
        this.storage.setItem('gallery', gallery);
        this.renderAdminGallery();
        this.renderHorizontalGallery();
    }

    // --- BOOKING ENGINE ---
    renderServices() {
        const services = this.storage.getItem('services');
        const container = document.getElementById('service-list-container');
        if (!container) return;

        container.innerHTML = services.map(s => `
            <div class="service-card-btn ${this.selectedService?.id === s.id ? 'active' : ''}" onclick="window.app.selectService(${s.id})">
                <h3>${s.name}</h3>
                <span>$${s.price} &bull; ${s.duration} min</span>
            </div>
        `).join('');
    }

    selectService(id) {
        const services = this.storage.getItem('services');
        this.selectedService = services.find(s => s.id == id);
        this.renderServices();
        this.renderTimeSlots();
    }

    renderCalendar() {
        const grid = document.getElementById('calendar-days-container');
        const label = document.getElementById('current-month-label');
        if (!grid) return;

        const headers = Array.from(grid.querySelectorAll('.cal-day-label'));
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        label.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(this.currentMonth);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let startGap = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < startGap; i++) grid.appendChild(document.createElement('div'));

        const today = new Date();
        today.setHours(0,0,0,0);
        const blockedSlots = this.storage.getItem('blocked_slots');

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = date.toLocaleDateString();
            const cell = document.createElement('div');
            cell.className = 'cal-day-item';
            cell.innerText = d;

            const isBlockedFullDay = blockedSlots.some(s => s.date === dateStr && s.time === 'ALL');
            if (date < today || isBlockedFullDay) {
                cell.classList.add('disabled');
            } else {
                if (this.selectedDate?.toLocaleDateString() === dateStr) cell.classList.add('selected');
                cell.onclick = () => {
                    this.selectedDate = date;
                    this.renderCalendar();
                    this.renderTimeSlots();
                };
            }
            grid.appendChild(cell);
        }

        if (this.currentView === 'admin') this.renderAdminCalendar();
    }

    changeMonth(v) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + v);
        this.renderCalendar();
    }

    renderTimeSlots() {
        const container = document.getElementById('time-slots-container');
        if (!container) return;
        container.innerHTML = '';
        if (!this.selectedDate || !this.selectedService) return;

        const dateStr = this.selectedDate.toLocaleDateString();
        const blockedTimes = this.storage.getItem('blocked_slots').filter(s => s.date === dateStr).map(s => s.time);

        // 8 AM to 8 PM (30 min increments)
        for (let h = 8; h <= 20; h++) {
            for (let m of [0, 30]) {
                if (h === 20 && m === 30) continue; // Ends at 8pm
                
                const hh = h > 12 ? h - 12 : h;
                const ampm = h >= 12 ? 'PM' : 'AM';
                const mm = m === 0 ? '00' : '30';
                const timeStr = `${hh}:${mm} ${ampm}`;

                const btn = document.createElement('div');
                btn.className = 'slot-btn-item';
                if (blockedTimes.includes(timeStr)) btn.classList.add('blocked');
                if (this.selectedTime === timeStr) btn.classList.add('selected');
                
                btn.innerText = timeStr;
                btn.onclick = () => {
                    if (blockedTimes.includes(timeStr)) return;
                    this.selectedTime = timeStr;
                    this.renderTimeSlots();
                    document.getElementById('booking-cta-box').style.display = 'block';
                };
                container.appendChild(btn);
            }
        }
    }

    proceedToBooking() {
        this.showView('details');
    }

    confirmBooking() {
        if (!document.getElementById('public-booking-form').checkValidity()) return document.getElementById('public-booking-form').reportValidity();
        
        const booking = {
            customer: document.getElementById('cust-name').value,
            email: document.getElementById('cust-email').value,
            phone: document.getElementById('cust-phone').value,
            notes: document.getElementById('cust-notes').value,
            service: this.selectedService.name,
            date: this.selectedDate.toLocaleDateString(),
            time: this.selectedTime,
            status: 'Pending'
        };
        this.storage.add('bookings', booking);
        
        // Notification Logic
        const biz = this.storage.getItem('business');
        this.mockSendSms(biz.admin_sms_phone, `New Booking: ${booking.service} on ${booking.date} at ${booking.time} by ${booking.customer}`);
        if (biz.client_sms_enabled !== false) {
            this.mockSendSms(booking.phone, `Hi ${booking.customer}, your booking for ${booking.service} is RECEIVED. We will confirm shortly!`);
        }

        alert('Success! Your appointment is reserved.');
        location.reload();
    }

    // --- ADMIN AUTH ---
    async handleLogin(e) {
        e.preventDefault();
        const biz = this.storage.getItem('business');
        const inputPass = document.getElementById('admin-pass').value.trim();
        const hashedInput = await hashStr(inputPass);
        
        console.log('Login attempt:', { inputHash: hashedInput, targetHash: biz.password });
        
        if (hashedInput === biz.password) {
            this.isAdmin = true;
            sessionStorage.setItem('adminToken', 'true');
            this.showView('admin');
            this.updateAuthUI();
        } else alert('Access Denied: Invalid Credentials');
    }

    logout() {
        this.isAdmin = false;
        sessionStorage.setItem('adminToken', 'false');
        location.reload();
    }

    updateAuthUI() { /* Placeholder if needed */ }

    // --- ADMIN DASHBOARD ---
    initAdminDashboard() {
        this.renderAdminGallery();
        this.renderAdminCalendar();
        this.renderAdminTimeBlocker();
        this.renderAdminServices();
        this.renderAdminAppointments();
    }

    renderAdminAppointments() {
        const container = document.getElementById('admin-appointments-table');
        const bookings = this.storage.getItem('bookings');
        if (!container) return;

        if (bookings.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-secondary);">No appointments found.</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="text-align: left; border-bottom: 1px solid var(--border-glass); color: var(--text-secondary); font-size: 13px;">
                        <th style="padding: 10px;">Customer</th>
                        <th style="padding: 10px;">Service</th>
                        <th style="padding: 10px;">Date/Time</th>
                        <th style="padding: 10px;">Status</th>
                        <th style="padding: 10px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.reverse().map(b => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
                            <td style="padding: 15px;">
                                <div style="font-weight: 700;">${b.customer}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">${b.phone}</div>
                            </td>
                            <td style="padding: 15px;">${b.service}</td>
                            <td style="padding: 15px;">${b.date} &bull; ${b.time}</td>
                            <td style="padding: 15px;">
                                <span style="background: ${b.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; 
                                             color: ${b.status === 'Confirmed' ? '#10b981' : '#f59e0b'}; 
                                             padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                                    ${b.status}
                                </span>
                            </td>
                            <td style="padding: 15px;">
                                ${b.status === 'Pending' ? `<button onclick="window.app.confirmAppointment(${b.id})" style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">Confirm</button>` : ''}
                                <button onclick="window.app.deleteAppointment(${b.id})" style="background: none; border: 1px solid rgba(255,0,0,0.2); color: #ff4444; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; margin-left: 5px;">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    confirmAppointment(id) {
        const bookings = this.storage.getItem('bookings');
        const b = bookings.find(x => x.id == id);
        if (!b) return;

        b.status = 'Confirmed';
        this.storage.setItem('bookings', bookings);
        
        // Notify Client
        const biz = this.storage.getItem('business');
        if (biz.client_sms_enabled !== false) {
            this.mockSendSms(b.phone, `Hi ${b.customer}, your appointment for ${b.service} on ${b.date} at ${b.time} is CONFIRMED! We look forward to seeing you.`);
        }

        this.renderAdminAppointments();
    }

    deleteAppointment(id) {
        if (!confirm('Remove this appointment record?')) return;
        this.storage.delete('bookings', id);
        this.renderAdminAppointments();
    }

    mockSendSms(to, message) {
        console.log(`%c[SMS GATEWAY] Sending to ${to}: %c${message}`, "color: #10b981; font-weight: bold", "color: #fff");
        // Show a visual toast in UI for demo
        this.showToast(`SMS Sent to ${to}`);
    }

    showToast(msg) {
        const t = document.createElement('div');
        t.innerText = msg;
        t.style.cssText = `position: fixed; bottom: 30px; right: 30px; background: var(--primary); color: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 9999; animation: fadeIn 0.3s;`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }

    renderAdminServices() {
        const grid = document.getElementById('admin-services-list');
        const services = this.storage.getItem('services');
        if (!grid) return;
        
        grid.innerHTML = services.map(s => `
            <div class="service-card-btn" style="cursor: default; transform: none; box-shadow: none;">
                <h3>${s.name}</h3>
                <p style="color: var(--text-secondary); font-size: 13px; margin: 10px 0;">${s.description || ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>$${s.price} &bull; ${s.duration}m</span>
                    <div>
                        <button onclick="window.app.openServiceModal(${s.id})" style="background: none; border: 1px solid var(--border-glass); color: white; padding: 5px 12px; border-radius: 8px; cursor: pointer;">Edit</button>
                        <button onclick="window.app.deleteService(${s.id})" style="background: none; border: 1px solid rgba(255,0,0,0.3); color: #ff4444; padding: 5px 12px; border-radius: 8px; cursor: pointer; margin-left: 5px;">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    openServiceModal(id = null) {
        document.getElementById('service-modal-title').innerText = id ? 'Edit Service' : 'New Service';
        const form = document.getElementById('admin-service-form');
        form.reset();
        document.getElementById('service-edit-id').value = id || '';
        
        if (id) {
            const s = this.storage.getItem('services').find(x => x.id == id);
            document.getElementById('service-name').value = s.name;
            document.getElementById('service-price').value = s.price;
            document.getElementById('service-duration').value = s.duration;
            document.getElementById('service-desc').value = s.description || '';
        }
        
        document.getElementById('overlay-service').classList.add('active');
    }

    handleServiceSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('service-edit-id').value;
        const item = {
            name: document.getElementById('service-name').value,
            price: document.getElementById('service-price').value,
            duration: document.getElementById('service-duration').value,
            description: document.getElementById('service-desc').value
        };

        if (id) {
            this.storage.update('services', id, item);
        } else {
            this.storage.add('services', item);
        }
        
        document.getElementById('overlay-service').classList.remove('active');
        this.renderAdminServices();
        this.renderServices(); // update public view
    }

    deleteService(id) {
        if (!confirm('Delete this service permanently?')) return;
        this.storage.delete('services', id);
        this.renderAdminServices();
        this.renderServices(); // update public view
    }

    renderAdminCalendar() {
        const container = document.getElementById('admin-calendar-blocker');
        if (!container) return;
        container.innerHTML = '<h3>Block Dates (Double Click)</h3>';
        
        const grid = document.createElement('div');
        grid.className = 'cal-grid-body';
        grid.style.marginTop = '20px';
        
        const monthLabel = document.createElement('h4');
        monthLabel.innerText = this.currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthLabel.style.marginBottom = '15px';
        container.appendChild(monthLabel);
        container.appendChild(grid);

        const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1).getDay();
        const daysInMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0).getDate();
        let startGap = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < startGap; i++) grid.appendChild(document.createElement('div'));

        const blocked = this.storage.getItem('blocked_slots');

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), d);
            const dateStr = date.toLocaleDateString();
            const cell = document.createElement('div');
            cell.className = 'cal-day-item';
            cell.innerText = d;
            
            if (blocked.some(s => s.date === dateStr && s.time === 'ALL')) cell.style.background = 'rgba(255,0,0,0.2)';
            if (this.selectedDate?.toDateString() === date.toDateString()) cell.classList.add('selected');

            cell.onclick = () => {
                this.selectedDate = date;
                this.renderAdminCalendar();
                this.renderAdminTimeBlocker();
            };

            cell.ondblclick = () => {
                let current = this.storage.getItem('blocked_slots');
                if (current.some(s => s.date === dateStr && s.time === 'ALL')) {
                    current = current.filter(s => !(s.date === dateStr && s.time === 'ALL'));
                } else {
                    current.push({ date: dateStr, time: 'ALL' });
                }
                this.storage.setItem('blocked_slots', current);
                this.renderAdminCalendar();
                this.renderCalendar();
            };
            grid.appendChild(cell);
        }
    }

    renderAdminTimeBlocker() {
        const blocker = document.getElementById('admin-time-blocker');
        if (!blocker) return;
        blocker.innerHTML = `<h4 style="grid-column: span 3; margin-bottom: 20px;">Block Times: ${this.selectedDate.toDateString()}</h4>`;
        
        const dateStr = this.selectedDate.toLocaleDateString();
        let blocked = this.storage.getItem('blocked_slots').filter(s => s.date === dateStr).map(s => s.time);

        for (let h = 8; h <= 20; h++) {
            for (let m of [0, 30]) {
                if (h === 20 && m === 30) continue;
                const hh = h > 12 ? h - 12 : h;
                const ampm = h >= 12 ? 'PM' : 'AM';
                const mm = m === 0 ? '00' : '30';
                const timeStr = `${hh}:${mm} ${ampm}`;

                const btn = document.createElement('div');
                btn.className = 'slot-btn-item';
                if (blocked.includes(timeStr)) btn.classList.add('blocked');
                btn.innerText = timeStr;

                btn.onclick = () => {
                    let current = this.storage.getItem('blocked_slots');
                    if (blocked.includes(timeStr)) {
                        current = current.filter(s => !(s.date === dateStr && s.time === timeStr));
                    } else {
                        current.push({ date: dateStr, time: timeStr });
                    }
                    this.storage.setItem('blocked_slots', current);
                    this.renderAdminTimeBlocker();
                    this.renderTimeSlots();
                };
                blocker.appendChild(btn);
            }
        }
    }
}

// Global entry point
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
