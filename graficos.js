// ============================================
// FUNÇÕES DE GRÁFICOS (CHART.JS)
// ============================================

/**
 * Criar os gráficos iniciais
 */
function criarGraficos() {
    criarGraficoGastos();
    criarGraficoDistribuicao();
}

/**
 * Criar gráfico de gastos por categoria (Pizza)
 */
function criarGraficoGastos() {
    const canvas = document.getElementById('graficoGastos');
    const ctx = canvas.getContext('2d');

    // Destruir gráfico anterior se existir
    if (graficoGastos) {
        graficoGastos.destroy();
    }

    // Criar novo gráfico
    graficoGastos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sem dados'],
            datasets: [{
                data: [1],
                backgroundColor: ['#334155'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f1f5f9',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const valor = formatarDinheiro(context.parsed);
                            return `${label}: ${valor}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Criar gráfico de distribuição ideal vs atual (Barras)
 */
function criarGraficoDistribuicao() {
    const canvas = document.getElementById('graficoDistribuicao');
    const ctx = canvas.getContext('2d');

    // Destruir gráfico anterior se existir
    if (graficoDistribuicao) {
        graficoDistribuicao.destroy();
    }

    // Criar novo gráfico
    graficoDistribuicao = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Necessidades', 'Desejos', 'Investimentos'],
            datasets: [
                {
                    label: 'Ideal (%)',
                    data: [50, 30, 20],
                    backgroundColor: '#10b981',
                    borderRadius: 5
                },
                {
                    label: 'Atual (%)',
                    data: [0, 0, 0],
                    backgroundColor: '#6366f1',
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#f1f5f9',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: '#334155'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: '#334155'
                    }
                }
            }
        }
    });
}

/**
 * Atualizar dados dos gráficos
 */
function atualizarGraficos() {
    const usuario = buscarUsuarioAtual();
    
    // Atualizar gráfico de gastos
    atualizarGraficoGastos(usuario);
    
    // Atualizar gráfico de distribuição
    atualizarGraficoDistribuicao(usuario);
}

/**
 * Atualizar gráfico de gastos por categoria
 */
function atualizarGraficoGastos(usuario) {
    // Calcular total por categoria
    const gastosPorCategoria = {};
    
    usuario.gastos.forEach(gasto => {
        gastosPorCategoria[gasto.categoria] = (gastosPorCategoria[gasto.categoria] || 0) + gasto.valor;
    });

    // Se tem dados
    if (Object.keys(gastosPorCategoria).length > 0) {
        graficoGastos.data.labels = Object.keys(gastosPorCategoria);
        graficoGastos.data.datasets[0].data = Object.values(gastosPorCategoria);
        graficoGastos.data.datasets[0].backgroundColor = [
            '#6366f1',  // Roxo
            '#10b981',  // Verde
            '#f59e0b',  // Laranja
            '#ef4444',  // Vermelho
            '#8b5cf6',  // Roxo claro
            '#ec4899',  // Rosa
            '#14b8a6'   // Turquesa
        ];
    } else {
        // Sem dados
        graficoGastos.data.labels = ['Sem dados'];
        graficoGastos.data.datasets[0].data = [1];
        graficoGastos.data.datasets[0].backgroundColor = ['#334155'];
    }

    graficoGastos.update();
}

/**
 * Atualizar gráfico de distribuição
 */
function atualizarGraficoDistribuicao(usuario) {
    const salario = usuario.salario || 0;
    const totalGastos = usuario.gastos.reduce((total, gasto) => total + gasto.valor, 0);

    if (salario > 0 && totalGastos > 0) {
        const percentualGastos = (totalGastos / salario) * 100;
        const percentualEconomia = ((salario - totalGastos) / salario) * 100;

        // Estimativa de distribuição atual
        // 60% dos gastos são necessidades, 40% são desejos
        const necessidadesAtual = Math.min(percentualGastos * 0.6, 100);
        const desejosAtual = Math.min(percentualGastos * 0.4, 100);
        const investimentosAtual = Math.min(percentualEconomia, 100);

        graficoDistribuicao.data.datasets[1].data = [
            necessidadesAtual,
            desejosAtual,
            investimentosAtual
        ];
    } else {
        // Sem dados
        graficoDistribuicao.data.datasets[1].data = [0, 0, 0];
    }

    graficoDistribuicao.update();
}
