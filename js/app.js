/* ================= CONFIGURAÇÃO ================= */
const LOJA = 'T-Fardas';            // nome que aparece no sistema e no PDF
const KEY  = 'tfardas_estoque_v1';  // chave do localStorage
const WHATS_LOJA = '(34) 99973-8747'; // WhatsApp padrão que recebe os pedidos da vitrine
const PAGTOS = { credito:'Cartão de Crédito', debito:'Cartão de Débito', dinheiro:'Dinheiro', pix:'PIX', carne:'Carnê' };

/* ================= UTILITÁRIOS ================= */
const $ = s => document.querySelector(s);
const main = $('#main');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const brl = v => Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const diaLocal = d => { const x = new Date(d); return new Date(x - x.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
const hoje = () => diaLocal(new Date());
const fmtDia = iso => iso ? iso.slice(0,10).split('-').reverse().join('/') : '';
const fmtDataHora = iso => new Date(iso).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' });
// Soma meses sem "pular" mês: 31/01 + 1 mês = 28/02 (e não 03/03)
const addMes = (iso, n) => {
  const [y,m,d] = iso.split('-').map(Number);
  const ultimo = new Date(y, m-1+n+1, 0).getDate();
  return diaLocal(new Date(y, m-1+n, Math.min(d, ultimo)));
};
const chaveCli = n => n.trim().toLowerCase();

function toast(msg, tipo = '') {
  const el = document.createElement('div');
  el.className = 't ' + tipo;
  el.innerHTML = ico(tipo ? 'alerta' : 'ok');
  el.append(msg);   // mensagem entra como texto puro
  $('#toast').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
function modal(html) { $('#modal').innerHTML = `<div class="caixa-modal">${html}</div>`; $('#modal').classList.add('aberto'); }
function fecharModal() { $('#modal').classList.remove('aberto'); }
// Clique fora fecha o modal, menos quando há formulário (para não perder o que foi digitado)
$('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal' && !$('#modal form')) fecharModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal').classList.contains('aberto')) fecharModal(); });

/* ================= BANCO DE DADOS (localStorage) ================= */
const vazio = () => ({ produtos:[], vendas:[], movimentos:[], config:{} });
let db = (() => { try { return { ...vazio(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return vazio(); } })();

function salvar() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { toast('Armazenamento cheio! Salve um backup e use fotos menores.', 'erro'); }
  atualizarBadges();
}
// Registra entradas e saídas de estoque
function mov(p, tipo, qtd, obs) {
  db.movimentos.push({ id:uid(), data:new Date().toISOString(), produtoId:p.id, nome:p.nome, tipo, qtd, obs });
}
const estoqueBaixo = () => db.produtos.filter(p => p.qtd <= p.minimo);
const parcelasAtrasadas = () => db.vendas.flatMap(v => v.parcelas || []).filter(p => !p.pago && p.venc < hoje());

function atualizarBadges() {
  const b = estoqueBaixo().length, a = parcelasAtrasadas().length;
  $('#bProd').hidden = !b; $('#bProd').textContent = b;
  $('#bCli').hidden  = !a; $('#bCli').textContent  = a;
}

/* ================= NAVEGAÇÃO ================= */
const telas = { painel:telaPainel, clientes:telaClientes, produtos:telaProdutos, vitrine:telaVitrine, vendas:telaVendas, caixa:telaCaixa };
function ir(t) {
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('ativo', b.dataset.tela === t));
  telas[t]();
  window.scrollTo(0, 0);
}
document.querySelectorAll('.nav button').forEach(b => b.onclick = () => ir(b.dataset.tela));

/* =====================================================
   PAINEL INICIAL
   ===================================================== */
function telaPainel() {
  const h = hoje(), ini = h.slice(0, 8) + '01';
  const M = dadosPeriodo(ini, h);   // mês atual
  const H = dadosPeriodo(h, h);     // hoje
  const mes = new Date().toLocaleDateString('pt-BR', { month:'long', year:'numeric' });
  const hora = new Date().getHours();
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const baixos = estoqueBaixo().length, atras = parcelasAtrasadas().length;
  const ultimas = db.vendas.slice(-5).reverse();

  main.innerHTML = `
    <div class="fundo-marca"><div class="marca"></div></div>
    <div class="painel-ini">
      <header class="topo"><div><h1>${saud}!</h1>
        <p>${new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })}</p></div></header>

      <div class="hero">
        <div>
          <div class="rot">Vendas em ${mes}</div>
          <div class="grande">${M.vendas.length}<small>venda(s)</small></div>
        </div>
        <div class="lado">
          <div><span>Vendido no mês</span><b>${brl(M.fat)}</b></div>
          <div><span>Entrou no caixa</span><b>${brl(M.entrou)}</b></div>
          <div><span>Vendas hoje</span><b>${H.vendas.length} · ${brl(H.fat)}</b></div>
        </div>
      </div>

      <div class="kpis">
        <div class="kpi atalho" onclick="ir('produtos')"><span>Produtos cadastrados</span><b>${db.produtos.length}</b></div>
        <div class="kpi atalho" onclick="ir('produtos')"><span>Estoque baixo</span><b style="color:${baixos ? 'var(--erro)' : 'var(--ok)'}">${baixos}</b></div>
        <div class="kpi atalho" onclick="ir('clientes')"><span>Parcelas atrasadas</span><b style="color:${atras ? 'var(--erro)' : 'var(--ok)'}">${atras}</b></div>
        <div class="kpi atalho" onclick="ir('clientes')"><span>Carnê a receber</span><b>${brl(M.aReceber)}</b></div>
      </div>

      <section class="painel">
        <h2>Últimas vendas</h2>
        ${ultimas.length ? ultimas.map(v => `
          <div class="vitem">
            <div><b>${esc(v.cliente) || 'Cliente não informado'}</b>
              <div class="meta">${fmtDataHora(v.data)} · ${v.itens.map(i => `${i.qtd}× ${esc(i.nome)}`).join(', ')}</div></div>
            <div class="val"><b>${brl(v.total)}</b><span class="pill ${v.pagamento}">${PAGTOS[v.pagamento]}</span></div>
          </div>`).join('') : '<p class="custo">Nenhuma venda ainda. Vá em <b>Vendas</b> para lançar a primeira.</p>'}
      </section>
    </div>`;
}

/* =====================================================
   PRODUTOS
   ===================================================== */
function telaProdutos() {
  main.innerHTML = `
    <header class="topo">
      <div><h1>Produtos</h1><p>${db.produtos.length} produto(s) cadastrado(s)</p></div>
      <div class="acoes">
        <input id="busca" class="busca" type="search" placeholder="Buscar produto...">
        <button class="btn" onclick="formProduto()">+ Novo produto</button>
      </div>
    </header>
    <div class="grid" id="grid"></div>`;
  $('#busca').oninput = e => renderGrid(e.target.value);
  renderGrid('');
}

function renderGrid(filtro) {
  const f = filtro.toLowerCase();
  const lista = db.produtos.filter(p => p.nome.toLowerCase().includes(f) || p.descricao.toLowerCase().includes(f));
  $('#grid').innerHTML = lista.length ? lista.map(cardProduto).join('')
    : `<div class="vazio">${db.produtos.length ? 'Nenhum produto encontrado.' : 'Nenhum produto ainda. Clique em <b>+ Novo produto</b> para começar.'}</div>`;
}

function cardProduto(p) {
  const baixo = p.qtd <= p.minimo;
  return `
  <div class="card ${baixo ? 'baixo' : ''}">
    <div class="img">
      ${p.img ? `<img src="${esc(p.img)}" alt="">` : 'Sem foto'}
      ${baixo ? `<span class="tag">${p.qtd === 0 ? 'ESGOTADO' : 'ESTOQUE BAIXO'}</span>` : ''}
    </div>
    <div class="info">
      <h3>${esc(p.nome)}</h3>
      <p class="desc">${esc(p.descricao) || '&nbsp;'}</p>
      <div class="precos"><span class="venda">${brl(p.venda)}</span><span class="custo">custo ${brl(p.custo)}</span></div>
      <div class="estoque">Estoque: <b>${p.qtd}</b> un. <span class="custo">(mín. ${p.minimo})</span></div>
      <div class="cbtns">
        <button onclick="entradaEstoque('${p.id}')">+ Entrada</button>
        <button onclick="formProduto('${p.id}')">Editar</button>
        <button class="del" onclick="excluirProduto('${p.id}')">Excluir</button>
      </div>
    </div>
  </div>`;
}

let imgTemp = null;
function formProduto(id) {
  const p = db.produtos.find(x => x.id === id) || { nome:'', descricao:'', qtd:0, minimo:3, custo:'', venda:'', img:null };
  imgTemp = p.img;
  modal(`
    <h2>${id ? 'Editar produto' : 'Novo produto'}</h2>
    <form id="fp">
      <label class="upload"><span id="prev">${p.img ? `<img src="${esc(p.img)}">` : ico('foto') + ' Clique para adicionar a foto'}</span>
        <input type="file" accept="image/*" id="fimg" hidden></label>
      <label>Nome do produto<input name="nome" required value="${esc(p.nome)}" placeholder="Ex: Camisa polo azul M"></label>
      <label>Descrição<textarea name="descricao" rows="2" placeholder="Detalhes, tamanho, cor...">${esc(p.descricao)}</textarea></label>
      <div class="linha">
        <label>Quantidade<input name="qtd" type="number" min="0" required value="${p.qtd}"></label>
        <label>Avisar quando chegar a<input name="minimo" type="number" min="0" required value="${p.minimo}"></label>
      </div>
      <div class="linha">
        <label>Valor de custo (R$)<input name="custo" type="number" step="0.01" min="0" required value="${p.custo}"></label>
        <label>Valor de venda (R$)<input name="venda" type="number" step="0.01" min="0" required value="${p.venda}"></label>
      </div>
      <div class="mbtns"><button type="button" class="sec" onclick="fecharModal()">Cancelar</button><button class="btn">Salvar</button></div>
    </form>`);

  $('#fimg').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    imgTemp = await reduzirImagem(f);
    $('#prev').innerHTML = `<img src="${imgTemp}">`;
  };

  $('#fp').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const dados = { nome:d.nome.trim(), descricao:d.descricao.trim(), qtd:+d.qtd, minimo:+d.minimo, custo:+d.custo, venda:+d.venda, img:imgTemp };
    if (id) {
      const p = db.produtos.find(x => x.id === id);
      const dif = dados.qtd - p.qtd;
      Object.assign(p, dados);
      if (dif) mov(p, dif > 0 ? 'entrada' : 'saida', Math.abs(dif), 'Ajuste manual');
    } else {
      const novo = { id:uid(), ...dados };
      db.produtos.push(novo);
      if (novo.qtd) mov(novo, 'entrada', novo.qtd, 'Cadastro inicial');
    }
    salvar(); fecharModal(); toast('Produto salvo'); telaProdutos();
  };
}

// Reduz a foto para no máx. 500px e JPEG: economiza espaço no navegador
function reduzirImagem(file, max = 500) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.75));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

