// State + persistence layer.

const STORAGE_KEY = 'dashvendas:v2';

// Generic, fictitious sample data — safe to publish.
const DEFAULT_INVENTORY = [
    { name: 'Camiseta Básica Branca', cost: 45.00, size: 'M', estimated: { min: 120, max: 150 } },
    { name: 'Camiseta Básica Preta', cost: 45.00, size: 'P', estimated: { min: 120, max: 150 } },
    { name: 'Camisa Polo Listrada', cost: 78.50, size: 'G', estimated: { min: 200, max: 260 } },
    { name: 'Camisa Social Slim', cost: 95.00, size: 'M', estimated: { min: 240, max: 300 } },
    { name: 'Bermuda Sarja Bege', cost: 62.00, size: 'M', estimated: { min: 160, max: 200 } },
    { name: 'Bermuda Tactel Marinho', cost: 38.00, size: 'G', estimated: { min: 100, max: 140 } },
    { name: 'Calça Jeans Skinny', cost: 110.00, size: 'M', estimated: { min: 280, max: 350 } },
    { name: 'Calça Chino Verde', cost: 98.00, size: 'G', estimated: { min: 250, max: 320 } },
    { name: 'Moletom Canguru Cinza', cost: 130.00, size: 'M', estimated: { min: 320, max: 400 } },
    { name: 'Jaqueta Corta-Vento', cost: 175.00, size: 'G', estimated: { min: 420, max: 520 } },
    { name: 'Tênis Casual Branco', cost: 220.00, size: '42', estimated: { min: 550, max: 680 } },
    { name: 'Tênis Esportivo Preto', cost: 260.00, size: '41', estimated: { min: 620, max: 780 } },
    { name: 'Boné Trucker', cost: 28.00, size: 'U', estimated: { min: 75, max: 95 } },
    { name: 'Mochila Urbana 20L', cost: 145.00, size: '-', estimated: { min: 360, max: 450 } },
    { name: 'Carteira Couro Slim', cost: 55.00, size: '-', estimated: { min: 140, max: 180 } }
];

export function createInitialState() {
    return {
        inventory: DEFAULT_INVENTORY.map((i, idx) => ({ id: 'i' + idx, ...i })),
        sales: [],
        clients: []
    };
}

export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const s = JSON.parse(raw);
            if (!s.clients) s.clients = []; // migration
            return s;
        }
    } catch (e) {
        console.warn('State load failed', e);
    }
    return createInitialState();
}

export function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
    localStorage.removeItem(STORAGE_KEY);
}
