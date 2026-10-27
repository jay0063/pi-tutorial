/* ==========================================================================
   pi 源码之旅 — shared site runtime
   No dependencies. Works from file://.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     Navigation data
     ---------------------------------------------------------------------- */
  const NAV = [
    {
      label: "开始",
      items: [{ file: "index.html", num: "00", title: "导览与学习地图" }],
    },
    {
      label: "I · 源码主线",
      items: [
        { file: "01-architecture.html", num: "01", title: "全景架构" },
        { file: "02-pi-ai.html", num: "02", title: "统一模型层 pi-ai" },
        { file: "03-agent-loop.html", num: "03", title: "Agent Loop 深潜" },
        { file: "04-agent-session.html", num: "04", title: "AgentSession 与装配" },
        { file: "05-session-context.html", num: "05", title: "会话树与上下文" },
        { file: "06-tools-interfaces.html", num: "06", title: "工具与运行接口" },
        { file: "07-extensions.html", num: "07", title: "扩展系统" },
        { file: "08-tui.html", num: "08", title: "TUI 差分渲染" },
      ],
    },
    {
      label: "II · 补充教程",
      items: [
        { file: "09-typescript.html", num: "09", title: "TypeScript 精要" },
        { file: "10-llm.html", num: "10", title: "大模型基础" },
        { file: "11-harness.html", num: "11", title: "Harness 设计" },
      ],
    },
    {
      label: "III · 动手",
      items: [{ file: "12-hands-on.html", num: "12", title: "实战与源码路线" }],
    },
  ];

  const flat = NAV.flatMap((g) => g.items);
  const current = location.pathname.split("/").pop() || "index.html";
  const currentIndex = flat.findIndex((i) => i.file === current);

  function buildSidebar() {
    const host = $("#sidebar-nav");
    if (!host) return;
    host.innerHTML = NAV.map(
      (group) => `
      <div class="nav-group">
        <div class="nav-label">${group.label}</div>
        ${group.items
          .map(
            (item) => `<a class="nav-link${item.file === current ? " active" : ""}" href="${item.file}" data-search="${item.num} ${item.title}">
              <b>${item.num}</b><span>${item.title}</span>
            </a>`,
          )
          .join("")}
      </div>`,
    ).join("");
  }

  function buildMobileBar() {
    const title = flat.find((i) => i.file === current)?.title || "pi 源码之旅";
    const host = $("#mobile-title");
    if (host) host.textContent = title;
  }

  function buildFooterNav() {
    const host = $("#footer-nav");
    if (!host) return;
    const prev = currentIndex > 0 ? flat[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;
    host.innerHTML = `
      ${prev ? `<a href="${prev.file}"><span>← ${prev.num}</span><strong>${prev.title}</strong></a>` : "<span></span>"}
      ${next ? `<a class="next" href="${next.file}"><span>${next.num} →</span><strong>${next.title}</strong></a>` : "<span></span>"}
    `;
  }

  /* ----------------------------------------------------------------------
     Theme, font size, nav, search
     ---------------------------------------------------------------------- */
  function initTheme() {
    const saved = localStorage.getItem("pi-theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (systemDark ? "dark" : "light");
    document.documentElement.dataset.theme = initial;

    $$("[data-theme-toggle]").forEach((btn) => {
      const render = () => {
        const dark = document.documentElement.dataset.theme === "dark";
        btn.textContent = dark ? "☾ 夜间" : "☀ 日间";
        btn.setAttribute("aria-label", dark ? "切换到日间模式" : "切换到夜间模式");
      };
      render();
      btn.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem("pi-theme", next);
        render();
      });
    });

    const savedFont = localStorage.getItem("pi-font");
    if (savedFont) document.documentElement.style.setProperty("--content-w", savedFont === "wide" ? "900px" : "812px");
    $$("[data-font-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wide = getComputedStyle(document.documentElement).getPropertyValue("--content-w").trim() === "900px";
        document.documentElement.style.setProperty("--content-w", wide ? "812px" : "900px");
        localStorage.setItem("pi-font", wide ? "normal" : "wide");
      });
    });
  }

  function initMobileNav() {
    $$("[data-nav-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => document.body.classList.toggle("nav-open"));
    });
    document.addEventListener("click", (e) => {
      if (!document.body.classList.contains("nav-open")) return;
      if (e.target.closest(".sidebar") || e.target.closest("[data-nav-toggle]")) return;
      document.body.classList.remove("nav-open");
    });
    $$("#sidebar-nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
  }

  function initSearch() {
    const input = $("#nav-search");
    if (!input) return;
    const links = $$("#sidebar-nav .nav-link");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      links.forEach((a) => {
        a.classList.toggle("hidden-by-filter", q.length > 0 && !a.dataset.search.toLowerCase().includes(q));
      });
      $$("#sidebar-nav .nav-group").forEach((g) => {
        const visible = $$(".nav-link:not(.hidden-by-filter)", g).length > 0;
        g.style.display = visible ? "" : "none";
      });
    });
  }

  /* ----------------------------------------------------------------------
     Reading progress, TOC, reveal
     ---------------------------------------------------------------------- */
  function initProgress() {
    const bar = $("#read-progress span");
    if (!bar) return;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = `${h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initTOC() {
    const host = $("#toc-nav");
    if (!host) return;
    const heads = $$("article h2, article h3").filter((h) => h.id);
    if (heads.length < 2) {
      const toc = $(".toc");
      if (toc) toc.style.display = "none";
      return;
    }
    host.innerHTML =
      `<div class="toc-title">本页目录</div>` +
      heads
        .map((h) => `<a href="#${h.id}" class="${h.tagName === "H3" ? "lvl3" : ""}">${h.dataset.toc || h.textContent.replace(/^[\d.]+\s*/, "")}</a>`)
        .join("");
    const links = $$("a", host);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
        });
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    heads.forEach((h) => observer.observe(h));
  }

  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach((i) => io.observe(i));
  }

  /* ----------------------------------------------------------------------
     Tiny syntax highlighter (TS / JS / JSON / bash / text)
     ---------------------------------------------------------------------- */
  const KEYWORDS = new Set(
    ("const let var function return if else for while do switch case default break continue new class extends implements interface type enum namespace declare import export from as of in instanceof typeof this super try catch finally throw async await yield static public private protected readonly abstract satisfies keyof infer asserts is void never unknown any string number boolean object symbol bigint true false null undefined").split(
      " ",
    ),
  );

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightLine(line, lang) {
    if (lang === "text" || lang === "plain") return esc(line);
    if (lang === "bash" || lang === "sh") {
      let out = esc(line);
      if (/^\s*#/.test(line)) return `<span class="tok-com">${out}</span>`;
      out = out.replace(/(&quot;|")([^"]*)(&quot;|")/g, '<span class="tok-str">$1$2$3</span>');
      out = out.replace(/\b(pi|npm|npx|node|git|curl|cd|export|echo|cat|ls|rg|jq)\b/g, '<span class="tok-fn">$1</span>');
      out = out.replace(/(\s)(--?[\w-]+)/g, '$1<span class="tok-attr">$2</span>');
      return out;
    }
    // Order matters: comments, strings, keywords, numbers, types, calls.
    const re = /(\/\/.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b([A-Za-z_$][\w$]*)\b|(\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?)/g;
    let out = "";
    let last = 0;
    let m;
    while ((m = re.exec(line))) {
      out += esc(line.slice(last, m.index));
      const [raw, comment, str, word, num] = m;
      if (comment) out += `<span class="tok-com">${esc(comment)}</span>`;
      else if (str) out += `<span class="tok-str">${esc(str)}</span>`;
      else if (num) out += `<span class="tok-num">${esc(num)}</span>`;
      else if (word) {
        const after = line.slice(re.lastIndex);
        if (KEYWORDS.has(word)) out += `<span class="tok-kw">${esc(word)}</span>`;
        else if (/^[A-Z]/.test(word)) out += `<span class="tok-type">${esc(word)}</span>`;
        else if (/^\s*\(/.test(after)) out += `<span class="tok-fn">${esc(word)}</span>`;
        else out += esc(word);
      }
      last = re.lastIndex;
    }
    out += esc(line.slice(last));
    return out;
  }

  function dedent(text) {
    const lines = text
      .replace(/\r\n?/g, "\n")
      .replace(/^[ \t]*\n+/, "")
      .replace(/\n+[ \t]*$/, "")
      .split("\n");
    let min = Infinity;
    for (const l of lines) {
      if (!l.trim()) continue;
      const n = l.match(/^[ \t]*/)[0].length;
      min = Math.min(min, n);
    }
    if (!isFinite(min) || min === 0) return lines;
    return lines.map((l) => l.slice(min));
  }

  function parseRanges(str) {
    const set = new Set();
    if (!str) return set;
    str.split(",").forEach((part) => {
      const [a, b] = part.split("-").map((n) => parseInt(n, 10));
      if (Number.isFinite(a)) {
        const end = Number.isFinite(b) ? b : a;
        for (let i = a; i <= end; i++) set.add(i);
      }
    });
    return set;
  }

  function initCodePanels() {
    $$(".code-panel").forEach((panel) => {
      const src = $("script.src", panel);
      if (!src) return;
      if (panel.hasAttribute("data-nolines")) panel.classList.add("no-lines");
      const lang = panel.dataset.lang || "ts";
      const lines = dedent(src.textContent || "");
      const start = parseInt(panel.dataset.start || "1", 10);
      const hi = parseRanges(panel.dataset.highlight);
      const pre = document.createElement("pre");
      pre.className = "code";
      const code = document.createElement("code");
      lines.forEach((line, i) => {
        const row = document.createElement("div");
        row.className = "cline" + (hi.has(i + 1) ? " hl" : "");
        row.dataset.line = String(start + i);
        const text = document.createElement("span");
        text.className = "ctext";
        text.innerHTML = highlightLine(line, lang) || " ";
        row.appendChild(text);
        code.appendChild(row);
      });
      pre.appendChild(code);
      const scroll = document.createElement("div");
      scroll.className = "code-scroll";
      scroll.appendChild(pre);
      src.replaceWith(scroll);
      panel.querySelector(".copy-btn")?.addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        const plain = lines.join("\n");
        try {
          await navigator.clipboard.writeText(plain);
          btn.textContent = "已复制";
        } catch {
          const ta = document.createElement("textarea");
          ta.value = plain;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          btn.textContent = "已复制";
        }
        setTimeout(() => (btn.textContent = "复制"), 1600);
      });
    });
  }

  /* ----------------------------------------------------------------------
     Tabs
     ---------------------------------------------------------------------- */
  function initTabs() {
    $$(".tabs").forEach((tabs) => {
      const btns = $$(".tab-btn", tabs);
      const panels = $$(".tab-panel", tabs);
      btns.forEach((btn, i) => {
        btn.addEventListener("click", () => {
          btns.forEach((b) => b.classList.toggle("active", b === btn));
          panels.forEach((p, j) => p.classList.toggle("active", i === j));
        });
      });
    });
  }

  /* ----------------------------------------------------------------------
     Movement along an SVG path (for packets)
     ---------------------------------------------------------------------- */
  function movePacket(packet, path, duration = 620) {
    if (!packet || !path || reduceMotion) return Promise.resolve();
    return new Promise((resolve) => {
      const length = path.getTotalLength();
      const start = performance.now();
      packet.style.opacity = "1";
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const pt = path.getPointAtLength(length * (0.15 + t * 0.7));
        packet.setAttribute("cx", pt.x);
        packet.setAttribute("cy", pt.y);
        if (t < 1) requestAnimationFrame(tick);
        else {
          packet.style.opacity = "0";
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /* ----------------------------------------------------------------------
     Home hero loop
     ---------------------------------------------------------------------- */
  function initHeroLoop() {
    const root = $("#hero-loop");
    if (!root) return;
    const nodes = $$(".node-box", root);
    const edges = $$(".edge", root);
    const packet = $(".packet", root);
    const log = $("#hero-log");
    const steps = [
      { node: 0, edge: 0, text: "prompt 进入会话，成为 active branch 的新叶子" },
      { node: 1, edge: 1, text: "投影上下文 + 系统提示 + 工具声明 → provider 请求" },
      { node: 2, edge: 2, text: "assistant 流式返回：text / thinking / toolCall" },
      { node: 3, edge: 3, text: "参数校验 → beforeToolCall → 并行执行 → afterToolCall" },
      { node: 4, edge: 4, text: "toolResult 落盘；需要时进入下一 turn" },
      { node: 1, edge: 5, text: "循环直到没有工具调用、队列为空，agent_end" },
    ];
    let step = 0;
    let playing = false;
    let timer = null;

    const reset = () => {
      step = 0;
      nodes.forEach((n) => n.classList.remove("active", "done"));
      edges.forEach((e) => e.classList.remove("active"));
      if (log) log.innerHTML = `<span class="muted">等待开始…</span>`;
    };

    const advance = async () => {
      if (step >= steps.length) {
        reset();
        return;
      }
      const s = steps[step];
      nodes.forEach((n, i) => {
        n.classList.toggle("active", i === s.node);
        if (i < s.node) n.classList.add("done");
      });
      edges.forEach((e) => e.classList.remove("active"));
      const edge = edges[s.edge];
      if (edge) edge.classList.add("active");
      if (log) {
        log.innerHTML = `<b>${String(step + 1).padStart(2, "0")}</b> ${s.text}`;
      }
      await movePacket(packet, edge, 560);
      step += 1;
      if (step === steps.length) {
        nodes.forEach((n) => n.classList.add("done"));
        edges.forEach((e) => e.classList.remove("active"));
      }
    };

    const scope = root.closest(".hero-figure") || document;
    const playBtn = $("[data-hero-play]", scope);
    const stepBtn = $("[data-hero-step]", scope);
    const resetBtn = $("[data-hero-reset]", scope);

    if (stepBtn) stepBtn.addEventListener("click", () => { stop(); advance(); });
    if (resetBtn) resetBtn.addEventListener("click", () => { stop(); reset(); });
    if (playBtn)
      playBtn.addEventListener("click", () => {
        if (playing) { stop(); return; }
        playing = true;
        playBtn.textContent = "⏸ 暂停";
        const run = async () => {
          if (!playing) return;
          if (step >= steps.length) reset();
          await advance();
          if (playing) timer = setTimeout(run, 1100);
        };
        run();
      });
    function stop() {
      playing = false;
      if (timer) clearTimeout(timer);
      timer = null;
      if (playBtn) playBtn.textContent = "▶ 播放循环";
    }
  }

  /* ----------------------------------------------------------------------
     Generic step demo (agent loop)
     ---------------------------------------------------------------------- */
  function initStepDemo() {
    const root = $("[data-demo='agentloop']");
    if (!root) return;
    const chips = $$(".step-chip", root);
    const nodes = $$("[data-step-node]", root);
    const edges = $$("[data-step-edge]", root);
    const log = $(".event-log", root);
    const steps = [
      { log: "agent_start → turn_start；prompt 写入 transcript", state: "declared" },
      { log: "prepareRequest → convertToLlm → streamFn(model, transcript)", state: "request" },
      { log: "provider 流式事件：text_delta / toolcall_delta / done", state: "stream" },
      { log: "prepareToolCall：查找工具 → 参数校验 → beforeToolCall", state: "prepare" },
      { log: "execute()；并行模式下同时跑，结果按源顺序落盘", state: "execute" },
      { log: "afterToolCall → toolResult message → turn_end", state: "result" },
      { log: "finishTurn / steering / follow-up 决定是否继续", state: "decide" },
      { log: "无工具调用且队列为空 → agent_end", state: "end" },
    ];
    let i = 0;
    const render = () => {
      chips.forEach((c, n) => {
        c.classList.toggle("active", n === i);
        c.classList.toggle("done", n < i);
      });
      nodes.forEach((n) => {
        const idx = parseInt(n.dataset.stepNode, 10);
        n.classList.toggle("active", idx === i);
        n.classList.toggle("done", idx < i);
      });
      edges.forEach((e) => e.classList.toggle("on", parseInt(e.dataset.stepEdge, 10) === i));
      if (log) {
        const row = document.createElement("div");
        row.innerHTML = `<span class="t">${String(i).padStart(2, "0")}</span> ${steps[i].log}`;
        log.appendChild(row);
        log.scrollTop = log.scrollHeight;
      }
    };
    $$("[data-demo-next]", root).forEach((b) =>
      b.addEventListener("click", () => {
        if (i >= steps.length - 1) return;
        i += 1;
        render();
      }),
    );
    $$("[data-demo-reset]", root).forEach((b) =>
      b.addEventListener("click", () => {
        i = 0;
        if (log) log.innerHTML = "";
        render();
      }),
    );
    render();
  }

  /* ----------------------------------------------------------------------
     Streaming event demo
     ---------------------------------------------------------------------- */
  function initStreamDemo() {
    const root = $("[data-demo='stream']");
    if (!root) return;
    const out = $(".stream-out", root);
    const meta = $(".stream-meta", root);
    const play = $("[data-stream-play]", root);
    const resetBtn = $("[data-stream-reset]", root);
    let timers = [];
    let running = false;

    const text = "我会先读取配置，再修改端口。";
    const json = '{"path":"config/server.ts","offset":1}';
    const clear = () => {
      timers.forEach(clearTimeout);
      timers = [];
      running = false;
      out.innerHTML = `<span class="dim">等待请求…</span>`;
      meta.innerHTML = "";
      if (play) play.textContent = "▶ 播放流";
    };

    const start = () => {
      if (running) return;
      running = true;
      if (play) play.textContent = "⏳ 流式中";
      out.textContent = "";
      meta.textContent = "";
      let t = 0;
      const push = (fn, ms) => timers.push(setTimeout(fn, (t += ms)));

      const sys = document.createElement("div");
      const metaLine = document.createElement("div");
      push(() => {
        out.innerHTML = `<span class="dim">event: start</span>\n`;
        meta.innerHTML = `stopReason: <b>pending</b> · 0 tokens`;
      }, 100);
      const addText = (s) => {
        out.insertAdjacentText("beforeend", s);
      };
      const textLines = text.split("");
      push(() => { out.insertAdjacentHTML("beforeend", `\n<span class="dim">event: text_delta</span>\n`); }, 350);
      textLines.forEach((ch, idx) => push(() => addText(ch), 34));
      push(() => {
        out.insertAdjacentHTML("beforeend", `\n<span class="dim">event: toolcall_start</span>\n`);
        meta.innerHTML = `正在累积 toolCall JSON…`;
        out.insertAdjacentHTML("beforeend", `<span style="color:#7ed3c6">read</span>(`);
      }, 250);
      json.split("").forEach((ch) => push(() => addText(ch.replace(/</g, "&lt;")), 22));
      push(() => {
        out.insertAdjacentHTML("beforeend", `)`);
        out.insertAdjacentHTML("beforeend", `\n<span class="dim">event: toolcall_end → done</span>`);
        meta.innerHTML = `解析结果：<b>path</b> = "config/server.ts" · <b>stopReason</b> = toolUse`;
      }, 200);
      push(() => {
        running = false;
        if (play) play.textContent = "↻ 重播";
      }, 300);
    };

    if (play) play.addEventListener("click", () => { if (!running) { clear(); start(); } });
    if (resetBtn) resetBtn.addEventListener("click", clear);
    clear();
  }

  /* ----------------------------------------------------------------------
     Compaction demo
     ---------------------------------------------------------------------- */
  function initCompactionDemo() {
    const root = $("[data-demo='compaction']");
    if (!root) return;
    const slider = $("input[type='range']", root);
    const bar = $(".budget-bar", root);
    const summary = $(".demo-note", root);
    const toggle = $("[data-compact-toggle]", root);
    const cutLabel = $("[data-cut-label]", root);
    const WINDOW = 200000;
    const SYSTEM = 5200;
    const TOOLS = 3600;
    const PER_MSG = 620;
    const KEEP = 20000;
    let compacted = false;

    const render = () => {
      const n = parseInt(slider.value, 10);
      const raw = n * PER_MSG;
      const keepMsgs = Math.min(n, Math.round(KEEP / PER_MSG));
      const summaryTokens = compacted ? 1400 : 0;
      const keptTokens = compacted ? keepMsgs * PER_MSG : raw;
      const history = compacted ? summaryTokens + keptTokens : raw;
      const total = SYSTEM + TOOLS + history;
      const pct = (v) => Math.max(0, (v / WINDOW) * 100);
      bar.innerHTML = `
        <div class="budget-seg system" style="width:${pct(SYSTEM)}%">sys</div>
        <div class="budget-seg tools" style="width:${pct(TOOLS)}%">tools</div>
        <div class="budget-seg history" style="width:${pct(history)}%">history ${(history / 1000).toFixed(1)}k</div>
        <div class="budget-seg free" style="width:${Math.max(0, 100 - pct(total))}%">${total < WINDOW ? "free" : "overflow"}</div>
      `;
      if (cutLabel) cutLabel.textContent = compacted ? `保留最近 ${keepMsgs} 条（约 ${(keptTokens / 1000).toFixed(1)}k）` : `切点：第 ${Math.max(0, n - keepMsgs)} 条之后`;
      if (summary) {
        summary.innerHTML = compacted
          ? `已压缩：${n} 条原始消息 → 1 条 summary + 最近 ${keepMsgs} 条。上下文约 <b>${(total / 1000).toFixed(1)}k</b> tokens，原始记录仍在 JSONL 里。`
          : `当前 ${n} 条消息 ≈ <b>${(total / 1000).toFixed(1)}k</b> tokens；阈值 = 200k − 16k = <b>184k</b>。${total > WINDOW - 16384 ? "⚠ 已越过自动压缩阈值。" : ""}`;
      }
    };
    slider.addEventListener("input", render);
    if (toggle)
      toggle.addEventListener("click", () => {
        compacted = !compacted;
        toggle.textContent = compacted ? "还原原始历史" : "执行压缩";
        render();
      });
    render();
  }

  /* ----------------------------------------------------------------------
     Session tree demo
     ---------------------------------------------------------------------- */
  function initTreeDemo() {
    const root = $("[data-demo='tree']");
    if (!root) return;
    const nodes = $$(".tn", root);
    const edges = $$(".tl", root);
    const detail = $(".tree-detail", root);
    const data = {
      u1: { parent: null, kind: "user", text: "给 server 加一个健康检查接口", id: "a1b2c3d4", tokens: 18 },
      a1: { parent: "u1", kind: "assistant", text: "先读一下现有路由与测试", id: "b2c3d4e5", tokens: 42 },
      t1: { parent: "a1", kind: "toolResult", text: "read src/server.ts (128 lines)", id: "c3d4e5f6", tokens: 930 },
      u2: { parent: "t1", kind: "user", text: "顺便补一个测试", id: "d4e5f6a7", tokens: 12 },
      a2: { parent: "u2", kind: "assistant", text: "修改 server.ts 并新增 server.test.ts", id: "e5f6a7b8", tokens: 88 },
      t2: { parent: "a2", kind: "toolResult", text: "edit ok · write ok", id: "f6a7b8c9", tokens: 24 },
      a3: { parent: "t2", kind: "assistant", text: "测试通过，总结改动", id: "a7b8c9d0", tokens: 31 },
      c1: { parent: "t1", kind: "compaction", text: "summary: 已读路由，接口方案确定", id: "b8c9d0e1", tokens: 1400, summary: true },
      a4: { parent: "c1", kind: "assistant", text: "基于摘要继续：实现 /healthz", id: "c9d0e1f2", tokens: 26 },
    };
    const pathTo = (id) => {
      const path = [];
      let cur = id;
      while (cur) {
        path.unshift(cur);
        cur = data[cur].parent;
      }
      return path;
    };
    const render = (id) => {
      const path = pathTo(id);
      const set = new Set(path);
      nodes.forEach((n) => n.classList.toggle("active", n.dataset.id === id));
      edges.forEach((e) => e.classList.toggle("active", set.has(e.dataset.to) && set.has(data[e.dataset.to]?.parent)));
      if (detail) {
        detail.innerHTML = path
          .map(
            (k) =>
              `<div><span class="k">${data[k].id}</span> <span class="a">${data[k].kind}</span> · <span class="v">${data[k].text}</span></div>`,
          )
          .join("") +
          `<div style="margin-top:7px;color:#8d9485">active branch: ${path.length} entries · 约 ${path.reduce((s, k) => s + data[k].tokens, 0)} tokens</div>`;
      }
    };
    nodes.forEach((n) => {
      n.addEventListener("click", () => render(n.dataset.id));
      n.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") render(n.dataset.id);
      });
      n.setAttribute("tabindex", "0");
      n.setAttribute("role", "button");
    });
    render("a3");
  }

  /* ----------------------------------------------------------------------
     TUI differential rendering demo
     ---------------------------------------------------------------------- */
  function initTuiDemo() {
    const root = $("[data-demo='tui']");
    if (!root) return;
    const screen = $(".tui-screen", root);
    const label = $(".tui-frame-label", root);
    const frames = [
      {
        label: "frame 1 · full render",
        lines: [
          "<span class='dim'>~/code/api</span>  <span class='acc'>pi</span> v1.4.0",
          "",
          "<span class='acc'>›</span> 给 server 加健康检查",
          "",
          "<span class='dim'>○ thinking…</span>",
          "<span class='dim'>○ reading src/server.ts</span>",
        ],
        changed: [],
      },
      {
        label: "frame 2 · text stream (line 5 changed)",
        lines: [
          "<span class='dim'>~/code/api</span>  <span class='acc'>pi</span> v1.4.0",
          "",
          "<span class='acc'>›</span> 给 server 加健康检查",
          "",
          "我先看一下现有路由，再加 /healthz。",
          "<span class='dim'>○ reading src/server.ts</span>",
        ],
        changed: [4],
      },
      {
        label: "frame 3 · tool result (line 6 changed)",
        lines: [
          "<span class='dim'>~/code/api</span>  <span class='acc'>pi</span> v1.4.0",
          "",
          "<span class='acc'>›</span> 给 server 加健康检查",
          "",
          "我先看一下现有路由，再加 /healthz。",
          "<span class='ok'>✓ read src/server.ts</span>  <span class='dim'>128 lines · 0.4s</span>",
        ],
        changed: [5],
      },
      {
        label: "frame 4 · appended editor line (lines 7–8 new)",
        lines: [
          "<span class='dim'>~/code/api</span>  <span class='acc'>pi</span> v1.4.0",
          "",
          "<span class='acc'>›</span> 给健康检查加测试",
          "",
          "我先看一下现有路由，再加 /healthz。",
          "<span class='ok'>✓ read src/server.ts</span>  <span class='dim'>128 lines · 0.4s</span>",
          "",
          "<span class='dim'>──────────────────────────────────</span>",
        ],
        changed: [7],
      },
    ];
    let i = 0;
    const render = () => {
      const f = frames[i];
      screen.innerHTML = f.lines
        .map((l, n) => `<div class="tui-line ${f.changed.includes(n) ? (i === 3 ? "new" : "changed") : ""}">${l || " "}</div>`)
        .join("");
      if (label) label.textContent = f.label;
    };
    $("[data-tui-next]", root)?.addEventListener("click", () => {
      i = (i + 1) % frames.length;
      render();
    });
    $("[data-tui-reset]", root)?.addEventListener("click", () => {
      i = 0;
      render();
    });
    render();
  }

  /* ----------------------------------------------------------------------
     Parallel / sequential tool timeline
     ---------------------------------------------------------------------- */
  function initParallelDemo() {
    const root = $("[data-demo='parallel']");
    if (!root) return;
    const body = $(".parallel-body", root);
    const modeLabel = $("[data-par-mode]", root);
    const totalLabel = $("[data-par-total]", root);
    const btn = $("[data-par-toggle]", root);
    const tools = [
      { name: "read src/server.ts", dur: 620 },
      { name: "grep health src", dur: 420 },
      { name: "bash npm test", dur: 940 },
    ];
    let parallel = true;
    let timers = [];
    const stop = () => { timers.forEach(clearTimeout); timers = []; };

    const render = () => {
      stop();
      if (modeLabel) modeLabel.textContent = parallel ? "parallel" : "sequential";
      if (btn) btn.textContent = parallel ? "切换为串行" : "切换为并行";
      const scale = 1.15;
      let rows = "";
      if (parallel) {
        tools.forEach((t) => {
          rows += `<div class="par-row"><span class="par-name">${t.name}</span><span class="par-track"><span class="par-bar" data-dur="${t.dur * scale}" style="width:0"></span></span><span class="par-time">${(t.dur / 1000).toFixed(2)}s</span></div>`;
        });
      } else {
        let acc = 0;
        tools.forEach((t) => {
          rows += `<div class="par-row"><span class="par-name">${t.name}</span><span class="par-track"><span class="par-bar seq" data-delay="${acc * scale}" data-dur="${t.dur * scale}" style="width:0"></span></span><span class="par-time">${(acc / 1000).toFixed(2)}s</span></div>`;
          acc += t.dur;
        });
      }
      body.innerHTML = rows;
      const bars = $$(".par-bar", body);
      requestAnimationFrame(() => {
        bars.forEach((b) => {
          const delay = parseInt(b.dataset.delay || "0", 10);
          timers.push(setTimeout(() => (b.style.width = "100%"), 40 + delay));
        });
      });
      const total = parallel ? Math.max(...tools.map((t) => t.dur)) : tools.reduce((s, t) => s + t.dur, 0);
      if (totalLabel) totalLabel.textContent = `${(total / 1000).toFixed(2)}s`;
    };
    btn?.addEventListener("click", () => { parallel = !parallel; render(); });
    render();
  }

  /* ----------------------------------------------------------------------
     Context budget (LLM chapter)
     ---------------------------------------------------------------------- */
  function initBudgetDemo() {
    const root = $("[data-demo='budget']");
    if (!root) return;
    const ranges = $$("input[type='range']", root);
    const bar = $(".budget-bar", root);
    const totalEl = $("[data-budget-total]", root);
    const warn = $("[data-budget-warn]", root);
    const WINDOW = 200000;
    const render = () => {
      const vals = ranges.map((r) => parseInt(r.value, 10) * 1000);
      const [sys, tools, history, output] = vals;
      const total = sys + tools + history + output;
      const pct = (v) => Math.max(0, (v / WINDOW) * 100);
      bar.innerHTML = `
        <div class="budget-seg system" style="width:${pct(sys)}%">system</div>
        <div class="budget-seg tools" style="width:${pct(tools)}%">tools</div>
        <div class="budget-seg history" style="width:${pct(history)}%">history</div>
        <div class="budget-seg free" style="width:${pct(output)}%;background:var(--accent-soft);color:var(--accent)">output</div>
        <div class="budget-seg free" style="width:${Math.max(0, 100 - pct(total))}%">free</div>
      `;
      if (totalEl) totalEl.textContent = `${(total / 1000).toFixed(0)}k / ${(WINDOW / 1000).toFixed(0)}k`;
      if (warn) {
        warn.textContent =
          total > WINDOW - 16384
            ? "超过压缩阈值（窗口 − 16k reserve）：下一轮开始前会触发 auto-compaction。"
            : "仍在安全区。注意：工具结果和系统提示也占上下文，不只是对话文本。";
        warn.style.color = total > WINDOW - 16384 ? "var(--accent)" : "var(--muted)";
      }
    };
    ranges.forEach((r) => r.addEventListener("input", render));
    render();
  }

  /* ----------------------------------------------------------------------
     Keyboard navigation
     ---------------------------------------------------------------------- */
  function initKeyboard() {
    if (currentIndex < 0) return;
    document.addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
      if (e.key === "[") {
        const prev = flat[currentIndex - 1];
        if (prev) location.href = prev.file;
      } else if (e.key === "]") {
        const next = flat[currentIndex + 1];
        if (next) location.href = next.file;
      }
    });
    const hint = $("#kbd-hint");
    if (hint) hint.textContent = `${currentIndex + 1} / ${flat.length} · [ ] 翻页`;
  }

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */
  function init() {
    buildSidebar();
    buildMobileBar();
    buildFooterNav();
    initTheme();
    initMobileNav();
    initSearch();
    initProgress();
    initTOC();
    initReveal();
    initCodePanels();
    initTabs();
    initHeroLoop();
    initStepDemo();
    initStreamDemo();
    initCompactionDemo();
    initTreeDemo();
    initTuiDemo();
    initParallelDemo();
    initBudgetDemo();
    initKeyboard();
    document.documentElement.classList.add("js-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
