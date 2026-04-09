// Chart.js wrapper. Chart is loaded globally via CDN.

import { formatCurrency } from './utils.js';

let chart = null;

export function renderChart(canvas, sales, mode = 'linear') {
    if (!canvas || typeof Chart === 'undefined') return;

    const sorted = [...sales].sort((a, b) => a.date.localeCompare(b.date));
    const labels = [];
    const revenueData = [];
    const profitData = [];
    let accRev = 0, accProf = 0;

    if (sorted.length) {
        sorted.forEach(s => {
            accRev += s.price;
            accProf += (s.price - s.cost);
            labels.push(new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
            revenueData.push(accRev);
            profitData.push(accProf);
        });
    } else {
        labels.push('—');
        revenueData.push(0);
        profitData.push(0);
    }

    const gold = '#C5A059';
    const goldSoft = 'rgba(197,160,89,0.15)';
    const muted = '#8A8A92';

    if (chart) chart.destroy();
    chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Receita',
                    data: revenueData,
                    borderColor: gold,
                    backgroundColor: goldSoft,
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: gold,
                    pointHoverBorderColor: '#fff'
                },
                {
                    label: 'Lucro',
                    data: profitData,
                    borderColor: '#4ADE80',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: muted,
                        font: { family: 'Inter', size: 11 },
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 16
                    }
                },
                tooltip: {
                    backgroundColor: '#17171A',
                    borderColor: '#27272B',
                    borderWidth: 1,
                    titleColor: '#F5F5F3',
                    bodyColor: '#8A8A92',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: muted, font: { family: 'JetBrains Mono', size: 10 } }
                },
                y: {
                    type: mode === 'log' ? 'logarithmic' : 'linear',
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: {
                        color: muted,
                        font: { family: 'JetBrains Mono', size: 10 },
                        callback: (v) => 'R$ ' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v)
                    }
                }
            }
        }
    });
}
