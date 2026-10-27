const blessed = require('blessed');
const fs = require('fs');
const path = require('path');
const figlet = require('figlet');
const notifier = require('node-notifier');

const filePath = path.join(__dirname, 'frases.json');

const frasesIniciais = [
  'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
  'Acredite que você pode e você já está no meio do caminho.',
  'Não espere por oportunidades, crie-as.',
  'Que o seu dia seja tão incrível quanto você!',
  'A persistência é o caminho do êxito.',
  'Você é mais forte do que imagina e mais capaz do que jamais sonhou.',
  'Pequenas atitudes geram grandes transformações.'
];

// ==========================================
// DADOS
// ==========================================

function obterFrases() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify(frasesIniciais, null, 2)
    );

    return [...frasesIniciais];
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function salvarFrase(frase) {
  const frases = obterFrases();

  frases.push(frase.trim());

  fs.writeFileSync(
    filePath,
    JSON.stringify(frases, null, 2)
  );
}

function obterFraseDoDia() {
  const frases = obterFrases();
  const hoje = new Date();

  const inicioAno = new Date(hoje.getFullYear(), 0, 1);

  const dias = Math.floor(
    (hoje - inicioAno) / 86400000
  );

  const indice = dias % frases.length;

  return frases[indice];
}

function obterDataFormatada() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// ==========================================
// TEMA
// ==========================================

const theme = {
  bg: '#1e222a',
  surface: '#282c34',
  border: '#61afef',
  primary: '#98c379',
  text: '#abb2bf',
  muted: '#5c6370',
  yellow: '#e5c07b',
  red: '#e06c75',
  purple: '#c678dd'
};

// ==========================================
// SCREEN
// ==========================================

const screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true,
  title: 'Frase do Dia',
  autoPadding: true
});

screen.program.hideCursor();

screen.style = {
  bg: theme.bg
};

// ==========================================
// CONTAINER PRINCIPAL
// ==========================================

const container = blessed.box({
  parent: screen,

  top: 'center',
  left: 'center',

  width: 76,
  height: 24,

  border: {
    type: 'line'
  },

  style: {
    bg: theme.bg,
    border: {
      fg: theme.border
    }
  }
});

// ==========================================
// HEADER
// ==========================================

const ascii = figlet.textSync('Frase do Dia', {
  font: 'Small'
});

blessed.box({
  parent: container,

  top: 1,
  left: 0,

  width: '100%-2',
  height: 6,

  content: ascii,

  align: 'center',

  style: {
    fg: theme.primary,
    bg: theme.bg
  }
});

// ==========================================
// FRASE
// ==========================================

const quoteBox = blessed.box({
  parent: container,

  top: 8,
  left: 'center',

  width: '90%',
  height: 6,

  border: {
    type: 'line'
  },

  label: ` ${obterDataFormatada()} `,

  content: '',

  align: 'center',
  valign: 'middle',

  tags: true,

  padding: {
    left: 2,
    right: 2
  },

  style: {
    bg: theme.surface,
    fg: theme.yellow,

    border: {
      fg: theme.yellow
    },

    label: {
      fg: theme.primary
    }
  }
});

// ==========================================
// MENU
// ==========================================

const menu = blessed.list({
  parent: container,

  top: 15,
  left: 'center',

  width: '80%',
  height: 5,

  keys: true,
  vi: true,
  mouse: true,

  interactive: true,

  items: [
    '  Atualizar frase',
    '  Adicionar nova frase',
    '  Agendar notificação',
    '  Sair'
  ],

  style: {
    bg: theme.bg,

    item: {
      fg: theme.text
    },

    selected: {
      bg: theme.border,
      fg: theme.bg,
      bold: true
    }
  }
});

// ==========================================
// FOOTER
// ==========================================

blessed.box({
  parent: container,

  bottom: 1,
  left: 0,

  width: '100%-2',
  height: 1,

  content: '↑/↓ Navegar  •  ENTER Selecionar  •  Q Sair',

  align: 'center',

  style: {
    fg: theme.muted,
    bg: theme.bg
  }
});

// ==========================================
// ESTADO
// ==========================================

let fraseAtual = obterFraseDoDia();
let modalAberto = false;
let modalAtual = null;
let mensagemAtual = null;

// ==========================================
// ATUALIZAÇÃO
// ==========================================

function atualizarTela() {
  quoteBox.setContent(
    `{center}${fraseAtual}{/center}`
  );

  screen.render();
}

function atualizarFrase() {
  const frases = obterFrases();

  if (frases.length === 0) return;

  if (frases.length === 1) {
    fraseAtual = frases[0];
  } else {
    const alternativas = frases.filter(
      frase => frase !== fraseAtual
    );

    fraseAtual = alternativas[
      Math.floor(Math.random() * alternativas.length)
    ];
  }

  atualizarTela();
}

// ==========================================
// MODAL BASE
// ==========================================

