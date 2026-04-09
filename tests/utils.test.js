import { describe, it, expect } from 'vitest';
import {
    formatCurrency, formatEstimate, estimateAvg,
    computeMargin, computeSummary, escapeHtml, buildCsv
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
