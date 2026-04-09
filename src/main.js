// Bootstrap: wires state, UI and events.

import { loadState, saveState, clearState, createInitialState } from './state.js';
import { today, buildCsv, formatCurrency, formatEstimate, estimateAvg } from './utils.js';
import { renderChart } from './chart.js';
import {
    $, toast, confirmModal,
    renderSummary, renderInventory, renderSales, renderClients,
    populateProductSelect, populateClientSelect
} from './ui.js';
import { requireAuth, logout, isAdmin } from './auth.js';

const user = requireAuth();
if (!user) throw new Error('redirecting to login');

let state = loadState();
let inventorySearch = '';
let editingSaleId = null;
let chartMode = 'linear';
let clientFilter = '';

const BRAND_KEY = 'dashvendas:brand';
const VIEW_TITLES = {
    dashboard: 'Dashboard',
    vendas: 'Vendas',
    estoque: 'Estoque',
    clientes: 'Clientes',
    config: 'Configurações'
};

function loadBrand() {
    return localStorage.getItem(BRAND_KEY) || 'Sua Empresa';
}
function saveBrand(name) {
    localStorage.setItem(BRAND_KEY, name);
}
function applyBrand(name) {
    const safe = (name || 'Sua Empresa').trim() || 'Sua Empresa';
    $('#brand-name').textContent = safe;
    document.title = `${safe} — Dashboard`;
}

const VALID_VIEWS = Object.keys(VIEW_TITLES);

function switchView(view, { updateHash = true } = {}) {
    if (!VALID_VIEWS.includes(view)) view = 'dashboard';
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.dataset.view === view);
    });
    document.querySelectorAll('.sidebar nav li').forEach(li => {
        const a = li.querySelector('a');
        const isActive = a?.dataset.view === view;
        li.classList.toggle('active', isActive);
        if (isActive) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });
    $('#page-title').textContent = VIEW_TITLES[view] || 'Dashboard';
    if (updateHash && location.hash !== '#' + view) {
        history.pushState(null, '', '#' + view);
    }
    if (view === 'dashboard') {
        setTimeout(() => renderChart($('#performance-chart'), state.sales, chartMode), 50);
    }
}

function viewFromHash() {
    return (location.hash || '#dashboard').slice(1);
}

function renderAll() {
    renderSummary(state);
    renderInventory(state, inventorySearch);
    renderSales(state);
    renderClientsFiltered();
    renderChart($('#performance-chart'), state.sales, chartMode);
    applyRoleRestrictions();
}

function renderClientsFiltered() {
    const filtered = clientFilter
        ? { ...state, clients: state.clients.filter(c => c.status === clientFilter) }
        : state;
    renderClients(filtered);
    applyRoleRestrictions();
}

function applyRoleRestrictions() {
    if (isAdmin()) return;
    document.querySelectorAll('#items-table .row-actions').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.client-card [data-admin-only]').forEach(el => el.style.display = 'none');
}

// ---- Clients CRUD ----
function openClientModal() {
    if (!guardAdmin()) return;
    $('#client-name-input').value = '';
    $('#client-email-input').value = '';
    $('#client-phone-input').value = '';
    $('#client-status-input').value = 'medio';
    $('#client-notes-input').value = '';
    $('#client-modal').classList.add('open');
    setTimeout(() => $('#client-name-input').focus(), 80);
}

function closeClientModal() {
    $('#client-modal').classList.remove('open');
}

function confirmClient() {
    if (!guardAdmin()) return;
    const name = $('#client-name-input').value.trim();
    if (!name) return toast('Informe o nome do cliente', 'ph-warning', 'error');
    state.clients.unshift({
        id: 'c' + Date.now(),
        name,
        email: $('#client-email-input').value.trim(),
        phone: $('#client-phone-input').value.trim(),
        status: $('#client-status-input').value,
        notes: $('#client-notes-input').value.trim(),
        createdAt: Date.now()
    });
    saveState(state);
    renderClientsFiltered();
    closeClientModal();
    toast('Cliente cadastrado');
}

async function deleteClient(id) {
    if (!guardAdmin()) return;
    const ok = await confirmModal({
        title: 'Excluir cliente',
        message: 'Tem certeza que deseja excluir este cliente?',
        confirmText: 'Excluir',
        danger: true
    });
    if (!ok) return;
    state.clients = state.clients.filter(c => c.id !== id);
    saveState(state);
    renderClientsFiltered();
    toast('Cliente excluído', 'ph-trash');
}

