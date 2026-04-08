// ============================================
// PAGINAÇÃO
// ============================================
let paginaAtual = 1;
const GASTOS_POR_PAGINA = 10;

// ============================================
// GESTÃO DE GASTOS
// ============================================

function adicionarGasto() {
    const descricao = document.getElementById('campoDescricao').value.trim();
    const valorStr  = document.getElementById('campoValor').value;
    let categoria   = document.getElementById('campoCategoria').value;
    const recorrente  = document.getElementById('campoRecorrente')?.checked || false;
    const frequencia  = document.getElementById('campoFrequencia')?.value || 'mensal';

    if (!descricao) { mostrarNotificacao('❌ Preencha a descrição!', 'erro'); return; }
    if (descricao.length > 100) { mostrarNotificacao('❌ Descrição muito longa!', 'erro'); return; }
    if (!validarValor(valorStr)) { mostrarNotificacao('❌ Valor inválido! (entre R$0,01 e R$999.999)', 'erro'); return; }

    const valor = parseFloat(valorStr);

    if (typeof categorizarComIA === 'function') {
        const cat = categorizarComIA(descricao);
        if (cat && cat !== 'Outros') categoria = cat;
    }

    const novoGasto = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2)),
        nome: descricao,
        valor,
        categoria,
        data: new Date().toISOString(),
        recorrente,
        frequencia: recorrente ? frequencia : null,
        proximaData: recorrente ? calcularProximaData(frequencia) : null
    };

    if (typeof detectarDuplicata === 'function' && detectarDuplicata(novoGasto)) return;

    _adicionarGastoConfirmado(novoGasto);
}

function _adicionarGastoConfirmado(novoGasto) {
    const usuario = buscarUsuarioAtual();
    usuario.gastos.push(novoGasto);
    atualizarUsuarioAtual(usuario);
    if (typeof salvarGastoNuvem === 'function') salvarGastoNuvem(novoGasto);

    document.getElementById('campoDescricao').value = '';
    document.getElementById('campoValor').value = '';
    if (document.getElementById('campoRecorrente')) document.getElementById('campoRecorrente').checked = false;
    toggleFrequencia();

    paginaAtual = 1;
    atualizarDashboard();
    mostrarNotificacao(`✅ ${novoGasto.nome} adicionado!`, 'sucesso');

    // Checar se ultrapassou orçamento com este gasto
    const uso = calcularUsoOrcamentos();
    const usoCategoria = uso[novoGasto.categoria];
    if (usoCategoria && usoCategoria.percentual >= 100) {
        enviarNotificacaoPush('🔴 Limite atingido!', `Você esgotou o orçamento de ${novoGasto.categoria}: ${formatarDinheiro(usoCategoria.limite)}`);
    }
}

function calcularProximaData(freq) {
    const d = new Date();
    if (freq === 'semanal') d.setDate(d.getDate() + 7);
    else if (freq === 'mensal') d.setMonth(d.getMonth() + 1);
    else if (freq === 'anual') d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
}

function verificarGastosRecorrentes() {
    const usuario = buscarUsuarioAtual();
    if (!usuario) return;
    const agora = new Date();
    let adicionados = 0;
    usuario.gastos.forEach(g => {
        if (!g.recorrente || !g.proximaData) return;
        if (agora >= new Date(g.proximaData)) {
            usuario.gastos.push({
                id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2)),
                nome: g.nome, valor: g.valor, categoria: g.categoria,
                data: agora.toISOString(), recorrente: true, frequencia: g.frequencia,
                proximaData: calcularProximaData(g.frequencia)
            });
            g.proximaData = calcularProximaData(g.frequencia);
            adicionados++;
        }
    });
    if (adicionados > 0) {
        atualizarUsuarioAtual(usuario);
        mostrarNotificacao(`🔄 ${adicionados} gasto(s) recorrente(s) adicionado(s)!`, 'info');
        atualizarDashboard();
    }
}

