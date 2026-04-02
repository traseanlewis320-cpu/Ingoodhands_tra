// Main Application State & Booking Interaction

let currentDate = new Date(), selectedDate = null, selectedService = null, selectedTime = null, currentCarouselIndex = 0, currentLightboxIndex = 0;
let busData = {}, services = [], gallery = [], bookings = [], blockedSlots = [];
const ALL_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

async function loadBookingData() {
    const [b, s, g, avail, bks] = await Promise.all([
        api('/api/business'), api('/api/services'), api('/api/gallery'), api('/api/availability'), api('/api/bookings')
    ]);
    busData = b; services = s; gallery = g; blockedSlots = avail; bookings = bks;
    applyTheme(b.theme);
    updateSiteUI();
}

function applyTheme(theme) {
    document.body.classList.remove('theme-oceanic', 'theme-golden', 'theme-midnight');
    const root = document.documentElement;
    if (theme === 'custom') {
        root.style.setProperty('--primary-accent', busData.customAccent || '#764ba2');
        root.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${busData.customPrimary || '#667eea'} 0%, ${busData.customAccent || '#764ba2'} 100%)`);
        root.style.setProperty('--primary-soft', busData.customSoft || '#f5f3ff');
        root.style.setProperty('--global-bg', busData.customSoft || '#f9fafb');
        root.style.setProperty('--card-bg', `rgba(${hexToRgb(busData.customSoft || '#ffffff')}, 0.8)`);
        if (typeof enforceWCAGContrast === 'function') requestAnimationFrame(enforceWCAGContrast);
    } else {
        ['--primary-accent', '--primary-gradient', '--primary-soft', '--global-bg', '--card-bg', '--text-primary'].forEach(p => root.style.removeProperty(p));
        if (theme && theme !== 'purple') document.body.classList.add(`theme-${theme}`);
        if (typeof enforceWCAGContrast === 'function') requestAnimationFrame(enforceWCAGContrast);
    }
    document.body.style.backgroundImage = 'none';
}

function updateSiteUI() {
    document.getElementById('nav-business-name').textContent = busData.name;
    document.getElementById('hero-title').textContent = busData.name;
    document.getElementById('hero-subtitle').textContent = busData.tagline;
    document.getElementById('sum-phone-info').textContent = busData.phone;
    document.getElementById('sum-address').textContent = busData.address;
    document.getElementById('sum-hours').textContent = busData.hours;
    document.getElementById('instagram-link').href = busData.instagram || '#';
    document.getElementById('tiktok-link').href = busData.tiktok || '#';
    document.getElementById('side-instagram').href = busData.instagram || '#';
    document.getElementById('side-tiktok').href = busData.tiktok || '#';
    document.getElementById('footer-business-name').textContent = busData.name;
    document.getElementById('footer-tagline').textContent = busData.tagline;

    const galleryGrid = document.getElementById('gallery-grid');
    if (galleryGrid) {
        galleryGrid.innerHTML = (gallery || []).map((img, idx) => `
            <div class="flex-none w-[80vw] sm:w-[45vw] md:w-[30vw] lg:w-[350px] aspect-square gallery-item snap-center rounded-[2rem] overflow-hidden floating-art cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-transform" onclick="openLightbox('${img}')">
                <img src="${img}" class="w-full h-full object-cover">
            </div>
        `).join('');
    }

    document.getElementById('service-grid').innerHTML = services.map(s => `
        <div onclick="selectService(${s.id},'${s.name.replace(/'/g, "\\'")}',${s.price})" class="group glass p-6 rounded-3xl border ${selectedService?.id === s.id ? 'border-purple-600 ring-2 ring-purple-100' : 'border-white/50'} cursor-pointer transition-all hover:shadow-xl service-card" id="svc-${s.id}">
            <div class="flex justify-between items-center mb-4"><h4 class="font-black text-gray-900 uppercase tracking-tight">${s.name}</h4><span class="text-xs font-black text-purple-600">$${s.price}</span></div>
            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center"><i class="fas fa-clock mr-2 opacity-50"></i>${s.duration} MIN</p>
        </div>`).join('');
    renderCalendar();
}

function renderCalendar() {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    document.getElementById('current-month').textContent = new Date(y,m).toLocaleDateString('en-US',{month:'long',year:'numeric'});
    const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
    let html = '';
    for(let i=0; i<first; i++) html += '<div></div>';
    for(let d=1; d<=days; d++) {
        const active = selectedDate?.getDate()===d && selectedDate?.getMonth()===m && selectedDate?.getFullYear()===y;
        html += `<div class="p-3 text-center rounded-2xl cursor-pointer font-bold transition-all ${active ? 'gradient-bg text-white shadow-lg' : 'hover:bg-purple-50 text-gray-700'}" onclick="selectDate(${y},${m},${d})">${d}</div>`;
    }
    document.getElementById('calendar-grid').innerHTML = html;
}

function selectService(id, name, price) {
    selectedService = { id, name, price };
    selectedTime = null;
    document.getElementById('sum-price').textContent = `$${price}`;
    document.getElementById('booking-summary').textContent = `${name} - Select Date & Time`;
    document.querySelectorAll('.service-card').forEach(c => c.classList.remove('border-purple-600', 'ring-2', 'ring-purple-100'));
    document.getElementById(`svc-${id}`).classList.add('border-purple-600', 'ring-2', 'ring-purple-100');
    document.getElementById('time-selection-area').classList.add('hidden');
    document.getElementById('booking-form-area').classList.add('hidden');
    showNotification(`Locked In: ${name}`, 'success');
}

function selectDate(y, m, d) {
    if (!selectedService) return showNotification('Please select an experience first', 'error');
    selectedDate = new Date(y, m, d);
    selectedTime = null;
    document.getElementById('display-date').textContent = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('time-selection-area').classList.remove('hidden');
    document.getElementById('booking-form-area').classList.add('hidden');
    renderCalendar();
    renderTimeSlots();
    window.scrollTo({ top: document.getElementById('time-selection-area').offsetTop - 100, behavior: 'smooth' });
}

async function renderTimeSlots() {
    if (!selectedDate) return;
    const ds = selectedDate.toLocaleDateString();
    const events = typeof fetchGoogleEvents === 'function' ? await fetchGoogleEvents(selectedDate) : [];
    const isFullDayBlocked = blockedSlots.some(s => s.date === ds && s.time === 'ALL');

    document.getElementById('time-slots').innerHTML = ALL_SLOTS.map(t => {
        const slotTime = new Date(selectedDate);
        const [h, m] = t.split(':'); slotTime.setHours(h, m, 0, 0);
        const isConflict = events.some(e => {
            const start = new Date(e.start.dateTime || e.start.date);
            const end = new Date(e.end.dateTime || e.end.date);
            return slotTime >= start && slotTime < end;
        });
        const isBlocked = isFullDayBlocked || isConflict || blockedSlots.some(s => s.date === ds && s.time === t);
        const isBooked = bookings.some(b => b.date === ds && b.time === t && b.status !== 'cancelled');
        if (isBlocked || isBooked) return `<div class="p-3 border-2 border-gray-50 bg-gray-50 rounded-2xl text-center font-bold text-gray-300 cursor-not-allowed opacity-50 relative">${formatTime12h(t)}<span class="absolute -top-2 -right-1 bg-white px-1 text-[8px] uppercase tracking-tighter rounded border border-gray-200">${isBooked ? 'Booked' : 'N/A'}</span></div>`;
        return `<div class="p-3 border-2 border-gray-100 rounded-2xl text-center cursor-pointer font-bold hover:border-purple-600 hover:text-purple-600 transition time-slot-btn" onclick="selectTime(event, '${t}')">${formatTime12h(t)}</div>`;
    }).join('');
}

function selectTime(e, time) {
    selectedTime = time;
    document.querySelectorAll('.time-slot-btn').forEach(el => el.classList.remove('slot-selected', 'border-transparent'));
    e.currentTarget.classList.add('slot-selected', 'border-transparent');
    document.getElementById('sum-price').textContent = `$${selectedService.price}`;
    document.getElementById('booking-summary').textContent = `${selectedService.name} - ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} @ ${formatTime12h(time)}`;
    document.getElementById('booking-form-area').classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('booking-form-area').offsetTop - 100, behavior: 'smooth' });
}

async function handleBooking(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('custName').value, email = document.getElementById('custEmail').value, phone = document.getElementById('custPhone').value, notes = document.getElementById('custNotes').value;
    if (!name || !email || !phone) return showNotification('Please fill all credentials', 'error');
    const bookingData = { serviceId: selectedService.id, serviceName: selectedService.name, servicePrice: selectedService.price, customerName: name, customerEmail: email, customerPhone: phone, notes, date: selectedDate.toLocaleDateString(), time: selectedTime, status: 'pending', createdAt: new Date().toISOString() };
    showNotification('Securing Appointment...', 'info');
    const res = await api('/api/bookings', 'POST', bookingData);
    if (res.success) {
        const start = new Date(selectedDate); const [h, m] = selectedTime.split(':'); start.setHours(h, m, 0); const end = new Date(start.getTime() + 60*60*1000);
        const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        document.getElementById('gcal-btn').href = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedService.name)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(notes)}&location=${encodeURIComponent(busData.address)}`;
        document.getElementById('success-modal').classList.remove('hidden');
    }
}

