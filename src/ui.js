// DOM rendering + small UI helpers (toast, confirm modal).

import {
    formatCurrency, formatEstimate, estimateAvg, computeMargin,
    computeSummary, escapeHtml
} from './utils.js';

export const $ = (s, root = document) => root.querySelector(s);

// ---- Toast ----
let toastTimer;
export function toast(msg, icon = 'ph-check-circle', variant = '') {
    const el = $('#toast');
    $('#toast-msg').textContent = msg;
    el.querySelector('i').className = 'ph ' + icon;
    el.classList.toggle('error', variant === 'error');
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ---- Confirm modal (replaces window.confirm) ----
export function confirmModal({ title = 'Confirmar', message = '', confirmText = 'Confirmar', danger = false } = {}) {
    return new Promise((resolve) => {
        const overlay = $('#confirm-modal');
        $('#confirm-title').textContent = title;
        $('#confirm-message').textContent = message;
        const okBtn = $('#confirm-ok');
        const cancelBtn = $('#confirm-cancel');
        okBtn.textContent = confirmText;
        okBtn.classList.toggle('btn-danger', danger);

        const close = (result) => {
            overlay.classList.remove('open');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onKey);
            resolve(result);
        };
        const onOk = () => close(true);
        const onCancel = () => close(false);
        const onBackdrop = (e) => { if (e.target === overlay) close(false); };
        const onKey = (e) => {
            if (e.key === 'Escape') close(false);
            if (e.key === 'Enter') close(true);
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onKey);

        overlay.classList.add('open');
        setTimeout(() => okBtn.focus(), 50);
    });
}

// ---- Summary cards ----
export function renderSummary(state) {
    const s = computeSummary(state.sales);
    const cards = [
        { label: 'Lucro Total', value: formatCurrency(s.profit), icon: 'ph-currency-circle-dollar', delta: `Margem <span class="up">${s.margin.toFixed(1)}%</span>` },
        { label: 'Receita', value: formatCurrency(s.revenue), icon: 'ph-trend-up', delta: `${s.count} transações` },
        { label: 'Vendas', value: s.count, icon: 'ph-shopping-bag', delta: `${state.inventory.length} em estoque` },
        { label: 'Ticket Médio', value: formatCurrency(s.avgTicket), icon: 'ph-receipt', delta: 'por venda' }
    ];
    $('#summary-cards').innerHTML = cards.map(c => `
        <div class="card summary-card">
            <div class="summary-head">
                <span class="summary-label">${escapeHtml(c.label)}</span>
                <div class="summary-icon"><i class="ph ${c.icon}"></i></div>
            </div>
            <div class="summary-value">${c.value}</div>
            <div class="summary-delta">${c.delta}</div>
        </div>
    `).join('');
}

// ---- Inventory ----
export function renderInventory(state, search = '') {
    const tbody = $('#inventory-table tbody');
    const term = search.toLowerCase().trim();
    const filtered = term
        ? state.inventory.filter(i => i.name.toLowerCase().includes(term) || i.size.toLowerCase().includes(term))
        : state.inventory;

    $('#inventory-count').textContent = `${filtered.length} / ${state.inventory.length} itens`;

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="ph ph-package"></i>Nenhum item encontrado</div></td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const avg = estimateAvg(item.estimated);
        const margin = computeMargin(item.cost, avg);
        return `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="product-thumb"><i class="ph ph-tag"></i></div>
                        <span>${escapeHtml(item.name)}</span>
                    </div>
                </td>
                <td><span class="size-chip">${escapeHtml(item.size)}</span></td>
                <td class="mono">${formatCurrency(item.cost)}</td>
                <td class="mono">${formatEstimate(item.estimated)}</td>
                <td class="mono num">${margin >= 0 ? '+' : ''}${margin.toFixed(0)}%</td>
                <td><span class="status-badge status-instock">Em Estoque</span></td>
            </tr>
        `;
    }).join('');
}

