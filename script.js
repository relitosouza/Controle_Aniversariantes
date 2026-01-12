/*********************************************************
 * CONFIGURAÇÕES GERAIS
 *********************************************************/
const SHEET_NAME = "Página1"; 
const EMAIL_DESTINO = "ricardo.elito@gmail.com"; 

/*********************************************************
 * 1. DO GET (LER DADOS)
 *********************************************************/
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  data.shift(); 

  const pessoas = data.map(linha => ({
    nome: linha[0],
    endereco: linha[1],
    cep: linha[2],
    telefone: linha[3],
    dataNascimento: linha[4]
  }));

  return ContentService.createTextOutput(JSON.stringify(pessoas))
    .setMimeType(ContentService.MimeType.JSON);
}

/*********************************************************
 * 2. DO POST (RECEBE PEDIDOS: SALVAR OU ENVIAR EMAIL)
 *********************************************************/
function doPost(e) {
  try {
    // Tenta ler os dados. Se vier como text/plain, faz o parse manual.
    const dados = JSON.parse(e.postData.contents);
    
    // --- ROTEADOR: Verifica qual é a ação ---
    
    // CASO 1: Pedido para enviar email
    if (dados.action === "enviar_email") {
      const resultado = processarEnvioEmail();
      return ContentService.createTextOutput(JSON.stringify(resultado))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // CASO 2: Se não tem "action", assumimos que é um CADASTRO NOVO
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sheet.appendRow([
      dados.nome,
      dados.endereco,
      dados.cep,
      dados.telefone,
      dados.dataNascimento
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "cadastro_ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Retorna erro para o site se algo falhar
    return ContentService.createTextOutput(JSON.stringify({ status: "erro", msg: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/*********************************************************
 * 3. LÓGICA DE EMAIL (CORRIGIDA COM FUSO HORÁRIO)
 *********************************************************/
function processarEnvioEmail() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const dados = sheet.getDataRange().getValues();
  dados.shift(); 

  const hoje = new Date();
  hoje.setHours(0,0,0,0); // Zera hora atual

  // Define intervalo: Daqui a 7 dias até Daqui a 14 dias
  const dataInicio = new Date(hoje);
  dataInicio.setDate(hoje.getDate() + 7); 

  const dataFim = new Date(hoje);
  dataFim.setDate(hoje.getDate() + 14); 

  let aniversariantes = [];

  dados.forEach(linha => {
    const nome = linha[0];
    const dataOriginal = linha[4];
    const telefone = linha[3];

    if (!dataOriginal) return;

    const dataNasc = new Date(dataOriginal);
    
    // Usa UTC para evitar bug de dia anterior
    const mes = dataNasc.getUTCMonth(); 
    const dia = dataNasc.getUTCDate();
    
    const aniverEsteAno = new Date(dataInicio.getFullYear(), mes, dia);

    // Ajuste de virada de ano
    if (aniverEsteAno < dataInicio && dataInicio.getMonth() === 11 && mes === 0) {
      aniverEsteAno.setFullYear(dataInicio.getFullYear() + 1);
    }

    if (aniverEsteAno >= dataInicio && aniverEsteAno <= dataFim) {
      aniversariantes.push({
        nome: nome,
        data: Utilities.formatDate(aniverEsteAno, "America/Sao_Paulo", "dd/MM"),
        telefone: telefone
      });
    }
  });

  if (aniversariantes.length > 0) {
    let corpo = "📅 *ALERTA DE ANIVERSARIANTES (Próxima Semana)*\n\n";
    aniversariantes.forEach(p => {
      corpo += `🎂 ${p.nome} - ${p.data}\n📞 ${p.telefone}\n------------------\n`;
    });

    MailApp.sendEmail({
      to: EMAIL_DESTINO,
      subject: "🎉 Aniversariantes da Próxima Semana",
      body: corpo
    });
    
    return { status: "enviado", qtd: aniversariantes.length };
  } else {
    return { status: "vazio", qtd: 0 };
  }
}
