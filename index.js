const readline = require('readline');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const figlet = require('figlet');
const notifier = require('node-notifier');

const filePath = path.join(__dirname, 'frases.json');

const frasesIniciais = [
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Acredite que você pode e você já está no meio do caminho.",
  "Não espere por oportunidades, crie-as.",
  "Que o seu dia seja tão incrível quanto você!",
  "A persistência é o caminho do êxito.",
  "Você é mais forte do que imagina e mais capaz do que jamais sonhou.",
  "Pequenas atitudes geram grandes transformações."
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ==========================================
// GERENCIAMENTO DE DADOS
// ==========================================
function obterFrases() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(frasesIniciais, null, 2));
    return frasesIniciais;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function salvarFraseNoArquivo(novaFrase) {
  const frases = obterFrases();
  frases.push(novaFrase.trim());
  fs.writeFileSync(filePath, JSON.stringify(frases, null, 2));
}

// ==========================================
// LÓGICA DE SORTEIO SEM REPETIÇÃO
// ==========================================
function obterNumeroDaSemana(data) {
  const primeiroDiaDoAno = new Date(data.getFullYear(), 0, 1);
  const diasPassados = Math.floor((data - primeiroDiaDoAno) / (24 * 60 * 60 * 1000));
  return Math.ceil((diasPassados + primeiroDiaDoAno.getDay() + 1) / 7);
}

function obterFraseDoDia() {
  const frases = obterFrases();
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const semana = obterNumeroDaSemana(hoje);
  const diaDaSemana = hoje.getDay();

  const sementeSemana = ano * 100 + semana;
  const indice = (sementeSemana + diaDaSemana) % frases.length;

  return {
    frase: frases[indice],
    data: hoje.toLocaleDateString("pt-BR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  };
}

// ==========================================
// FUNÇÃO DE NOTIFICAÇÃO
// ==========================================
function dispararNotificacao(frase) {
  notifier.notify({
    title: '✨ Frase do Dia Motivacional',
    message: frase,
    sound: true, // Toca som padrão do sistema
    wait: false
  });
}

// ==========================================
// INTERFACE GRÁFICA DE TERMINAL (UI)
// ==========================================
function mostrarMenu() {
  console.clear();

  console.log(
    chalk.cyan(
      figlet.textSync('Frase do Dia', { horizontalLayout: 'fitted' })
    )
  );
  console.log(chalk.gray('═'.repeat(60)));

  const { frase, data } = obterFraseDoDia();
  
  console.log(chalk.yellow(`📅  ${data}\n`));
  console.log(chalk.white.bgBlue.bold(' ✨ FRASE MOTIVACIONAL DO DIA ✨ '));
  console.log(chalk.cyan.italic(`\n   "${frase}"\n`));
  
  console.log(chalk.gray('═'.repeat(60)));
  console.log(chalk.green('[1]') + chalk.white(' Atualizar / Ver Frase do Dia'));
  console.log(chalk.green('[2]') + chalk.white(' Adicionar nova frase motivacional'));
  console.log(chalk.green('[3]') + chalk.white(' Agendar notificação personalizada (ex: daqui a X min)'));
  console.log(chalk.red('[0]') + chalk.white(' Sair'));
  console.log(chalk.gray('═'.repeat(60)));

  rl.question(chalk.magenta('\n👉 Escolha uma opção: '), (opcao) => {
    switch (opcao.trim()) {
      case '1':
        mostrarMenu();
        break;
        
      case '2':
        console.clear();
        console.log(chalk.blue.bold('\n📝 CADASTRAR NOVA FRASE\n'));
        rl.question(chalk.yellow('Digite a frase motivacional: '), (novaFrase) => {
          if (novaFrase && novaFrase.trim() !== "") {
            salvarFraseNoArquivo(novaFrase);
            console.log(chalk.green('\n✅ Frase adicionada com sucesso!'));
          } else {
            console.log(chalk.red('\n❌ Erro: A frase não pode estar vazia.'));
          }
          setTimeout(mostrarMenu, 2000);
        });
        break;

      case '3':
        console.clear();
        console.log(chalk.blue.bold('\n⏰ AGENDAR NOTIFICAÇÃO\n'));
        rl.question(chalk.yellow('Daqui a quantos minutos você quer receber a notificação? '), (minutosInput) => {
          const minutos = parseFloat(minutosInput);

          if (isNaN(minutos) || minutos <= 0) {
            console.log(chalk.red('\n❌ Por favor, digite um número válido de minutos.'));
            setTimeout(mostrarMenu, 2000);
            return;
          }

          const ms = minutos * 60 * 1000;
          console.log(chalk.yellow(`\n⏳ Notificação agendada com sucesso para daqui a ${minutos} minuto(s)!`));
          console.log(chalk.gray('Você pode continuar usando o terminal ou minimizá-lo.'));
          
          // Agenda o disparo
          setTimeout(() => {
            const dadosAtuais = obterFraseDoDia();
            dispararNotificacao(dadosAtuais.frase);
          }, ms);

          setTimeout(mostrarMenu, 4000);
        });
        break;

      case '0':
        console.log(chalk.cyan('\n✨ Tenha um dia incrível e produtivo! Até logo! ✨\n'));
        rl.close();
        break;

      default:
        console.log(chalk.red('\n❌ Opção inválida! Tente novamente.'));
        setTimeout(mostrarMenu, 1500);
        break;
    }
  });
}

// Iniciar o app
mostrarMenu();