// ---- Sales table ----
export function renderSales(state) {
    const tbody = $('#items-table tbody');
    $('#sales-count').textContent = `${state.sales.length} registro${state.sales.length === 1 ? '' : 's'}`;

    if (!state.sales.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="ph ph-shopping-bag"></i>Nenhuma venda registrada ainda</div></td></tr>`;
        return;
    }

    const clientById = new Map(state.clients.map(c => [c.id, c]));

    tbody.innerHTML = state.sales.map(sale => {
        const profit = sale.price - sale.cost;
        const profitColor = profit >= 0 ? '#4ADE80' : '#F87171';
        const client = sale.clientId ? clientById.get(sale.clientId) : null;
        return `
            <tr data-sale-id="${escapeHtml(sale.id)}">
                <td>
                    <div class="product-cell">
                        <div class="product-thumb"><i class="ph ph-package"></i></div>
                        <div>
                            <div>${escapeHtml(sale.name)}</div>
                            ${client ? `<div class="cell-sub"><i class="ph ph-user"></i> ${escapeHtml(client.name)}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="mono">${new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                <td class="mono">${formatCurrency(sale.cost)}</td>
                <td class="mono num">${formatCurrency(sale.price)}</td>
                <td class="mono"><span style="color:${profitColor}">${formatCurrency(profit)}</span></td>
                <td><span class="status-badge status-completed">Concluído</span></td>
                <td>
                    <div class="row-actions">
                        <button class="btn-icon" data-action="edit" aria-label="Editar venda"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn-icon danger" data-action="delete" aria-label="Excluir venda"><i class="ph ph-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ---- Clients ----
const LEAD_LABELS = {
    forte: { label: 'Lead Forte', cls: 'lead-strong', icon: 'ph-fire' },
    medio: { label: 'Lead Médio', cls: 'lead-medium', icon: 'ph-thermometer' },
    fraco: { label: 'Lead Fraco', cls: 'lead-weak', icon: 'ph-snowflake' },
    cliente: { label: 'Cliente', cls: 'lead-client', icon: 'ph-check-circle' }
};

export function leadInfo(status) {
    return LEAD_LABELS[status] || LEAD_LABELS.medio;
}

export function renderClients(state) {
    const grid = $('#clients-grid');
    const count = $('#clients-count');
    if (!grid) return;

    count.textContent = `${state.clients.length} ${state.clients.length === 1 ? 'cliente' : 'clientes'}`;

    if (!state.clients.length) {
        grid.innerHTML = `
            <div class="placeholder" style="grid-column:1/-1;">
                <i class="ph ph-users" aria-hidden="true"></i>
                <h3>Nenhum cliente cadastrado</h3>
                <p>Clique em "Novo Cliente" para começar a registrar seus contatos e classificá-los como leads.</p>
            </div>`;
        return;
    }

    grid.innerHTML = state.clients.map(c => {
        const info = leadInfo(c.status);
        return `
            <div class="client-card" data-client-id="${escapeHtml(c.id)}">
                <div class="client-head">
                    <div class="client-avatar">${escapeHtml((c.name || '?').charAt(0).toUpperCase())}</div>
                    <div class="client-info">
                        <div class="client-name">${escapeHtml(c.name)}</div>
                        ${c.email ? `<div class="client-meta"><i class="ph ph-envelope-simple"></i> ${escapeHtml(c.email)}</div>` : ''}
                        ${c.phone ? `<div class="client-meta"><i class="ph ph-phone"></i> ${escapeHtml(c.phone)}</div>` : ''}
                    </div>
                    <button class="btn-icon danger" data-action="delete-client" aria-label="Excluir cliente" data-admin-only><i class="ph ph-trash"></i></button>
                </div>
                <div class="client-foot">
                    <span class="lead-badge ${info.cls}"><i class="ph ${info.icon}"></i> ${info.label}</span>
                    ${c.notes ? `<div class="client-notes">${escapeHtml(c.notes)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

export function populateProductSelect(state) {
    const select = $('#sale-product-select');
    select.innerHTML = '<option value="">Selecione um item…</option>'
        + state.inventory.map(item =>
            `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (${escapeHtml(item.size)}) — ${formatCurrency(item.cost)}</option>`
        ).join('');
}

export function populateClientSelect(state) {
    const select = $('#sale-client-select');
    if (!select) return;
    select.innerHTML = '<option value="">Sem cliente vinculado</option>'
        + state.clients.map(c => {
            const info = leadInfo(c.status);
            return `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} — ${info.label}</option>`;
        }).join('');
}
