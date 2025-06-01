import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';

const AES_KEY = process.env.NEXT_PUBLIC_AES_KEY;
const fetchUserFromLocalStorage = () => {
  const encrypted = localStorage.getItem('user');
  if (!encrypted) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, AES_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
};

const saveUserToLocalStorage = (user) => {

  const data = JSON.stringify({ name: user.name });
  const encrypted = CryptoJS.AES.encrypt(data, AES_KEY).toString();
  localStorage.setItem('user', encrypted);
};

let socket;

const Chat = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState('');
  const msgsRef = useRef(null);
  const inputRef = useRef(null);
  const [darkMode, setDarkMode] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userReady, setUserReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark-mode');
    } else if (saved === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark-mode');
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setDarkMode(true);
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
    }
  }, []);

  useEffect(() => {
    const u = fetchUserFromLocalStorage();
    if (!u) {
      setShowLogin(true);
      setLoading(false);
      return;
    }
    fetch('/api/users')
      .then(res => res.json())
      .then(usersList => {
        const userObj = usersList.find(user => user.name === u.name);
        if (userObj) {
          setUser(userObj);
        } else {
          setShowLogin(true);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    setUserReady(true);
    socket = io('http://localhost:4000');
    socket.emit('setUser', user);
    socket.on('chatHistory', (msgs) => {
      setMessages(msgs);
    });
    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });
    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogin = async () => {
    if (!name.trim()) return;
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const usersRes = await fetch('/api/users');
      const usersList = await usersRes.json();
      const userObj = usersList.find(u => u.name === name);
      if (userObj) {
        setUser(userObj);
        saveUserToLocalStorage(userObj); 
        setShowLogin(false);
        setUserReady(true);
      }
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !user || !userReady) return;
    socket.emit('sendMessage', { content: message, userId: user.id });
    setMessage('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const toggleTheme = () => {
    if (darkMode) {
      setDarkMode(false);
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    }
  };

  if (loading) return <div>Loading...</div>;

  if (showLogin) {
    return (
      <div>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label="Toggle dark/light mode"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        <div className="login-container">
          <div className="login-card">
            <h1>Login</h1>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={toggleTheme}
        className="theme-toggle-btn"
        aria-label="Toggle dark/light mode"
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
      <div className="chat-main">
        <div className="online-users-col">
          <h2>Online Users</h2>
          <div>
            {onlineUsers.map((u) => (
              <div key={u.id} style={{ fontWeight: u.id === user?.id ? 'bold' : undefined }}>
                {u.name} {u.id === user?.id ? '(You)' : ''}
              </div>
            ))}
          </div>
        </div>
        <div className="chat-area-col">
          <h1>Chat with other users!</h1>
          <div id="msgs" ref={msgsRef}>
            {messages.map((msg, index) => {
              const isMe = msg.user && user && msg.user.id === user.id;
              return (
                <div
                  key={msg.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: isMe ? '#6366f1' : '#888',
                      marginBottom: 2,
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {isMe ? 'You' : msg.user?.name || 'Unknown'}
                    <span style={{ marginLeft: 8, color: '#aaa', fontSize: 11 }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`zpravicka${isMe ? ' me' : ''}`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
          </div>
          <div id="msg-box" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', width: '100%', maxWidth: '100%', margin: '0 0 0 auto', position: 'static', bottom: 'unset', left: 'unset', transform: 'none', padding: '0 0 1rem 0', background: 'none', justifyContent: 'flex-end' }}>
            <button
              onClick={() => socket && socket.emit('clearChat')}
              className="clear-chat-btn"
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, height: 48, padding: '0 1.2rem', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(239,68,68,0.12)', marginRight: 'auto', display: 'flex', alignItems: 'center' }}
            >
              Clear chat
            </button>
            <input
              type="text"
              id="msg-input"
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={!userReady}
            />
            <button id="send-msg" onClick={sendMessage} disabled={!userReady}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;