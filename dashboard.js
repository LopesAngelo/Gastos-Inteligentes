// ============================================
// ATUALIZAÇÃO DO DASHBOARD
// ============================================

function atualizarDashboard() {
    const usuario = buscarUsuarioAtual();
    if (!usuario) return;

    // Invalida cache do histórico mensal ao atualizar dados
    if (typeof _cacheOrganizarMes !== 'undefined') {
        _cacheOrganizarMes = null;
        _cacheOrganizarMesLen = -1;
    }

    const mes = chaveMesAtual();
    const salario = buscarSalarioMes(mes);
    const gastosMes = buscarGastosMes(mes);
    const totalGastos = gastosMes.reduce((t, g) => t + g.valor, 0);
    const saldo = salario - totalGastos;

    atualizarEstatisticas(salario, totalGastos, saldo);
    atualizarListaGastos();
    atualizarRecomendacoes503020(salario, gastosMes, totalGastos, saldo);
    atualizarOrcamentosUI();
    atualizarGraficos();

    if (typeof atualizarMeta === 'function') atualizarMeta();
    if (typeof verificarAlertas === 'function') verificarAlertas();

    console.log('📊 Dashboard atualizado');
}

function atualizarEstatisticas(salario, totalGastos, saldo) {
    document.getElementById('valorSalario').textContent = formatarDinheiro(salario);
    document.getElementById('valorGastos').textContent = formatarDinheiro(totalGastos);
    document.getElementById('valorSaldo').textContent = formatarDinheiro(saldo);
    document.getElementById('valorInvestimento').textContent = formatarDinheiro(salario * 0.20);

    const pGastos = salario > 0 ? ((totalGastos / salario) * 100).toFixed(1) : 0;
    const pSaldo  = salario > 0 ? ((saldo / salario) * 100).toFixed(1) : 0;

    document.getElementById('percentualGastos').textContent = `${pGastos}% do salário`;
    document.getElementById('percentualSaldo').textContent  = `${pSaldo}% restante`;

    document.getElementById('valorSalario').className    = 'verde';
    document.getElementById('valorGastos').className     = 'vermelho';
    document.getElementById('valorSaldo').className      = saldo >= 0 ? 'verde' : 'vermelho';
    document.getElementById('valorInvestimento').className = 'azul';
}

// ============================================
// PAINEL DE ORÇAMENTOS POR CATEGORIA
// ============================================

function atualizarOrcamentosUI() {
    const container = document.getElementById('painelOrcamentos');
    if (!container) return;

    const uso = calcularUsoOrcamentos();
    const cats = Object.keys(uso);

    if (cats.length === 0) {
        container.innerHTML = `
            <p class="orcamento-vazio">Nenhum orçamento definido.<br>
            Clique em <strong>Definir Orçamentos</strong> para estabelecer limites por categoria.</p>`;
        return;
    }

    container.innerHTML = cats.map(cat => {
        const { limite, gasto, percentual, falta } = uso[cat];
        const pct = Math.min(percentual, 100).toFixed(0);
        let cor = '#10b981';
        let status = '';
        if (percentual >= 100) { cor = '#ef4444'; status = '🔴 Limite atingido!'; }
        else if (percentual >= 80) { cor = '#f59e0b'; status = `⚠️ ${falta > 0 ? formatarDinheiro(falta) + ' restando' : 'No limite!'}`; }
        else { status = `✅ ${formatarDinheiro(falta)} restando`; }

        return `
        <div class="orcamento-item">
            <div class="orcamento-header">
                <span class="orcamento-cat">${cat}</span>
                <span class="orcamento-status" style="color:${cor}">${status}</span>
            </div>
            <div class="orcamento-barra-bg">
                <div class="orcamento-barra" style="width:${pct}%;background:${cor}"></div>
            </div>
            <div class="orcamento-valores">
                <span>${formatarDinheiro(gasto)} gastos</span>
                <span><strong>${pct}%</strong> de ${formatarDinheiro(limite)}</span>
            </div>
        </div>`;
    }).join('');
}

// ============================================
// MODAL DE DEFINIÇÃO DE ORÇAMENTOS
// ============================================