function closeSuccessModal() { location.reload(); }
function openLightbox(src) { currentLightboxIndex = gallery.indexOf(src); document.getElementById('lightbox-img').src = src; document.getElementById('lightbox-modal').classList.add('active'); }
function closeLightbox() { document.getElementById('lightbox-modal').classList.remove('active'); }
function changeLightboxImage(direction) { if (!gallery?.length) return; currentLightboxIndex = (currentLightboxIndex + direction + gallery.length) % gallery.length; document.getElementById('lightbox-img').src = gallery[currentLightboxIndex]; }
function toggleMobileMenu() { const nav = document.querySelector('nav .hidden.md\\:flex'); nav.classList.toggle('hidden'); nav.classList.toggle('flex'); nav.classList.toggle('flex-col'); nav.classList.toggle('absolute'); nav.classList.toggle('top-16'); nav.classList.toggle('left-0'); nav.classList.toggle('right-0'); nav.classList.toggle('glass', 'p-6', 'space-y-4'); }
function scrollGallery(dir) { const container = document.getElementById('gallery-grid'); if (container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10) container.scrollTo({ left: 0, behavior: 'smooth' }); else container.scrollBy({ left: dir * (container.offsetWidth * 0.5), behavior: 'smooth' }); }

document.addEventListener('DOMContentLoaded', () => loadBookingData());
window.changeMonth = (v) => { currentDate.setMonth(currentDate.getMonth() + v); renderCalendar(); };
window.scrollToBookingSection = async () => { await showPage('booking', true); document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
window.showPage = showPage;