function guardAdmin(action) {
    if (!isAdmin()) {
        toast('Apenas administradores podem realizar esta ação', 'ph-lock', 'error');
        return false;
    }
    return true;
}

// ---- Sales modal ----
function openSaleModal() {
    if (!guardAdmin()) return;
    editingSaleId = null;
    $('#modal-title').textContent = 'Registrar Nova Venda';
    $('#sale-confirm-btn').textContent = 'Confirmar Venda';
    populateProductSelect(state);
    populateClientSelect(state);
    const select = $('#sale-product-select');
    select.disabled = false;
    select.value = '';
    $('#sale-client-select').value = '';
    $('#sale-price-input').value = '';
    $('#sale-date-input').value = today();
    $('#sale-hint').textContent = 'Selecione um produto para ver custo e estimativa.';
    $('#sale-modal').classList.add('open');
    setTimeout(() => select.focus(), 80);
}

function closeSaleModal() {
    $('#sale-modal').classList.remove('open');
    editingSaleId = null;
}

function updateSaleForm() {
    const id = $('#sale-product-select').value;
    const item = state.inventory.find(i => i.id === id);
    const input = $('#sale-price-input');
    const hint = $('#sale-hint');
    if (item) {
        input.value = estimateAvg(item.estimated).toFixed(2);
        hint.innerHTML = `Custo: <strong>${formatCurrency(item.cost)}</strong> · Estimativa: <strong>${formatEstimate(item.estimated)}</strong>`;
    } else {
        input.value = '';
        hint.textContent = 'Selecione um produto para ver custo e estimativa.';
    }
}

function confirmSale() {
    const select = $('#sale-product-select');
    const priceInput = $('#sale-price-input');
    const dateInput = $('#sale-date-input');
    const salePrice = parseFloat(priceInput.value);
    const saleDate = dateInput.value || today();

    if (editingSaleId) {
        const sale = state.sales.find(s => s.id === editingSaleId);
        if (!sale) return;
        if (isNaN(salePrice)) return toast('Valor inválido', 'ph-warning', 'error');
        sale.price = salePrice;
        sale.date = saleDate;
        saveState(state);
        renderAll();
        closeSaleModal();
        toast('Venda atualizada');
        return;
    }

    const id = select.value;
    if (!id || isNaN(salePrice)) return toast('Preencha produto e valor', 'ph-warning', 'error');

    const idx = state.inventory.findIndex(i => i.id === id);
    if (idx === -1) return;
    const item = state.inventory[idx];

    state.sales.unshift({
        id: 's' + Date.now(),
        productId: item.id,
        name: item.name,
        size: item.size,
        cost: item.cost,
        estimated: item.estimated,
        price: salePrice,
        date: saleDate,
        clientId: $('#sale-client-select').value || null,
        status: 'completed'
    });
    state.inventory.splice(idx, 1);
    saveState(state);
    renderAll();
    closeSaleModal();
    toast(`Venda registrada: ${formatCurrency(salePrice)}`);
}

function editSale(id) {
    if (!guardAdmin()) return;
    const sale = state.sales.find(s => s.id === id);
    if (!sale) return;
    editingSaleId = id;
    $('#modal-title').textContent = 'Editar Venda';
    $('#sale-confirm-btn').textContent = 'Salvar alterações';
    const select = $('#sale-product-select');
    select.innerHTML = `<option value="${sale.productId}">${sale.name} (${sale.size})</option>`;
    select.disabled = true;
    $('#sale-price-input').value = sale.price;
    $('#sale-date-input').value = sale.date;
    $('#sale-hint').innerHTML = `Custo: <strong>${formatCurrency(sale.cost)}</strong>`;
    $('#sale-modal').classList.add('open');
    setTimeout(() => $('#sale-price-input').focus(), 80);
}

async function deleteSale(id) {
    if (!guardAdmin()) return;
    const ok = await confirmModal({
        title: 'Excluir venda',
        message: 'O item voltará para o estoque. Deseja continuar?',
        confirmText: 'Excluir',
        danger: true
    });
    if (!ok) return;
    const idx = state.sales.findIndex(s => s.id === id);
    if (idx === -1) return;
    const sale = state.sales[idx];
    state.inventory.push({
        id: sale.productId || ('i' + Date.now()),
        name: sale.name,
        size: sale.size,
        cost: sale.cost,
        estimated: sale.estimated || { min: 0, max: 0 }
    });
    state.sales.splice(idx, 1);
    saveState(state);
    renderAll();
    toast('Venda excluída', 'ph-trash');
}

