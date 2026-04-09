// Pure helpers — no DOM, easy to test.

export function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

export function formatEstimate(est) {
    if (!est || (!est.min && !est.max)) return '—';
    return `${formatCurrency(est.min)} – ${formatCurrency(est.max)}`;
}

export function estimateAvg(est) {
    if (!est) return 0;
    return ((est.min || 0) + (est.max || est.min || 0)) / 2;
}

export function computeMargin(cost, avg) {
    if (!cost) return 0;
    return ((avg - cost) / cost) * 100;
}

export function computeSummary(sales) {
    const revenue = sales.reduce((a, s) => a + s.price, 0);
    const cost = sales.reduce((a, s) => a + s.cost, 0);
    const profit = revenue - cost;
    const count = sales.length;
    const margin = revenue ? (profit / revenue) * 100 : 0;
    const avgTicket = count ? revenue / count : 0;
    return { revenue, cost, profit, count, margin, avgTicket };
}

export function today() {
    return new Date().toISOString().split('T')[0];
}

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

export function buildCsv(sales) {
    const headers = ['Produto', 'Tamanho', 'Data', 'Custo', 'Venda', 'Lucro', 'Status'];
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const num = (n) => n.toFixed(2).replace('.', ',');
    const rows = sales.map(s => [
        esc(s.name),
        esc(s.size),
        s.date,
        num(s.cost),
        num(s.price),
        num(s.price - s.cost),
        s.status
    ].join(';'));
    return '\uFEFF' + [headers.join(';'), ...rows].join('\n');
}
