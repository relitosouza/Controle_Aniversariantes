const API_URL = "https://script.google.com/macros/s/AKfycbwiYYGTlenNQGATHFaS8DSmHTzA1d4lXMMUK2TvjJodhhXznJY2KY2oUjBOrmrnCu0I/exec";

let pessoas = [];

// CARREGAR DADOS AO INICIAR
window.onload = carregarDados;

function carregarDados() {
    console.log("Carregando dados...");
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            pessoas = data;
            console.log("Dados carregados:", pessoas.length);
        })
        .catch(err => console.error("Erro ao carregar dados", err));
}

// 1. FUNÇÃO DE CADASTRO (MANTIDA)
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
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // Ajuste para evitar preflight CORS em alguns casos
        body: JSON.stringify(pessoa)
    })
    .then(res => res.json())
    .then(() => {
        alert("Cadastro salvo com sucesso!");
        form.reset();
        carregarDados(); // Recarrega a lista local
    })
    .catch(err => alert("Erro ao salvar: " + err))
    .finally(() => {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    });
});

// 2. FUNÇÃO DE PESQUISA (NOVA)
// Seleciona o botão dentro do card de pesquisa
const btnPesquisa = document.querySelector(".card:nth-of-type(2) button");
btnPesquisa.addEventListener("click", function() {
    const dataInput = document.getElementById("dataPesquisa").value;
    const divResultado = document.querySelector(".card:nth-of-type(2) .resultado");
    
    if (!dataInput) {
        alert("Por favor, selecione uma data.");
        return;
    }

    // Extrair dia e mês da busca (ignorando ano)
    const [ano, mes, dia] = dataInput.split("-"); // Formato YYYY-MM-DD
    
    const encontrados = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        const dataPessoa = new Date(p.dataNascimento);
        // Compara dia e mês (Mês no JS começa em 0, por isso o ajuste não é necessário se compararmos direto)
        // Mas vindo do Google Sheets, as vezes é string ISO. Vamos garantir:
        const dataString = p.dataNascimento.substring(0, 10); // Pega YYYY-MM-DD
        return dataString.endsWith(`-${mes}-${dia}`);
    });

    renderizarLista(encontrados, divResultado, "Ninguém faz aniversário neste dia.");
});

// 3. FUNÇÃO RELATÓRIO SEMANAL (NOVA)
// Seleciona o botão dentro do card de relatório
const btnRelatorio = document.querySelector(".card:nth-of-type(3) button");
btnRelatorio.addEventListener("click", function() {
    const divResultado = document.querySelector(".card:nth-of-type(3) .resultado");
    
    const hoje = new Date();
    const hojeDia = hoje.getDate();
    const hojeMes = hoje.getMonth(); // 0 = Jan
    
    // Define o limite (hoje + 7 dias)
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + 7);

    const aniversariantes = pessoas.filter(p => {
        if (!p.dataNascimento) return false;
        
        const dataNasc = new Date(p.dataNascimento);
        
        // Cria uma data de aniversário para o ANO ATUAL para comparação
        const aniversarioEsteAno = new Date(hoje.getFullYear(), dataNasc.getUTCMonth(), dataNasc.getUTCDate());

        // Se o aniversário já passou este ano, verificamos se é no ano que vem (ex: pesquisa em Dezembro para Jan)
        // Mas para simplificar "semana", vamos focar no intervalo simples:
        
        return aniversarioEsteAno >= hoje && aniversarioEsteAno <= dataLimite;
    });

    renderizarLista(aniversariantes, divResultado, "Nenhum aniversariante nos próximos 7 dias.");
});

// FUNÇÃO AUXILIAR PARA EXIBIR NA TELA
function renderizarLista(lista, elementoAlvo, msgVazio) {
    elementoAlvo.innerHTML = ""; // Limpa anterior

    if (lista.length === 0) {
        elementoAlvo.innerHTML = `<p style="color: #666;">${msgVazio}</p>`;
        return;
    }

    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.padding = "0";

    lista.forEach(p => {
        const li = document.createElement("li");
        li.style.borderBottom = "1px solid #eee";
        li.style.padding = "8px 0";
        
        // Formatar data para PT-BR
        const dataFormatada = new Date(p.dataNascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        
        li.innerHTML = `<strong>${p.nome}</strong> - 🎂 ${dataFormatada} <br> 📞 ${p.telefone}`;
        ul.appendChild(li);
    });

    elementoAlvo.appendChild(ul);
}