function criarModal(titulo, cor = theme.primary) {
  if (modalAberto) return null;

  modalAberto = true;

  menu.hide();

  const overlay = blessed.box({
    parent: screen,

    top: 0,
    left: 0,

    width: '100%',
    height: '100%',

    style: {
      bg: theme.bg
    }
  });

  const modal = blessed.box({
    parent: overlay,

    top: 'center',
    left: 'center',

    width: 62,
    height: 12,

    border: {
      type: 'line'
    },

    label: ` ${titulo} `,

    padding: {
      left: 2,
      right: 2
    },

    style: {
      bg: theme.surface,
      fg: theme.text,

      border: {
        fg: cor
      },

      label: {
        fg: cor,
        bold: true
      }
    }
  });

  modalAtual = overlay;

  return modal;
}

// ==========================================
// FECHAR MODAL
// ==========================================

function fecharModal() {
  if (!modalAberto) return;

  if (modalAtual) {
    modalAtual.destroy();
    modalAtual = null;
  }

  modalAberto = false;

  menu.show();
  menu.focus();

  screen.program.hideCursor();
  screen.render();
}

// ==========================================
// INPUT MODAL
// ==========================================

function abrirModalInput({
  titulo,
  descricao,
  cor,
  placeholder,
  onSubmit
}) {
  const modal = criarModal(titulo, cor);

  if (!modal) return;

  blessed.box({
    parent: modal,

    top: 1,
    left: 2,

    width: '100%-6',
    height: 1,

    content: descricao,

    style: {
      bg: theme.surface,
      fg: theme.text
    }
  });

  const input = blessed.textbox({
    parent: modal,

    top: 3,
    left: 2,

    width: '100%-6',
    height: 3,

    border: {
      type: 'line'
    },

    inputOnFocus: false,

    keys: true,

    mouse: true,

    style: {
      bg: theme.bg,
      fg: theme.text,

      border: {
        fg: theme.muted
      },

      focus: {
        border: {
          fg: cor
        }
      }
    }
  });

  input.setValue(placeholder || '');

  blessed.box({
    parent: modal,

    bottom: 1,
    left: 2,

    width: '100%-6',
    height: 1,

    content: 'ENTER Salvar  •  ESC Cancelar',

    align: 'center',

    style: {
      bg: theme.surface,
      fg: theme.muted
    }
  });

  input.on('submit', value => {
    fecharModal();
    onSubmit(value);
  });

  input.on('cancel', () => {
    fecharModal();
  });

  input.focus();

  screen.render();

  input.readInput();
}

// ==========================================
// ADICIONAR FRASE
// ==========================================

function abrirModalAdicionar() {
  abrirModalInput({
    titulo: 'Adicionar nova frase',

    descricao: 'Digite a frase que deseja adicionar:',

    cor: theme.primary,

    placeholder: '',

    onSubmit(value) {
      if (!value || !value.trim()) {
        exibirMensagem(
          'A frase não pode estar vazia.',
          theme.red
        );

        return;
      }

      salvarFrase(value);

      fraseAtual = value.trim();

      atualizarTela();

      exibirMensagem(
        'Frase adicionada com sucesso!',
        theme.primary
      );
    }
  });
}

// ==========================================
// NOTIFICAÇÃO
// ==========================================

function abrirModalNotificacao() {
  abrirModalInput({
    titulo: 'Agendar notificação',

    descricao: 'Receber notificação em quantos minutos?',

    cor: theme.purple,

    placeholder: '',

    onSubmit(value) {
      const minutos = Number(value);

      if (
        !Number.isFinite(minutos) ||
        minutos <= 0 ||
        minutos * 60000 > 2147483647
      ) {
        exibirMensagem(
          'Informe um tempo válido.',
          theme.red
        );

        return;
      }

      setTimeout(() => {
        notifier.notify({
          title: 'Frase do Dia',
          message: obterFraseDoDia(),
          sound: true
        });
      }, minutos * 60000);

      exibirMensagem(
        `Notificação agendada para ${minutos} min.`,
        theme.purple
      );
    }
  });
}

// ==========================================
// FEEDBACK
// ==========================================

function exibirMensagem(texto, cor = theme.primary) {
  if (mensagemAtual) {
    mensagemAtual.destroy();
  }

  const mensagem = blessed.box({
    parent: screen,

    top: 'center',
    left: 'center',

    width: 52,
    height: 5,

    border: {
      type: 'line'
    },

    content: texto,

    align: 'center',
    valign: 'middle',

    style: {
      bg: theme.surface,
      fg: cor,

      border: {
        fg: cor
      }
    }
  });

  mensagemAtual = mensagem;

  screen.render();

  setTimeout(() => {
    if (mensagemAtual === mensagem) {
      mensagem.destroy();
      mensagemAtual = null;
      screen.render();
    }
  }, 2000);
}

// ==========================================
// EVENTOS
// ==========================================

menu.on('select', (_, index) => {
  if (modalAberto) return;

  switch (index) {
    case 0:
      atualizarFrase();
      break;

    case 1:
      abrirModalAdicionar();
      break;

    case 2:
      abrirModalNotificacao();
      break;

    case 3:
      encerrar();
      break;
  }
});

// ==========================================
// SAÍDA
// ==========================================

function encerrar() {
  screen.destroy();
  process.exit(0);
}

screen.key(['C-c'], encerrar);

screen.key(['q'], () => {
  if (!modalAberto) {
    encerrar();
  }
});

screen.key(['escape'], () => {
  if (modalAberto) {
    fecharModal();
  } else {
    encerrar();
  }
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================

atualizarTela();

menu.focus();

screen.render();