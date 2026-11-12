/* =====================================================
   VITRINE
   Gera uma página separada (vitrine-tfardas.html) para os clientes da loja.
   Ela leva só nome, foto, descrição e valor de venda — nunca custo ou estoque.
   O cliente escolhe os produtos e as quantidades e envia o pedido pelo WhatsApp.
   ===================================================== */

// Deixa o número no formato do wa.me: 55 + DDD + número, só dígitos
function numeroWhats(txt) {
  let n = String(txt || '').replace(/\D/g, '').replace(/^0+/, '');
  if (n.length === 10 || n.length === 11) n = '55' + n;
  return /^55\d{10,11}$/.test(n) ? n : '';
}

function produtosVitrine() {
  const comEsgotados = db.config.esgotados !== false;
  return db.produtos.filter(p => comEsgotados || p.qtd > 0);
}

function telaVitrine() {
  const c = db.config;
  const total = produtosVitrine().length;
  main.innerHTML = `
    <header class="topo"><div><h1>Vitrine</h1><p>Página para seus clientes escolherem os produtos e pedirem pelo WhatsApp</p></div></header>
    <div class="duas">
      <section class="painel">
        <h2>Configurar vitrine</h2>
        <form id="fv">
          <label>WhatsApp que recebe os pedidos (com DDD)<input name="whats" required inputmode="tel" placeholder="(34) 99999-9999" value="${esc(c.whatsapp || WHATS_LOJA)}"></label>
          <label>Frase de apresentação (opcional)<input name="frase" maxlength="120" placeholder="Ex: Fardamentos e artigos militares" value="${esc(c.frase || '')}"></label>
          <label class="check"><input type="checkbox" name="esgotados" ${c.esgotados !== false ? 'checked' : ''}> Mostrar também produtos sem estoque</label>
          <p class="custo" id="vTotal" style="margin-bottom:12px"><b>${total}</b> produto(s) vão aparecer na vitrine. Só nome, foto, descrição e valor de venda.</p>
          <div class="mbtns" style="flex-wrap:wrap">
            <button type="button" class="sec" id="vPrev">${ico('ver')} Visualizar</button>
            <button class="btn">${ico('baixar')} Baixar vitrine</button>
          </div>
        </form>
      </section>
      <section class="painel">
        <h2>Como enviar para os clientes</h2>
        <ol class="passos">
          <li>Clique em <b>Baixar vitrine</b>. Vai ser salvo o arquivo <b>vitrine-tfardas.html</b>.</li>
          <li>Publique o arquivo para ter um link: entre em <b>app.netlify.com/drop</b> e arraste o arquivo para lá (é grátis).</li>
          <li>Mande o link para os clientes no WhatsApp, Instagram ou status.</li>
          <li>O cliente escolhe os produtos, as quantidades e toca em <b>Enviar pedido</b>. O pedido chega no seu WhatsApp, pronto para você fechar a venda.</li>
        </ol>
        <p class="custo" style="margin-top:12px">${ico('alerta')} Mudou preço ou cadastrou produto novo? Baixe a vitrine de novo e publique outra vez para o link ficar atualizado.</p>
      </section>
    </div>`;

  const f = $('#fv');
  const ler = () => {
    db.config.whatsapp = f.whats.value.trim();
    db.config.frase = f.frase.value.trim();
    db.config.esgotados = f.esgotados.checked;
    salvar();
    $('#vTotal').innerHTML = `<b>${produtosVitrine().length}</b> produto(s) vão aparecer na vitrine. Só nome, foto, descrição e valor de venda.`;
  };
  const validar = () => {
    ler();
    if (!numeroWhats(db.config.whatsapp)) { toast('Digite o WhatsApp com DDD. Ex: (34) 99999-9999', 'erro'); f.whats.focus(); return false; }
    if (!produtosVitrine().length) { toast('Nenhum produto para mostrar. Cadastre produtos primeiro.', 'erro'); return false; }
    return true;
  };
  f.esgotados.onchange = ler;
  f.onsubmit = e => {
    e.preventDefault();
    if (!validar()) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([htmlVitrine()], { type:'text/html' }));
    a.download = `vitrine-${LOJA.toLowerCase()}.html`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Vitrine baixada. Agora publique o arquivo para ter o link.');
  };
  $('#vPrev').onclick = () => {
    if (!validar()) return;
    window.open(URL.createObjectURL(new Blob([htmlVitrine()], { type:'text/html' })), '_blank');
  };
}

