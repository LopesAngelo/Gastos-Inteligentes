// ============================================
// FUNÇÕES DE GESTÃO DE GASTOS
// ============================================

/**
 * Adicionar novo gasto
 */
function adicionarGasto() {
    // Pegar valores dos campos
    const descricao = document.getElementById('campoDescricao').value.trim();
    const valor = parseFloat(document.getElementById('campoValor').value);
    const categoria = document.getElementById('campoCategoria').value;

    // Validar campos
    if (!descricao || !valor || valor <= 0) {
        alert('❌ Preencha descrição e valor válido!');
        return;
    }

    // Buscar dados do usuário
    const usuario = buscarUsuarioAtual();

    // Adicionar gasto
    usuario.gastos.push({
        nome: descricao,
        valor: valor,
        categoria: categoria,
        data: new Date().toISOString()
    });

    // Salvar
    atualizarUsuarioAtual(usuario);

    // Limpar campos
    document.getElementById('campoDescricao').value = '';
    document.getElementById('campoValor').value = '';

    // Atualizar dashboard
    atualizarDashboard();
    
    console.log('✅ Gasto adicionado:', descricao);
}

/**
 * Remover gasto
 */
function removerGasto(indice) {
    const usuario = buscarUsuarioAtual();
    
    // Remover gasto pelo índice
    usuario.gastos.splice(indice, 1);
    
    // Salvar
    atualizarUsuarioAtual(usuario);
    
    // Atualizar dashboard
    atualizarDashboard();
    
    console.log('✅ Gasto removido');
}

/**
 * Importar extrato bancário
 */
function importarExtrato(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    
    leitor.onload = function(e) {
        const conteudo = e.target.result;
        const linhas = conteudo.split('\n');
        const usuario = buscarUsuarioAtual();
        let contador = 0;

        // Processar cada linha
        linhas.forEach(linha => {
            const partes = linha.split(/[,;]/);
            
            if (partes.length >= 2) {
                const descricao = partes[0].trim();
                const valorTexto = partes[1].replace(/[^\d,.-]/g, '').replace(',', '.');
                const valor = Math.abs(parseFloat(valorTexto));

                // Validar e adicionar
                if (descricao && valor > 0 && !isNaN(valor)) {
                    usuario.gastos.push({
                        nome: descricao,
                        valor: valor,
                        categoria: 'Outros',
                        data: new Date().toISOString()
                    });
                    contador++;
                }
            }
        });

        // Salvar
        atualizarUsuarioAtual(usuario);
        
        // Atualizar dashboard
        atualizarDashboard();
        
        alert(`✅ Extrato importado! ${contador} transações adicionadas.`);
        console.log(`✅ Importadas ${contador} transações`);
    };

    leitor.readAsText(arquivo);
}

/**
 * Atualizar lista de gastos na tela
 */
function atualizarListaGastos() {
    const usuario = buscarUsuarioAtual();
    const lista = document.getElementById('listaGastos');

    // Se não tem gastos
    if (usuario.gastos.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px">Nenhum gasto cadastrado</p>';
        return;
    }

    // Criar HTML dos gastos
    lista.innerHTML = usuario.gastos.map((gasto, indice) => `
        <div class="itemGasto">
            <div class="infoGasto">
                <div class="nomeGasto">${gasto.nome}</div>
                <div class="categoriaGasto">${gasto.categoria}</div>
            </div>
            <div style="display:flex;align-items:center;">
                <div class="valorGasto">${formatarDinheiro(gasto.valor)}</div>
                <button class="btnRemover" onclick="removerGasto(${indice})">✕</button>
            </div>
        </div>
    `).join('');
}

// ============================================
// FUNÇÃO UTILITÁRIA
// ============================================

/**
 * Formatar valor em dinheiro brasileiro
 */
function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}