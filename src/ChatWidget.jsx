import React, { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Groq from "groq-sdk";
import { PORTFOLIO_CONTEXT } from './portfolioData';
import './App.css'; // Ensure CSS is imported if not already globally available

const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi there! I'm your AI assistant. How can I help you today?", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [showPrompts, setShowPrompts] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const chatWindowRef = useRef(null);
    const messagesEndRef = useRef(null);

    const presetPrompts = [
        "Tell me about yourself",
        "What are your skills?",
        "Show me your projects",
        "Contact information"
    ];

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    useGSAP(() => {
        if (isOpen) {
            gsap.fromTo(chatWindowRef.current,
                { scale: 0, opacity: 0, transformOrigin: "bottom right" },
                { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.2)" }
            );
        }
    }, [isOpen]);

    const handleClose = () => {
        gsap.to(chatWindowRef.current, {
            scale: 0,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => setIsOpen(false)
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text) => {
        if (!text.trim()) return;

        const newMessages = [...messages, { text, sender: 'user' }];
        setMessages(newMessages);
        setInput('');
        setShowPrompts(false);
        setIsTyping(true);

        try {
            const apiMessages = [
                { role: 'system', content: `${PORTFOLIO_CONTEXT}\n\nYou are a helpful and professional AI assistant for a developer's portfolio website. Keep responses concise and friendly.` },
                ...newMessages.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }))
            ];

            const chatCompletion = await groq.chat.completions.create({
                messages: apiMessages,
                model: "llama-3.1-8b-instant",
            });

            const reply = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that.";
            setMessages(prev => [...prev, { text: reply, sender: 'ai' }]);
        } catch (error) {
            console.error("Groq API error:", error);
            setMessages(prev => [...prev, { text: `Error: ${error.message || "Unknown error"}. Check console.`, sender: 'ai' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handlePromptClick = (prompt) => {
        handleSendMessage(prompt);
    };

    return (
        <div className="chat-widget-container">
            {isOpen && (
                <div className="chat-window" ref={chatWindowRef}>
                    <div className="chat-header">
                        <div className="chat-title">
                            <span className="status-dot"></span>
                            <h3>Assistant</h3>
                        </div>
                        <button className="close-btn" onClick={handleClose}>&times;</button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-bubble ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message-bubble ai typing">
                                <span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {showPrompts && (
                        <div className="preset-prompts">
                            {presetPrompts.map((prompt, index) => (
                                <button
                                    key={index}
                                    className="prompt-chip"
                                    onClick={() => handlePromptClick(prompt)}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="chat-input-area">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                        />
                        <button className="send-btn" onClick={() => handleSendMessage(input)}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <button className="chat-toggle-btn" onClick={isOpen ? handleClose : toggleChat}>
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
