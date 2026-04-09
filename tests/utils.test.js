import { describe, it, expect } from 'vitest';
import {
    formatCurrency, formatEstimate, estimateAvg,
    computeMargin, computeSummary, escapeHtml, buildCsv,
    parseCsv, filterByPeriod
} from '../src/utils.js';

describe('formatCurrency', () => {
    it('formats numbers as BRL', () => {
        expect(formatCurrency(1234.5)).toMatch(/R\$/);
        expect(formatCurrency(1234.5)).toContain('1.234,50');
    });
    it('handles 0 and undefined', () => {
        expect(formatCurrency(0)).toContain('0,00');
        expect(formatCurrency(undefined)).toContain('0,00');
    });
});

describe('estimateAvg', () => {
    it('averages min and max', () => {
        expect(estimateAvg({ min: 100, max: 200 })).toBe(150);
    });
    it('falls back to min when max missing', () => {
        expect(estimateAvg({ min: 100 })).toBe(100);
    });
    it('returns 0 for null', () => {
        expect(estimateAvg(null)).toBe(0);
    });
});

describe('formatEstimate', () => {
    it('renders a range', () => {
        const out = formatEstimate({ min: 100, max: 200 });
        expect(out).toContain('100');
        expect(out).toContain('200');
    });
    it('renders dash for empty', () => {
        expect(formatEstimate({ min: 0, max: 0 })).toBe('—');
        expect(formatEstimate(null)).toBe('—');
    });
});

describe('computeMargin', () => {
    it('computes percent margin', () => {
        expect(computeMargin(100, 150)).toBe(50);
    });
    it('returns 0 when cost is 0', () => {
        expect(computeMargin(0, 100)).toBe(0);
    });
});

describe('computeSummary', () => {
    const sales = [
        { price: 200, cost: 100 },
        { price: 300, cost: 150 }
    ];
    it('computes revenue, profit, count and margin', () => {
        const s = computeSummary(sales);
        expect(s.revenue).toBe(500);
        expect(s.cost).toBe(250);
        expect(s.profit).toBe(250);
        expect(s.count).toBe(2);
        expect(s.margin).toBe(50);
        expect(s.avgTicket).toBe(250);
    });
    it('handles empty array', () => {
        const s = computeSummary([]);
        expect(s.revenue).toBe(0);
        expect(s.margin).toBe(0);
        expect(s.avgTicket).toBe(0);
    });
});

describe('escapeHtml', () => {
    it('escapes dangerous characters', () => {
        expect(escapeHtml('<script>alert("x")</script>'))
            .toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    });
    it('handles null/undefined', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });
});

describe('filterByPeriod', () => {
    const mkDate = (offset) => {
        const d = new Date();
        d.setDate(d.getDate() - offset);
        return d.toISOString().split('T')[0];
    };
    const sales = [
        { date: mkDate(1) },
        { date: mkDate(10) },
        { date: mkDate(60) }
    ];
    it('returns all when days is 0', () => {
        expect(filterByPeriod(sales, 0)).toHaveLength(3);
    });
    it('filters last 7 days', () => {
        expect(filterByPeriod(sales, 7)).toHaveLength(1);
    });
    it('filters last 30 days', () => {
        expect(filterByPeriod(sales, 30)).toHaveLength(2);
    });
});

describe('parseCsv', () => {
    it('parses a valid CSV with BOM and BR numbers', () => {
        const csv = '\uFEFFProduto;Tamanho;Data;Custo;Venda;Lucro;Status\n"Item A";M;2026-01-01;50,00;120,00;70,00;completed';
        const { sales, errors } = parseCsv(csv);
        expect(errors).toHaveLength(0);
        expect(sales).toHaveLength(1);
        expect(sales[0].name).toBe('Item A');
        expect(sales[0].cost).toBe(50);
        expect(sales[0].price).toBe(120);
    });
    it('rejects invalid header', () => {
        const { errors } = parseCsv('foo;bar\nbaz;qux');
        expect(errors[0]).toContain('Cabeçalho');
    });
    it('skips invalid rows but keeps valid ones', () => {
        const csv = 'Produto;Tamanho;Data;Custo;Venda\nValido;M;2026-01-01;10;20\n;;;;';
        const { sales, errors } = parseCsv(csv);
        expect(sales).toHaveLength(1);
        expect(errors).toHaveLength(1);
    });
    it('round-trips through buildCsv', () => {
        const original = [
            { name: 'Item X', size: 'M', date: '2026-01-01', cost: 10, price: 25, status: 'completed' }
        ];
        const csv = buildCsv(original);
        const { sales } = parseCsv(csv);
        expect(sales[0].name).toBe('Item X');
        expect(sales[0].price).toBe(25);
        expect(sales[0].cost).toBe(10);
    });
});

describe('buildCsv', () => {
    it('outputs BOM, header and rows separated by ;', () => {
        const csv = buildCsv([
            { name: 'Item A', size: 'M', date: '2026-01-01', cost: 50, price: 120, status: 'completed' }
        ]);
        expect(csv.charCodeAt(0)).toBe(0xFEFF);
        expect(csv).toContain('Produto;Tamanho');
        expect(csv).toContain('"Item A"');
        expect(csv).toContain('70,00'); // profit
    });
    it('escapes quotes in product names', () => {
        const csv = buildCsv([
            { name: 'Item "premium"', size: 'M', date: '2026-01-01', cost: 1, price: 2, status: 'ok' }
        ]);
        expect(csv).toContain('"Item ""premium"""');
    });
});
