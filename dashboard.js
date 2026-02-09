// ============================================
// ATUALIZAÇÃO DO DASHBOARD
// ============================================

/**
 * Atualizar todos os dados do dashboard
 */
function atualizarDashboard() {
    const usuario = buscarUsuarioAtual();
    const salario = usuario.salario || 0;
    
    // Calcular total de gastos
    const totalGastos = usuario.gastos.reduce((total, gasto) => total + gasto.valor, 0);
    
    // Calcular saldo
    const saldo = salario - totalGastos;

    // Atualizar cards de estatísticas
    atualizarEstatisticas(salario, totalGastos, saldo);
    
    // Atualizar lista de gastos
    atualizarListaGastos();
    
    // Atualizar recomendações
    atualizarRecomendacoes(salario, totalGastos, saldo);
    
    // Atualizar gráficos
    atualizarGraficos();
    
    console.log('📊 Dashboard atualizado');
}

/**
 * Atualizar cards de estatísticas
 */
function atualizarEstatisticas(salario, totalGastos, saldo) {
    // Atualizar valores
    document.getElementById('valorSalario').textContent = formatarDinheiro(salario);
    document.getElementById('valorGastos').textContent = formatarDinheiro(totalGastos);
    document.getElementById('valorSaldo').textContent = formatarDinheiro(saldo);
    document.getElementById('valorInvestimento').textContent = formatarDinheiro(salario * 0.25);

    // Calcular percentuais
    const percentualGastos = salario > 0 ? ((totalGastos / salario) * 100).toFixed(1) : 0;
    const percentualSaldo = salario > 0 ? ((saldo / salario) * 100).toFixed(1) : 0;

    document.getElementById('percentualGastos').textContent = `${percentualGastos}% do salário`;
    document.getElementById('percentualSaldo').textContent = `${percentualSaldo}% restante`;

    // Aplicar cores
    document.getElementById('valorSalario').className = 'verde';
    document.getElementById('valorGastos').className = 'vermelho';
    document.getElementById('valorSaldo').className = saldo >= 0 ? 'verde' : 'vermelho';
    document.getElementById('valorInvestimento').className = 'azul';
}

// ============================================
// RECOMENDAÇÕES INTELIGENTES
// ============================================

/**
 * Gerar e exibir recomendações personalizadas
 */
function atualizarRecomendacoes(salario, totalGastos, saldo) {
    const recomendacoes = [];

    // Se não tem salário cadastrado
    if (salario === 0) {
        recomendacoes.push({
            titulo: '⚙️ Configure seu salário',
            texto: 'Adicione seu salário mensal para receber recomendações personalizadas de investimento e controle financeiro.'
        });
    } else {
        // Calcular proporção de gastos
        const proporcao = totalGastos / salario;

        // Recomendação: Gastos muito altos
        if (proporcao > 0.8) {
            recomendacoes.push({
                titulo: '⚠️ Atenção: Gastos Elevados',
                texto: `Você está gastando ${(proporcao * 100).toFixed(1)}% do seu salário. Tente reduzir gastos não essenciais para ter mais segurança financeira.`
            });
        } 
        // Recomendação: Gastos controlados
        else if (proporcao < 0.5) {
            recomendacoes.push({
                titulo: '✅ Excelente Controle!',
                texto: `Parabéns! Você está gastando apenas ${(proporcao * 100).toFixed(1)}% do seu salário. Continue assim!`
            });
        }

        // Recomendação: Boa economia
        if (saldo > salario * 0.3) {
            recomendacoes.push({
                titulo: '💰 Economia Exemplar',
                texto: `Você economizou ${((saldo/salario)*100).toFixed(1)}% do seu salário este mês. Ótimo trabalho!`
            });
        }

        // Regra 50-30-20
        recomendacoes.push({
            titulo: '📊 Regra 50-30-20',
            texto: 'Distribua sua renda: 50% para necessidades, 30% para desejos e 20% para investimentos e poupança.'
        });

        // Recomendação de investimento
        const valorInvestimento = salario * 0.2;
        if (saldo >= valorInvestimento) {
            recomendacoes.push({
                titulo: '📈 Oportunidade de Investimento',
                texto: `Você pode investir ${formatarDinheiro(valorInvestimento)} (20% do salário) este mês. Considere aplicações de longo prazo.`
            });
        } else if (saldo > 0) {
            recomendacoes.push({
                titulo: '💡 Dica de Economia',
                texto: `Tente economizar pelo menos 20% do seu salário (${formatarDinheiro(valorInvestimento)}) para construir um patrimônio.`
            });
        }

        // Análise por categoria
        const usuario = buscarUsuarioAtual();
        const gastosPorCategoria = {};
        
        usuario.gastos.forEach(gasto => {
            gastosPorCategoria[gasto.categoria] = (gastosPorCategoria[gasto.categoria] || 0) + gasto.valor;
        });

        // Encontrar categoria com mais gastos
        const categoriasMaiores = Object.entries(gastosPorCategoria)
            .sort((a, b) => b[1] - a[1]);

        if (categoriasMaiores.length > 0 && categoriasMaiores[0][1] > salario * 0.25) {
            recomendacoes.push({
                titulo: `📌 Destaque: ${categoriasMaiores[0][0]}`,
                texto: `Seus gastos com ${categoriasMaiores[0][0]} representam ${((categoriasMaiores[0][1]/salario)*100).toFixed(1)}% do salário. Avalie se há espaço para economizar nesta categoria.`
            });
        }
    }

    // Exibir recomendações
    const containerRec = document.getElementById('recomendacoes');
    containerRec.innerHTML = recomendacoes.map(rec => `
        <div class="itemRecomendacao">
            <div class="tituloRecomendacao">${rec.titulo}</div>
            <div class="textoRecomendacao">${rec.texto}</div>
        </div>
    `).join('');
}