function entradaEstoque(id) {
  const p = db.produtos.find(x => x.id === id);
  modal(`
    <h2>Entrada de estoque</h2>
    <p style="margin-bottom:14px">${esc(p.nome)} — estoque atual: <b>${p.qtd}</b></p>
    <form id="fe">
      <label>Quantidade recebida<input name="q" type="number" min="1" required autofocus></label>
      <label>Observação<input name="obs" placeholder="Ex: fornecedor, nota fiscal"></label>
      <div class="mbtns"><button type="button" class="sec" onclick="fecharModal()">Cancelar</button><button class="btn">Adicionar</button></div>
    </form>`);
  $('#fe').onsubmit = e => {
    e.preventDefault();
    const q = +e.target.q.value;
    p.qtd += q;
    mov(p, 'entrada', q, e.target.obs.value.trim() || 'Entrada de mercadoria');
    salvar(); fecharModal(); toast(`+${q} un. de ${p.nome}`); telaProdutos();
  };
}

function excluirProduto(id) {
  const p = db.produtos.find(x => x.id === id);
  if (!confirm(`Excluir "${p.nome}"? As vendas já lançadas continuam no histórico.`)) return;
  db.produtos = db.produtos.filter(x => x.id !== id);
  salvar(); toast('Produto excluído'); telaProdutos();
}

