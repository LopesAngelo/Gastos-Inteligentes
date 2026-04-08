// ============================================
// HISTÓRICO MENSAL COM COMPARAÇÕES
// ============================================

// Cache simples para evitar reprocessar todos os gastos a cada chamada
let _cacheOrganizarMes = null;
let _cacheOrganizarMesLen = -1;

/**
 * Estrutura de dados por mês — com cache
 */
function organizarPorMes() {
    const usuario = buscarUsuarioAtual();
    const totalGastos = usuario?.gastos?.length ?? 0;

    // Invalida cache se o número de gastos mudou
    if (_cacheOrganizarMes && _cacheOrganizarMesLen === totalGastos) {
        return _cacheOrganizarMes;
    }

    const gastosPorMes = {};
    
    usuario.gastos.forEach(gasto => {
        const data = new Date(gasto.data);
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        
        if (!gastosPorMes[chave]) {
            gastosPorMes[chave] = {
                mes: chave,
                gastos: [],
                total: 0,
                porCategoria: {}
            };
        }
        
        gastosPorMes[chave].gastos.push(gasto);
        gastosPorMes[chave].total += gasto.valor;
        
        // Agrupar por categoria
        const cat = gasto.categoria;
        if (!gastosPorMes[chave].porCategoria[cat]) {
            gastosPorMes[chave].porCategoria[cat] = 0;
        }
        gastosPorMes[chave].porCategoria[cat] += gasto.valor;
    });
    
    _cacheOrganizarMes = gastosPorMes;
    _cacheOrganizarMesLen = totalGastos;
    return gastosPorMes;
}

/**
 * Obter lista de meses disponíveis (ordenados do mais recente)
 */
function obterMesesDisponiveis() {
    const gastosPorMes = organizarPorMes();
    return Object.keys(gastosPorMes).sort().reverse();
}

/**
 * Formatar nome do mês
 */
function formatarNomeMes(chave) {
    const [ano, mes] = chave.split('-');
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
}

/**
 * Renderizar abas de meses
 */
function renderizarAbasMeses() {
    const meses = obterMesesDisponiveis();
    const container = document.getElementById('abasMeses');
    
    if (!container) return;
    
    if (meses.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px">Nenhum dado mensal disponível ainda</p>';
        return;
    }
    
    // Criar abas
    const abasHTML = meses.map((mes, index) => `
        <button class="aba-mes ${index === 0 ? 'active' : ''}" 
                onclick="selecionarMes('${mes}')" 
                data-mes="${mes}">
            ${formatarNomeMes(mes)}
        </button>
    `).join('');
    
    container.innerHTML = `
        <div class="abas-container">
            ${abasHTML}
        </div>
        <div id="conteudoMes"></div>
    `;
    
    // Mostrar o primeiro mês
    if (meses.length > 0) {
        selecionarMes(meses[0]);
    }
}

/**
 * Selecionar e exibir dados de um mês
 */
function selecionarMes(mesSelecionado) {
    // Atualizar abas ativas
    document.querySelectorAll('.aba-mes').forEach(aba => {
        aba.classList.toggle('active', aba.dataset.mes === mesSelecionado);
    });
    
    // Renderizar conteúdo do mês
    const dadosMes = organizarPorMes()[mesSelecionado];
    const container = document.getElementById('conteudoMes');
    
    if (!container || !dadosMes) return;
    
    const usuario = buscarUsuarioAtual();
    const salario = buscarSalarioMes(mesSelecionado);   // ✅ salário correto do mês visualizado
    const saldo = salario - dadosMes.total;
    const percentualGasto = salario > 0 ? ((dadosMes.total / salario) * 100).toFixed(1) : 0;
    
    container.innerHTML = `
        <!-- Resumo do Mês -->
        <div class="resumo-mes">
            <div class="card-resumo">
                <h4>💰 Total Gasto</h4>
                <p class="valor-grande vermelho">${formatarDinheiro(dadosMes.total)}</p>
                <small>${percentualGasto}% do salário</small>
            </div>
            <div class="card-resumo">
                <h4>💵 Saldo do Mês</h4>
                <p class="valor-grande ${saldo >= 0 ? 'verde' : 'vermelho'}">${formatarDinheiro(saldo)}</p>
                <small>${saldo >= 0 ? 'Positivo' : 'Negativo'}</small>
            </div>
            <div class="card-resumo">
                <h4>📊 Nº de Gastos</h4>
                <p class="valor-grande azul">${dadosMes.gastos.length}</p>
                <small>transações</small>
            </div>
        </div>
        
        <!-- Gastos por Categoria -->
        <div class="categorias-mes">
            <h3>📊 Gastos por Categoria</h3>
            ${renderizarCategoriasMes(dadosMes.porCategoria)}
        </div>
        
        <!-- Comparação com Outros Meses -->
        <div class="comparacao-meses">
            <h3>📈 Comparação com Outros Meses</h3>
            ${gerarComparacao(mesSelecionado)}
        </div>
        
        <!-- Dicas Inteligentes -->
        <div class="dicas-mes">
            <h3>💡 Dicas de Economia e Investimento</h3>
            ${gerarDicasInteligentes(mesSelecionado, dadosMes)}
        </div>
    `;
}