function abrirModalOrcamentos() {
    const orcamentos = buscarOrcamentos();
    const categorias = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Outros'];

    let modal = document.getElementById('modalOrcamentos');
    if (!modal) { modal = document.createElement('div'); modal.id = 'modalOrcamentos'; modal.className = 'modal-overlay'; document.body.appendChild(modal); }

    const campos = categorias.map(cat => `
        <div class="form-group">
            <label>${cat} <small style="color:#94a3b8">(0 = sem limite)</small></label>
            <div style="position:relative">
                <span class="input-prefix">R$</span>
                <input type="number" id="orc_${cat}" value="${orcamentos[cat] || ''}" placeholder="0,00" min="0" step="0.01" class="input-com-prefix">
            </div>
        </div>`).join('');

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🎯 Orçamento por Categoria</h2>
                <button class="btn-fechar" onclick="fecharModalOrcamentos()">✕</button>
            </div>
            <div class="modal-body">
                <div class="orcamento-aviso">
                    💡 Defina o limite máximo de gasto para cada categoria no mês atual.
                    Você receberá alertas ao atingir 80% do limite.
                </div>
                <div class="grid-dois-col">
                    ${campos}
                </div>
                <div class="modal-botoes">
                    <button class="btn-secundario" onclick="fecharModalOrcamentos()">Cancelar</button>
                    <button class="btn-salvar" onclick="salvarTodosOrcamentos()">💾 Salvar Orçamentos</button>
                </div>
            </div>
        </div>`;
    modal.style.display = 'flex';
}

function fecharModalOrcamentos() { const m = document.getElementById('modalOrcamentos'); if (m) m.style.display = 'none'; }

function salvarTodosOrcamentos() {
    const categorias = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Outros'];
    let count = 0;
    categorias.forEach(cat => {
        const val = parseFloat(document.getElementById(`orc_${cat}`)?.value || 0);
        salvarOrcamentoCategoria(cat, val);
        if (val > 0) count++;
    });
    fecharModalOrcamentos();
    atualizarDashboard();
    mostrarNotificacao(`✅ ${count} orçamento(s) definido(s)!`, 'sucesso');
}

// ============================================
// RECOMENDAÇÕES — REGRA 50-30-20 REAL
// ============================================

function atualizarRecomendacoes503020(salario, gastosMes, totalGastos, saldo) {
    const container = document.getElementById('recomendacoes');
    if (!container) return;

    const recomendacoes = [];

    if (salario === 0) {
        recomendacoes.push({ titulo: '⚙️ Configure seu salário', texto: 'Informe seu salário mensal para receber recomendações personalizadas com a Regra 50-30-20.' });
        container.innerHTML = recomendacoes.map(r => `
            <div class="itemRecomendacao"><div class="tituloRecomendacao">${r.titulo}</div><div class="textoRecomendacao">${r.texto}</div></div>`).join('');
        return;
    }

    // Calcular distribuição real 50-30-20 por categoria
    const dist = calcular503020(gastosMes, salario);

    // Card explicativo da regra
    recomendacoes.push({
        titulo: '📊 Regra 50-30-20 — Seu Mês Atual',
        texto: `
            <div class="card-5030">
                ${Object.entries(REGRA_503020).map(([grupo, config]) => {
                    const atual = dist[grupo] || 0;
                    const valorAbs = dist.valoresAbsolutos?.[grupo] || 0;
                    const diff = atual - config.meta;
                    const status = diff > 5 ? '⚠️ Acima' : diff < -5 ? '✅ Abaixo' : '✅ OK';
                    const cor = diff > 5 ? '#ef4444' : '#10b981';
                    return `
                        <div class="linha-5030">
                            <div class="linha-5030-header">
                                <span>${config.icone} ${config.label}</span>
                                <span style="color:${cor}">${status} (${atual.toFixed(1)}% / meta ${config.meta}%)</span>
                            </div>
                            <div class="barra-5030-bg">
                                <div class="barra-5030-meta" style="left:${config.meta}%"></div>
                                <div class="barra-5030" style="width:${Math.min(atual,100)}%;background:${cor}"></div>
                            </div>
                            <div class="linha-5030-desc">
                                <small style="color:#94a3b8">${config.descricao}</small>
                                <small>${formatarDinheiro(valorAbs)}</small>
                            </div>
                        </div>`;
                }).join('')}
                <div class="linha-5030" style="margin-top:8px;padding-top:8px;border-top:1px solid #334155">
                    <div class="linha-5030-header">
                        <span>💾 Poupança livre</span>
                        <span style="color:#10b981">${dist.poupanca?.toFixed(1) || 0}%</span>
                    </div>
                    <small style="color:#94a3b8">${formatarDinheiro(dist.valoresAbsolutos?.poupanca || 0)} não comprometidos</small>
                </div>
            </div>`,
        html: true
    });

    // Alertas por grupo
    const propNec = dist.necessidades || 0;
    const propDes = dist.desejos || 0;
    const propFut = dist.futuro || 0;

    if (propNec > 55) recomendacoes.push({ titulo: '🏠 Necessidades Elevadas', texto: `Você está gastando ${propNec.toFixed(1)}% do salário em necessidades (meta: 50%). Tente renegociar aluguel, plano de saúde ou reduzir gastos com alimentação fora de casa.` });
    if (propDes > 35) recomendacoes.push({ titulo: '🎉 Controle os Desejos', texto: `${propDes.toFixed(1)}% do salário em lazer e outros (meta: 30%). Avalie assinaturas que pode cancelar e saídas que podem ser reduzidas.` });
    if (propFut < 15 && salario > 0) recomendacoes.push({ titulo: '📈 Invista no Seu Futuro', texto: `Apenas ${propFut.toFixed(1)}% direcionados ao futuro (meta: 20% = ${formatarDinheiro(salario * 0.2)}). Priorize uma reserva de emergência antes de qualquer investimento.` });
    if (propNec <= 50 && propDes <= 30 && propFut >= 20) recomendacoes.push({ titulo: '🏆 Regra 50-30-20 Equilibrada!', texto: `Parabéns! Sua distribuição está alinhada com a regra de Elizabeth Warren. Continue assim e considere aumentar a parcela de investimentos progressivamente.` });

    // Alertas de orçamento
    const uso = calcularUsoOrcamentos();
    Object.entries(uso).forEach(([cat, { percentual, falta, limite }]) => {
        if (percentual >= 100) recomendacoes.push({ titulo: `🔴 Limite de ${cat} atingido!`, texto: `Você já esgotou o orçamento de ${formatarDinheiro(limite)} para ${cat} este mês.` });
        else if (percentual >= 80) recomendacoes.push({ titulo: `⚠️ ${cat} quase no limite`, texto: `Restam apenas ${formatarDinheiro(falta)} no orçamento de ${cat} (${percentual.toFixed(0)}% usado).` });
    });

    container.innerHTML = recomendacoes.map(r => `
        <div class="itemRecomendacao">
            <div class="tituloRecomendacao">${r.titulo}</div>
            <div class="textoRecomendacao">${r.html ? r.texto : r.texto}</div>
        </div>`).join('');
}