function toggleFrequencia() {
    const cb = document.getElementById('campoRecorrente');
    const gr = document.getElementById('grupoFrequencia');
    if (gr) gr.style.display = (cb && cb.checked) ? 'block' : 'none';
}

function removerGasto(indice) {
    const usuario = buscarUsuarioAtual();
    const gasto = usuario.gastos[indice];
    if (!gasto) return;
    mostrarConfirm(
        '🗑️ Remover Gasto',
        `Remover <strong>${gasto.nome}</strong> (${formatarDinheiro(gasto.valor)})?<br>Esta ação não pode ser desfeita.`,
        () => {
            const u = buscarUsuarioAtual();
            u.gastos.splice(indice, 1);
            atualizarUsuarioAtual(u);
            paginaAtual = 1;
            atualizarDashboard();
            mostrarNotificacao('✅ Gasto removido!', 'sucesso');
        }
    );
}

function importarExtrato(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    const nome = arquivo.name.toLowerCase();
    if (arquivo.type === 'application/pdf' || nome.endsWith('.pdf')) importarExtratoPDF(arquivo);
    else importarExtratoTexto(arquivo);
}

function importarExtratoTexto(arquivo) {
    const leitor = new FileReader();
    leitor.onload = e => processarLinhasExtrato(e.target.result);
    leitor.readAsText(arquivo);
}

function importarExtratoPDF(arquivo) {
    const leitor = new FileReader();
    leitor.onload = async e => {
        try {
            const pdf = await pdfjsLib.getDocument(e.target.result).promise;
            let texto = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const p = await pdf.getPage(i);
                const c = await p.getTextContent();
                texto += c.items.map(x => x.str).join(' ') + '\n';
            }
            processarLinhasExtrato(texto);
        } catch (err) { mostrarNotificacao('❌ Erro ao processar PDF', 'erro'); }
    };
    leitor.readAsArrayBuffer(arquivo);
}

function processarLinhasExtrato(conteudo) {
    const linhas = conteudo.split('\n');
    const usuario = buscarUsuarioAtual();
    let contador = 0;
    linhas.forEach(linha => {
        const partes = linha.split(/[,;|\t]/);
        if (partes.length >= 2) {
            const descricao = partes[0].trim();
            const valor = Math.abs(parseFloat(partes[1].replace(/[^\d,.-]/g,'').replace(',','.')));
            if (descricao && valor > 0 && !isNaN(valor) && valor < 1000000) {
                usuario.gastos.push({ id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + contador.toString()), nome: descricao.substring(0,100), valor, categoria: 'Outros', data: new Date().toISOString(), recorrente: false });
                contador++;
            }
        }
    });
    atualizarUsuarioAtual(usuario);
    paginaAtual = 1;
    atualizarDashboard();
    mostrarNotificacao(`✅ ${contador} transações importadas!`, 'sucesso');
}

// ============================================
// PAGINAÇÃO
// ============================================

function atualizarListaGastos() {
    // Se há filtros ativos, aplica eles em vez de mostrar tudo ordenado por data
    if (typeof _aplicarFiltrosCombinados === 'function' &&
        typeof _filtrosAtivos !== 'undefined' &&
        (_filtrosAtivos.termo || _filtrosAtivos.periodo || _filtrosAtivos.ordenacao !== 'data-desc')) {
        _aplicarFiltrosCombinados();
        return;
    }
    const usuario = buscarUsuarioAtual();
    const gastos = [...usuario.gastos].sort((a,b) => new Date(b.data) - new Date(a.data));
    renderizarPagina(gastos, paginaAtual);
}

