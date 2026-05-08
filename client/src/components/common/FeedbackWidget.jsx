import { useState, useRef, useEffect, useCallback } from 'react';
import { io as socketIO } from 'socket.io-client';
import { IoClose, IoChatbubbleEllipses, IoSend, IoCamera, IoImage, IoTrash } from 'react-icons/io5';
import '../css/FeedbackWidget.css';

export default function FeedbackWidget({ user }) {
    const [open, setOpen] = useState(false);
    const [type] = useState('chat');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [images, setImages] = useState([]); // [{ file, preview }]
    const [chatConversationId, setChatConversationId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [capturingScreen, setCapturingScreen] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const panelRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const socketRef = useRef(null);
    const lastMsgCountRef = useRef(0);
    const chatThreadRef = useRef(null);
    const chatBottomRef = useRef(null);

    const MAX_IMAGES = 3;

    const messagePlaceholder = 'Décrivez votre bug, votre question ou votre idée…';

    const loadCurrentChat = useCallback(async ({ silent = false } = {}) => {
        if (!user) return;
        if (!silent) {
            setChatLoading(true);
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${window.API_URL}/feedback/chat/my-current`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data?._id) {
                setChatConversationId(data._id);
                setChatMessages((prev) => {
                    const nextMessages = data.messages || [];
                    if (
                        prev.length === nextMessages.length
                        && prev.every((msg, index) => String(msg._id) === String(nextMessages[index]?._id))
                    ) {
                        return prev;
                    }
                    return nextMessages;
                });
            } else {
                setChatConversationId(null);
                setChatMessages((prev) => (prev.length ? [] : prev));
            }
        } catch {
            // Ignore transient polling errors
        } finally {
            if (!silent) {
                setChatLoading(false);
            }
        }
    }, [user]);

    // Play a short notification beep using Web Audio API
    // Auto-scroll chat to bottom when new messages arrive (only if already near bottom)
    useEffect(() => {
        const thread = chatThreadRef.current;
        const bottom = chatBottomRef.current;
        if (!thread || !bottom || !chatMessages.length) return;
        const distanceFromBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight;
        // Auto-scroll if user is within 80px of the bottom
        if (distanceFromBottom < 80) {
            bottom.scrollIntoView({ block: 'end' });
        }
    }, [chatMessages]);

    const playNotifSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        } catch {
            // Web Audio not available
        }
    }, []);

    // Socket.io connection
    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = socketIO(window.BASE_URL || window.API_URL?.replace('/api', '') || 'http://127.0.0.1:8100', {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('chat:message', (payload) => {
            const newMsg = payload.message;
            if (!newMsg) return;

            // Update messages list
            setChatMessages((prev) => {
                // Avoid duplicates
                if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
                const updated = [...prev, newMsg];
                lastMsgCountRef.current = updated.length;
                return updated;
            });

            // Only notify for admin messages (not own messages)
            if (newMsg.senderRole === 'admin') {
                // Show unread badge if not currently viewing the chat tab
                setUnreadCount((c) => {
                    const isViewingChat = document.visibilityState !== 'hidden';
                    // We'll check open+type in the render, just increment here
                    return c + 1;
                });
                playNotifSound();
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, playNotifSound]);

    useEffect(() => {
        if (open && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);
    useEffect(() => {
        if (!open || !user) return;
        loadCurrentChat();
        const timer = setInterval(() => {
            loadCurrentChat({ silent: true });
        }, 4000);
        return () => clearInterval(timer);
    }, [open, user, loadCurrentChat]);

    const handleOpen = () => {
        setError('');
        setOpen((prev) => {
            const next = !prev;
            if (next) setUnreadCount(0);
            return next;
        });
    };

    const addImages = useCallback((files) => {
        const remaining = MAX_IMAGES - images.length;
        if (remaining <= 0) return;
        const toAdd = Array.from(files).slice(0, remaining).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setImages((prev) => [...prev, ...toAdd]);
    }, [images.length]);

    const removeImage = (index) => {
        setImages((prev) => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => images.forEach((img) => URL.revokeObjectURL(img.preview));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFileChange = (e) => {
        if (e.target.files?.length) addImages(e.target.files);
        e.target.value = '';
    };

    const handleScreenshot = async () => {
        setCapturingScreen(true);
        setError('');
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen', cursor: 'never' },
                audio: false,
            });
            const track = stream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);
            const bitmap = await imageCapture.grabFrame();
            track.stop();

            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            canvas.getContext('2d').drawImage(bitmap, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
                    addImages([file]);
                }
            }, 'image/png');
        } catch (err) {
            if (err.name !== 'NotAllowedError') {
                setError('Impossible de capturer l\'écran.');
            }
        } finally {
            setCapturingScreen(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!message.trim()) {
            setError('Le message est requis.');
            return;
        }

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('type', type);
            formData.append('message', message.trim());
            if (email.trim()) formData.append('email', email.trim());
            images.forEach((img) => formData.append('images', img.file));

            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const isChat = type === 'chat';
            const endpoint = isChat && chatConversationId
                ? `${window.API_URL}/feedback/chat/${chatConversationId}/messages`
                : `${window.API_URL}/feedback`;

            if (isChat && chatConversationId) {
                formData.delete('type');
                formData.delete('email');
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Erreur lors de l\'envoi.');

            setMessage('');
            setEmail('');
            images.forEach((img) => URL.revokeObjectURL(img.preview));
            setImages([]);
            await loadCurrentChat({ silent: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="feedback-widget" ref={panelRef}>
            {open && (
                <div className="feedback-panel" role="dialog" aria-label="Feedback" aria-modal="true">
                    <div className="feedback-panel__header">
                        <div>
                            <span className="feedback-panel__title">Support OpenGlow</span>
                            <p className="feedback-panel__subtitle">Questions, bugs et idées.</p>
                        </div>
                        <button
                            type="button"
                            className="feedback-panel__close"
                            onClick={() => setOpen(false)}
                            aria-label="Fermer"
                        >
                            <IoClose />
                        </button>
                    </div>

                    <form className="feedback-panel__body" onSubmit={handleSubmit} noValidate>
                        <div className="feedback-chat-thread" ref={chatThreadRef} aria-live="polite">
                            {chatLoading ? (
                                <div className="feedback-chat-empty">Chargement du chat…</div>
                            ) : chatMessages.length ? chatMessages.map((msg) => {
                                const mine = msg.senderRole !== 'admin';
                                return (
                                    <div key={String(msg._id)} className={`feedback-chat-message${mine ? ' feedback-chat-message--mine' : ''}`}>
                                        <div className="feedback-chat-bubble">
                                            <p>{msg.message}</p>
                                            {msg.imageIds?.length ? (
                                                <div className="feedback-chat-images">
                                                    {msg.imageIds.map((id) => (
                                                        <a key={String(id)} href={`${window.API_URL}/uploads/image/${id}`} target="_blank" rel="noreferrer">
                                                            <img src={`${window.API_URL}/uploads/image/${id}`} alt="Piece jointe" />
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="feedback-chat-empty">Décrivez votre souci, un bug ou une idée, puis discutez avec l'équipe admin ici.</div>
                            )}
                            <div ref={chatBottomRef} style={{ height: 0, overflow: 'hidden' }} />
                        </div>

                        <div className="feedback-composer">
                            <textarea
                                ref={textareaRef}
                                className="feedback-textarea"
                                placeholder={messagePlaceholder}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                maxLength={2000}
                                rows={2}
                                required
                                aria-label="Message"
                            />

                            {!user && (
                                <input
                                    type="email"
                                    className="feedback-email"
                                    placeholder="Votre e-mail (optionnel, pour vous répondre)"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    maxLength={254}
                                    aria-label="E-mail"
                                />
                            )}

                            {images.length > 0 && (
                                <div className="feedback-image-previews feedback-image-previews--compact">
                                    {images.map((img, i) => (
                                        <div key={i} className="feedback-image-preview">
                                            <img src={img.preview} alt={`Piece jointe ${i + 1}`} />
                                            <button
                                                type="button"
                                                className="feedback-image-remove"
                                                onClick={() => removeImage(i)}
                                                aria-label="Supprimer l'image"
                                            >
                                                <IoTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="feedback-composer__footer">
                                <div className="feedback-attach-bar">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        type="button"
                                        className="feedback-attach-btn feedback-attach-btn--icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Joindre une image"
                                        disabled={images.length >= MAX_IMAGES}
                                    >
                                        <IoImage />
                                        <span>Photo</span>
                                    </button>
                                    {typeof navigator.mediaDevices?.getDisplayMedia === 'function' && (
                                        <button
                                            type="button"
                                            className="feedback-attach-btn feedback-attach-btn--icon"
                                            onClick={handleScreenshot}
                                            disabled={capturingScreen || images.length >= MAX_IMAGES}
                                            title="Capturer l'écran"
                                        >
                                            <IoCamera />
                                            <span>{capturingScreen ? 'Capture…' : 'Écran'}</span>
                                        </button>
                                    )}
                                    <span className="feedback-attach-hint">{images.length}/{MAX_IMAGES}</span>
                                </div>

                                <button
                                    type="submit"
                                    className="feedback-submit feedback-submit--compact"
                                    disabled={sending || !message.trim()}
                                >
                                    {sending ? 'Envoi…' : <><IoSend /> Envoyer</>}
                                </button>
                            </div>
                        </div>

                        {error && <p className="feedback-error">{error}</p>}

                        <p className="feedback-privacy-note">
                            Votre conversation reste privée entre vous et l'équipe OpenGlow.
                        </p>
                    </form>
                </div>
            )}

            <button
                type="button"
                className={`feedback-trigger${open ? ' feedback-trigger--active' : ''}`}
                onClick={handleOpen}
                aria-label="Feedback"
                title="Feedback / Signaler un bug"
            >
                <IoChatbubbleEllipses />
                {unreadCount > 0 && !open && (
                    <span className="feedback-trigger__badge" aria-label={`${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''} message`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}
