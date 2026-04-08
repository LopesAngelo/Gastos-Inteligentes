// ============================================
// SYNC / CLOUD (opcional)
// ============================================
// Integração com Firebase ou outro backend pode ser
// adicionada aqui futuramente. Por enquanto os dados
// ficam no localStorage do navegador.

function salvarGastoNuvem(gasto) { /* futura integração */ }
function salvarDadosNuvem(dados) { /* futura integração */ }
// Stub — Firebase não configurado, usa conta local
async function criarContaFirebase(email, senha, nome) { return { sucesso: false }; }

window.addEventListener('online',  () => mostrarNotificacao('🌐 Conexão restaurada', 'sucesso'));
window.addEventListener('offline', () => mostrarNotificacao('📴 Sem conexão — dados salvos localmente', 'alerta'));
