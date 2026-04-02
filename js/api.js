// API Communication layer

async function api(path, method = 'GET', body = null) {
    try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(path, opts);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || res.statusText);
        }
        return await res.json();
    } catch (e) {
        if (typeof showNotification === 'function') showNotification(e.message, 'error');
        console.error('API Error:', e.message);
        return { error: true, message: e.message };
    }
}
