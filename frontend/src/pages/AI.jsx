import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    MessageSquare, Plus, Send, Paperclip,
    Trash2, Menu, X, Bot, User, Loader2,
    Sparkles, Code, Lightbulb, BookOpen, ChevronDown
} from 'lucide-react';
import './AI.css';

const SUGGESTIONS = [
    { icon: <Code size={16} />, text: "Python asoslari haqida tushuntir" },
    { icon: <Lightbulb size={16} />, text: "JavaScript - HTML - CSS farqi nima?" },
    { icon: <BookOpen size={16} />, text: "React nima va qanday ishlaydi?" },
    { icon: <Sparkles size={16} />, text: "Birinchi loyiha yasashni o'rgat" },
];

const AI = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [model, setModel] = useState('gemini-2.5-pro');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Fetch user chats on mount
    useEffect(() => {
        if (currentUser) {
            fetchChats();
        }
    }, [currentUser]);

    const getAuthHeaders = async () => {
        if (!currentUser) return {};
        const token = await currentUser.getIdToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const fetchChats = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chats`, { headers });
            if (res.ok) {
                const data = await res.json();
                setChats(data);
                if (data.length > 0 && !currentChat) {
                    selectChat(data[0]);
                }
            }
        } catch (error) {
            console.error("Chats fetch xatolik:", error);
        }
    };

    const selectChat = async (chat) => {
        setCurrentChat(chat);
        setModel(chat.model);
        if (window.innerWidth <= 768) setIsSidebarOpen(false);

        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chats/${chat.id}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Messages fetch xatolik:", error);
        }
    };

    const createNewChat = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chats`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ model })
            });
            if (res.ok) {
                const newChat = await res.json();
                setChats([newChat, ...chats]);
                setCurrentChat(newChat);
                setMessages([]);
                if (window.innerWidth <= 768) setIsSidebarOpen(false);
            }
        } catch (error) {
            console.error("Yangi chat yaratishda xatolik:", error);
        }
    };

    const deleteChat = async (e, chatId) => {
        e.stopPropagation();
        if (!window.confirm("Bu chatni o'chirmoqchimisiz?")) return;

        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chats/${chatId}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                setChats(chats.filter(c => c.id !== chatId));
                if (currentChat?.id === chatId) {
                    setCurrentChat(null);
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error("Chat o'chirishda xatolik:", error);
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        let activeChat = currentChat;
        if (!activeChat) {
            try {
                const headers = await getAuthHeaders();
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chats`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ model })
                });
                if (res.ok) {
                    activeChat = await res.json();
                    setChats([activeChat, ...chats]);
                    setCurrentChat(activeChat);
                } else {
                    return;
                }
            } catch (err) {
                console.error("Failed to create init chat", err);
                return;
            }
        }

        const messageText = input;
        setInput('');

        const tempUserMessage = { id: Date.now().toString(), role: 'user', content: messageText };
        setMessages(prev => [...prev, tempUserMessage]);
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chats/${activeChat.id}/messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ content: messageText })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [
                    ...prev.filter(m => m.id !== tempUserMessage.id),
                    data.userMessage,
                    data.aiMessage
                ]);
            }
        } catch (error) {
            console.error("Xabar jo'natishda xatolik:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (text) => {
        setInput(text);
        // Focus the textarea
        textareaRef.current?.focus();
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        }
    }, [input]);

    // Login prompt for unauthenticated users
    if (!currentUser) {
        return (
            <div className="ai-login-prompt">
                <div className="ai-login-icon">
                    <Sparkles size={36} />
                </div>
                <h1>AI Yordamchi</h1>
                <p>Dasturlash bo'yicha savollaringizga AI javob beradi. Tizimga kiring va boshlang!</p>
                <button
                    onClick={() => navigate('/login')}
                    className="btn btn-primary btn-large"
                >
                    Tizimga Kirish
                </button>
            </div>
        );
    }

    const hasMessages = messages.length > 0;

    return (
        <div className="ai-page">
            {/* Mobile sidebar overlay */}
            {isSidebarOpen && (
                <div
                    className="ai-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`ai-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="ai-sidebar-header">
                    <button onClick={createNewChat} className="new-chat-btn">
                        <Plus size={18} /> Yangi Chat
                    </button>
                    <button
                        className="sidebar-toggle-btn sidebar-close-btn"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="chat-history-list">
                    {chats.length === 0 ? (
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            padding: '2rem 0',
                            opacity: 0.6
                        }}>
                            Hozircha chatlar yo'q
                        </p>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => selectChat(chat)}
                                className={`chat-history-item ${currentChat?.id === chat.id ? 'active' : ''}`}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                                    <MessageSquare size={15} />
                                    <span>{chat.title}</span>
                                </div>
                                <button
                                    onClick={(e) => deleteChat(e, chat.id)}
                                    className="delete-chat-btn"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="ai-main">
                {/* Top bar */}
                <div className="ai-topbar">
                    <button
                        className="sidebar-toggle-btn"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        title="Sidebar"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="topbar-model-label">
                        <Sparkles size={16} />
                        Gemini
                    </div>
                </div>

                {/* Content */}
                <div className="ai-content">
                    {!hasMessages ? (
                        /* Empty state */
                        <div className="ai-empty-state">
                            <h1 className="gemini-greeting">Salom, qanday yordam kerak?</h1>
                            <p className="gemini-subtext">Dasturlash bo'yicha so'rang</p>

                            <div className="suggestion-chips">
                                {SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        className="suggestion-chip"
                                        onClick={() => handleSuggestionClick(s.text)}
                                    >
                                        {s.icon}
                                        {s.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Messages */
                        <div className="ai-messages">
                            <div className="ai-messages-inner">
                                {messages.map((msg, index) => (
                                    <div key={msg.id || index} className={`msg-row ${msg.role}`}>
                                        <div className="msg-avatar">
                                            {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                                        </div>
                                        <div className="msg-bubble">
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="msg-row assistant">
                                        <div className="msg-avatar">
                                            <Sparkles size={16} />
                                        </div>
                                        <div className="typing-indicator">
                                            <div className="typing-dots">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    )}

                    {/* Input area */}
                    <div className="ai-input-area">
                        <div className="gemini-input-outer">
                            <div className="gemini-input-inner">
                                <div className="gemini-textarea-row">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask anything, @ for context"
                                        className="gemini-textarea"
                                        rows={1}
                                    />
                                </div>

                                {/* Controls row */}
                                <div className="gemini-controls-row">
                                    <div className="gemini-controls-left">
                                        <button className="gemini-chip" title="Planning mode">
                                            <ChevronDown size={14} />
                                            Planning
                                        </button>

                                        <select
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="gemini-model-select"
                                            disabled={messages.length > 0}
                                            title="Model tanlash"
                                        >
                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        </select>
                                    </div>

                                    <div className="gemini-controls-right">
                                        <button
                                            className="gemini-send-btn"
                                            onClick={handleSend}
                                            disabled={!input.trim() || isLoading}
                                            title="Jo'natish"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="ai-disclaimer">
                            AI ba'zan noaniq ma'lumotlar berishi mumkin. Muhim qarorlar qabul qilishdan oldin tekshiring.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AI;
