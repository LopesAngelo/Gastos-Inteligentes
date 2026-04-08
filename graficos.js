// ============================================
// FUNÇÕES DE GRÁFICOS (CHART.JS)
// ============================================

let graficoTendencia = null;

function criarGraficos() {
    criarGraficoGastos();
    criarGraficoDistribuicao();
    criarGraficoEvolucao();
    criarGraficoTendencia();
}

function criarGraficoGastos() {
    const ctx = document.getElementById('graficoGastos').getContext('2d');
    if (graficoGastos) graficoGastos.destroy();

    graficoGastos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sem dados'],
            datasets: [{ data: [1], backgroundColor: ['#334155'], borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#f1f5f9', padding: 15, font: { size: 12 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${formatarDinheiro(ctx.parsed)}`
                    }
                }
            }
        }
    });
}

function criarGraficoDistribuicao() {
    const ctx = document.getElementById('graficoDistribuicao').getContext('2d');
    if (graficoDistribuicao) graficoDistribuicao.destroy();

    // Rótulos corretos com os percentuais da regra
    graficoDistribuicao = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['🏠 Necessidades', '🎉 Desejos', '📈 Futuro'],
            datasets: [
                {
                    label: 'Meta 50-30-20 (%)',
                    data: [50, 30, 20],
                    backgroundColor: ['rgba(239,68,68,0.3)', 'rgba(245,158,11,0.3)', 'rgba(16,185,129,0.3)'],
                    borderColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 2,
                    borderRadius: 5
                },
                {
                    label: 'Atual (%)',
                    data: [0, 0, 0],
                    backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(245,158,11,0.8)', 'rgba(16,185,129,0.8)'],
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#f1f5f9', font: { size: 12 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const val = ctx.parsed.y.toFixed(1);
                            const grupo = ['necessidades', 'desejos', 'futuro'][ctx.dataIndex];
                            const meta = REGRA_503020[grupo]?.meta || 0;
                            const diff = ctx.parsed.y - meta;
                            const sinal = diff > 0 ? '+' : '';
                            return `${ctx.dataset.label}: ${val}%${ctx.datasetIndex === 1 ? ` (${sinal}${diff.toFixed(1)}% da meta)` : ''}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#94a3b8', callback: v => v + '%' },
                    grid: { color: '#334155' }
                },
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
            }
        }
    });
}

function criarGraficoEvolucao() {
    const ctx = document.getElementById('graficoEvolucao').getContext('2d');
    if (graficoEvolucao) graficoEvolucao.destroy();

    graficoEvolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Gastos (R$)', data: [], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, fill: true },
                { label: 'Economia (R$)', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#f1f5f9', font: { size: 12 } } },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatarDinheiro(ctx.parsed.y)}` } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#94a3b8', callback: v => 'R$ ' + v }, grid: { color: '#334155' } },
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
            }
        }
    });
}

// ============================================
// ATUALIZAÇÃO DOS GRÁFICOS
// ============================================

function atualizarGraficos() {
    const usuario = buscarUsuarioAtual();
    const mes = chaveMesAtual();
    const gastosMes = buscarGastosMes(mes);
    atualizarGraficoGastos(gastosMes);
    atualizarGraficoDistribuicao(usuario, gastosMes, mes);
    atualizarGraficoEvolucao(usuario);
    atualizarGraficoTendencia();
}

function atualizarGraficoGastos(gastosMes) {
    const porCat = {};
    gastosMes.forEach(g => { porCat[g.categoria] = (porCat[g.categoria] || 0) + g.valor; });

    if (Object.keys(porCat).length > 0) {
        graficoGastos.data.labels = Object.keys(porCat);
        graficoGastos.data.datasets[0].data = Object.values(porCat);
        graficoGastos.data.datasets[0].backgroundColor = [
            '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'
        ];
    } else {
        graficoGastos.data.labels = ['Sem dados'];
        graficoGastos.data.datasets[0].data = [1];
        graficoGastos.data.datasets[0].backgroundColor = ['#334155'];
    }
    graficoGastos.update();
}

/**
 * Gráfico de distribuição usando mapeamento REAL das categorias da Regra 50-30-20
 */
function atualizarGraficoDistribuicao(usuario, gastosMes, mes) {
    const salario = buscarSalarioMes(mes);
    const dist = calcular503020(gastosMes, salario);

    graficoDistribuicao.data.datasets[1].data = [
        parseFloat(dist.necessidades.toFixed(1)),
        parseFloat(dist.desejos.toFixed(1)),
        parseFloat(dist.futuro.toFixed(1))
    ];
    graficoDistribuicao.update();
}

function atualizarGraficoEvolucao(usuario) {
    // Gera últimos 6 meses
    const meses = [];
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        meses.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }

    const labels = meses.map(m => {
        const [ano, mesN] = m.split('-');
        return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(mesN)-1] + '/' + ano.slice(2);
    });

    const dadosGastos = meses.map(m => {
        const gastos = buscarGastosMes(m);
        return gastos.reduce((t, g) => t + g.valor, 0);
    });

    const dadosEconomia = meses.map((m, i) => {
        const salario = buscarSalarioMes(m);
        return Math.max(salario - dadosGastos[i], 0);
    });

    graficoEvolucao.data.labels = labels;
    graficoEvolucao.data.datasets[0].data = dadosGastos;
    graficoEvolucao.data.datasets[1].data = dadosEconomia;
    graficoEvolucao.update();
}
// ============================================
// GRÁFICO DE TENDÊNCIA POR CATEGORIA
// ============================================

const CORES_CATEGORIA = {
    'Alimentação': '#ef4444',
    'Transporte':  '#f59e0b',
    'Moradia':     '#6366f1',
    'Saúde':       '#10b981',
    'Lazer':       '#ec4899',
    'Educação':    '#14b8a6',
    'Outros':      '#8b5cf6'
};

function criarGraficoTendencia() {
    const canvas = document.getElementById('graficoTendencia');
    if (!canvas) return;

    if (graficoTendencia) graficoTendencia.destroy();

    graficoTendencia = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f1f5f9', font: { size: 11 }, padding: 12, boxWidth: 12 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${formatarDinheiro(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', callback: v => 'R$' + v.toLocaleString('pt-BR') },
                    grid: { color: '#334155' }
                },
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
            }
        }
    });

    atualizarGraficoTendencia();
}

function atualizarGraficoTendencia() {
    if (!graficoTendencia) return;

    // Últimos 6 meses
    const hoje = new Date();
    const meses = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        meses.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }

    const labels = meses.map(m => {
        const mesN = parseInt(m.split('-')[1]);
        const ano = m.split('-')[0].slice(2);
        return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][mesN-1] + '/' + ano;
    });

    // Pegar categorias selecionadas
    const checkboxes = document.querySelectorAll('.filtro-tendencia:checked');
    const categoriasSel = checkboxes.length > 0
        ? Array.from(checkboxes).map(c => c.value)
        : Object.keys(CORES_CATEGORIA);

    const datasets = categoriasSel.map(cat => {
        const cor = CORES_CATEGORIA[cat] || '#94a3b8';
        const data = meses.map(m => {
            const gastos = buscarGastosMes(m);
            return gastos.filter(g => g.categoria === cat).reduce((s, g) => s + g.valor, 0);
        });
        return {
            label: cat,
            data,
            borderColor: cor,
            backgroundColor: cor + '20',
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
        };
    });

    graficoTendencia.data.labels = labels;
    graficoTendencia.data.datasets = datasets;
    graficoTendencia.update();
}
