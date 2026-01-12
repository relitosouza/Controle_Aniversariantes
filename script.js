/*********************************************************
 * FUNÇÃO DE EMAIL (CORRIGIDA COM FUSO HORÁRIO)
 *********************************************************/
function processarEnvioEmail() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const dados = sheet.getDataRange().getValues();
  dados.shift(); // Remove cabeçalho

  const hoje = new Date();
  
  // 1. DEFINIÇÃO DO INTERVALO (1 SEMANA ANTES)
  // Zera as horas de "hoje" para não ter conflito de horário atual
  hoje.setHours(0,0,0,0);

  const dataInicio = new Date(hoje);
  dataInicio.setDate(hoje.getDate() + 7); // Começa a buscar daqui a 7 dias

  const dataFim = new Date(hoje);
  dataFim.setDate(hoje.getDate() + 14); // Busca até daqui a 14 dias

  let aniversariantes = [];

  dados.forEach(linha => {
    const nome = linha[0];
    const dataOriginal = linha[4];
    const telefone = linha[3];

    if (!dataOriginal) return;

    const dataNasc = new Date(dataOriginal);
    
    // --- CORREÇÃO DO FUSO HORÁRIO ---
    // Adicionamos 12 horas para garantir que caia no meio do dia,
    // evitando que o fuso jogue para o dia anterior (ex: dia 18 as 23h)
    // Ou usamos UTC se a data vier pura. O método seguro é usar UTC:
    
    const mes = dataNasc.getUTCMonth(); 
    const dia = dataNasc.getUTCDate();
    
    // Cria o aniversário para o ano de referência (dataInicio)
    const aniverEsteAno = new Date(dataInicio.getFullYear(), mes, dia);

    // Ajuste de virada de ano (ex: busca em Dezembro para niver em Janeiro)
    if (aniverEsteAno < dataInicio && dataInicio.getMonth() === 11 && mes === 0) {
      aniverEsteAno.setFullYear(dataInicio.getFullYear() + 1);
    }

    // Verifica se cai no intervalo
    if (aniverEsteAno >= dataInicio && aniverEsteAno <= dataFim) {
      aniversariantes.push({
        nome: nome,
        telefone: telefone,
        data: Utilities.formatDate(aniverEsteAno, "America/Sao_Paulo", "dd/MM")
      });
    }
  });

  // Envia Email
  if (aniversariantes.length > 0) {
    let corpo = "📅 *ALERTA DE ANIVERSARIANTES (Daqui a 1 semana)*\n\n";
    corpo += "Prepare-se para parabenizar:\n\n";
    
    aniversariantes.forEach(p => {
      corpo += `🎂 ${p.nome} - Dia ${p.data}\n📞 ${p.telefone}\n------------------\n`;
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
