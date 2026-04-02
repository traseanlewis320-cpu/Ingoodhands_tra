// Admin Dashboard Logic

let adminSelectedDate = null, adminCurrentDate = new Date();

async function loadAdminData() {
    const [b, s, g, book, avail] = await Promise.all([
        api('/api/business'), api('/api/services'), api('/api/gallery'), api('/api/bookings'), api('/api/availability')
    ]);
    busData = b; services = s; gallery = g; bookings = book; blockedSlots = avail;

    // UI Updates
    document.getElementById('admin-bus-name').value = b.name;
    document.getElementById('admin-bus-tagline').value = b.tagline;
    document.getElementById('admin-bus-address').value = b.address;
    document.getElementById('admin-bus-phone').value = b.phone;
    document.getElementById('admin-bus-email').value = b.email;
    document.getElementById('admin-bus-hours').value = b.hours;
    document.getElementById('admin-bus-instagram').value = b.instagram;
    document.getElementById('admin-bus-tiktok').value = b.tiktok;
    document.getElementById('admin-bus-theme').value = b.theme || 'purple';
    document.getElementById('admin-bus-google-key').value = b.googleApiKey || '';
    document.getElementById('admin-bus-calendar-id').value = b.googleCalendarId || '';

    // Services
    document.getElementById('admin-services-grid').innerHTML = s.map(sv => `
        <div class="unified-card border border-gray-200 p-5 rounded-2xl flex justify-between items-start group">
            <div><b class="admin-text-primary block mb-1">${sv.name}</b><p class="admin-text-secondary text-sm">$${sv.price} • ${sv.duration}m</p></div>
            <div class="flex space-x-2 opacity-0 group-hover:opacity-100"><button onclick="openServiceModal(${sv.id})" class="p-2 text-blue-500"><i class="fas fa-edit"></i></button><button onclick="deleteService(${sv.id})" class="p-2 text-red-500"><i class="fas fa-trash"></i></button></div>
        </div>`).join('');

    // Gallery
    document.getElementById('admin-gallery-preview').innerHTML = g.map(url => `<div class="relative rounded-xl overflow-hidden group h-24 shadow-md"><img src="${url}" class="w-full h-full object-cover"><button onclick="deleteGalleryImage('${url}')" class="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center font-bold text-xs">Delete</button></div>`).join('');

    // Bookings
    const statusClass = (s) => ({"confirmed":"bg-green-500/10 text-green-600", "completed":"bg-blue-500/10 text-blue-600", "cancelled":"bg-red-500/10 text-red-600", "pending":"bg-yellow-500/10 text-yellow-600"}[s] || "bg-gray-500/10 text-gray-600");
    document.getElementById('admin-bookings-rows').innerHTML = book.map(bk => `
        <tr class="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onclick="openBookingModal(${bk.id})">
            <td class="py-4 px-2 font-bold admin-text-primary">${bk.customerName}</td>
            <td class="py-4 font-medium admin-text-secondary">${bk.serviceName}</td>
            <td class="py-4 text-sm admin-text-secondary">${bk.date} @ ${formatTime12h(bk.time)}</td>
            <td class="py-4"><span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusClass(bk.status)}">${bk.status || 'pending'}</span></td>
            <td class="py-4 text-right"><i class="fas fa-chevron-right text-xs opacity-20"></i></td>
        </tr>`).join('');
}

