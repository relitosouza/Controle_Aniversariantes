// =================================================================
// CONFIGURAÇÕES
// =================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzk3TraZoI1QNWjzb5ZaNVSF2Kk8kOlGhQ2HoGSuvHBkRubTOj_EjM_c939Iuc5W6Zj/exec";
const CACHE_KEY = "niver_app_cache_v1"; // Chave para salvar no navegador

let pessoas = [];

// =================================================================
// INICIALIZAÇÃO
// =================================================================
window.onload = function() {
    // 1. Tenta carregar do cache imediatamente (instantâneo)
    carregarDoCache();
    
    // 2. Busca dados atualizados da nuvem (segundo plano)
    carregarDaAPI();

    // Seleciona aba inicial visualmente
    const abaInicial = document.querySelector(".tab-link");
    if(abaInicial) abaInicial.click();
};

// --- FUNÇÃO 1: Carregar do Cache (Instantâneo) ---
function carregarDoCache() {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
        pessoas = JSON.parse(cache);
        console.log("📦 Dados carregados do Cache:", pessoas.length);
        atualizarTelas(); // Mostra na tela na hora
    }
}

// --- FUNÇÃO 2: Carregar da API (Dados Frescos) ---
function carregarDaAPI() {
    console.log("☁️ Buscando atualizações na nuvem...");
    
    // Mostra um pequeno indicador de carregamento no canto (opcional)
    const btnRefresh = document.getElementById("btnRelatorio");
    if(btnRefresh && btnRefresh.innerText === "Gerar Relatório Semanal") btnRefresh.innerText = "Atualizando...";

    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            // ORDENAÇÃO (Janeiro a Dezembro)
            pessoas = data.sort((a, b) => {
                if (!a.dataNascimento || !b.dataNascimento) return 0;
                const dA = new Date(a.dataNascimento);
                const dB = new Date(b.dataNascimento);
                // Compara mês, se igual compara dia
                return (dA.getUTCMonth() - dB.getUTCMonth()) || (dA.getUTCDate() - dB.getUTCDate());
            });

            console.log("✅ Dados da nuvem recebidos:", pessoas.length);
            
            // SALVA NO CACHE (Para a próxima vez ser rápido)
            localStorage.setItem(CACHE_KEY, JSON.stringify(pessoas));
            
            atualizarTelas(); // Atualiza a interface com os dados novos
        })
        .catch(err => {
            console.error("❌ Erro de conexão", err);
            // Se não tiver cache e der erro, avisa. Se tiver cache, o usuário nem percebe.
            if (pessoas.length === 0 && typeof Swal !== 'undefined') {
                Swal.fire('Offline', 'Não foi possível baixar os dados e não há cache salvo.', 'warning');
            }
        })
        .finally(() => {
             if(btnRefresh && btnRefresh.innerText === "Atualizando...") btnRefresh.innerText = "Gerar Relatório Semanal";
        });
}

// Função auxiliar para atualizar a tela onde o usuário estiver
function atualizarTelas() {
    // Se o usuário estiver na aba Relatório e já tiver algo na tela, atualiza ela
    const divRelatorio = document.getElementById("resRelatorio");
    if(divRelatorio && divRelatorio.innerHTML !== "" && !divRelatorio.innerHTML.includes("placeholder-text")) {
         document.getElementById("btnRelatorio").click();
    }
    
    // Se estiver pesquisando, refaz a pesquisa (opcional, aqui mantemos estático para não pular layout)
}

