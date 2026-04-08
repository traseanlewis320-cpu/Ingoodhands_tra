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
                password: '', 
                admin_sms_phone: '+1 (555) 000-0000',
                email: 'bookings@luxesalon.com',
                theme: 'slate',
                logo: ''
            },
            bookings: [],
            gallery: [
                'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800',
                'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800'
            ],
            blocked_slots: []
        };
        this.init();
    }

    init() {
        const keys = ['services', 'business', 'bookings', 'gallery', 'blocked_slots'];
        keys.forEach(key => {
            if (!localStorage.getItem(`booknow_${key}`)) {
                this.setItem(key, this.INIT_DATA[key]);
            }
        });
    }

    getItem(key) { return JSON.parse(localStorage.getItem(`booknow_${key}`)); }
    setItem(key, data) { localStorage.setItem(`booknow_${key}`, JSON.stringify(data)); }

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