/* =====================================================
   VENDAS
   ===================================================== */
let carrinho = [];
function telaVendas() {
  carrinho = [];
  const clientes = [...new Set(db.vendas.map(v => v.cliente).filter(Boolean))];
  const disp = db.produtos.filter(p => p.qtd > 0);
  main.innerHTML = `
    <header class="topo"><div><h1>Vendas</h1><p>Lance as vendas da loja</p></div></header>
    <div class="duas">
      <section class="painel">
        <h2>Nova venda</h2>
        <form id="fv">
          <label>Nome do cliente<input name="cliente" list="lcli" placeholder="Opcional (obrigatório no carnê)"></label>
          <datalist id="lcli">${clientes.map(c => `<option value="${esc(c)}">`).join('')}</datalist>

          <div class="linha">
            <label>Produto
              <select id="selp">${disp.length
                ? disp.map(p => `<option value="${p.id}">${esc(p.nome)} — ${brl(p.venda)} (${p.qtd} em estoque)</option>`).join('')
                : '<option value="">Nenhum produto com estoque</option>'}</select>
            </label>
            <label class="peq">Qtd<input id="qtdp" type="number" min="1" step="1" value="1"></label>
            <button type="button" class="btn" id="addp">Adicionar</button>
          </div>
          <div id="carrinho" class="carr"></div>

          <label>Valor da compra (R$) <small style="font-weight:400">— calculado automaticamente, pode dar desconto</small>
            <input name="total" id="total" type="number" step="0.01" min="0.01"></label>

          <div class="lbl">Forma de pagamento</div>
          <div class="pagtos">${Object.entries(PAGTOS).map(([k, v], i) =>
            `<label class="chip"><input type="radio" name="pagamento" value="${k}" ${i === 0 ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div>

          <div id="carneBox" hidden>
            <div class="linha">
              <label>Telefone<input name="telefone" placeholder="(34) 9...." disabled></label>
              <label class="peq">Parcelas<input name="nparc" type="number" min="1" max="24" step="1" value="3" required disabled></label>
            </div>
            <label>1º vencimento<input name="venc" type="date" value="${addMes(hoje(), 1)}" required disabled></label>
          </div>

          <button class="btn grande">${ico('ok')} Finalizar venda</button>
        </form>
      </section>

      <section class="painel">
        <h2>Vendas lançadas</h2>
        <input id="bv" class="busca" type="search" placeholder="Buscar por cliente ou produto...">
        <div id="listaV" class="listaScroll"></div>
      </section>
    </div>`;

  $('#addp').onclick = adicionarItem;
  document.querySelectorAll('[name=pagamento]').forEach(r => r.onchange = () => {
    const carne = $('[name=pagamento]:checked').value === 'carne';
    $('#carneBox').hidden = !carne;
    // campos escondidos ficam desativados: senão um valor inválido neles trava o "Finalizar venda" sem aviso
    $('#carneBox').querySelectorAll('input').forEach(i => i.disabled = !carne);
  });
  $('#fv').onsubmit = finalizarVenda;
  $('#bv').oninput = e => renderVendas(e.target.value);
  renderCarrinho(); renderVendas('');
}

function adicionarItem() {
  const p = db.produtos.find(x => x.id === $('#selp').value);
  const q = Number($('#qtdp').value);
  if (!p) return toast('Nenhum produto com estoque para vender', 'erro');
  if (!Number.isInteger(q) || q < 1) return toast('Quantidade inválida: use um número inteiro a partir de 1', 'erro');
  const item = carrinho.find(i => i.produtoId === p.id);
  const jaNoCarrinho = item ? item.qtd : 0;
  if (jaNoCarrinho + q > p.qtd) return toast(`Só tem ${p.qtd} un. de ${p.nome} em estoque`, 'erro');
  if (item) item.qtd += q;
  else carrinho.push({ produtoId:p.id, nome:p.nome, qtd:q, preco:p.venda, custo:p.custo });
  $('#qtdp').value = 1;
  renderCarrinho();
}

function renderCarrinho() {
  const soma = carrinho.reduce((s, i) => s + i.qtd * i.preco, 0);
  $('#carrinho').innerHTML = carrinho.length ? `
    <table>
      <tr><th>Produto</th><th>Qtd</th><th>Subtotal</th><th></th></tr>
      ${carrinho.map((i, n) => `<tr><td>${esc(i.nome)}</td><td>${i.qtd}</td><td>${brl(i.qtd * i.preco)}</td>
        <td><button type="button" class="rm" onclick="carrinho.splice(${n},1);renderCarrinho()">×</button></td></tr>`).join('')}
    </table>
    <div class="total-linha"><span>Total dos produtos</span><span>${brl(soma)}</span></div>`
    : '<p class="custo" style="padding:4px 0 6px">Nenhum produto adicionado.</p>';
  $('#total').value = soma ? soma.toFixed(2) : '';
}

function finalizarVenda(e) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const cliente = d.cliente.trim();
  if (!carrinho.length) return toast('Adicione pelo menos um produto', 'erro');
  if (d.pagamento === 'carne' && !cliente) return toast('No carnê, o nome do cliente é obrigatório', 'erro');
  for (const i of carrinho) {
    const p = db.produtos.find(x => x.id === i.produtoId);
    if (!p || p.qtd < i.qtd) return toast(`Estoque insuficiente: ${i.nome}`, 'erro');
  }

  const total = Math.round(Number(d.total) * 100) / 100;
  if (!(total > 0)) return toast('Informe o valor da compra', 'erro');
  const venda = { id:uid(), data:new Date().toISOString(), cliente, itens:carrinho, total, pagamento:d.pagamento };

  if (d.pagamento === 'carne') {
    const n = Math.min(24, Math.max(1, Math.floor(+d.nparc) || 1));
    // conta em centavos inteiros para não perder/sobrar centavo no arredondamento
    const cent = Math.round(total * 100), base = Math.floor(cent / n);
    venda.telefone = (d.telefone || '').trim();
    venda.parcelas = Array.from({ length:n }, (_, k) => ({
      n: k + 1,
      valor: (k === n - 1 ? cent - base * (n - 1) : base) / 100, // última parcela acerta os centavos
      venc: addMes(d.venc || addMes(hoje(), 1), k),
      pago: false, dataPgto: null
    }));
  }

  // Baixa no estoque
  carrinho.forEach(i => {
    const p = db.produtos.find(x => x.id === i.produtoId);
    p.qtd -= i.qtd;
    mov(p, 'saida', i.qtd, 'Venda' + (cliente ? ' — ' + cliente : ''));
    if (p.qtd <= p.minimo) toast(`${p.nome}: estoque baixo (${p.qtd} un.)`, 'alerta');
  });

  db.vendas.push(venda);
  salvar(); toast(`Venda de ${brl(total)} lançada`); telaVendas();
}

function renderVendas(filtro) {
  const f = filtro.toLowerCase();
  const lista = db.vendas.slice().reverse().filter(v =>
    (v.cliente || '').toLowerCase().includes(f) || v.itens.some(i => i.nome.toLowerCase().includes(f)));
  $('#listaV').innerHTML = lista.length ? lista.map(v => `
    <div class="vitem">
      <div>
        <b>${esc(v.cliente) || 'Cliente não informado'}</b>
        <div class="meta">${fmtDataHora(v.data)}</div>
        <div class="meta">${v.itens.map(i => `${i.qtd}× ${esc(i.nome)}`).join(', ')}</div>
      </div>
      <div class="val">
        <b>${brl(v.total)}</b>
        <span class="pill ${v.pagamento}">${PAGTOS[v.pagamento]}${v.parcelas ? ` ${v.parcelas.length}x` : ''}</span><br>
        <button class="link" onclick="cancelarVenda('${v.id}')">Cancelar venda</button>
      </div>
    </div>`).join('') : '<p class="custo">Nenhuma venda lançada.</p>';
}

function cancelarVenda(id) {
  const v = db.vendas.find(x => x.id === id);
  const pagas = (v.parcelas || []).filter(p => p.pago);
  const aviso = pagas.length
    ? `\n\nATENÇÃO: ${pagas.length} parcela(s) desse carnê já foram recebidas (${brl(soma(pagas, p => p.valor))}). Esses recebimentos também vão sair do caixa e dos relatórios.`
    : '';
  if (!confirm(`Cancelar a venda de ${brl(v.total)}? Os produtos voltam para o estoque.${aviso}`)) return;
  v.itens.forEach(i => {
    const p = db.produtos.find(x => x.id === i.produtoId);
    if (p) { p.qtd += i.qtd; mov(p, 'entrada', i.qtd, 'Venda cancelada'); }
  });
  db.vendas = db.vendas.filter(x => x.id !== id);
  salvar(); toast('Venda cancelada'); telaVendas();
}

/* =====================================================
   CAIXA (dashboard + PDF)
   ===================================================== */
let periodo = { de: hoje().slice(0, 8) + '01', ate: hoje() };

const FORMAS_CAIXA = ['dinheiro', 'pix', 'debito', 'credito']; // formas que colocam dinheiro no caixa
const soma = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

function dadosPeriodo(de = periodo.de, ate = periodo.ate) {
  const noPeriodo = iso => { const d = diaLocal(iso); return d >= de && d <= ate; };
  const vendas = db.vendas.filter(v => noPeriodo(v.data));
  const fat = soma(vendas, v => v.total);
  const custo = soma(vendas, v => soma(v.itens, i => i.qtd * i.custo));
  const itens = soma(vendas, v => soma(v.itens, i => i.qtd));
  const porPag = Object.keys(PAGTOS).map(k => {
    const vs = vendas.filter(v => v.pagamento === k);
    return { k, nome:PAGTOS[k], qtd:vs.length, total:soma(vs, v => v.total) };
  });

  // Parcelas de carnê pagas no período (entram no caixa no dia do pagamento)
  const recebimentos = db.vendas.flatMap(v => (v.parcelas || [])
      .filter(p => p.pago && noPeriodo(p.dataPgto))
      .map(p => ({ ...p, cliente:v.cliente, de:v.parcelas.length, forma:p.forma || 'dinheiro' })))
    .sort((a, b) => b.dataPgto.localeCompare(a.dataPgto));

  // Entradas no caixa = vendas à vista + parcelas recebidas, por forma
  const caixa = FORMAS_CAIXA.map(k => {
    const avista = soma(vendas.filter(v => v.pagamento === k), v => v.total);
    const carne = soma(recebimentos.filter(p => p.forma === k), p => p.valor);
    return { k, nome:PAGTOS[k], avista, carne, total:avista + carne };
  });
  const entrou = soma(caixa, c => c.total);
  const recebidoCarne = soma(recebimentos, p => p.valor);
  const aReceber = soma(db.vendas.flatMap(v => v.parcelas || []).filter(p => !p.pago), p => p.valor);

  const ranking = {};
  vendas.forEach(v => v.itens.forEach(i => {
    ranking[i.nome] ??= { nome:i.nome, qtd:0, total:0 };
    ranking[i.nome].qtd += i.qtd; ranking[i.nome].total += i.qtd * i.preco;
  }));
  const top = Object.values(ranking).sort((a, b) => b.qtd - a.qtd).slice(0, 5);
  const movs = db.movimentos.filter(m => noPeriodo(m.data)).reverse();
  return { vendas, fat, custo, lucro:fat - custo, itens, porPag, recebimentos, caixa, entrou, recebidoCarne, aReceber, top, movs };
}

function telaCaixa() {
  const D = dadosPeriodo();
  const baixos = estoqueBaixo();
  main.innerHTML = `
    <header class="topo">
      <div><h1>Caixa</h1><p>${fmtDia(periodo.de)} até ${fmtDia(periodo.ate)}</p></div>
      <div class="filtros">
        <button class="sec" onclick="setPeriodo('hoje')">Hoje</button>
        <button class="sec" onclick="setPeriodo('mes')">Este mês</button>
        <button class="sec" onclick="setPeriodo('tudo')">Tudo</button>
        <label>De<input type="date" id="pde" value="${periodo.de}"></label>
        <label>Até<input type="date" id="pate" value="${periodo.ate}"></label>
        <button class="btn" onclick="gerarPDF()">${ico('pdf')} Gerar PDF</button>
      </div>
    </header>

    <div class="kpis">
      <div class="kpi destaque"><span>Entrou no caixa</span><b>${brl(D.entrou)}</b></div>
      <div class="kpi"><span>Vendido (faturamento)</span><b>${brl(D.fat)}</b></div>
      <div class="kpi"><span>Lucro bruto</span><b style="color:var(--ok)">${brl(D.lucro)}</b></div>
      <div class="kpi"><span>Vendas</span><b>${D.vendas.length}</b></div>
      <div class="kpi"><span>Ticket médio</span><b>${brl(D.vendas.length ? D.fat / D.vendas.length : 0)}</b></div>
      <div class="kpi"><span>Carnê a receber (total)</span><b style="color:var(--alerta)">${brl(D.aReceber)}</b></div>
    </div>

    <div class="grid2">
      <section class="painel">
        <h2>${ico('dinheiro')} Entradas no caixa</h2>
        <table>
          <tr><th>Forma</th><th>Vendas à vista</th><th>Parcelas de carnê</th><th>Total</th></tr>
          ${D.caixa.map(c => `<tr><td>${c.nome}</td><td>${brl(c.avista)}</td><td>${brl(c.carne)}</td><td><b>${brl(c.total)}</b></td></tr>`).join('')}
          <tr><td><b>Total</b></td><td><b>${brl(D.entrou - D.recebidoCarne)}</b></td><td><b>${brl(D.recebidoCarne)}</b></td><td><b>${brl(D.entrou)}</b></td></tr>
        </table>
        <p class="custo" style="margin-top:10px">Vendas no carnê não entram aqui na hora: cada parcela entra no dia em que é paga.</p>
      </section>
      <section class="painel">
        <h2>${ico('vendas')} Vendas por forma de pagamento</h2>
        ${D.porPag.map(p => `
          <div class="barra">
            <span>${p.nome}<small>${p.qtd} venda(s)</small></span>
            <div class="trilho"><div class="enche" style="width:${D.fat ? p.total / D.fat * 100 : 0}%"></div></div>
            <span class="v">${brl(p.total)}</span>
          </div>`).join('')}
      </section>
    </div>

    <div class="grid2">
      <section class="painel">
        <h2>Parcelas de carnê recebidas</h2>
        ${D.recebimentos.length ? `<div class="listaScroll" style="max-height:300px"><table>
          <tr><th>Data</th><th>Cliente</th><th>Parcela</th><th>Forma</th><th>Valor</th></tr>
          ${D.recebimentos.map(p => `<tr><td>${fmtDataHora(p.dataPgto)}</td><td>${esc(p.cliente)}</td><td>${p.n}/${p.de}</td>
            <td>${PAGTOS[p.forma]}</td><td>${brl(p.valor)}</td></tr>`).join('')}
        </table></div>` : '<p class="custo">Nenhuma parcela recebida no período.</p>'}
      </section>
      <section class="painel">
        <h2>Mais vendidos</h2>
        ${D.top.length ? `<table><tr><th>Produto</th><th>Qtd</th><th>Total</th></tr>
          ${D.top.map(t => `<tr><td>${esc(t.nome)}</td><td>${t.qtd}</td><td>${brl(t.total)}</td></tr>`).join('')}</table>`
          : '<p class="custo">Sem vendas no período.</p>'}
        <h2 style="margin-top:22px">${ico('alerta')} Estoque baixo</h2>
        ${baixos.length ? `<table><tr><th>Produto</th><th>Estoque</th><th>Mínimo</th></tr>
          ${baixos.map(p => `<tr><td>${esc(p.nome)}</td><td class="sai">${p.qtd}</td><td>${p.minimo}</td></tr>`).join('')}</table>`
          : '<p class="custo">Tudo certo com o estoque.</p>'}
      </section>
    </div>

    <section class="painel">
      <h2>Entradas e saídas de estoque</h2>
      ${D.movs.length ? `<div class="listaScroll" style="max-height:360px"><table>
        <tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Obs.</th></tr>
        ${D.movs.map(m => `<tr><td>${fmtDataHora(m.data)}</td><td>${esc(m.nome)}</td>
          <td class="${m.tipo === 'entrada' ? 'ent' : 'sai'}">${m.tipo === 'entrada' ? ico('sobe') + ' Entrada' : ico('desce') + ' Saída'}</td>
          <td>${m.qtd}</td><td>${esc(m.obs)}</td></tr>`).join('')}
      </table></div>` : '<p class="custo">Nenhuma movimentação no período.</p>'}
    </section>`;

  // data apagada ou "De" depois do "Até" deixava o caixa zerado: corrige sozinho
  const mudar = () => {
    let de = $('#pde').value || periodo.de, ate = $('#pate').value || periodo.ate;
    if (de > ate) [de, ate] = [ate, de];
    periodo = { de, ate }; telaCaixa();
  };
  $('#pde').onchange = mudar; $('#pate').onchange = mudar;
}

function setPeriodo(t) {
  const h = hoje();
  if (t === 'hoje') periodo = { de:h, ate:h };
  if (t === 'mes')  periodo = { de:h.slice(0, 8) + '01', ate:h };
  if (t === 'tudo') periodo = { de:'2000-01-01', ate:h };
  telaCaixa();
}

function gerarPDF() {
  if (!window.jspdf) { toast('Gerador de PDF indisponível offline — use "Salvar como PDF" na impressão', 'alerta'); return window.print(); }
  const D = dadosPeriodo();
  const doc = new window.jspdf.jsPDF();
  const cor = [22, 19, 15];
  const tab = (head, body, extra = {}) => doc.autoTable({
    startY:(doc.lastAutoTable ? doc.lastAutoTable.finalY : 32) + 8, head:[head], body,
    headStyles:{ fillColor:cor, textColor:[216, 195, 160] }, styles:{ fontSize:9 }, ...extra });

  doc.addImage(MARCA, 'PNG', 14, 8, 22, 20);
  doc.setFontSize(18); doc.text(`${LOJA} — Relatório de Caixa`, 40, 18);
  doc.setFontSize(10); doc.setTextColor(100);
  doc.text(`Período: ${fmtDia(periodo.de)} a ${fmtDia(periodo.ate)}     Emitido em: ${new Date().toLocaleString('pt-BR')}`, 40, 25);
  doc.setTextColor(0);

  tab(['Resumo', 'Valor'], [
    ['Entrou no caixa', brl(D.entrou)], ['Vendido (faturamento)', brl(D.fat)], ['Quantidade de vendas', D.vendas.length],
    ['Itens vendidos', D.itens], ['Custo das mercadorias', brl(D.custo)], ['Lucro bruto', brl(D.lucro)],
    ['Ticket médio', brl(D.vendas.length ? D.fat / D.vendas.length : 0)], ['Carnê a receber (total em aberto)', brl(D.aReceber)]
  ], { startY:32 });
  tab(['Entradas no caixa', 'Vendas à vista', 'Parcelas de carnê', 'Total'],
    [...D.caixa.map(c => [c.nome, brl(c.avista), brl(c.carne), brl(c.total)]),
     ['TOTAL', brl(D.entrou - D.recebidoCarne), brl(D.recebidoCarne), brl(D.entrou)]],
    { didParseCell: d => { if (d.section === 'body' && d.row.index === D.caixa.length) d.cell.styles.fontStyle = 'bold'; } });
  tab(['Vendas por forma de pagamento', 'Vendas', 'Total'], D.porPag.map(p => [p.nome, p.qtd, brl(p.total)]));
  tab(['Data', 'Cliente', 'Produtos', 'Pagamento', 'Valor'], D.vendas.map(v => [
    fmtDataHora(v.data), v.cliente || '-', v.itens.map(i => `${i.qtd}x ${i.nome}`).join(', '),
    PAGTOS[v.pagamento] + (v.parcelas ? ` ${v.parcelas.length}x` : ''), brl(v.total)]),
    { columnStyles:{ 2:{ cellWidth:70 } } });
  if (D.recebimentos.length) tab(['Recebido em', 'Cliente (carnê)', 'Parcela', 'Forma', 'Valor'],
    D.recebimentos.map(p => [fmtDataHora(p.dataPgto), p.cliente, `${p.n}/${p.de}`, PAGTOS[p.forma], brl(p.valor)]));
  if (D.movs.length) tab(['Data', 'Produto', 'Tipo', 'Qtd', 'Obs.'],
    D.movs.map(m => [fmtDataHora(m.data), m.nome, m.tipo === 'entrada' ? 'Entrada' : 'Saída', m.qtd, m.obs]));
  const baixos = estoqueBaixo();
  if (baixos.length) tab(['Produto com estoque baixo', 'Estoque', 'Mínimo'], baixos.map(p => [p.nome, p.qtd, p.minimo]),
    { headStyles:{ fillColor:[220, 38, 38] } });

  doc.save(`relatorio-caixa_${periodo.de}_a_${periodo.ate}.pdf`);
}

/* =====================================================
   CLIENTES (carnê)
   ===================================================== */
let soEmAberto = false;
function telaClientes() {
  main.innerHTML = `
    <header class="topo">
      <div><h1>Clientes</h1><p>Clientes com compras no carnê</p></div>
      <div class="acoes">
        <label class="chip"><input type="checkbox" id="soAb" ${soEmAberto ? 'checked' : ''}><span>Só com saldo em aberto</span></label>
        <input id="bc" class="busca" type="search" placeholder="Buscar cliente...">
      </div>
    </header>
    <div id="listaC"></div>`;
  $('#soAb').onchange = e => { soEmAberto = e.target.checked; renderClientes($('#bc').value); };
  $('#bc').oninput = e => renderClientes(e.target.value);
  renderClientes('');
}

function agruparClientes() {
  const mapa = {};
  db.vendas.filter(v => v.pagamento === 'carne').forEach(v => {
    const k = chaveCli(v.cliente);
    mapa[k] ??= { nome:v.cliente, telefone:'', vendas:[] };
    if (v.telefone) mapa[k].telefone = v.telefone;
    mapa[k].vendas.push(v);
  });
  return Object.values(mapa).map(c => {
    const parc = c.vendas.flatMap(v => v.parcelas);
    const total = c.vendas.reduce((s, v) => s + v.total, 0);
    const pago = parc.filter(p => p.pago).reduce((s, p) => s + p.valor, 0);
    const atrasadas = parc.filter(p => !p.pago && p.venc < hoje()).length;
    return { ...c, total, pago, saldo:+(total - pago).toFixed(2), atrasadas };
  }).sort((a, b) => b.atrasadas - a.atrasadas || b.saldo - a.saldo);
}

function renderClientes(filtro) {
  const f = filtro.toLowerCase();
  const abertos = new Set([...document.querySelectorAll('.cli.aberto')].map(e => e.dataset.k));
  const lista = agruparClientes().filter(c => c.nome.toLowerCase().includes(f) && (!soEmAberto || c.saldo > 0));
  $('#listaC').innerHTML = lista.length ? lista.map(c => {
    const k = chaveCli(c.nome);
    return `
    <div class="cli ${abertos.has(k) ? 'aberto' : ''}" data-k="${esc(k)}">
      <div class="cli-topo" onclick="this.parentElement.classList.toggle('aberto')">
        <div class="avatar">${esc(c.nome[0].toUpperCase())}</div>
        <div class="nome"><b>${esc(c.nome)}</b><small>${esc(c.telefone) || 'sem telefone'} · ${c.vendas.length} compra(s)</small></div>
        ${c.atrasadas ? `<span class="st atrasado">${c.atrasadas} atrasada(s)</span>` : ''}
        <div class="saldo"><small class="custo">Saldo devedor</small><b style="color:${c.saldo > 0 ? 'var(--erro)' : 'var(--ok)'}">${brl(c.saldo)}</b></div>
      </div>
      <div class="cli-corpo">
        ${c.vendas.map(v => `
          <p style="margin:14px 0 6px"><b>Compra de ${fmtDia(diaLocal(v.data))}</b> — ${brl(v.total)}
            <span class="custo">· ${v.itens.map(i => `${i.qtd}× ${esc(i.nome)}`).join(', ')}</span></p>
          <table>
            <tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th></th></tr>
            ${v.parcelas.map(p => {
              const st = p.pago ? 'pago' : p.venc < hoje() ? 'atrasado' : 'aberto';
              return `<tr><td>${p.n}/${v.parcelas.length}</td><td>${fmtDia(p.venc)}</td><td>${brl(p.valor)}</td>
                <td><span class="st ${st}">${st === 'pago' ? 'Pago em ' + fmtDia(diaLocal(p.dataPgto)) + (p.forma ? ' · ' + PAGTOS[p.forma] : '') : st === 'atrasado' ? 'Atrasada' : 'Em aberto'}</span></td>
                <td>${p.pago
                  ? `<button class="bpg desf" onclick="pagarParcela('${v.id}',${p.n})">Desfazer</button>`
                  : `<button class="bpg" onclick="pagarParcela('${v.id}',${p.n})">Receber</button>`}</td></tr>`;
            }).join('')}
          </table>`).join('')}
      </div>
    </div>`;
  }).join('') : `<div class="vazio">${db.vendas.some(v => v.pagamento === 'carne') ? 'Nenhum cliente encontrado.' : 'Nenhuma venda no carnê ainda.'}</div>`;
}

function pagarParcela(vendaId, n) {
  const v = db.vendas.find(x => x.id === vendaId);
  const p = v.parcelas.find(x => x.n === n);
  if (p.pago) {
    if (!confirm('Desfazer o recebimento desta parcela? O valor sai do caixa do dia em que foi recebido.')) return;
    p.pago = false; p.dataPgto = null; p.forma = null;
    salvar(); return renderClientes($('#bc').value);
  }
  modal(`
    <h2>Receber parcela</h2>
    <p style="margin-bottom:14px">${esc(v.cliente)} — parcela <b>${n}/${v.parcelas.length}</b> de <b>${brl(p.valor)}</b> (venc. ${fmtDia(p.venc)})</p>
    <form id="frec">
      <div class="lbl">Como o cliente pagou?</div>
      <div class="pagtos">${FORMAS_CAIXA.map((k, i) =>
        `<label class="chip"><input type="radio" name="forma" value="${k}" ${i === 0 ? 'checked' : ''}><span>${PAGTOS[k]}</span></label>`).join('')}</div>
      <label>Data do pagamento<input type="date" name="dia" value="${hoje()}" max="${hoje()}" required></label>
      <div class="mbtns"><button type="button" class="sec" onclick="fecharModal()">Cancelar</button><button class="btn">Confirmar recebimento</button></div>
    </form>`);
  $('#frec').onsubmit = e => {
    e.preventDefault();
    const dia = e.target.dia.value;
    p.pago = true;
    p.forma = e.target.forma.value;
    // hoje: hora atual | data passada: meio-dia local (evita cair no dia anterior pelo fuso)
    p.dataPgto = (dia === hoje() ? new Date() : new Date(dia + 'T12:00:00')).toISOString();
    salvar(); fecharModal(); renderClientes($('#bc').value);
    toast(`Parcela ${n} recebida no ${PAGTOS[p.forma]}: ${brl(p.valor)}`);
  };
}

/* ================= LIMPAR SISTEMA ================= */
function limparSistema() {
  modal(`
    <h2 style="color:var(--erro)">${ico('alerta')} Você quer mesmo apagar todo o sistema?</h2>
    <div class="aviso-del">
      Serão apagados <b>${db.produtos.length}</b> produto(s), <b>${db.vendas.length}</b> venda(s),
      todos os clientes do carnê e o histórico de estoque.<br><b>Essa ação não pode ser desfeita.</b>
    </div>
    <p class="custo" style="margin-bottom:14px">Dica: salve um backup antes, assim dá para recuperar depois.</p>
    <div class="mbtns" style="flex-wrap:wrap">
      <button class="sec" onclick="exportarBackup()">${ico('baixar')} Salvar backup antes</button>
      <button class="sec" onclick="fecharModal()">Cancelar</button>
      <button class="btn-perigo" onclick="confirmarLimpeza()">Sim, apagar tudo</button>
    </div>`);
}
function confirmarLimpeza() {
  db = { ...vazio(), config: db.config }; salvar(); fecharModal();   // mantém as configurações (ex: WhatsApp da vitrine)
  toast('Sistema limpo. Todos os dados foram apagados.', 'alerta');
  ir('painel');
}

/* ================= BACKUP ================= */
function exportarBackup() {
  const blob = new Blob([JSON.stringify(db)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `backup-${LOJA.toLowerCase()}_${hoje()}.json`; a.click();
  URL.revokeObjectURL(a.href);
}
$('#fileBackup').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const dados = JSON.parse(r.result);
      if (!dados || !Array.isArray(dados.produtos) || ['vendas', 'movimentos'].some(k => dados[k] !== undefined && !Array.isArray(dados[k]))) throw 0;
      if (!confirm('Restaurar este backup? Os dados atuais serão substituídos.')) return;
      db = { ...vazio(), ...dados }; salvar(); toast('Backup restaurado'); ir('produtos');
    } catch { toast('Arquivo de backup inválido', 'erro'); }
  };
  r.readAsText(f); e.target.value = '';
};

/* ================= INICIALIZAÇÃO ================= */
document.documentElement.style.setProperty('--marca', `url(${MARCA})`);
document.querySelectorAll('[data-i]').forEach(e => e.innerHTML = ico(e.dataset.i));
atualizarBadges();
ir('painel');
const nb = estoqueBaixo().length, na = parcelasAtrasadas().length;
if (nb) toast(`${nb} produto(s) com estoque baixo`, 'alerta');
if (na) toast(`${na} parcela(s) de carnê atrasada(s)`, 'alerta');
