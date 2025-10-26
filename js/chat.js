// ./js/chat.js
const url = 'https://chat-app-1935c-default-rtdb.asia-southeast1.firebasedatabase.app/chat';
const imageAny = './images/08-15-27-06-cat_ready.gif';

let messages = localStorage.getItem('messages') ? JSON.parse(localStorage.getItem('messages')) : [];

// --- Helpers (giữ nguyên chức năng, code sạch hơn) ---
const sendPostRequest = (url, data, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) callback(xhr.responseText);
  };
  xhr.send(JSON.stringify(data));
};

const sendGetRequest = (url, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) callback(xhr.responseText);
      else console.error("Error:", xhr.status);
    }
  };
  xhr.send();
};

// --- Render giữ nguyên cấu trúc để CSS cũ hoặc Tailwind hook vào ---
const genMessage = (name, image, content) => {
  const parent = document.getElementById('chatDisplay');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');

  const img = document.createElement('img');
  img.src = image;
  img.alt = name;
  img.classList.add('user-avatar');

  const contentDiv = document.createElement('div');

  const userNameSpan = document.createElement('span');
  userNameSpan.classList.add('user-name');
  userNameSpan.textContent = name;

  const messageContentDiv = document.createElement('div');
  messageContentDiv.classList.add('content');
  // textContent đã an toàn XSS cho plain text
  messageContentDiv.textContent = content;

  contentDiv.appendChild(userNameSpan);
  contentDiv.appendChild(messageContentDiv);
  contentDiv.setAttribute('content', content);

  messageDiv.appendChild(img);
  messageDiv.appendChild(contentDiv);
  parent.appendChild(messageDiv);
};

const politeAlert = (msg) => {
  // thay alert cũ bằng thông điệp lịch sự
  alert(msg || "Vui lòng nhập nội dung trước khi gửi nhé!");
};

// --- Core chat ---
const chat = (channel, content, callback) => {
  if (content.trim() === '') {
    politeAlert();
    return;
  }
  if (channel === 'anyone') {
    // Lưu chữ thuần (string) như logic cũ
    sendPostRequest(`${url}/anyone.json`, content, () => {});
    genMessage('Unknow', imageAny, content);
    messages.push({ channel: 'Unknow', image: imageAny, content });
    localStorage.setItem('messages', JSON.stringify(messages));
    const display = document.getElementById('chatDisplay');
    display.scrollTop = display.scrollHeight;
  }
  setTimeout(() => {
    if (typeof callback === 'function') callback();
  }, 300);
};

const sendMessage = () => {
  const channel = document.getElementById('channel').value;
  const messageEl = document.getElementById('message');
  const message = messageEl.value;
  messageEl.value = '';
  messageEl.dispatchEvent(new Event('input')); // auto-resize lại
  chat(channel, message, () => scrollToBottomChat());
};

// --- Load & Sync ---
const loadChannel = () => {
  const channel = localStorage.getItem('channel') || 'anyone';
  // đặt select khớp giá trị
  const select = document.getElementById('channel');
  if (select) select.value = channel;
  if (channel === 'anyone') fillAny();
};

const clearMessages = () => {
  document.querySelectorAll('.message').forEach((m) => m.remove());
};

const fillAny = () => {
  messages = [];
  sendGetRequest(`${url}/anyone.json`, (response) => {
    const result = JSON.parse(response || 'null') || {};
    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        const content = result[key];
        genMessage('Unknow', imageAny, content);
        messages.push({ channel: 'Unknow', image: imageAny, content });
      }
    }
    const display = document.getElementById('chatDisplay');
    display.scrollTop = display.scrollHeight;
    localStorage.setItem('messages', JSON.stringify(messages));
  });
};

const scrollToBottomChat = () => {
  const chatDisplay = document.getElementById('chatDisplay');
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
};

// Giảm tải: chỉ cập nhật nếu khác biệt
const thread = () => {
  const channel = localStorage.getItem('channel') || 'anyone';
  let messagesString = localStorage.getItem('messages');
  let cached = messagesString ? JSON.parse(messagesString) : [];

  if (channel === 'anyone') {
    sendGetRequest(`${url}/anyone.json`, (response) => {
      const messArr = [];
      const result = JSON.parse(response || 'null') || {};
      for (const key in result) {
        if (Object.prototype.hasOwnProperty.call(result, key)) {
          const content = result[key];
          messArr.push({ channel: 'Unknow', image: imageAny, content });
        }
      }
      const compare = JSON.stringify(messArr) === JSON.stringify(cached);
      if (!compare) {
        localStorage.setItem('messages', JSON.stringify(messArr));
        clearMessages();
        fillAny();
      }
    });
  }
};

// --- Init ---
window.onload = () => {
  loadChannel();
};

// Polling mỗi 2s như cũ
const intervalId = setInterval(thread, 2000);
