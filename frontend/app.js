/**
 * AI Retail Intelligence - Frontend Application Logic
 * Pure JavaScript client with local conversation history management.
 */
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:8000'
      : '';
  const BACKEND_URL = `${API_BASE_URL}/chat`;
  const STORAGE_KEY_CHATS = 'retail_ai_conversations_v1';
  const STORAGE_KEY_ACTIVE = 'retail_ai_active_chat_id_v1';

  // DOM Elements
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const chatContainer = document.getElementById('chat-container');
  const welcomeScreen = document.getElementById('welcome-screen');
  const messagesContainer = document.getElementById('messages-container');
  const newChatBtn = document.getElementById('new-chat-btn');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const historyList = document.getElementById('history-list');
  const suggestedItems = document.querySelectorAll('.suggested-item');
  const insightCards = document.querySelectorAll('.insight-card');

  let activeChatId = null;
  let isGenerating = false;

  // =========================================================================
  // Local Storage & State Management
  // =========================================================================

  function getStoredConversations() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHATS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to parse stored conversations:', e);
      return [];
    }
  }

  function saveStoredConversations(conversations) {
    try {
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to localStorage:', e);
    }
  }

  function getStoredActiveId() {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE) || null;
    } catch (e) {
      return null;
    }
  }

  function saveStoredActiveId(id) {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY_ACTIVE, id);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE);
      }
    } catch (e) {
      console.error('Failed to save active chat ID:', e);
    }
  }

  /**
   * Derive a concise, user-friendly title from the first question.
   */
  function generateChatTitle(question) {
    const q = question.toLowerCase();
    if (q.includes('rfm') || q.includes('segment')) {
      return 'RFM Segment Analysis';
    }
    if (q.includes('department') && (q.includes('sales') || q.includes('revenue') || q.includes('top'))) {
      return 'Top Department Sales';
    }
    if (q.includes('campaign') && (q.includes('spend') || q.includes('performance') || q.includes('highest'))) {
      return 'Campaign Spend Analysis';
    }
    if (q.includes('risk') || q.includes('at risk') || q.includes('churn')) {
      return 'At-Risk Customer Cohorts';
    }
    if (q.includes('product') && (q.includes('revenue') || q.includes('highest') || q.includes('sales'))) {
      return 'Top Product Revenue';
    }
    if (q.includes('basket') || q.includes('trip')) {
      return 'Basket & Trip Metrics';
    }
    if (q.includes('discount') || q.includes('coupon') || q.includes('promotion')) {
      return 'Promotion & Discount Impact';
    }

    // General fallback: clean punctuation and truncate to 28 characters
    const clean = question.replace(/[^\w\s]/g, '').trim();
    if (clean.length <= 28) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return clean.slice(0, 28).trim() + '...';
  }

  /**
   * Render Recent Chats list in the sidebar.
   */
  function renderHistoryList() {
    if (!historyList) return;
    const conversations = getStoredConversations();

    if (conversations.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No previous chats</div>';
      return;
    }

    historyList.innerHTML = '';
    conversations.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'history-item' + (chat.id === activeChatId ? ' active' : '');
      item.setAttribute('data-id', chat.id);

      const btn = document.createElement('button');
      btn.className = 'history-item-btn';
      btn.title = chat.title || 'Untitled Conversation';
      btn.innerHTML = `
        <span class="history-icon">💬</span>
        <span class="history-title">${escapeHtml(chat.title || 'Conversation')}</span>
      `;

      btn.addEventListener('click', () => {
        if (!isGenerating) {
          if (window.innerWidth <= 960 && sidebar) {
            sidebar.classList.remove('open');
          }
          switchConversation(chat.id);
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-chat';
      delBtn.title = 'Delete conversation';
      delBtn.setAttribute('aria-label', 'Delete conversation');
      delBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isGenerating) {
          deleteConversation(chat.id);
        }
      });

      item.appendChild(btn);
      item.appendChild(delBtn);
      historyList.appendChild(item);
    });
  }

  /**
   * Start a new chat session.
   */
  function startNewChat() {
    activeChatId = null;
    saveStoredActiveId(null);
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'block';
    userInput.value = '';
    userInput.style.height = 'auto';
    userInput.focus();
    isGenerating = false;
    toggleInputState(false);
    renderHistoryList();
  }

  /**
   * Switch to an existing conversation by ID.
   */
  function switchConversation(chatId) {
    const conversations = getStoredConversations();
    const chat = conversations.find(c => c.id === chatId);

    if (!chat) {
      startNewChat();
      return;
    }

    activeChatId = chatId;
    saveStoredActiveId(chatId);

    // Hide welcome screen
    welcomeScreen.style.display = 'none';
    messagesContainer.innerHTML = '';

    // Render stored messages
    if (chat.messages && Array.isArray(chat.messages)) {
      chat.messages.forEach(msg => {
        if (msg.role === 'user') {
          appendUserMessage(msg.text);
        } else if (msg.role === 'assistant') {
          appendAssistantResponse(msg);
        }
      });
    }

    renderHistoryList();
    scrollToBottom();
    userInput.focus();
  }

  /**
   * Delete a conversation by ID with user confirmation.
   */
  function deleteConversation(chatId) {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    let conversations = getStoredConversations();
    conversations = conversations.filter(c => c.id !== chatId);
    saveStoredConversations(conversations);

    if (activeChatId === chatId) {
      if (conversations.length > 0) {
        switchConversation(conversations[0].id);
      } else {
        startNewChat();
      }
    } else {
      renderHistoryList();
    }
  }

  // =========================================================================
  // UI Interactions & Form Submission
  // =========================================================================

  // Input Auto-resize
  function adjustInputHeight() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
  }

  userInput.addEventListener('input', adjustInputHeight);

  // Enter to submit (Shift+Enter for newline)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && userInput.value.trim()) {
        chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
  });

  // Sidebar Toggle for Mobile
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 960 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // "New Chat" button handler
  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      if (!isGenerating) {
        startNewChat();
      }
    });
  }

  // Suggested Queries Handlers (Sidebar)
  suggestedItems.forEach(item => {
    item.addEventListener('click', () => {
      const query = item.getAttribute('data-query');
      if (query && !isGenerating) {
        if (window.innerWidth <= 960 && sidebar) {
          sidebar.classList.remove('open');
        }
        submitQuestion(query);
      }
    });
  });

  // Welcome Insight Cards Handlers
  insightCards.forEach(card => {
    card.addEventListener('click', () => {
      const query = card.getAttribute('data-query');
      if (query && !isGenerating) {
        submitQuestion(query);
      }
    });
  });

  // Form Submit Handler
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = userInput.value.trim();
    if (!query || isGenerating) return;
    submitQuestion(query);
  });

  /**
   * Send question to backend, display results, and persist to active conversation.
   */
  async function submitQuestion(questionText) {
    if (!questionText.trim() || isGenerating) return;

    // Hide welcome screen
    if (welcomeScreen.style.display !== 'none') {
      welcomeScreen.style.display = 'none';
    }

    // Append User Message to UI
    appendUserMessage(questionText);

    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';

    // Show Loading Indicator
    const typingElement = appendTypingIndicator();
    scrollToBottom();

    isGenerating = true;
    toggleInputState(true);

    try {
      // Retrieve existing history for follow-up query context
      let currentHistory = [];
      if (activeChatId) {
        const conversations = getStoredConversations();
        const activeChat = conversations.find(c => c.id === activeChatId);
        if (activeChat && activeChat.messages) {
          currentHistory = activeChat.messages;
        }
      }

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: questionText, history: currentHistory })
      });

      removeTypingIndicator(typingElement);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      appendAssistantResponse(data);

      // Persist to localStorage only after successful response
      persistConversationExchange(questionText, data);

    } catch (err) {
      console.error('Chat API Error:', err);
      removeTypingIndicator(typingElement);
      appendErrorMessage('Unable to reach the AI backend. Please make sure the FastAPI server is running.');
    } finally {
      isGenerating = false;
      toggleInputState(false);
      scrollToBottom();
      userInput.focus();
    }
  }

  /**
   * Persist a completed user question and assistant response into the active conversation.
   */
  function persistConversationExchange(questionText, responseData) {
    let conversations = getStoredConversations();

    // If starting a fresh chat, create conversation object
    if (!activeChatId) {
      const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newTitle = generateChatTitle(questionText);
      const newChat = {
        id: newId,
        title: newTitle,
        createdAt: new Date().toISOString(),
        messages: [
          { role: 'user', text: questionText },
          {
            role: 'assistant',
            answer: responseData.answer || '',
            sql: responseData.sql || '',
            data: responseData.data || []
          }
        ]
      };

      conversations.unshift(newChat);
      activeChatId = newId;
      saveStoredConversations(conversations);
      saveStoredActiveId(newId);
      renderHistoryList();
    } else {
      // Append to active conversation
      const chatIndex = conversations.findIndex(c => c.id === activeChatId);
      if (chatIndex !== -1) {
        conversations[chatIndex].messages.push({ role: 'user', text: questionText });
        conversations[chatIndex].messages.push({
          role: 'assistant',
          answer: responseData.answer || '',
          sql: responseData.sql || '',
          data: responseData.data || []
        });
        saveStoredConversations(conversations);
      }
    }
  }

  function toggleInputState(disabled) {
    userInput.disabled = disabled;
    sendBtn.disabled = disabled;
  }

  // =========================================================================
  // Rendering Helpers
  // =========================================================================

  function appendUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'message-row user';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble user-bubble';
    bubble.textContent = text;

    row.appendChild(bubble);
    messagesContainer.appendChild(row);
  }

  function appendTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'message-row assistant typing-row';

    const card = document.createElement('div');
    card.className = 'typing-card';
    card.innerHTML = `
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="typing-text">Analyzing retail data & generating response...</span>
    `;

    row.appendChild(card);
    messagesContainer.appendChild(row);
    return row;
  }

  function removeTypingIndicator(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  function appendAssistantResponse(res) {
    const row = document.createElement('div');
    row.className = 'message-row assistant';

    const card = document.createElement('div');
    card.className = 'assistant-card';

    // Header with avatar
    const header = document.createElement('div');
    header.className = 'assistant-header';
    header.innerHTML = `
      <div class="assistant-avatar">✨</div>
      <div class="assistant-title">Retail Intelligence Assistant</div>
    `;
    card.appendChild(header);

    // Natural language answer
    const answerContainer = document.createElement('div');
    answerContainer.className = 'assistant-answer';
    const answerText = res.answer || res.message || 'No analytical summary returned.';
    answerContainer.innerHTML = formatAnswerText(answerText);
    card.appendChild(answerContainer);

    // Data Table (if data exists and is a non-empty array)
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const tableWrapper = createDataTable(res.data);
      card.appendChild(tableWrapper);
    }

    // Generated SQL Section (if SQL exists)
    if (res.sql && typeof res.sql === 'string' && res.sql.trim()) {
      const sqlAccordion = createSqlAccordion(res.sql.trim());
      card.appendChild(sqlAccordion);
    }

    row.appendChild(card);
    messagesContainer.appendChild(row);
  }

  function formatAnswerText(text) {
    if (!text) return '';
    const sanitized = escapeHtml(text);
    const paragraphs = sanitized.split(/\n\s*\n/);
    return paragraphs
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  function createSqlAccordion(sqlText) {
    const details = document.createElement('details');
    details.className = 'sql-accordion';

    const summary = document.createElement('summary');
    summary.className = 'sql-summary';
    summary.innerHTML = `
      <div class="sql-summary-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
        <span>Generated SQL Query</span>
      </div>
      <span style="font-size:0.75rem; opacity:0.8;">Click to expand</span>
    `;

    const codeContainer = document.createElement('div');
    codeContainer.className = 'sql-code-container';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy-sql';
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>Copy</span>
    `;

    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(sqlText);
        copyBtn.innerHTML = `<span>Copied!</span>`;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          `;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy SQL:', err);
      }
    });

    const pre = document.createElement('pre');
    pre.className = 'sql-code';
    pre.textContent = sqlText;

    codeContainer.appendChild(copyBtn);
    codeContainer.appendChild(pre);

    details.appendChild(summary);
    details.appendChild(codeContainer);
    return details;
  }

  function createDataTable(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'data-table-wrapper';

    const rowCount = data.length;
    const headerBar = document.createElement('div');
    headerBar.className = 'table-header-bar';
    headerBar.innerHTML = `
      <span>QUERY RESULT DATA</span>
      <span>${rowCount} row${rowCount === 1 ? '' : 's'}</span>
    `;
    wrapper.appendChild(headerBar);

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'data-table-scroll';

    const table = document.createElement('table');
    table.className = 'data-table';

    const firstRow = data[0];
    const columns = (typeof firstRow === 'object' && firstRow !== null)
      ? Object.keys(firstRow)
      : ['Value'];

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = formatColumnName(col);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach(rowItem => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        let val = (typeof rowItem === 'object' && rowItem !== null) ? rowItem[col] : rowItem;
        td.textContent = formatCellValue(val, col);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    scrollContainer.appendChild(table);
    wrapper.appendChild(scrollContainer);

    return wrapper;
  }

  function formatColumnName(name) {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatCellValue(val, colName) {
    if (val === null || val === undefined) {
      return '—';
    }
    if (typeof val === 'number') {
      const lowerCol = (colName || '').toLowerCase();
      if (lowerCol.includes('sales') || lowerCol.includes('spend') || lowerCol.includes('revenue') || lowerCol.includes('amount') || lowerCol.includes('price')) {
        return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return val.toLocaleString();
    }
    return String(val);
  }

  function appendErrorMessage(message) {
    const row = document.createElement('div');
    row.className = 'message-row assistant';

    const card = document.createElement('div');
    card.className = 'error-card';
    card.innerHTML = `
      <div class="error-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div>
        <strong style="display:block; margin-bottom: 2px;">Connection Error</strong>
        <span>${escapeHtml(message)}</span>
      </div>
    `;

    row.appendChild(card);
    messagesContainer.appendChild(row);
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // Initial Page Load Restoration & URL Query Handler
  // =========================================================================
  const savedActiveId = getStoredActiveId();
  const savedConversations = getStoredConversations();

  renderHistoryList();

  // Handle URL query parameter if passed via "Ask AI" buttons (e.g., ai.html?q=...)
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledQuery = urlParams.get('q');

  if (prefilledQuery && prefilledQuery.trim()) {
    startNewChat();
    submitQuestion(prefilledQuery.trim());
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (savedActiveId && savedConversations.some(c => c.id === savedActiveId)) {
    switchConversation(savedActiveId);
  } else if (savedConversations.length > 0) {
    switchConversation(savedConversations[0].id);
  } else {
    startNewChat();
  }
});