async function resetData() {
    if (!guardAdmin()) return;
    const ok = await confirmModal({
        title: 'Restaurar dados',
        message: 'Todas as vendas registradas serão perdidas. Continuar?',
        confirmText: 'Restaurar',
        danger: true
    });
    if (!ok) return;
    clearState();
    state = createInitialState();
    saveState(state);
    renderAll();
    toast('Dados restaurados', 'ph-arrow-counter-clockwise');
}

function exportSalesCSV() {
    if (!state.sales.length) return toast('Nada para exportar', 'ph-warning', 'error');
    const csv = buildCsv(state.sales);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exportado');
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    $('#today-date').textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Auth UI
    document.body.classList.toggle('role-mod', !isAdmin());
    $('#user-name').textContent = user.name;
    const roleBadge = $('#user-role');
    roleBadge.textContent = isAdmin() ? 'Admin' : 'Mod';
    roleBadge.classList.add(isAdmin() ? 'admin' : 'mod');
    $('#logout-btn').addEventListener('click', () => {
        logout();
        window.location.href = 'login.html';
    });

    // Brand
    const brand = loadBrand();
    applyBrand(brand);
    const brandInput = $('#brand-input');
    if (brandInput) {
        brandInput.value = brand;
        brandInput.addEventListener('input', (e) => {
            const val = e.target.value;
            saveBrand(val);
            applyBrand(val);
        });
    }

    // Sidebar navigation
    document.querySelectorAll('.sidebar nav a[data-view]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(a.dataset.view);
        });
    });
    window.addEventListener('hashchange', () => switchView(viewFromHash(), { updateHash: false }));
    switchView(viewFromHash(), { updateHash: false });

    // Search
    $('#inventory-search').addEventListener('input', (e) => {
        inventorySearch = e.target.value;
        renderInventory(state, inventorySearch);
    });

    // Chart toggle
    $('#chart-toggle').addEventListener('click', () => {
        chartMode = chartMode === 'linear' ? 'log' : 'linear';
        $('#chart-toggle-label').textContent = chartMode === 'log' ? 'Log' : 'Linear';
        renderChart($('#performance-chart'), state.sales, chartMode);
    });

    // Header buttons
    $('#new-sale-btn')?.addEventListener('click', openSaleModal);
    $('#export-csv-btn').addEventListener('click', exportSalesCSV);
    $('#reset-btn')?.addEventListener('click', resetData);

    // Sales modal
    $('#sale-product-select').addEventListener('change', updateSaleForm);
    $('#sale-confirm-btn').addEventListener('click', confirmSale);
    $('#sale-cancel-btn').addEventListener('click', closeSaleModal);
    $('#sale-close-btn').addEventListener('click', closeSaleModal);
    $('#sale-modal').addEventListener('click', (e) => {
        if (e.target.id === 'sale-modal') closeSaleModal();
    });

    // Clients
    $('#new-client-btn')?.addEventListener('click', openClientModal);
    $('#client-confirm-btn').addEventListener('click', confirmClient);
    $('#client-cancel-btn').addEventListener('click', closeClientModal);
    $('#client-close-btn').addEventListener('click', closeClientModal);
    $('#client-modal').addEventListener('click', (e) => {
        if (e.target.id === 'client-modal') closeClientModal();
    });
    $('#client-filter').addEventListener('change', (e) => {
        clientFilter = e.target.value;
        renderClientsFiltered();
    });
    $('#clients-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action="delete-client"]');
        if (!btn) return;
        const id = btn.closest('.client-card')?.dataset.clientId;
        if (id) deleteClient(id);
    });

    // Sales table — event delegation for edit/delete
    $('#items-table tbody').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.closest('tr')?.dataset.saleId;
        if (!id) return;
        if (btn.dataset.action === 'edit') editSale(id);
        else if (btn.dataset.action === 'delete') deleteSale(id);
    });

    // Esc closes sales modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && $('#sale-modal').classList.contains('open')) {
            closeSaleModal();
        }
    });

    renderAll();
    console.log('%cDashVendas ready', 'color:#C5A059;font-weight:bold');
});
