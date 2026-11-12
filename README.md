# T-Fardas · Sistema de Gestão

> Um sistema feito sob medida para uma loja de fardamentos militares que precisava sair do caderno e da planilha, sem perder o jeito simples de trabalhar.

A T-Fardas vende fardamentos e artigos militares. Como em muita loja pequena, o dia a dia mistura venda no balcão, cliente que paga no carnê, mercadoria chegando e a pergunta de todo fim de mês: *"quanto entrou de verdade?"*

Este sistema nasceu para responder essa pergunta e tirar peso das costas de quem toca a loja. Ele não tenta ser um ERP gigante. A ideia é fazer bem o que a loja realmente usa, com uma tela que qualquer pessoa entende no primeiro dia.

---

## O que dá para fazer

### Painel
Assim que o sistema abre, aparece um resumo do mês: quantas vendas foram feitas, quanto foi vendido, quanto entrou no caixa e se tem alguma coisa pedindo atenção, como estoque acabando ou parcela atrasada.

### Produtos e estoque
- Cadastro com foto, descrição, preço de custo e preço de venda
- Entrada de mercadoria com observação (fornecedor, nota fiscal...)
- Aviso automático quando um produto chega no estoque mínimo
- Histórico de tudo o que entrou e saiu

### Vendas
- Carrinho com vários produtos, sem deixar vender mais do que tem em estoque
- Desconto direto no valor final
- Cartão de crédito, débito, dinheiro, PIX ou **carnê**

### Carnê
Muita loja ainda vende no carnê, e é aí que as contas costumam se perder. Aqui cada cliente tem o seu histórico:
- Parcelas com vencimento, situação (em aberto, paga, atrasada) e saldo devedor
- Registro de como e quando cada parcela foi paga
- Os clientes com parcela atrasada aparecem primeiro, para ninguém ser esquecido

### Caixa e relatórios
- Quanto **entrou de verdade** no caixa, separado por forma de pagamento
- Faturamento, lucro bruto, ticket médio e produtos mais vendidos
- Filtro por dia, mês ou qualquer período
- **Relatório em PDF** pronto para imprimir ou mandar para o contador

### Vitrine com pedido pelo WhatsApp
A loja gera uma vitrine com os produtos e manda o link para os clientes. O cliente escolhe o que quer e a quantidade, e com um toque o pedido chega pronto no WhatsApp da loja, já com os itens e o total.

A vitrine mostra só o que o cliente precisa ver: foto, nome, descrição e preço. Custo e estoque nunca saem do sistema.

### Backup
Com um clique a loja salva uma cópia de todos os dados e consegue restaurar quando precisar.

---

## Detalhes que fizeram diferença

Alguns cuidados que não aparecem à primeira vista, mas evitam dor de cabeça no dia a dia:

- **Parcelas que fecham no centavo.** R$ 100,01 em 3x vira 33,33 + 33,33 + 33,35. A conta é feita em centavos inteiros para não sumir nem sobrar dinheiro.
- **Vencimento que não pula mês.** Um carnê que vence dia 31 passa a vencer em 28/02 em fevereiro, e não em 03/03.
- **Caixa honesto.** Uma venda no carnê não entra no caixa no dia da venda. Cada parcela entra no dia em que o cliente paga, e assim o caixa mostra o dinheiro que realmente chegou.
- **Nada se perde por um clique errado.** Formulários não fecham ao clicar fora, e cancelar uma venda com parcelas já pagas mostra um aviso antes.
- **Funciona sem internet.** O sistema roda direto no navegador e guarda os dados no próprio computador.

---

## Tecnologias

- **HTML, CSS e JavaScript puro**: sem framework, leve e rápido em qualquer computador
- **localStorage** para guardar os dados no navegador
- **jsPDF + AutoTable** para os relatórios em PDF
- **Ícones SVG** próprios, em linha, seguindo a identidade visual da loja
- Layout responsivo: funciona no computador e no celular

---

## Como rodar

Não precisa instalar nada.

```bash
git clone https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
```

Depois é só abrir o arquivo `index.html` no navegador (Chrome, Edge ou Firefox).

---

## Estrutura

```
T-Fardas/
├── index.html        # estrutura da página e menu
├── css/style.css     # visual (paleta preto + bege coyote, tirada da logo)
├── js/app.js         # painel, produtos, vendas, carnê, caixa e backup
├── js/vitrine.js     # vitrine para clientes e pedido pelo WhatsApp
├── js/icones.js      # ícones SVG
├── js/logo.js        # logo embutida (usada na tela e no PDF)
└── assets/logo.png
```

---

## Em breve

O próximo passo é levar o sistema para a nuvem com o **Firebase**:

- [ ] **Hospedagem no Firebase**, com o sistema acessível por um link, de qualquer lugar
- [ ] **Dados na nuvem (Firestore)**, sem depender de um único computador
- [ ] **Acesso pelo celular**, para a loja consultar estoque e vendas de onde estiver
- [ ] **Login** para proteger os dados da loja
- [ ] **Vitrine com link fixo**: cadastrou um produto, ele já aparece para os clientes, sem precisar gerar a vitrine de novo
- [ ] **QR Code da vitrine**, para imprimir e deixar no balcão

---

## Sobre

Desenvolvido por **[Diego gobbis](https://github.com/DiegoGobbisDeveloper)** para a **T-Fardas**.


Se você tem uma loja e se identificou com esse dia a dia, ou quer trocar uma ideia sobre o projeto, fique à vontade para entrar em contato.