/**
 * Renderizar categorias do mês
 */
function renderizarCategoriasMes(porCategoria) {
    const total = Object.values(porCategoria).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(porCategoria)
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, valor]) => {
            const percentual = ((valor / total) * 100).toFixed(1);
            return `
                <div class="item-categoria-mes">
                    <div class="info-categoria">
                        <span class="nome-categoria">${categoria}</span>
                        <span class="percentual-categoria">${percentual}%</span>
                    </div>
                    <div class="barra-progresso-categoria">
                        <div class="progresso-categoria" style="width: ${percentual}%"></div>
                    </div>
                    <div class="valor-categoria">${formatarDinheiro(valor)}</div>
                </div>
            `;
        }).join('');
}

/**
 * Gerar comparação entre meses
 */
function gerarComparacao(mesAtual) {
    const meses = obterMesesDisponiveis();
    const todosDados = organizarPorMes();
    
    if (meses.length < 2) {
        return '<p style="color:#94a3b8;text-align:center;padding:20px">Adicione gastos em mais meses para ver comparações</p>';
    }
    
    const dadosAtual = todosDados[mesAtual];
    const indexAtual = meses.indexOf(mesAtual);
    
    // Comparar com mês anterior
    let comparacaoAnterior = '';
    if (indexAtual < meses.length - 1) {
        const mesAnterior = meses[indexAtual + 1];
        const dadosAnterior = todosDados[mesAnterior];
        const diferenca = dadosAtual.total - dadosAnterior.total;
        const percentual = ((diferenca / dadosAnterior.total) * 100).toFixed(1);
        
        const emoji = diferenca > 0 ? '📈' : '📉';
        const cor = diferenca > 0 ? 'vermelho' : 'verde';
        const texto = diferenca > 0 ? 'aumentaram' : 'diminuíram';
        
        comparacaoAnterior = `
            <div class="card-comparacao">
                <h4>${emoji} Vs. ${formatarNomeMes(mesAnterior)}</h4>
                <p class="${cor}">Seus gastos ${texto} ${Math.abs(percentual)}%</p>
                <p class="detalhe">Diferença: ${formatarDinheiro(Math.abs(diferenca))}</p>
                ${gerarDetalhesCategorias(dadosAtual, dadosAnterior)}
            </div>
        `;
    }
    
    // Média dos últimos 3 meses
    const ultimos3 = meses.slice(0, Math.min(3, meses.length));
    const media3Meses = ultimos3.reduce((sum, mes) => sum + todosDados[mes].total, 0) / ultimos3.length;
    const diferencaMedia = dadosAtual.total - media3Meses;
    const percentualMedia = ((diferencaMedia / media3Meses) * 100).toFixed(1);
    
    const comparacaoMedia = `
        <div class="card-comparacao">
            <h4>📊 Vs. Média dos Últimos ${ultimos3.length} Meses</h4>
            <p>Média: ${formatarDinheiro(media3Meses)}</p>
            <p class="${diferencaMedia > 0 ? 'vermelho' : 'verde'}">
                ${diferencaMedia > 0 ? 'Acima' : 'Abaixo'} da média em ${Math.abs(percentualMedia)}%
            </p>
        </div>
    `;
    
    return comparacaoAnterior + comparacaoMedia;
}

/**
 * Gerar detalhes de categorias que mais mudaram
 */
