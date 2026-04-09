// Simple client-side auth (DEMO ONLY — never use plain credentials in production).

const SESSION_KEY = 'dashvendas:session';

// Demo users — in a real app these would live on a server.
const USERS = {
    admin: { password: 'admin123', role: 'admin', name: 'Administrador' },
    mod:   { password: 'mod123',   role: 'mod',   name: 'Moderador' }
};

export function login(username, password) {
    const u = USERS[username?.toLowerCase().trim()];
    if (!u || u.password !== password) return null;
    const session = { username, role: u.role, name: u.name, loggedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
}

export function currentUser() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function requireAuth() {
    const user = currentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

export function isAdmin() {
    return currentUser()?.role === 'admin';
}
