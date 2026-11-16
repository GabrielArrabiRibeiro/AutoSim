# AutoSim — Simulador de Financiamento Automotivo

Aplicação web para simular o financiamento de veículos, com cálculo da parcela, total pago, total de juros e comprometimento da renda.

## Descrição

O AutoSim permite informar o veículo, o valor, a entrada, a taxa de juros mensal, a quantidade de parcelas e a renda mensal. Os resultados são exibidos dinamicamente, sem recarregar a página, em um painel com destaque para a parcela mensal.

## Objetivo

Projeto desenvolvido para uma atividade acadêmica de Front-end, demonstrando HTML5 semântico, CSS3 responsivo (mobile-first) e JavaScript moderno (ES6+) com manipulação do DOM, eventos, validação e persistência de preferências.

## Tecnologias utilizadas

- HTML5
- CSS3 (variáveis CSS, Grid, Flexbox, media queries)
- JavaScript ES6+ (sem frameworks ou bibliotecas)
- Google Fonts (Inter e Manrope), de uso opcional: sem elas, a aplicação usa fontes do sistema
- Ícones SVG inline

## Funcionalidades

- Formulário com máscara monetária em reais (R$)
- Validação completa com mensagens próximas a cada campo, acessíveis por leitores de tela
- Cálculo de parcela, total pago, total de juros e comprometimento da renda
- Indicador visual de comprometimento da renda (informativo, não é aprovação de crédito)
- Estado inicial vazio e botão "Limpar" que restaura o painel
- Modo claro e escuro, com preferência salva em `localStorage` (padrão: claro)
- Layout responsivo para celular (até 600px), tablet (601–1024px) e desktop (acima de 1024px)
- Navegação por teclado, foco visível e link "pular para o simulador"

## Estrutura de pastas

```
AutoSim/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── README.md
```

## Como executar localmente

Não há dependências nem servidor. Basta abrir o arquivo `index.html` em um navegador moderno (Chrome, Firefox, Edge ou Safari).

Opcionalmente, para servir localmente:

```bash
cd AutoSim
python3 -m http.server 8000
# acesse http://localhost:8000
```

## Cálculos utilizados

**Valor financiado** = valor do veículo − entrada

**Parcela mensal** (parcelas fixas, juros compostos):

```
PMT = PV × i / [1 − (1 + i)^(−n)]
```

- `PV`: valor financiado
- `i`: taxa mensal em decimal (taxa % ÷ 100)
- `n`: quantidade de parcelas

Com taxa igual a zero: `PMT = PV / n`.

**Total pago** = parcela × quantidade de parcelas

**Total de juros** = total pago − valor financiado

**Comprometimento da renda** = (parcela ÷ renda mensal) × 100

Os valores monetários são arredondados para duas casas decimais.

Faixas do indicador de comprometimento: até 20% (baixo), até 30% (moderado), até 40% (atenção) e acima de 40% (alto). A classificação é apenas informativa.

## Aviso

Os valores são estimativas e não representam aprovação de crédito nem proposta oficial de instituição financeira. Taxas, tarifas, seguros e impostos podem alterar as condições reais. Simulador demonstrativo.
