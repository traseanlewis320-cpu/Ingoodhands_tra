// StorageManager: Handles all localStorage operations
export class StorageManager {
    constructor() {
        this.INIT_DATA = {
            services: [
                { id: 1, name: 'Hair Styling', duration: 60, price: 75, description: 'Professional cut and style' },
                { id: 2, name: 'Massage Therapy', duration: 90, price: 120, description: 'Relaxing deep tissue massage' }
            ],
            business: {
                name: 'Luxe Salon & Spa',
                tagline: 'Premium beauty and wellness services',
                password: 'admin123',
                admin_sms_phone: '+1 (555) 000-0000',
                email: 'bookings@luxesalon.com',
                phone: '+1 (555) 123-4567',
                address: '123 Beauty Lane, NY',
                hours: 'Mon-Sat: 9AM-7PM',
                instagram: '',
                tiktok: '',
                theme: 'slate',
                customPrimary: '#6366f1',
                customAccent: '#ec4899',
                customSoft: '#f5f3ff',
                customBodyBg: '#f9fafb',
                customAdminBg: '#ffffff',
                bgImage: ''
            },
            bookings: [],
            gallery: [
                'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop'
            ],
            blocked_slots: []
        };
        this.init();
    }

    init() {
        if (!localStorage.getItem('booknow_services')) {
            localStorage.setItem('booknow_services', JSON.stringify(this.INIT_DATA.services));
        }
        if (!localStorage.getItem('booknow_business')) {
            localStorage.setItem('booknow_business', JSON.stringify(this.INIT_DATA.business));
        }
        if (!localStorage.getItem('booknow_bookings')) {
            localStorage.setItem('booknow_bookings', JSON.stringify(this.INIT_DATA.bookings));
        }
        if (!localStorage.getItem('booknow_gallery')) {
            localStorage.setItem('booknow_gallery', JSON.stringify(this.INIT_DATA.gallery));
        }
        if (!localStorage.getItem('booknow_blocked_slots')) {
            localStorage.setItem('booknow_blocked_slots', JSON.stringify(this.INIT_DATA.blocked_slots));
        }
    }

    // Generic CRUD
    getItem(key) {
        return JSON.parse(localStorage.getItem(`booknow_${key}`));
    }

    setItem(key, data) {
        localStorage.setItem(`booknow_${key}`, JSON.stringify(data));
    }

    // Specific CRUD for services/bookings
    add(key, item) {
        const data = this.getItem(key);
        item.id = Date.now();
        data.push(item);
        this.setItem(key, data);
        return item;
    }

    update(key, id, updatedItem) {
        let data = this.getItem(key);
        data = data.map(item => item.id == id ? { ...item, ...updatedItem } : item);
        this.setItem(key, data);
    }

    delete(key, id) {
        let data = this.getItem(key);
        data = data.filter(item => item.id != id);
        this.setItem(key, data);
    }
}
