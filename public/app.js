/* ═══════════════════════════════════════════════
   PRIME ELITE STORE AI — Frontend Application
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── State ──
  const state = {
    sessionId: getOrCreateSession(),
    isLoading: false,
    welcomeVisible: true
  };

  // ── DOM Elements ──
  const dom = {
    chatArea: document.getElementById('chatArea'),
    messages: document.getElementById('messages'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    typingIndicator: document.getElementById('typingIndicator'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    quickBtns: document.querySelectorAll('.quick-btn')
  };

  // ── Session Management ──
  function getOrCreateSession() {
    let sid = sessionStorage.getItem('pes_session');
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('pes_session', sid);
    }
    return sid;
  }

  // ── Markdown to HTML Parser ──
  function markdownToHtml(text) {
    if (!text) return '';
    let html = text;

    // Escape HTML entities first
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks (fenced)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="lang-${lang || ''}">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Images - ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" onerror="this.style.display=\'none\'">');

    // Links - [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');

    // Blockquote
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Unordered lists
    html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, (match) => `<ul>${match}</ul>`);
    // Fix multiple consecutive ULs
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Tables (basic markdown tables)
    html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split('|').map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return '<!--table-sep-->';
      return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    });
    html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, (match) => {
      const withHeaders = match.replace('<!--table-sep-->', '');
      return `<table>${withHeaders}</table>`;
    });
    html = html.replace(/<!--table-sep-->/g, '');

    // Fix table headers (first row)
    html = html.replace(/<table><tr>(.*?)<\/tr>/g, (match, cells) => {
      const headerCells = cells.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
      return `<table><tr>${headerCells}</tr>`;
    });

    // Line breaks (paragraphs)
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph if not already structured
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p><(h[123]|ul|ol|pre|table|blockquote|hr)/g, '<$1');
    html = html.replace(/<\/(h[123]|ul|ol|pre|table|blockquote)><\/p>/g, '</$1>');

    return html;
  }

  // ── Create Message Element ──
  function createMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'msg-avatar';

    if (role === 'assistant') {
      avatarDiv.innerHTML = `<img src="logo.webp" alt="AI" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm);">`;
    } else {
      avatarDiv.textContent = '👤';
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';

    if (role === 'assistant') {
      contentDiv.innerHTML = markdownToHtml(content);
    } else {
      contentDiv.textContent = content;
    }

    msgDiv.appendChild(avatarDiv);
    msgDiv.appendChild(contentDiv);

    return msgDiv;
  }

  // ── Create Product Cards ──
  function createProductCards(products) {
    if (!products || products.length === 0) return null;

    const grid = document.createElement('div');
    grid.className = 'product-cards-grid';

    products.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.style.animationDelay = `${index * 0.08}s`;

      const imgSrc = product.thumbnail || '';
      const imgHtml = imgSrc
        ? `<img class="product-card-img" src="${imgSrc}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'">`
        : '';

      card.innerHTML = `
        ${imgHtml}
        <div class="product-card-body">
          <div class="product-card-category">${product.category || 'Product'}</div>
          <div class="product-card-name">${product.name}</div>
          <div class="product-card-price">₹${(product.price || 0).toLocaleString('en-IN')}</div>
          <a class="product-card-link" href="${product.link}" target="_blank" rel="noopener noreferrer">
            View Product →
          </a>
        </div>
      `;

      grid.appendChild(card);
    });

    return grid;
  }

  // ── Send Message ──
  async function sendMessage(text) {
    const msg = (text || '').trim();
    if (!msg || state.isLoading) return;

    state.isLoading = true;
    dom.sendBtn.disabled = true;

    // Hide welcome screen
    if (state.welcomeVisible) {
      dom.welcomeScreen.style.display = 'none';
      state.welcomeVisible = false;
    }

    // Add user message
    const userMsg = createMessage('user', msg);
    dom.messages.appendChild(userMsg);
    dom.messageInput.value = '';
    autoResizeInput();
    scrollToBottom();

    // Show typing indicator
    dom.typingIndicator.classList.remove('hidden');
    scrollToBottom();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          sessionId: state.sessionId
        })
      });

      const data = await response.json();

      // Hide typing indicator
      dom.typingIndicator.classList.add('hidden');

      // Add assistant message
      const assistantMsg = createMessage('assistant', data.reply);
      dom.messages.appendChild(assistantMsg);

      // Add product cards if products were returned
      if (data.products && data.products.length > 0) {
        const cards = createProductCards(data.products);
        if (cards) {
          dom.messages.appendChild(cards);
        }
      }

      scrollToBottom();

    } catch (err) {
      console.error('Chat error:', err);
      dom.typingIndicator.classList.add('hidden');

      const errorMsg = createMessage('assistant',
        "I'm having trouble connecting right now. Please check your internet connection and try again. 🙏"
      );
      dom.messages.appendChild(errorMsg);
      scrollToBottom();
    }

    state.isLoading = false;
    dom.sendBtn.disabled = false;
    dom.messageInput.focus();
  }

  // ── Scroll to Bottom ──
  function scrollToBottom() {
    requestAnimationFrame(() => {
      dom.chatArea.scrollTop = dom.chatArea.scrollHeight;
    });
  }

  // ── Auto Resize Textarea ──
  function autoResizeInput() {
    const input = dom.messageInput;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  // ── Event Listeners ──

  // Send button click
  dom.sendBtn.addEventListener('click', () => {
    sendMessage(dom.messageInput.value);
  });

  // Enter key (Shift+Enter for new line)
  dom.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(dom.messageInput.value);
    }
  });

  // Auto resize on input
  dom.messageInput.addEventListener('input', autoResizeInput);

  // Quick action buttons
  dom.quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-query');
      if (query) {
        dom.messageInput.value = query;
        sendMessage(query);
      }
    });
  });

  // Focus input on load
  dom.messageInput.focus();

})();