// Monta o arquivo HTML completo da vitrine, com os produtos dentro dele
function htmlVitrine() {
  const c = db.config;
  const dados = {
    loja: LOJA, whats: numeroWhats(c.whatsapp || WHATS_LOJA), frase: c.frase || '', logo: MARCA, atualizado: fmtDia(hoje()),
    produtos: produtosVitrine().map(p => ({ id:p.id, n:p.nome, d:p.descricao, v:p.venda, img:p.img || '' })),
  };
  const json = JSON.stringify(dados).replace(/</g, '\\u003c');
  return '<!DOCTYPE html>\n<html lang="pt-BR"><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + `<title>${esc(LOJA)} · Vitrine</title>`
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&display=swap">'
    + '<style>' + VITRINE_CSS + '</style></head><body>'
    + '<header class="topo"><div class="marca"></div><div><h1 id="loja"></h1><p id="frase"></p></div></header>'
    + '<div class="busca"><input id="busca" type="search" placeholder="Buscar produto..."></div>'
    + '<main id="grid"></main>'
    + '<footer id="rodape"></footer>'
    + '<div id="barra" hidden><div><b id="bQtd"></b><span id="bTotal"></span></div><button id="bVer">Ver pedido ›</button></div>'
    + '<div id="fundo" hidden><div class="pedido"><div class="pcab"><h2>Seu pedido</h2><button id="fechar" aria-label="Fechar">' + ico('fechar') + '</button></div>'
    + '<div id="itens"></div><div class="ptotal"><span>Total</span><b id="pTotal"></b></div>'
    + '<form id="fp"><label>Seu nome<input name="nome" required autocomplete="name" placeholder="Como podemos te chamar?"></label>'
    + '<label>Observação (opcional)<textarea name="obs" rows="2" placeholder="Tamanho, cor, forma de entrega..."></textarea></label>'
    + '<button class="enviar">' + ico('zap') + ' Enviar pedido pelo WhatsApp</button></form></div></div>'
    + '<script>var D=' + json + ';(' + vitrineApp.toString() + ')();</' + 'script></body></html>';
}