function renderizarPagina(gastos, pagina) {
    const lista = document.getElementById('listaGastos');
    const pag   = document.getElementById('paginacao');
    if (gastos.length === 0) { lista.innerHTML = '<p class="lista-vazia">Nenhum gasto cadastrado</p>'; if (pag) pag.innerHTML = ''; return; }

    const totalPag = Math.ceil(gastos.length / GASTOS_POR_PAGINA);
    const p = Math.min(Math.max(pagina, 1), totalPag);
    const inicio = (p-1) * GASTOS_POR_PAGINA;
    const slice  = gastos.slice(inicio, inicio + GASTOS_POR_PAGINA);
    const usuario = buscarUsuarioAtual();

    lista.innerHTML = slice.map(gasto => {
        const idx = usuario.gastos.findIndex(g => g.id === gasto.id || (g.nome===gasto.nome && g.valor===gasto.valor && g.data===gasto.data));
        const badge = gasto.recorrente ? `<span class="badge-recorrente">🔄 ${gasto.frequencia}</span>` : '';
        return `
        <div class="itemGasto">
            <div class="infoGasto">
                <div class="nomeGasto">${gasto.nome} ${badge}</div>
                <div class="categoriaGasto">${gasto.categoria} • ${formatarData(gasto.data)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                <div class="valorGasto">${formatarDinheiro(gasto.valor)}</div>
                <button class="btn-editar" onclick="editarGasto(${idx})" title="Editar">✏️</button>
                <button class="btnRemover" onclick="removerGasto(${idx})" title="Remover">✕</button>
            </div>
        </div>`;
    }).join('');

    if (pag) {
        if (totalPag <= 1) { pag.innerHTML = ''; return; }
        const filtroInfo = (typeof _filtrosAtivos !== 'undefined' && (_filtrosAtivos.termo || _filtrosAtivos.periodo))
            ? ` <span style="color:#6366f1;font-size:12px">(filtrado)</span>` : '';
        let html = `<div class="paginacao-info">${gastos.length} gastos${filtroInfo} • Página ${p} de ${totalPag}</div><div class="paginacao-botoes">`;
        html += `<button class="btn-pagina" onclick="irParaPagina(1,event)" ${p===1?'disabled':''}>«</button>`;
        html += `<button class="btn-pagina" onclick="irParaPagina(${p-1},event)" ${p===1?'disabled':''}>‹</button>`;
        const ini = Math.max(1,p-2), fim = Math.min(totalPag,p+2);
        for (let i=ini; i<=fim; i++) html += `<button class="btn-pagina ${i===p?'ativa':''}" onclick="irParaPagina(${i},event)">${i}</button>`;
        html += `<button class="btn-pagina" onclick="irParaPagina(${p+1},event)" ${p===totalPag?'disabled':''}>›</button>`;
        html += `<button class="btn-pagina" onclick="irParaPagina(${totalPag},event)" ${p===totalPag?'disabled':''}>»</button></div>`;
        pag.innerHTML = html;
    }
}

function irParaPagina(pagina, event) {
    if (event) event.preventDefault();
    paginaAtual = pagina;
    atualizarListaGastos();
    document.getElementById('listaGastos').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// EXPORTAR CSV
// ============================================

function exportarCSV() {
    const usuario = buscarUsuarioAtual();
    if (!usuario.gastos.length) { mostrarNotificacao('❌ Nenhum gasto para exportar!', 'erro'); return; }

    const linhas = ['Descrição,Valor (R$),Categoria,Data,Recorrente,Frequência'];
    usuario.gastos.forEach(g => {
        const data = new Date(g.data).toLocaleDateString('pt-BR');
        linhas.push(`"${g.nome.replace(/"/g,'""')}",${g.valor.toFixed(2)},"${g.categoria}","${data}","${g.recorrente?'Sim':'Não'}","${g.frequencia||''}"`);
    });

    const total = usuario.gastos.reduce((s,g) => s+g.valor, 0);
    const salario = buscarSalarioMes(chaveMesAtual());
    linhas.push('', `"TOTAL",${total.toFixed(2)}`, `"Salário do Mês",${salario.toFixed(2)}`, `"Saldo",${(salario-total).toFixed(2)}`);

    const blob = new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gastos-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    mostrarNotificacao('📊 CSV exportado!', 'sucesso');
}

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}