function gerarDetalhesCategorias(mesAtual, mesAnterior) {
    const mudancas = [];
    
    // Analisar cada categoria
    const todasCategorias = new Set([
        ...Object.keys(mesAtual.porCategoria),
        ...Object.keys(mesAnterior.porCategoria)
    ]);
    
    todasCategorias.forEach(cat => {
        const valorAtual = mesAtual.porCategoria[cat] || 0;
        const valorAnterior = mesAnterior.porCategoria[cat] || 0;
        
        if (valorAnterior > 0) {
            const diferenca = valorAtual - valorAnterior;
            const percentual = ((diferenca / valorAnterior) * 100).toFixed(1);
            
            if (Math.abs(percentual) > 20) { // Mudança significativa
                mudancas.push({
                    categoria: cat,
                    diferenca: diferenca,
                    percentual: percentual
                });
            }
        }
    });
    
    if (mudancas.length === 0) return '';
    
    // Ordenar por maior mudança
    mudancas.sort((a, b) => Math.abs(b.percentual) - Math.abs(a.percentual));
    
    return `
        <div class="mudancas-categorias">
            <strong>Maiores mudanças:</strong>
            ${mudancas.slice(0, 3).map(m => `
                <div class="item-mudanca">
                    <span>${m.categoria}:</span>
                    <span class="${m.diferenca > 0 ? 'vermelho' : 'verde'}">
                        ${m.diferenca > 0 ? '+' : ''}${m.percentual}%
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Gerar dicas inteligentes baseadas em análise
 */
function gerarDicasInteligentes(mesAtual, dadosMes) {
    const dicas = [];
    const salario = buscarSalarioMes(mesAtual);  // ✅ salário correto do mês analisado
    const todosDados = organizarPorMes();
    const meses = obterMesesDisponiveis();
    
    // Dica 1: Análise de gastos vs salário
    const percentualGasto = (dadosMes.total / salario) * 100;
    if (percentualGasto > 80) {
        dicas.push({
            tipo: 'alerta',
            icone: '⚠️',
            titulo: 'Atenção: Gastos Muito Altos',
            texto: `Você gastou ${percentualGasto.toFixed(1)}% do seu salário este mês. Tente reduzir para pelo menos 70% para ter mais segurança financeira.`,
            acao: 'Identifique gastos não essenciais que podem ser cortados.'
        });
    } else if (percentualGasto < 50) {
        dicas.push({
            tipo: 'sucesso',
            icone: '🎉',
            titulo: 'Excelente Controle Financeiro!',
            texto: `Você gastou apenas ${percentualGasto.toFixed(1)}% do seu salário. Ótimo trabalho!`,
            acao: `Considere investir os ${formatarDinheiro(salario - dadosMes.total)} que sobraram.`
        });
    }
    
    // Dica 2: Categoria que mais gasta
    const categoriaMaior = Object.entries(dadosMes.porCategoria)
        .sort((a, b) => b[1] - a[1])[0];
    
    if (categoriaMaior) {
        const [categoria, valor] = categoriaMaior;
        const percentualCategoria = ((valor / dadosMes.total) * 100).toFixed(1);
        
        if (percentualCategoria > 40) {
            dicas.push({
                tipo: 'info',
                icone: '📊',
                titulo: `${categoria} Consome ${percentualCategoria}% dos Gastos`,
                texto: `Esta categoria representa ${formatarDinheiro(valor)} dos seus gastos mensais.`,
                acao: getDicaPorCategoria(categoria, valor, salario)
            });
        }
    }
    
    // Dica 3: Tendência de gastos
    // ✅ .reverse() porque meses[] vem do mais recente → mais antigo;
    // analisarTendencia espera ordem cronológica (mais antigo → mais recente)
    if (meses.length >= 3) {
        const ultimos3 = meses.slice(0, 3).reverse().map(m => todosDados[m].total);
        const tendencia = analisarTendencia(ultimos3);
        
        if (tendencia === 'crescente') {
            dicas.push({
                tipo: 'alerta',
                icone: '📈',
                titulo: 'Tendência de Aumento nos Gastos',
                texto: 'Seus gastos estão aumentando nos últimos 3 meses.',
                acao: 'Revise seu orçamento e identifique onde pode economizar.'
            });
        } else if (tendencia === 'decrescente') {
            dicas.push({
                tipo: 'sucesso',
                icone: '📉',
                titulo: 'Parabéns! Gastos em Queda',
                texto: 'Você está conseguindo reduzir seus gastos!',
                acao: 'Continue assim e invista o que economizar.'
            });
        }
    }
    
    // Dica 4: Oportunidade de investimento
    const saldo = salario - dadosMes.total;
    if (saldo > 0) {
        const percentualEconomia = ((saldo / salario) * 100).toFixed(1);
        
        if (percentualEconomia >= 20) {
            dicas.push({
                tipo: 'investimento',
                icone: '💰',
                titulo: 'Oportunidade de Investimento',
                texto: `Você economizou ${formatarDinheiro(saldo)} (${percentualEconomia}% do salário).`,
                acao: gerarSugestaoInvestimento(saldo)
            });
        }
    }
    
    // Dica 5: Comparação com mês anterior
    const indexAtual = meses.indexOf(mesAtual);
    if (indexAtual < meses.length - 1) {
        const mesAnterior = meses[indexAtual + 1];
        const dadosAnterior = todosDados[mesAnterior];
        const diferenca = dadosMes.total - dadosAnterior.total;
        
        if (diferenca < -100) {
            dicas.push({
                tipo: 'sucesso',
                icone: '✅',
                titulo: 'Economia em Relação ao Mês Anterior',
                texto: `Você economizou ${formatarDinheiro(Math.abs(diferenca))} em comparação com ${formatarNomeMes(mesAnterior)}.`,
                acao: 'Continue com esse padrão de economia!'
            });
        }
    }
    
    // Se não tem dicas, gerar dica genérica
    if (dicas.length === 0) {
        dicas.push({
            tipo: 'info',
            icone: '💡',
            titulo: 'Mantenha o Controle',
            texto: 'Continue acompanhando seus gastos mensalmente.',
            acao: 'Defina metas de economia e acompanhe seu progresso.'
        });
    }
    
    // Renderizar dicas
    return dicas.map(dica => `
        <div class="card-dica ${dica.tipo}">
            <div class="icone-dica">${dica.icone}</div>
            <div class="conteudo-dica">
                <h4>${dica.titulo}</h4>
                <p>${dica.texto}</p>
                <p class="acao-dica"><strong>Ação:</strong> ${dica.acao}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Dica específica por categoria
 */
function getDicaPorCategoria(categoria, valor, salario) {
    const dicas = {
        'Alimentação': `Considere fazer compras mensais no atacado e cozinhar mais em casa. Delivery pode custar até 3x mais que cozinhar.`,
        'Transporte': `Avalie opções de transporte público ou carona. Apps de transporte podem consumir muito do orçamento.`,
        'Moradia': `Revise contratos de serviços (internet, luz) e negocie. Pequenas economias somam muito no ano.`,
        'Lazer': `Busque opções gratuitas de lazer. Parques, museus gratuitos e eventos públicos são ótimas alternativas.`,
        'Saúde': `Verifique se há genéricos disponíveis e compare preços entre farmácias.`,
        'Educação': `Procure cursos gratuitos online (Coursera, Udemy em promoção) antes de pagar valores altos.`,
        'Outros': `Categorize melhor seus gastos para identificar onde pode economizar.`
    };
    
    return dicas[categoria] || 'Avalie se todos estes gastos são realmente necessários.';
}

/**
 * Sugestão de investimento
 */
function gerarSugestaoInvestimento(valor) {
    if (valor < 100) {
        return 'Acumule mais um pouco e comece com Tesouro Direto (a partir de R$ 30).';
    } else if (valor < 1000) {
        return `Tesouro Direto, CDB ou LCI são ótimas opções para começar com ${formatarDinheiro(valor)}.`;
    } else if (valor < 5000) {
        return `Com ${formatarDinheiro(valor)}, considere diversificar: 50% renda fixa, 30% fundos, 20% ações.`;
    } else {
        return `Valor significativo! Considere consultar um assessor de investimentos para otimizar os ${formatarDinheiro(valor)}.`;
    }
}

/**
 * Analisar tendência
 */
function analisarTendencia(valores) {
    if (valores.length < 2) return 'estavel';
    
    let crescente = 0;
    let decrescente = 0;
    
    for (let i = 1; i < valores.length; i++) {
        if (valores[i] > valores[i-1]) crescente++;
        if (valores[i] < valores[i-1]) decrescente++;
    }
    
    if (crescente > decrescente) return 'crescente';
    if (decrescente > crescente) return 'decrescente';
    return 'estavel';
}

/**
 * Abrir modal de histórico mensal
 */
function abrirHistoricoMensal() {
    let modal = document.getElementById('modalHistorico');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalHistorico';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content modal-historico">
            <div class="modal-header">
                <h2>📅 Histórico Mensal</h2>
                <button class="btn-fechar" onclick="fecharHistoricoMensal()">✕</button>
            </div>
            
            <div class="modal-body">
                <div id="abasMeses"></div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    renderizarAbasMeses();
}

/**
 * Fechar modal de histórico
 */
function fecharHistoricoMensal() {
    const modal = document.getElementById('modalHistorico');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Inicializar ao carregar
window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Módulo de histórico mensal carregado');
});
