const API_URL = https://script.google.com/macros/s/AKfycbyKO-lVijHWeTDiL3tgiVj2E8DZvhrqIT47x8RgCEY7lrskPMz75YPsUiq5uhkHDtcv/exec;

let pessoas = [];

// CARREGAR DADOS AO INICIAR
window.onload = carregarDados;

function carregarDados() {
    fetch(API_URL)
        .then(r => r.json())
        .then(data => pessoas = data);
}

// CADASTRO
document.getElementById("formCadastro").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;

    const pessoa = {
        nome: form.nome.value,
        endereco: form.endereco.value,
        cep: form.cep.value,
        telefone: form.telefone.value,
        dataNascimento: form.data_nascimento.value
    };

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(pessoa)
    })
    .then(() => {
        alert("Cadastro salvo!");
        form.reset();
        carregarDados();
    });
});

// PESQUISA POR DATA
document.querySelectorAll("button")[1].onclick = function () {
    const data = document.getElementById("dataPesquisa").value;
    const resultado = document.querySelectorAll(".resultado")[0];

    if (!data) {
        resultado.innerHTML = "Selecione uma data.";
        return;
    }

    const mmdd = data.slice(5);

    const filtrados = pessoas.filter(p =>
        p.dataNascimento.slice(5) === mmdd
    );

    resultado.innerHTML = filtrados.length
        ? filtrados.map(p => `🎉 ${p.nome}`).join("<br>")
        : "Nenhum aniversariante.";
};

// RELATÓRIO SEMANAL
document.querySelectorAll("button")[2].onclick = function () {
    const resultado = document.querySelectorAll(".resultado")[1];

    const hoje = new Date();
    const fim = new Date();
    fim.setDate(hoje.getDate() + 7);

    const semana = pessoas.filter(p => {
        const d = new Date(p.dataNascimento);
        d.setFullYear(hoje.getFullYear());
        return d >= hoje && d <= fim;
    });

    resultado.innerHTML = semana.length
        ? semana.map(p => `🎂 ${p.nome}`).join("<br>")
        : "Nenhum aniversariante esta semana.";
};

function enviarRelatorioSemanal() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Página1");
  const dados = sheet.getDataRange().getValues();
  dados.shift(); // remove cabeçalho

  const hoje = new Date();
  const fimSemana = new Date();
  fimSemana.setDate(hoje.getDate() + 7);

  let aniversariantes = [];

  dados.forEach(linha => {
    const nome = linha[0];
    const dataNasc = new Date(linha[4]);

    dataNasc.setFullYear(hoje.getFullYear());

    if (dataNasc >= hoje && dataNasc <= fimSemana) {
      aniversariantes.push({
        nome,
        data: Utilities.formatDate(dataNasc, "America/Sao_Paulo", "dd/MM")
      });
    }
  });

  let corpoEmail = "📅 Relatório semanal de aniversariantes\n\n";

  if (aniversariantes.length === 0) {
    corpoEmail += "Nenhum aniversariante esta semana.";
  } else {
    aniversariantes.forEach(p =>
      corpoEmail += `🎂 ${p.nome} - ${p.data}\n`
    );
  }

  MailApp.sendEmail({
    to: EMAIL_DESTINO,
    subject: "🎉 Aniversariantes da Semana",
    body: corpoEmail
  });
}