// =================================================================
// 1. SALVAR (CREATE)
// =================================================================
document.getElementById("formCadastro").addEventListener("submit", function (e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector("button");
    const textoOriginal = btn.innerText;

    btn.innerText = "Salvando...";
    btn.disabled = true;

    const pessoa = {
        nome: form.nome.value,
        endereco: form.endereco.value,
        cep: form.cep.value,
        telefone: form.telefone.value,
        dataNascimento: form.data_nascimento.value
    };

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(pessoa)
    })
    .then(res => res.json())
    .then(() => {
        Swal.fire({
            title: 'Sucesso!',
            text: 'Aniversariante cadastrado!',
            icon: 'success',
            confirmButtonColor: '#2563eb'
        });
        form.reset();
        carregarDaAPI(); // Força atualização da nuvem + cache
    })
    .catch(err => Swal.fire('Erro', 'Erro ao salvar: ' + err, 'error'))
    .finally(() => {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    });
});

// =================================================================
// 2. EXCLUIR (DELETE)
// =================================================================
function excluirPessoa(id, nome) {
    Swal.fire({
        title: `Excluir ${nome}?`,
        text: "Essa ação não pode ser desfeita!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Excluindo...', didOpen: () => { Swal.showLoading() } });

            fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "excluir", id: id })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "excluido") {
                    Swal.fire('Excluído!', 'O registro foi apagado.', 'success');
                    
                    // Remove localmente antes de baixar da rede (UX instantânea)
                    pessoas = pessoas.filter(p => p.id !== id);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(pessoas));
                    document.getElementById("resPesquisa").innerHTML = ""; // Limpa pesquisa
                    
                    carregarDaAPI(); // Sincroniza garantia
                } else {
                    Swal.fire('Erro', 'Não foi possível excluir.', 'error');
                }
            })
            .catch(err => Swal.fire('Erro', 'Erro de conexão.', 'error'));
        }
    });
}

// =================================================================
// 3. PESQUISA
// =================================================================
document.getElementById("btnPesquisar").addEventListener("click", function() {
    const nomeInput = document.getElementById("nomePesquisa").value.trim().toLowerCase();
    const dataInput = document.getElementById("dataPesquisa").value;
    const divResultado = document.getElementById("resPesquisa");
    
    if (!nomeInput && !dataInput) {
        // Se vazio, mostra lista completa (lida do cache/memória)
        renderizarLista(pessoas, divResultado, "Nenhum cadastro encontrado.");
        return;
    }

    let dia = "", mes = "";
    if (dataInput) {
        const partes = dataInput.split("-");
        mes = partes[1]; dia = partes[2];
    }
    
    const encontrados = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        let bateuNome = true;
        let bateuData = true;

        if (nomeInput) bateuNome = p.nome.toLowerCase().includes(nomeInput);
        if (dataInput) {
            const dataString = p.dataNascimento.substring(0, 10);
            bateuData = dataString.endsWith(`-${mes}-${dia}`);
        }
        return bateuNome && bateuData;
    });

    renderizarLista(encontrados, divResultado, "Nenhum resultado encontrado.");
});

// =================================================================
// 4. RELATÓRIO SEMANAL
// =================================================================
document.getElementById("btnRelatorio").addEventListener("click", function() {
    const divResultado = document.getElementById("resRelatorio");
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    
    const dataInicio = new Date(hoje); dataInicio.setDate(hoje.getDate() + 7);
    const dataFim = new Date(hoje); dataFim.setDate(hoje.getDate() + 14); dataFim.setHours(23,59,59,999);

    const aniversariantes = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        const dataNasc = new Date(p.dataNascimento);
        const aniverEsteAno = new Date(dataInicio.getFullYear(), dataNasc.getUTCMonth(), dataNasc.getUTCDate());
        
        if (aniverEsteAno < dataInicio && dataInicio.getMonth() === 11 && dataNasc.getUTCMonth() === 0) {
            aniverEsteAno.setFullYear(dataInicio.getFullYear() + 1);
        }
        return aniverEsteAno >= dataInicio && aniverEsteAno <= dataFim;
    });

    // Ordenação extra para garantir ordem de dias da semana
    aniversariantes.sort((a,b) => {
         const dA = new Date(a.dataNascimento); const dB = new Date(b.dataNascimento);
         return (dA.getUTCMonth() - dB.getUTCMonth()) || (dA.getUTCDate() - dB.getUTCDate());
    });

    const diaIni = String(dataInicio.getDate()).padStart(2,'0');
    const mesIni = String(dataInicio.getMonth()+1).padStart(2,'0');
    const diaFim = String(dataFim.getDate()).padStart(2,'0');
    const mesFim = String(dataFim.getMonth()+1).padStart(2,'0');

    renderizarLista(aniversariantes, divResultado, `Ninguém faz aniversário na próxima semana (${diaIni}/${mesIni} a ${diaFim}/${mesFim}).`);
});