async function fetchGoogleEvents(date) {
    if (!busData.googleApiKey || !busData.googleCalendarId) return [];
    const d = new Date(date), tMin = new Date(d.setHours(0,0,0,0)).toISOString(), tMax = new Date(d.setHours(23,59,59,999)).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(busData.googleCalendarId)}/events?key=${busData.googleApiKey}&timeMin=${tMin}&timeMax=${tMax}&singleEvents=true`;
    try { const res = await (await fetch(url)).json(); return res.items || []; } catch (e) { return []; }
}

function renderAdminCalendar() {
    const y = adminCurrentDate.getFullYear(), m = adminCurrentDate.getMonth();
    document.getElementById('admin-month-display').textContent = new Date(y,m).toLocaleDateString('en-US',{month:'long',year:'numeric'});
    const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
    let html = ''; for(let i=0; i<first; i++) html += '<div></div>';
    for(let d=1; d<=days; d++) {
        const active = adminSelectedDate?.getDate()===d && adminSelectedDate?.getMonth()===m && adminSelectedDate?.getFullYear()===y;
        html += `<div class="p-2 text-center rounded-xl cursor-pointer font-bold text-sm ${active ? 'bg-purple-600 text-white' : 'hover:bg-purple-50 text-gray-700'}" onclick="selectAdminDate(${y},${m},${d})">${d}</div>`;
    }
    document.getElementById('admin-calendar-grid').innerHTML = html;
}

function selectAdminDate(y, m, d) { adminSelectedDate = new Date(y, m, d); renderAdminCalendar(); renderAdminSlots(); }

function renderAdminSlots() {
    if (!adminSelectedDate) return;
    const ds = adminSelectedDate.toLocaleDateString();
    document.getElementById('admin-selected-date-display').textContent = adminSelectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const isFullDayBlocked = blockedSlots.some(s => s.date === ds && s.time === 'ALL');
    document.getElementById('admin-time-slots').innerHTML = ALL_SLOTS.map(t => {
        const isBlocked = isFullDayBlocked || blockedSlots.some(s => s.date === ds && s.time === t);
        const isBooked = bookings.some(b => b.date === ds && b.time === t && b.status !== 'cancelled');
        if (isBooked) return `<div class="p-3 bg-gray-100 rounded-xl text-center font-bold text-gray-400 opacity-50 relative">${formatTime12h(t)} <span class="absolute -top-2 -right-1 bg-white px-1 text-[8px] rounded border">Booked</span></div>`;
        if (isBlocked) return `<div onclick="toggleAdminSlot('${ds}', '${t}', true)" class="p-3 border-2 border-red-200 bg-red-50 text-red-600 rounded-xl text-center font-bold relative">${formatTime12h(t)} <i class="fas fa-lock absolute top-1 right-2 text-[10px] opacity-40"></i></div>`;
        return `<div onclick="toggleAdminSlot('${ds}', '${t}', false)" class="p-3 border-2 border-gray-200 bg-white rounded-xl text-center font-bold hover:border-purple-600 transition">${formatTime12h(t)}</div>`;
    }).join('');
}

async function toggleAdminSlot(dateStr, timeStr, currentlyBlocked) {
    const res = await api('/api/availability', currentlyBlocked ? 'DELETE' : 'POST', { date: dateStr, time: timeStr });
    if (res.success) { 
        if (currentlyBlocked) blockedSlots = blockedSlots.filter(s => !(s.date === dateStr && (s.time === timeStr || s.time === 'ALL')));
        else blockedSlots.push({ date: dateStr, time: timeStr });
        renderAdminSlots(); 
    }
}

async function blockFullAdminDay() {
    if (!adminSelectedDate) return;
    const ds = adminSelectedDate.toLocaleDateString();
    if(!confirm(`Block all slots for ${ds}?`)) return;
    const res = await api('/api/availability', 'POST', { date: ds, time: 'ALL' });
    if (res.success) { blockedSlots.push({ date: ds, time: 'ALL' }); showNotification('Entire day blocked.', 'info'); renderAdminSlots(); }
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => { t.classList.remove('active', 'text-gray-900', 'border-gray-900'); t.classList.add('text-gray-400', 'border-transparent'); });
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
    const btn = document.getElementById(`tab-${tab}`);
    if(btn) btn.classList.add('active', 'text-gray-900', 'border-gray-900');
    document.getElementById(`panel-${tab}`)?.classList.remove('hidden');
    if (tab === 'schedule') { if (!adminSelectedDate) adminSelectedDate = new Date(); renderAdminCalendar(); renderAdminSlots(); }
}

window.changeAdminMonth = (v) => { adminCurrentDate.setMonth(adminCurrentDate.getMonth() + v); renderAdminCalendar(); };
window.switchAdminTab = switchAdminTab;
window.handleSaveBusiness = async (e) => { e.preventDefault(); /* Build body and call API */ };
// ... and so on for all window-level functions ...