// Código que roda dentro da página da vitrine (é copiado para o arquivo gerado)
function vitrineApp() {
  const $ = s => document.querySelector(s);
  const brl = v => Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const porId = Object.fromEntries(D.produtos.map(p => [p.id, p]));
  const qtd = {};   // id do produto -> quantidade escolhida

  document.documentElement.style.setProperty('--marca', 'url(' + D.logo + ')');
  $('#loja').textContent = D.loja;
  $('#frase').textContent = D.frase; $('#frase').hidden = !D.frase;
  $('#rodape').textContent = 'Valores atualizados em ' + D.atualizado + '. O pedido é confirmado pela loja no WhatsApp.';

  function render(filtro) {
    const f = filtro.toLowerCase();
    const lista = D.produtos.filter(p => (p.n + ' ' + p.d).toLowerCase().includes(f));
    $('#grid').innerHTML = lista.length ? lista.map(p => `
      <div class="card${qtd[p.id] ? ' sel' : ''}" data-id="${p.id}">
        <div class="img">${p.img ? `<img src="${p.img}" alt="" loading="lazy">` : '<span>Sem foto</span>'}</div>
        <div class="info">
          <h3>${esc(p.n)}</h3>
          ${p.d ? `<p class="desc">${esc(p.d)}</p>` : ''}
          <div class="preco">${brl(p.v)}</div>
          <div class="qtd">
            <button type="button" data-d="-1" aria-label="Diminuir">−</button>
            <input type="number" min="0" step="1" inputmode="numeric" value="${qtd[p.id] || 0}" aria-label="Quantidade">
            <button type="button" data-d="1" aria-label="Aumentar">+</button>
          </div>
        </div>
      </div>`).join('') : '<p class="vazio">Nenhum produto encontrado.</p>';
  }

  function setQtd(id, n) {
    n = Math.max(0, Math.floor(Number(n)) || 0);
    if (n) qtd[id] = n; else delete qtd[id];
    const card = document.querySelector(`.card[data-id="${id}"]`);
    if (card) { card.classList.toggle('sel', !!n); const i = card.querySelector('input'); if (document.activeElement !== i) i.value = n; }
    atualizar();
  }

  const escolhidos = () => Object.keys(qtd).map(id => ({ p:porId[id], q:qtd[id] }));
  const totalPedido = () => escolhidos().reduce((s, x) => s + x.p.v * x.q, 0);

  function atualizar() {
    const itens = escolhidos(), un = itens.reduce((s, x) => s + x.q, 0);
    $('#barra').hidden = !itens.length;
    $('#bQtd').textContent = un + (un === 1 ? ' item' : ' itens');
    $('#bTotal').textContent = brl(totalPedido());
    if (!$('#fundo').hidden) renderPedido();
  }

  function renderPedido() {
    const itens = escolhidos();
    if (!itens.length) { $('#fundo').hidden = true; return; }
    $('#itens').innerHTML = itens.map(x => `
      <div class="item" data-id="${x.p.id}">
        <div><b>${esc(x.p.n)}</b><small>${x.q} × ${brl(x.p.v)}</small></div>
        <div class="dir"><b>${brl(x.p.v * x.q)}</b><button type="button" class="rem">Remover</button></div>
      </div>`).join('');
    $('#pTotal').textContent = brl(totalPedido());
  }

  $('#grid').addEventListener('click', e => {
    const b = e.target.closest('button[data-d]'); if (!b) return;
    const id = b.closest('.card').dataset.id;
    setQtd(id, (qtd[id] || 0) + Number(b.dataset.d));
  });
  $('#grid').addEventListener('input', e => {
    if (e.target.matches('.qtd input')) setQtd(e.target.closest('.card').dataset.id, e.target.value);
  });
  $('#grid').addEventListener('focusout', e => {
    if (e.target.matches('.qtd input')) e.target.value = qtd[e.target.closest('.card').dataset.id] || 0;
  });
  $('#itens').addEventListener('click', e => {
    if (e.target.matches('.rem')) setQtd(e.target.closest('.item').dataset.id, 0);
  });
  $('#busca').oninput = e => render(e.target.value);
  $('#bVer').onclick = () => { renderPedido(); $('#fundo').hidden = false; };
  $('#fechar').onclick = () => { $('#fundo').hidden = true; };
  $('#fundo').addEventListener('mousedown', e => { if (e.target.id === 'fundo') $('#fundo').hidden = true; });

  $('#fp').onsubmit = e => {
    e.preventDefault();
    const nome = e.target.nome.value.trim(), obs = e.target.obs.value.trim();
    const linhas = escolhidos().map(x => `• ${x.q}x ${x.p.n} (${brl(x.p.v)} cada) = ${brl(x.p.v * x.q)}`);
    const msg = `Olá! Quero fazer um pedido pela vitrine da ${D.loja}:\n\n${linhas.join('\n')}\n\n*Total: ${brl(totalPedido())}*\n\nNome: ${nome}` + (obs ? `\nObservação: ${obs}` : '');
    window.open('https://wa.me/' + D.whats + '?text=' + encodeURIComponent(msg), '_blank');
  };

  render('');
}

