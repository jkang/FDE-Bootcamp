let _scriptIndex = 0;
let _badgeEl = null;

function setBadge(state) {
  const map = {
    idle: ['badge-idle', 'idle'],
    thinking: ['badge-thinking', 'thinking'],
    tool_calling: ['badge-tool', 'calling tool'],
    awaiting_human: ['badge-human', 'awaiting human'],
    error: ['badge-error', 'error']
  };
  const [cls, label] = map[state] || map.idle;
  if (_badgeEl) {
    _badgeEl.className = 'badge ' + cls;
    _badgeEl.textContent = label;
  }
}

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function streamText(container, text) {
  const p = el('div', 'text-sm leading-6 whitespace-pre-line');
  container.appendChild(p);
  let i = 0;
  return new Promise(res => {
    const t = setInterval(() => {
      p.textContent = text.slice(0, i++);
      if (i > text.length) { clearInterval(t); res(); }
    }, 22);
  });
}

function appendUser(text) {
  const conv = document.getElementById('conv');
  const row = el('div', 'flex justify-end');
  row.appendChild(el('div', 'chat-msg bubble-user px-4 py-2 text-sm shadow-sm', text));
  conv.appendChild(row);
  conv.scrollTop = conv.scrollHeight;
}

function appendThinking(text) {
  const conv = document.getElementById('conv');
  const box = el('div', 'thinking-box thinking px-3 py-2 text-xs');
  box.innerHTML = '<details><summary class="cursor-pointer font-semibold">展开推理过程</summary><pre class="mt-1 whitespace-pre-wrap">' + text + '</pre></details>';
  conv.appendChild(box);
  conv.scrollTop = conv.scrollHeight;
}

function appendToolCall(tool, status, ms) {
  const conv = document.getElementById('conv');
  const card = el('div', 'tool-card px-3 py-2 text-xs flex items-center gap-2');
  card.innerHTML = '<span>🔧</span><span class="font-mono font-semibold">正在调用 ' + tool + '</span><span class="text-slate-400">' + status + '</span>';
  conv.appendChild(card);
  conv.scrollTop = conv.scrollHeight;
  return new Promise(res => setTimeout(res, ms || 900));
}

function appendCitations(citations) {
  if (!citations || !citations.length) return;
  const conv = document.getElementById('conv');
  const row = el('div', 'flex gap-2 text-xs mt-1 flex-wrap');
  citations.forEach(c => {
    const s = el('span', 'cite-foot', '[' + c.id + ']');
    s.onmouseenter = () => { pop.textContent = c.label + ' · ' + c.field; pop.style.display = 'block'; };
    s.onmouseleave = () => { pop.style.display = 'none'; };
    row.appendChild(s);
  });
  conv.appendChild(row);
  const pop = el('div', 'cite-pop');
  conv.appendChild(pop);
  conv.scrollTop = conv.scrollHeight;
}

function renderTable(rows) {
  const t = el('table', 'tbl');
  const head = Object.keys(rows[0]);
  let h = '<tr>' + head.map(k => '<th>' + k + '</th>').join('') + '</tr>';
  t.innerHTML = h + rows.map(r => '<tr>' + head.map(k => '<td>' + r[k] + '</td>').join('') + '</tr>').join('');
  return t;
}

function appendComponent(comp) {
  const art = document.getElementById('artifact');
  art.innerHTML = '';
  art.appendChild(el('h3', 'font-semibold text-base mb-2', comp.title));
  art.appendChild(renderTable(comp.rows));
}

function fillArtifact(title, html) {
  const art = document.getElementById('artifact');
  art.innerHTML = '';
  art.appendChild(el('h3', 'font-semibold text-base mb-2', title));
  art.appendChild(html);
}

function triggerHitl(detail, options) {
  const conv = document.getElementById('conv');
  const b = el('div', 'hitl-banner px-3 py-3 text-sm');
  b.innerHTML = '<div class="flex items-center gap-2 font-semibold text-amber-700"><span class="badge badge-human">待你确认</span>HITL 拦截</div>' +
    '<div class="mt-1 text-amber-900">' + detail.replace(/\n/g, '<br>') + '</div>' +
    '<div class="flex gap-2 mt-2">' + options.map((o, i) => '<button class="px-3 py-1 text-xs rounded-lg ' + (i === 0 ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200') + '" onclick="window.__hitlAnswer(this,\'' + o + '\')">' + o + '</button>').join('') + '</div>';
  conv.appendChild(b);
  conv.scrollTop = conv.scrollHeight;
  window.__hitlAnswer = (btn, opt) => {
    btn.closest('.hitl-banner').style.opacity = 0.5;
    appendUser(opt);
  };
}

function showUndoToast(undo) {
  const conv = document.getElementById('conv');
  const t = el('div', 'undo-toast px-3 py-2 text-xs flex items-center gap-2');
  t.innerHTML = '<span>' + undo.text + '</span><button class="ml-auto underline" onclick="this.parentElement.remove()">' + undo.action + '</button>';
  conv.appendChild(t);
  conv.scrollTop = conv.scrollHeight;
}

async function runStep(step) {
  if (step.role === 'user') { appendUser(step.text); return; }
  setBadge(step.state === 'awaiting_human' ? 'awaiting_human' : 'thinking');
  if (step.thinking) appendThinking(step.thinking);
  if (step.state === 'tool_calling') { await appendToolCall(step.tool, step.tool_status_text, step.tool_duration_ms); setBadge('thinking'); }
  if (step.text) { setBadge(step.state === 'error' ? 'error' : 'idle'); await streamText(document.getElementById('conv'), step.text); }
  if (step.citations) appendCitations(step.citations);
  if (step.component) appendComponent(step.component);
  if (step.undo) showUndoToast(step.undo);
  if (step.state === 'awaiting_human') { setBadge('awaiting_human'); triggerHitl(step.hitl_detail, step.hitl_options); }
}

async function startScript(script) {
  const art = document.getElementById('artifact');
  art.innerHTML = '<div class="artifact-empty w-full h-40 rounded-xl flex items-center justify-center text-sm">Artifact 面板 · 初始为空态</div>';
  for (const step of script) {
    await runStep(step);
    await new Promise(r => setTimeout(r, 350));
  }
  setBadge('idle');
}
