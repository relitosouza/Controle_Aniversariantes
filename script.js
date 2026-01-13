// =================================================================
// CONFIGURAÇÕES
// =================================================================
// ✅ URL DA SUA API (ATUALIZADA)
const API_URL = "https://script.google.com/macros/s/AKfycbzk3TraZoI1QNWjzb5ZaNVSF2Kk8kOlGhQ2HoGSuvHBkRubTOj_EjM_c939Iuc5W6Zj/exec";

let pessoas = [];

// =================================================================
// INICIALIZAÇÃO
// =================================================================
window.onload = function() {
    carregarDados();
    const abaInicial = document.querySelector(".tab-link");
    if(abaInicial) abaInicial.click();
};

function carregarDados() {
    console.log("🔄 Baixando dados...");
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            
            // --- 📅 AQUI ESTÁ A MÁGICA DA ORDENAÇÃO ---
            // Ordena a lista de Janeiro (0) a Dezembro (11)
            pessoas = data.sort((a, b) => {
                if (!a.dataNascimento || !b.dataNascimento) return 0;
                
                const dataA = new Date(a.dataNascimento);
                const dataB = new Date(b.dataNascimento);

                // 1. Compara os Meses (usando UTC para evitar erro de fuso)
                const mesA = dataA.getUTCMonth();
                const mesB = dataB.getUTCMonth();
                
                if (mesA !== mesB) {
                    return mesA - mesB; // Se meses forem diferentes, ordena pelo mês
                }

                // 2. Se o mês for igual, compara os Dias
                const diaA = dataA.getUTCDate();
                const diaB = dataB.getUTCDate();
                return diaA - diaB;
            });
            // ---------------------------------------------

            console.log("✅ Dados carregados e ordenados:", pessoas.length);
            
            // Atualiza a tela se estiver na aba de relatório ou pesquisa
            if(document.getElementById("resRelatorio").innerHTML !== "") {
               document.getElementById("btnRelatorio").click();
            }
        })
        .catch(err => {
            console.error("❌ Erro", err);
            if (typeof Swal !== 'undefined') {
                Swal.fire('Erro de Conexão', 'Não foi possível carregar os dados.', 'error');
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
            text: 'Aniversariante cadastrado com sucesso.',
            icon: 'success',
            confirmButtonColor: '#2563eb'
        });
        form.reset();
        carregarDados();
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
            Swal.fire({
                title: 'Excluindo...',
                didOpen: () => { Swal.showLoading() }
            });

            fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "excluir", id: id })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "excluido") {
                    Swal.fire('Excluído!', 'O registro foi apagado.', 'success');
                    carregarDados(); 
                    document.getElementById("resPesquisa").innerHTML = "";
                    document.getElementById("resRelatorio").innerHTML = "";
                } else {
                    Swal.fire('Erro', 'Não foi possível excluir.', 'error');
                }
            })
            .catch(err => Swal.fire('Erro', 'Erro de conexão: ' + err, 'error'));
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
    
    // Se não digitar nada, mostra TODOS (agora ordenados!)
    // Isso é útil para ver a lista completa de Jan a Dez
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

    // Ordena o relatório por proximidade de data (opcional, pois a lista global já ajuda)
    aniversariantes.sort((a,b) => {
        const dA = new Date(a.dataNascimento); 
        const dB = new Date(b.dataNascimento);
        // Lógica simples para ordenar dias próximos
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
        text: "Deseja enviar o aviso dos aniversariantes da PRÓXIMA semana agora?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, enviar!',
        cancelButtonText: 'Cancelar'
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
                if (data.status === "enviado") {
                    Swal.fire('Sucesso!', `E-mail enviado para ${data.qtd} aniversariantes.`, 'success');
                } else if (data.status === "vazio") {
                    Swal.fire('Informação', 'Nenhum aniversariante encontrado para a próxima semana.', 'info');
                } else {
                    Swal.fire('Ops', 'Resposta inesperada do servidor.', 'warning');
                }
            })
            .catch(err => Swal.fire('Erro', 'Erro ao enviar: ' + err, 'error'))
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