const VITRINE_CSS = `
:root{--bg:#f2ece2;--card:#fffdf9;--borda:#e0d5c2;--texto:#1a1712;--suave:#75695a;--side:#16130f;--tan:#b08d63;--tan-claro:#d8c3a0;--acc2:#5e4629;--zap:#1f8f4e;--titulo:'Oswald','Arial Narrow',sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--texto);font-size:15px;padding-bottom:90px}
button{font:inherit;cursor:pointer;border:none}
input,textarea{font:inherit;width:100%;padding:10px 12px;border:1px solid var(--borda);border-radius:8px;background:#fff;color:var(--texto)}
input:focus,textarea:focus{outline:2px solid var(--tan);border-color:transparent}
h1,h2,h3{font-family:var(--titulo);text-transform:uppercase;letter-spacing:.6px}
.topo{background:var(--side);color:#fff;display:flex;align-items:center;gap:16px;padding:18px 16px}
.topo .marca{width:64px;aspect-ratio:520/473;background:var(--tan);flex-shrink:0;-webkit-mask:var(--marca) center/contain no-repeat;mask:var(--marca) center/contain no-repeat}
.topo h1{font-size:24px;font-weight:600;color:var(--tan-claro)}
.topo p{color:#cbbfae;font-size:14px;margin-top:2px}
.busca{max-width:1100px;margin:16px auto 0;padding:0 16px}
#grid{max-width:1100px;margin:16px auto;padding:0 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--borda);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .15s,box-shadow .15s}
.card.sel{border-color:var(--tan);box-shadow:0 0 0 2px var(--tan)}
.img{aspect-ratio:1;background:#ece4d6;display:flex;align-items:center;justify-content:center;color:var(--suave);font-size:13px}
.img img{width:100%;height:100%;object-fit:cover}
.info{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;flex:1}
.info h3{font-size:16px;font-weight:500}
.desc{font-size:13px;color:var(--suave);line-height:1.4}
.preco{font-size:20px;font-weight:700;color:var(--acc2);margin-top:auto;padding-top:4px}
.qtd{display:flex;align-items:center;gap:6px}
.i{width:1.15em;height:1.15em;vertical-align:-.2em;flex-shrink:0}
#busca{padding-left:38px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2375695a' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-4-4'/%3E%3C/svg%3E") no-repeat 12px center/18px}
.qtd button{width:40px;height:40px;border-radius:8px;background:var(--side);color:var(--tan-claro);font-size:20px;font-weight:600;flex-shrink:0}
.qtd button:hover{background:var(--acc2)}
.qtd input{text-align:center;padding:8px 4px;min-width:0;-moz-appearance:textfield}
.qtd input::-webkit-outer-spin-button,.qtd input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.vazio{grid-column:1/-1;text-align:center;color:var(--suave);padding:50px 16px}
#rodape{max-width:1100px;margin:8px auto 0;padding:0 16px;font-size:12px;color:var(--suave);text-align:center}
#barra{position:fixed;left:0;right:0;bottom:0;background:var(--side);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;box-shadow:0 -4px 16px rgba(0,0,0,.18)}
#barra[hidden],#fundo[hidden]{display:none}
#barra div{display:flex;flex-direction:column}
#barra b{color:var(--tan-claro);font-size:13px;font-weight:500}
#barra span{font-size:20px;font-weight:700}
#barra button{background:var(--tan);color:var(--side);padding:12px 18px;border-radius:8px;font-weight:700;font-family:var(--titulo);text-transform:uppercase;letter-spacing:.6px}
#fundo{position:fixed;inset:0;background:rgba(10,8,6,.55);display:flex;align-items:flex-end;justify-content:center;z-index:10}
.pedido{background:var(--card);width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:14px 14px 0 0;padding:18px 16px 20px}
.pcab{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.pcab h2{font-size:18px;font-weight:500}
.pcab button{background:none;font-size:20px;color:var(--suave);padding:4px 8px;display:flex}
.item{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--borda)}
.item small{display:block;color:var(--suave);font-size:13px;margin-top:2px}
.item .dir{text-align:right;flex-shrink:0}
.rem{background:none;color:#b3261e;font-size:12px;margin-top:4px;display:block;margin-left:auto}
.ptotal{display:flex;justify-content:space-between;align-items:center;padding:14px 0;font-size:18px}
.ptotal b{font-size:22px}
label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:600;color:var(--suave);margin-bottom:12px}
.enviar{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:var(--zap);color:#fff;padding:14px;border-radius:8px;font-weight:700;font-size:16px}
.enviar:hover{filter:brightness(.92)}
@media (min-width:700px){#fundo{align-items:center}.pedido{border-radius:14px}}
@media (max-width:480px){#grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.info{padding:10px}.info h3{font-size:14px}.preco{font-size:17px}.qtd button{width:34px;height:34px}}
`;
