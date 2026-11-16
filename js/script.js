/* ==========================================================================
   AutoSim — Lógica da aplicação
   Organização: utilitários > tema > cálculo > validação > interface > eventos
   ========================================================================== */

(() => {
  'use strict';

  /* ---------- Constantes ---------- */
  const THEME_KEY = 'autosim-theme';
  const DEFAULT_THEME = 'light';
  const VALID_INSTALLMENTS = [12, 24, 36, 48, 60, 72];
  const MAX_MONEY_DIGITS = 12;

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const percentFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  /* ---------- Referências do DOM ---------- */
  const $ = (id) => document.getElementById(id);

  const els = {
    html: document.documentElement,
    themeToggle: $('theme-toggle'),
    menuToggle: $('menu-toggle'),
    nav: $('main-nav'),
    form: $('simulation-form'),
    clearButton: $('clear-button'),
    resultsEmpty: $('results-empty'),
    resultsContent: $('results-content'),
    fields: {
      vehicleName: $('vehicle-name'),
      vehiclePrice: $('vehicle-price'),
      downPayment: $('down-payment'),
      interestRate: $('interest-rate'),
      installments: $('installments'),
      monthlyIncome: $('monthly-income')
    }
  };

  /* ==========================================================================
     Utilitários numéricos e monetários
     ========================================================================== */

  /** Arredonda para duas casas decimais (centavos). */
  const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

  /** Converte texto monetário ("R$ 1.234,56") em número (1234.56). Retorna NaN se vazio. */
  function parseCurrency(text) {
    const digits = String(text).replace(/\D/g, '');
    if (digits === '') return NaN;
    return Number(digits) / 100;
  }

  const formatCurrency = (value) => currencyFormatter.format(value);

  /** Máscara de entrada: mantém apenas dígitos e formata como moeda enquanto o usuário digita. */
  function applyMoneyMask(input) {
    const digits = input.value.replace(/\D/g, '').slice(0, MAX_MONEY_DIGITS);
    input.value = digits === '' ? '' : formatCurrency(Number(digits) / 100);
  }

  /* ==========================================================================
     Tema
     ========================================================================== */

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'dark' || saved === 'light' ? saved : DEFAULT_THEME;
    } catch (error) {
      return DEFAULT_THEME;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      /* Armazenamento indisponível: o tema vale apenas para esta sessão. */
    }
  }

  function applyTheme(theme) {
    els.html.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    els.themeToggle.setAttribute('aria-pressed', String(isDark));
    els.themeToggle.setAttribute(
      'aria-label',
      isDark ? 'Alternar para o modo claro' : 'Alternar para o modo escuro'
    );
  }

  function toggleTheme() {
    const next = els.html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  }

  /* ==========================================================================
     Cálculo do financiamento
     ========================================================================== */

  /**
   * Calcula as condições do financiamento (tabela Price: parcelas fixas, juros compostos).
   * @param {{price:number, downPayment:number, monthlyRate:number, installments:number, income:number}} data
   * monthlyRate em porcentagem (ex.: 1.49).
   */
  function calculateFinancing({ price, downPayment, monthlyRate, installments, income }) {
    const financed = roundMoney(price - downPayment);
    const i = monthlyRate / 100;
    let payment;

    if (financed <= 0) {
      payment = 0;
    } else if (i === 0) {
      payment = financed / installments;
    } else {
      payment = (financed * i) / (1 - Math.pow(1 + i, -installments));
    }

    payment = roundMoney(payment);
    const totalPaid = roundMoney(payment * installments);
    const totalInterest = financed > 0 ? roundMoney(totalPaid - financed) : 0;
    const commitment = (payment / income) * 100;

    return { financed, payment, totalPaid, totalInterest, commitment };
  }

  /** Classifica o comprometimento da renda (apenas informativo, não é análise de crédito). */
  function getCommitmentLevel(percent) {
    if (percent <= 20) {
      return {
        key: 'low',
        label: 'Baixo',
        text: 'A parcela representa uma fatia pequena da sua renda, deixando boa folga no orçamento mensal.'
      };
    }
    if (percent <= 30) {
      return {
        key: 'moderate',
        label: 'Moderado',
        text: 'A parcela ocupa uma parte relevante da renda. Vale considerar os demais gastos fixos do mês.'
      };
    }
    if (percent <= 40) {
      return {
        key: 'attention',
        label: 'Atenção',
        text: 'A parcela compromete boa parte da renda. Aumentar a entrada ou reduzir o valor do veículo pode ajudar.'
      };
    }
    return {
      key: 'high',
      label: 'Alto',
      text: 'A parcela compromete grande parte da renda. Considere uma entrada maior, outro prazo ou um veículo mais barato.'
    };
  }

  /* ==========================================================================
     Validação
     ========================================================================== */

  /** Lê e converte os valores atuais do formulário. */
  function readFormValues() {
    const f = els.fields;
    return {
      name: f.vehicleName.value.trim(),
      price: parseCurrency(f.vehiclePrice.value),
      downPayment: parseCurrency(f.downPayment.value),
      rateRaw: f.interestRate.value.trim(),
      monthlyRate: f.interestRate.valueAsNumber,
      installments: Number(f.installments.value),
      income: parseCurrency(f.monthlyIncome.value)
    };
  }

  /** Cada validador devolve uma mensagem de erro ou string vazia. */
  const validators = {
    vehicleName(v) {
      if (v.name === '') return 'Informe o nome e o modelo do veículo.';
      if (v.name.length < 2) return 'O nome do veículo deve ter pelo menos 2 caracteres.';
      return '';
    },
    vehiclePrice(v) {
      if (Number.isNaN(v.price)) return 'Informe o valor do veículo.';
      if (v.price <= 0) return 'O valor do veículo deve ser maior que zero.';
      return '';
    },
    downPayment(v) {
      if (Number.isNaN(v.downPayment)) return 'Informe o valor da entrada (use R$ 0,00 se não houver).';
      if (v.downPayment < 0) return 'A entrada não pode ser negativa.';
      if (!Number.isNaN(v.price) && v.downPayment > v.price) {
        return 'A entrada não pode ser maior que o valor do veículo.';
      }
      return '';
    },
    interestRate(v) {
      if (v.rateRaw === '' || Number.isNaN(v.monthlyRate)) return 'Informe a taxa de juros mensal (use 0 se não houver juros).';
      if (v.monthlyRate < 0) return 'A taxa de juros não pode ser negativa.';
      if (v.monthlyRate > 100) return 'A taxa mensal deve ser de no máximo 100%.';
      return '';
    },
    installments(v) {
      if (!VALID_INSTALLMENTS.includes(v.installments)) return 'Selecione a quantidade de parcelas.';
      return '';
    },
    monthlyIncome(v) {
      if (Number.isNaN(v.income)) return 'Informe sua renda mensal.';
      if (v.income <= 0) return 'A renda mensal deve ser maior que zero.';
      return '';
    }
  };

  function getErrorElement(input) {
    return $(`${input.id}-error`);
  }

  function showFieldError(input, message) {
    const errorEl = getErrorElement(input);
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(input) {
    const errorEl = getErrorElement(input);
    errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  /** Valida um único campo e atualiza a interface. Retorna true se válido. */
  function validateField(key) {
    const input = els.fields[key];
    const message = validators[key](readFormValues());
    if (message) {
      showFieldError(input, message);
      return false;
    }
    clearFieldError(input);
    return true;
  }

  /** Valida o formulário inteiro e foca o primeiro campo inválido. */
  function validateForm() {
    let firstInvalid = null;
    Object.keys(validators).forEach((key) => {
      if (!validateField(key) && !firstInvalid) firstInvalid = els.fields[key];
    });
    if (firstInvalid) firstInvalid.focus();
    return firstInvalid === null;
  }

  /* ==========================================================================
     Interface de resultados
     ========================================================================== */

  /** Cria um elemento com classe e texto (sempre via textContent). */
  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function createResultItem(label, value, modifier) {
    const row = createEl('div', modifier ? `result-item ${modifier}` : 'result-item');
    row.append(createEl('dt', '', label), createEl('dd', '', value));
    return row;
  }

  function buildHighlight(result, installments) {
    const box = createEl('div', 'highlight');
    box.append(
      createEl('p', 'highlight-label', 'Valor da parcela mensal'),
      createEl('p', 'highlight-value', formatCurrency(result.payment)),
      createEl('p', 'highlight-note', `em ${installments}x fixas`)
    );
    return box;
  }

  function buildResultList(data, result) {
    const list = createEl('dl', 'result-list');
    list.append(
      createResultItem('Valor do veículo', formatCurrency(data.price)),
      createResultItem('Entrada', formatCurrency(data.downPayment)),
      createResultItem('Valor financiado', formatCurrency(result.financed), 'is-financed'),
      createResultItem('Quantidade de parcelas', `${data.installments} meses`),
      createResultItem('Taxa de juros mensal', `${percentFormatter.format(data.monthlyRate)}% a.m.`),
      createResultItem('Total pago', formatCurrency(result.totalPaid)),
      createResultItem('Total de juros', formatCurrency(result.totalInterest), 'is-interest')
    );
    return list;
  }

  function buildCommitment(percent) {
    const level = getCommitmentLevel(percent);
    const box = createEl('div', `commitment level-${level.key}`);

    const head = createEl('div', 'commitment-head');
    head.append(
      createEl('span', 'commitment-title', 'Comprometimento da renda'),
      createEl('span', 'badge', level.label)
    );

    const meter = createEl('div', 'meter');
    meter.setAttribute('role', 'progressbar');
    meter.setAttribute('aria-label', 'Comprometimento da renda mensal');
    meter.setAttribute('aria-valuemin', '0');
    meter.setAttribute('aria-valuemax', '100');
    meter.setAttribute('aria-valuenow', String(Math.min(100, Math.round(percent))));
    meter.setAttribute('aria-valuetext', `${percentFormatter.format(percent)}%`);
    const fill = createEl('div', 'meter-fill');
    fill.style.width = `${Math.min(100, percent)}%`;
    meter.append(fill);

    box.append(
      head,
      createEl('p', 'commitment-value', `${percentFormatter.format(percent)}%`),
      meter,
      createEl('p', 'commitment-text', level.text)
    );
    return box;
  }

  /** Monta e exibe o painel de resultados. */
  function renderResults(data, result) {
    const container = els.resultsContent;
    container.replaceChildren();

    const vehicle = createEl('p', 'result-vehicle');
    vehicle.append('Veículo: ', createEl('strong', '', data.name));

    container.append(
      vehicle,
      buildHighlight(result, data.installments),
      buildResultList(data, result),
      buildCommitment(result.commitment),
      createEl(
        'p',
        'result-disclaimer',
        'Estimativa informativa. Não representa aprovação de crédito nem proposta oficial.'
      )
    );

    els.resultsEmpty.hidden = true;
    container.hidden = false;
  }

  function resetResults() {
    els.resultsContent.replaceChildren();
    els.resultsContent.hidden = true;
    els.resultsEmpty.hidden = false;
  }

  /* ==========================================================================
     Ações do formulário
     ========================================================================== */

  function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) {
      resetResults();
      return;
    }
    const data = readFormValues();
    const result = calculateFinancing(data);
    renderResults(data, result);

    // Em telas pequenas, leva o usuário até o resultado.
    if (window.matchMedia('(max-width: 1024px)').matches) {
      els.resultsContent.closest('.results-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function clearForm() {
    els.form.reset();
    Object.values(els.fields).forEach(clearFieldError);
    resetResults();
    els.fields.vehicleName.focus();
  }

  function toggleMenu() {
    const open = els.nav.classList.toggle('is-open');
    els.menuToggle.setAttribute('aria-expanded', String(open));
    els.menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  function closeMenu() {
    els.nav.classList.remove('is-open');
    els.menuToggle.setAttribute('aria-expanded', 'false');
    els.menuToggle.setAttribute('aria-label', 'Abrir menu');
  }

  /* ==========================================================================
     Eventos
     ========================================================================== */

  function bindEvents() {
    els.themeToggle.addEventListener('click', toggleTheme);
    els.menuToggle.addEventListener('click', toggleMenu);
    els.nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    els.form.addEventListener('submit', handleSubmit);
    els.clearButton.addEventListener('click', clearForm);

    // Máscara monetária e revalidação de campos que já exibem erro
    els.form.querySelectorAll('[data-money]').forEach((input) => {
      input.addEventListener('input', () => applyMoneyMask(input));
    });

    Object.entries(els.fields).forEach(([key, input]) => {
      const revalidate = () => {
        if (input.hasAttribute('aria-invalid')) validateField(key);
      };
      input.addEventListener('input', revalidate);
      input.addEventListener('change', revalidate);
      input.addEventListener('blur', () => {
        if (input.value !== '') validateField(key);
      });
    });

    // Preço e entrada dependem um do outro
    els.fields.vehiclePrice.addEventListener('input', () => {
      if (els.fields.downPayment.hasAttribute('aria-invalid')) validateField('downPayment');
    });
  }

  /* ---------- Inicialização ---------- */
  applyTheme(getSavedTheme());
  bindEvents();
})();
