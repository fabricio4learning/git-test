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
  bg: 'default',
  fg: 'default',

  primary: '#8FBC9F',
  secondary: '#6B7280',
  muted: '#9CA3AF',

  accent: '#A3BE8C',
  quote: '#D8C49A',

  error: '#BF8888'
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

// ==========================================
// CONTAINER PRINCIPAL
// ==========================================

const container = blessed.box({
  parent: screen,

  top: 'center',
  left: 'center',

  width: 76,
  height: 26,

  border: {
    type: 'line'
  },

  style: {
    bg: theme.bg,
    fg: theme.fg,

    border: {
      fg: theme.primary
    }
  }
});

// ==========================================
// HEADER
// ==========================================

const ascii = figlet.textSync('Frase do Dia', {
  font: 'Small'
});

const header = blessed.box({
  parent: container,

  top: 1,
  left: 'center',

  width: '100%-2',
  height: 6,

  content: ascii,

  align: 'center',

  style: {
    bg: theme.bg,
    fg: theme.primary
  }
});

// ==========================================
// FRASE DO DIA
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
    bg: theme.bg,
    fg: theme.quote,

    border: {
      fg: theme.secondary
    },

    label: {
      fg: theme.primary
    }
  }
});

// ==========================================
// MENU
// ==========================================

const menuItems = [
  'Atualizar frase',
  'Adicionar nova frase',
  'Agendar notificação',
  'Sair'
];

const menu = blessed.list({
  parent: container,

  top: 15,
  left: 'center',

  width: '70%',
  height: 5,

  keys: true,
  vi: true,
  mouse: true,

  interactive: true,

  items: menuItems.map(item => `  ❯ ${item}`),

  style: {
    bg: 'default',
    fg: theme.fg,

    item: {
      bg: 'default',
      fg: theme.muted
    },

    selected: {
      bg: 'default',
      fg: theme.accent,
      bold: true
    }
  }
});

// ==========================================
// FOOTER
// ==========================================

const footer = blessed.box({
  parent: container,

  bottom: 2,
  left: 'center',

  width: '100%-2',
  height: 1,

  content:
    '↑/↓ Navegar  •  ENTER Selecionar  •  ESC Sair',

  align: 'center',

  style: {
    bg: theme.bg,
    fg: theme.muted
  }
});

// ==========================================
// STATUS BAR
// ==========================================

const statusBar = blessed.box({
  parent: container,

  bottom: 0,
  left: 'center',

  width: '100%-4',
  height: 1,

  content: '',

  align: 'center',

  tags: true,

  style: {
    bg: 'default',
    fg: theme.muted
  }
});

// ==========================================
// ESTADO
// ==========================================

let fraseAtual = obterFraseDoDia();

let modalAberto = false;
let modalAtual = null;

// ==========================================
// ATUALIZAR FRASE
// ==========================================

function atualizarTela() {
  quoteBox.setContent(
    `{center}"${fraseAtual}"{/center}`
  );

  screen.render();
}

function atualizarFrase() {
  const frases = obterFrases();

  if (frases.length === 0) return;

  const alternativas = frases.filter(
    frase => frase !== fraseAtual
  );

  if (alternativas.length > 0) {
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

  const modal = blessed.box({
    parent: screen,

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
      bg: theme.bg,
      fg: theme.fg,

      border: {
        fg: cor
      },

      label: {
        fg: cor,
        bold: true
      }
    }
  });

  modalAtual = modal;

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

  screen.render();
}

// ==========================================
// MODAL DE INPUT
// ==========================================

function abrirModalInput({
  titulo,
  descricao,
  cor,
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
      bg: theme.bg,
      fg: theme.muted
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
      fg: theme.fg,

      border: {
        fg: theme.secondary
      },

      focus: {
        border: {
          fg: cor
        }
      }
    }
  });

  blessed.box({
    parent: modal,

    bottom: 1,
    left: 2,

    width: '100%-6',
    height: 1,

    content: 'ENTER Salvar  •  ESC Cancelar',

    align: 'center',

    style: {
      bg: theme.bg,
      fg: theme.muted
    }
  });

  input.on('submit', value => {
    fecharModal();
    onSubmit(value);
  });

  input.on('cancel', fecharModal);

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

    onSubmit(value) {
      if (!value || !value.trim()) {
        exibirMensagem(
          'A frase não pode estar vazia.',
          theme.error
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
// AGENDAR NOTIFICAÇÃO
// ==========================================

function abrirModalNotificacao() {
  abrirModalInput({
    titulo: 'Agendar notificação',

    descricao: 'Receber notificação em quantos minutos?',

    cor: theme.accent,

    onSubmit(value) {
      const minutos = Number(value);

      if (
        !Number.isFinite(minutos) ||
        minutos <= 0 ||
        minutos * 60000 > 2147483647
      ) {
        exibirMensagem(
          'Informe um tempo válido.',
          theme.error
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
        theme.accent
      );
    }
  });
}

// ==========================================
// FEEDBACK
// ==========================================

let mensagemTimeout = null;

function exibirMensagem(texto, tipo = 'success') {
  const estilos = {
    success: {
      icone: '✓',
      cor: theme.primary
    },
    error: {
      icone: '✗',
      cor: theme.error
    },
    info: {
      icone: '●',
      cor: theme.muted
    }
  };

  const estilo = estilos[tipo] || estilos.info;

  if (mensagemTimeout) {
    clearTimeout(mensagemTimeout);
  }

  statusBar.setContent(`${estilo.icone} ${texto}`);
  statusBar.style.fg = estilo.cor;

  screen.render();

  mensagemTimeout = setTimeout(() => {
    statusBar.setContent('');
    screen.render();
    mensagemTimeout = null;
  }, 3000);
}

// ==========================================
// EVENTOS DO MENU
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
  if (!modalAberto) encerrar();
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

menu.select(0);
menu.focus();

screen.render();