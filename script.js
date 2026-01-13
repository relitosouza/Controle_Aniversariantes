// =================================================================
// CONFIGURAÇÕES
// =================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzk3TraZoI1QNWjzb5ZaNVSF2Kk8kOlGhQ2HoGSuvHBkRubTOj_EjM_c939Iuc5W6Zj/exec";

let pessoas = [];

// =================================================================
// INICIALIZAÇÃO
// =================================================================
window.onload = function() {
    carregarDados(); // Busca direto da nuvem
    
    // Seleciona aba inicial visualmente
    const abaInicial = document.querySelector(".tab-link");
    if(abaInicial) abaInicial.click();
};

// --- FUNÇÃO PRINCIPAL: Carregar da API ---
function carregarDados() {
    console.log("☁️ Buscando dados atualizados...");
    
    // Feedback visual no botão de atualizar (se existir)
    const btnRefresh = document.getElementById("btnRelatorio");
    if(btnRefresh) {
        if(btnRefresh.innerText.includes("Atualizar")) btnRefresh.innerText = "Carregando...";
    }

    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            // ORDENAÇÃO CRONOLÓGICA (Janeiro a Dezembro)
            pessoas = data.sort((a, b) => {
                if (!a.dataNascimento || !b.dataNascimento) return 0;
                
                // Converte para data segura
                // (Usamos UTC ou split para garantir a ordem correta independente do ano)
                const partesA = a.dataNascimento.split('T')[0].split('-');
                const partesB = b.dataNascimento.split('T')[0].split('-');
                
                const mesA = parseInt(partesA[1]);
                const diaA = parseInt(partesA[2]);
                const mesB = parseInt(partesB[1]);
                const diaB = parseInt(partesB[2]);

                // Compara Mês primeiro, depois Dia
                if (mesA !== mesB) return mesA - mesB;
                return diaA - diaB;
            });

            console.log("✅ Dados recebidos:", pessoas.length);
            
            // Se estiver com a aba de relatório aberta, atualiza ela automaticamente
            const divRelatorio = document.getElementById("resRelatorio");
            if(divRelatorio && divRelatorio.innerHTML !== "" && !divRelatorio.innerHTML.includes("placeholder-text")) {
                 document.getElementById("btnRelatorio").click();
            }
        })
        .catch(err => {
            console.error("❌ Erro de conexão", err);
            if (typeof Swal !== 'undefined') {
                Swal.fire('Erro', 'Não foi possível carregar a lista. Verifique sua internet.', 'error');
            }
        })
        .finally(() => {
             // Restaura texto do botão
             if(btnRefresh && btnRefresh.innerText === "Carregando...") {
                 btnRefresh.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Atualizar Tela';
             }
        });
}

// =================================================================
// 1. SALVAR (CREATE)
// =================================================================
document.getElementById("formCadastro").addEventListener("submit", function (e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector("button");
    const textoOriginal = btn.innerHTML;

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
            text: 'Aniversariante salvo!',
            icon: 'success',
            confirmButtonColor: '#7c3aed'
        });
        form.reset();
        carregarDados(); // Recarrega a lista oficial
    })
    .catch(err => Swal.fire('Erro', 'Erro ao salvar: ' + err, 'error'))
    .finally(() => {
        btn.innerHTML = textoOriginal;
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
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Aguarde...', didOpen: () => { Swal.showLoading() } });

            fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "excluir", id: id })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "excluido") {
                    Swal.fire('Excluído!', 'O registro foi apagado.', 'success');
                    
                    // Limpa telas para não mostrar dados velhos
                    document.getElementById("resPesquisa").innerHTML = `<div class="empty-state"><i class="ph-duotone ph-magnifying-glass"></i><p>Pesquise novamente para atualizar.</p></div>`;
                    document.getElementById("resRelatorio").innerHTML = "";
                    
                    carregarDados(); // Busca lista nova
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
    
    // Se vazio, mostra todos (ordenados)
    if (!nomeInput && !dataInput) {
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
// 4. RELATÓRIO SEMANAL (COM PERÍODO VISÍVEL)
// =================================================================
document.getElementById("btnRelatorio").addEventListener("click", function() {
    const divResultado = document.getElementById("resRelatorio");
    
    // Limpa visualmente antes de começar
    divResultado.innerHTML = "";
    
    const hoje = new Date(); 
    hoje.setHours(0,0,0,0);
    
    // INTERVALO: Daqui a 7 dias -> até -> Daqui a 14 dias
    const dataInicio = new Date(hoje); 
    dataInicio.setDate(hoje.getDate() + 7);
    dataInicio.setHours(0,0,0,0);
    
    const dataFim = new Date(hoje); 
    dataFim.setDate(hoje.getDate() + 14); 
    dataFim.setHours(23,59,59,999);

    const aniversariantes = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        
        // Parse manual da data para evitar fuso horário
        const partes = p.dataNascimento.split('T')[0].split('-');
        const mesNasc = parseInt(partes[1]) - 1; 
        const diaNasc = parseInt(partes[2]);
        
        const aniverEsteAno = new Date(dataInicio.getFullYear(), mesNasc, diaNasc);
        aniverEsteAno.setHours(12,0,0,0); 

        // Ajuste virada de ano
        if (aniverEsteAno < dataInicio && dataInicio.getMonth() === 11 && mesNasc === 0) {
            aniverEsteAno.setFullYear(dataInicio.getFullYear() + 1);
        }

        return aniverEsteAno >= dataInicio && aniverEsteAno <= dataFim;
    });

    // Ordenação interna do relatório
    aniversariantes.sort((a,b) => {
         const dA = new Date(a.dataNascimento); 
         const dB = new Date(b.dataNascimento);
         return (dA.getUTCMonth() - dB.getUTCMonth()) || (dA.getUTCDate() - dB.getUTCDate());
    });

    // Texto do Período
    const diaIni = String(dataInicio.getDate()).padStart(2,'0');
    const mesIni = String(dataInicio.getMonth()+1).padStart(2,'0');
    const diaFim = String(dataFim.getDate()).padStart(2,'0');
    const mesFim = String(dataFim.getMonth()+1).padStart(2,'0');

    // Cria o aviso do período
    const periodoDiv = document.createElement("div");
    periodoDiv.style.marginBottom = "15px";
    periodoDiv.style.padding = "10px";
    periodoDiv.style.background = "#eef2ff";
    periodoDiv.style.borderRadius = "12px";
    periodoDiv.style.textAlign = "center";
    periodoDiv.style.color = "#4f46e5";
    periodoDiv.style.fontSize = "0.9rem";
    periodoDiv.style.fontWeight = "600";
    periodoDiv.style.border = "1px solid #e0e7ff";
    periodoDiv.innerHTML = `📅 Próxima semana: <strong>${diaIni}/${mesIni}</strong> a <strong>${diaFim}/${mesFim}</strong>`;
    
    divResultado.appendChild(periodoDiv);

    renderizarLista(aniversariantes, divResultado, "Ninguém faz aniversário neste período.");
});