// =================================================================
// 5. EMAIL MANUAL
// =================================================================
document.getElementById("btnEnviarEmail").addEventListener("click", function() {
    const btn = document.getElementById("btnEnviarEmail");
    
    Swal.fire({
        title: 'Enviar e-mail?',
        text: "Disparar aviso da PRÓXIMA semana?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, enviar'
    }).then((result) => {
        if (result.isConfirmed) {
            btn.innerText = "Enviando..."; btn.disabled = true;
            Swal.fire({ title: 'Enviando...', didOpen: () => { Swal.showLoading() } });

            fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "enviar_email" }) 
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "enviado") Swal.fire('Sucesso!', `Enviado para ${data.qtd} pessoas.`, 'success');
                else if (data.status === "vazio") Swal.fire('Vazio', 'Sem aniversariantes na próxima semana.', 'info');
                else Swal.fire('Erro', 'Resposta desconhecida.', 'warning');
            })
            .catch(err => Swal.fire('Erro', 'Falha na conexão.', 'error'))
            .finally(() => { btn.innerText = "📧 Enviar Aviso por Email Agora"; btn.disabled = false; });
        }
    });
});

// =================================================================
// 6. UI & UTILS
// =================================================================
const inputTelefone = document.querySelector('input[name="telefone"]');
if (inputTelefone) {
    inputTelefone.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, "").slice(0, 11);
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
        e.target.value = v;
    });
}

function renderizarLista(lista, elementoAlvo, msgVazio) {
    elementoAlvo.innerHTML = ""; 
    if (lista.length === 0) {
        elementoAlvo.innerHTML = `<p class="placeholder-text">${msgVazio}</p>`;
        return;
    }

    const ul = document.createElement("ul");
    lista.forEach(p => {
        const li = document.createElement("li");
        const dataObj = new Date(p.dataNascimento);
        const dia = String(dataObj.getUTCDate()).padStart(2, '0');
        const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
        const cepTexto = p.cep ? ` - CEP: ${p.cep}` : "";
        
        const btnDelete = `<button class="btn-delete" onclick="excluirPessoa('${p.id}', '${p.nome}')">🗑️ Excluir</button>`;

        li.innerHTML = `
            <div style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <div>
                        <strong style="font-size: 1.1rem; color: #1e3a8a;">${p.nome}</strong>
                        ${btnDelete} 
                    </div>
                    <span style="background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 0.9rem;">
                        🎂 ${dia}/${mes}
                    </span>
                </div>
                <div style="margin-bottom: 3px; color: #444;">📞 ${p.telefone || "Sem telefone"}</div>
                <div style="font-size: 0.9rem; color: #666;">🏠 ${p.endereco || "Endereço não informado"}${cepTexto}</div>
            </div>
        `;
        ul.appendChild(li);
    });
    elementoAlvo.appendChild(ul);
}

function abrirTab(evt, tabNome) {
    const conteudos = document.getElementsByClassName("tab-content");
    for (let i = 0; i < conteudos.length; i++) {
        conteudos[i].style.display = "none"; conteudos[i].classList.remove("active");
    }
    const tabs = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" active", "");
    }
    document.getElementById(tabNome).style.display = "block";
    document.getElementById(tabNome).classList.add("active");
    if (evt && evt.currentTarget) evt.currentTarget.className += " active";
}
