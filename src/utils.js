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

export function filterByPeriod(sales, days) {
    if (!days) return sales;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return sales.filter(s => s.date >= cutoffStr);
}

export function parseCsv(text) {
    const errors = [];
    const sales = [];
    const lines = String(text || '')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .filter(l => l.trim().length);
    if (lines.length < 2) return { sales, errors: ['CSV vazio ou sem linhas de dados'] };

    const parseLine = (line) => {
        // Minimal CSV: handles quoted fields with ;
        const out = [];
        let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
                else inQ = !inQ;
            } else if (c === ';' && !inQ) {
                out.push(cur); cur = '';
            } else cur += c;
        }
        out.push(cur);
        return out.map(s => s.trim());
    };

    const parseNum = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));

    const header = parseLine(lines[0]).map(h => h.toLowerCase());
    const idx = {
        name: header.findIndex(h => h.startsWith('produto')),
        size: header.findIndex(h => h.startsWith('tamanho')),
        date: header.findIndex(h => h.startsWith('data')),
        cost: header.findIndex(h => h.startsWith('custo')),
        price: header.findIndex(h => h.startsWith('venda')),
    };
    if (idx.name === -1 || idx.date === -1 || idx.price === -1) {
        return { sales, errors: ['Cabeçalho inválido. Esperado: Produto;Tamanho;Data;Custo;Venda;...'] };
    }

    for (let i = 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        const name = cols[idx.name];
        const date = cols[idx.date];
        const price = parseNum(cols[idx.price]);
        const cost = idx.cost >= 0 ? parseNum(cols[idx.cost]) : 0;
        if (!name || !date || isNaN(price)) {
            errors.push(`Linha ${i + 1}: dados inválidos`);
            continue;
        }
        sales.push({
            name,
            size: idx.size >= 0 ? (cols[idx.size] || '-') : '-',
            date,
            cost: isNaN(cost) ? 0 : cost,
            price,
            status: 'completed'
        });
    }
    return { sales, errors };
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