// =================================================================
// 5. EMAIL MANUAL
// =================================================================
document.getElementById("btnEnviarEmail").addEventListener("click", function() {
    const btn = document.getElementById("btnEnviarEmail");
    
    Swal.fire({
        title: 'Enviar e-mail?',
        text: "Disparar aviso da PRÓXIMA semana agora?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Sim, enviar'
    }).then((result) => {
        if (result.isConfirmed) {
            btn.disabled = true;
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
            .finally(() => { btn.disabled = false; });
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
    // Se já tiver o aviso de período, não apaga ele, só adiciona a lista depois
    const avisoPeriodo = elementoAlvo.querySelector("div[style*='background']");
    
    if (avisoPeriodo) {
        // Remove tudo que NÃO é o aviso de período
        while (elementoAlvo.lastChild && elementoAlvo.lastChild !== avisoPeriodo) {
            elementoAlvo.removeChild(elementoAlvo.lastChild);
        }
    } else {
        elementoAlvo.innerHTML = ""; 
    }

    if (lista.length === 0) {
        const p = document.createElement("p");
        p.className = "empty-state";
        p.innerHTML = `<i class="ph-duotone ph-calendar-x"></i> ${msgVazio}`;
        elementoAlvo.appendChild(p);
        return;
    }

    const ul = document.createElement("ul");
    lista.forEach(p => {
        const li = document.createElement("li");
        
        // Formatação visual da data
        const partes = p.dataNascimento.split('T')[0].split('-');
        const dia = partes[2];
        const mes = partes[1];
        
        const cepTexto = p.cep ? ` - CEP: ${p.cep}` : "";
        
        const btnDelete = `<button class="btn-delete" onclick="excluirPessoa('${p.id}', '${p.nome}')">🗑️ Excluir</button>`;

        li.innerHTML = `
            <div style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div>
                        <strong style="font-size: 1.05rem; color: var(--primary-dark);">${p.nome}</strong>
                        <div style="display:inline-block; margin-left: 8px;">${btnDelete}</div>
                    </div>
                    <span style="background: var(--primary-light); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
                        🎂 ${dia}/${mes}
                    </span>
                </div>
                
                <div style="margin-bottom: 4px; color: var(--text-muted); font-size: 0.9rem; display: flex; align-items: center; gap: 5px;">
                    <i class="ph-fill ph-phone" style="color: var(--accent)"></i> ${p.telefone || "Sem telefone"}
                </div>
                
                <div style="font-size: 0.85rem; color: #9ca3af; display: flex; align-items: flex-start; gap: 5px;">
                    <i class="ph-fill ph-map-pin" style="color: #9ca3af; margin-top: 2px;"></i> 
                    <span>${p.endereco || "Sem endereço"}${cepTexto}</span>
                </div>
            </div>
        `;
        ul.appendChild(li);
    });
    elementoAlvo.appendChild(ul);
}

function abrirTab(evt, tabNome) {
    const conteudos = document.getElementsByClassName("tab-content");
    for (let i = 0; i < conteudos.length; i++) {
        conteudos[i].classList.remove("active");
    }
    const tabs = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }
    document.getElementById(tabNome).classList.add("active");
    if (evt && evt.currentTarget) evt.currentTarget.classList.add("active");
}
