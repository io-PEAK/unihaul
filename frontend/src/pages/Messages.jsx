import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

function ConversationItem({ convo, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)
  const hasUnread = convo.unread_count > 0

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: isActive
          ? 'rgba(232,119,34,0.12)'
          : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: isActive ? '1px solid rgba(232,119,34,0.2)' : '1px solid transparent',
        marginBottom: '0.35rem',
        position: 'relative',
      }}
    >
      {/* Unread indicator bar on left */}
      {hasUnread && !isActive && (
        <div style={{
          position: 'absolute', left: 0, top: '50%',
          transform: 'translateY(-50%)',
          width: '3px', height: '60%', borderRadius: '0 2px 2px 0',
          background: 'linear-gradient(135deg, #e87722, #f5a623)',
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          fontSize: '0.9rem', fontWeight: hasUnread ? '800' : '700',
          color: isActive ? '#e87722' : hasUnread ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)',
          letterSpacing: '-0.2px', marginBottom: '0.3rem',
        }}>
          {convo.other_user_name || 'Unknown User'}
        </div>

        {/* Unread count badge */}
        {hasUnread && !isActive && (
          <div style={{
            minWidth: '18px', height: '18px', borderRadius: '9px',
            padding: '0 5px', boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #e87722, #f09030)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: '800', color: 'white',
            flexShrink: 0, marginLeft: '0.5rem',
          }}>
            {convo.unread_count > 9 ? '9+' : convo.unread_count}
          </div>
        )}
      </div>

      <div style={{
        fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)',
        fontWeight: '500', letterSpacing: '0.3px', marginBottom: '0.3rem',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        re: {convo.item_title || 'Item'}
      </div>

      {convo.last_message && (
        <div style={{
          fontSize: '0.78rem',
          color: hasUnread && !isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
          fontWeight: hasUnread && !isActive ? '600' : '400',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {convo.last_message}
        </div>
      )}
    </div>
  )
}

function Messages() {
  const navigate = useNavigate()
  const location = useLocation()

  const incomingItem = location.state?.item

  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [newConvoMode, setNewConvoMode] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)

  const messagesEndRef = useRef(null)
  const panelsRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const myId = user?.id

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConvos(true)
        const res = await API.get('/messages/conversations')
        setConversations(res.data)

        if (incomingItem) {
          const existing = res.data.find(c =>
            c.item_id === incomingItem.id || c.itemId === incomingItem.id
          )
          if (existing) {
            setActiveConvo(existing)
            setNewConvoMode(false)
          } else {
            setNewConvoMode(true)
            setActiveConvo({
              item_id: incomingItem.id,
              item_title: incomingItem.title,
              other_user_name: incomingItem.seller?.name || 'Seller',
              other_user_id: incomingItem.seller?.id,
              isNew: true,
            })
          }
        } else if (res.data.length > 0) {
          setActiveConvo(res.data[0])
        }
      } catch (err) {
        console.error('Failed to load conversations', err)
      } finally {
        setLoadingConvos(false)
      }
    }
    fetchConversations()
  }, [])

  useEffect(() => {
    if (!activeConvo || activeConvo.isNew) return
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true)
        const res = await API.get(`/messages/${activeConvo.item_id}`, {
          params: { otherUserId: activeConvo.other_user_id }
        })
        setMessages(res.data)
        // Clear unread count for this convo in state
        setConversations(prev => prev.map(c =>
          c.conversation_id === activeConvo.conversation_id
            ? { ...c, unread_count: 0 }
            : c
        ))
      } catch (err) {
        console.error('Failed to load messages', err)
      } finally {
        setLoadingMessages(false)
      }
    }
    fetchMessages()
  }, [activeConvo])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleBackgroundClick(e) {
    if (panelsRef.current && !panelsRef.current.contains(e.target)) {
      navigate(-1)
    }
  }

  async function handleMarkAllRead() {
    try {
      setMarkingRead(true)
      await API.post('/messages/mark-all-read')
      setConversations(prev => prev.map(c => ({ ...c, unread_count: 0 })))
    } catch (err) {
      console.error('Failed to mark all read', err)
    } finally {
      setMarkingRead(false)
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !activeConvo) return

    try {
      setSending(true)

      if (activeConvo.isNew) {
        const res = await API.post('/messages', {
          receiverId: activeConvo.other_user_id,
          itemId: activeConvo.item_id,
          content: newMessage.trim(),
        })
        const convosRes = await API.get('/messages/conversations')
        setConversations(convosRes.data)
        const newConvo = convosRes.data.find(c =>
          c.item_id === activeConvo.item_id || c.itemId === activeConvo.item_id
        )
        if (newConvo) {
          setActiveConvo({ ...newConvo, isNew: false })
        }
        setMessages([res.data])
        setNewConvoMode(false)
      } else {
        const res = await API.post('/messages', {
          receiverId: activeConvo.other_user_id,
          itemId: activeConvo.item_id,
          content: newMessage.trim(),
        })
        setMessages(prev => [...prev, res.data])
      }
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      onClick={handleBackgroundClick}
      style={{
        position: 'fixed', inset: 0, top: '70px',
        padding: '2rem 4rem', display: 'flex',
        flexDirection: 'column', cursor: 'default', zIndex: 10,
      }}
    >
      <div
        ref={panelsRef}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '1100px', width: '100%',
          margin: '0 auto', height: '100%',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '2.4rem', fontWeight: '900',
            letterSpacing: '-1.5px', lineHeight: '1.05',
            color: 'white', marginBottom: '0.4rem',
          }}>
            My <span style={{
              background: 'linear-gradient(135deg, #e87722, #f5a623)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Messages.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', fontWeight: '400' }}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            {totalUnread > 0 && (
              <span style={{
                marginLeft: '0.75rem', fontSize: '0.75rem', fontWeight: '700',
                color: '#e87722',
              }}>
                · {totalUnread} unread
              </span>
            )}
          </p>
        </div>

        {/* Back + Mark all read row */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.6rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '0.45rem 1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: '600',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = 'rgba(255,255,255,0.85)' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'rgba(255,255,255,0.5)' }}
          >← Back</button>

          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingRead}
              style={{
                padding: '0.45rem 1rem',
                background: 'rgba(232,119,34,0.08)',
                border: '1px solid rgba(232,119,34,0.2)',
                color: markingRead ? 'rgba(232,119,34,0.4)' : 'rgba(232,119,34,0.8)',
                borderRadius: '10px', cursor: markingRead ? 'not-allowed' : 'pointer',
                fontSize: '0.78rem', fontWeight: '600',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { if (!markingRead) { e.target.style.background = 'rgba(232,119,34,0.15)'; e.target.style.color = '#e87722' }}}
              onMouseLeave={e => { e.target.style.background = 'rgba(232,119,34,0.08)'; e.target.style.color = 'rgba(232,119,34,0.8)' }}
            >
              {markingRead ? 'Marking...' : '✓ Mark all as read'}
            </button>
          )}
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.1)', fontSize: '0.72rem',
          marginBottom: '0.75rem', fontWeight: '400',
        }}>
          Click anywhere outside to go back
        </p>

        {/* Panels */}
        <div style={{
          display: 'grid', gridTemplateColumns: '280px 1fr',
          gap: '1rem', flex: 1, minHeight: 0,
        }}>

          {/* LEFT — Conversation list */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '0.75rem',
            overflowY: 'auto', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            }} />

            {newConvoMode && activeConvo?.isNew && (
              <div style={{
                padding: '1rem 1.25rem', borderRadius: '12px',
                background: 'rgba(232,119,34,0.12)',
                border: '1px solid rgba(232,119,34,0.2)',
                marginBottom: '0.35rem',
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#e87722', marginBottom: '0.3rem' }}>
                  {activeConvo.other_user_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
                  re: {activeConvo.item_title}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(232,119,34,0.5)', marginTop: '0.3rem', fontWeight: '600' }}>
                  New conversation
                </div>
              </div>
            )}

            {loadingConvos ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{
                  width: '32px', height: '32px',
                  border: '3px solid rgba(255,255,255,0.08)',
                  borderTop: '3px solid #e87722',
                  borderRadius: '50%', margin: '0 auto 0.75rem',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>Loading...</p>
              </div>
            ) : conversations.length === 0 && !newConvoMode ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}>✉</div>
                <p style={{ fontSize: '0.8rem', fontWeight: '500' }}>No conversations yet.</p>
              </div>
            ) : (
              conversations.map(convo => (
                <ConversationItem
                  key={convo.conversation_id}
                  convo={convo}
                  isActive={activeConvo && !activeConvo.isNew &&
                    activeConvo.conversation_id === convo.conversation_id}
                  onClick={() => {
                    setActiveConvo(convo)
                    setNewConvoMode(false)
                    setMessages([])
                  }}
                />
              ))
            )}
          </div>

          {/* RIGHT — Message thread */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', display: 'flex', flexDirection: 'column',
            minHeight: 0, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            }} />

            {activeConvo && (
              <div style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.2px' }}>
                  {activeConvo.other_user_name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem', fontWeight: '500' }}>
                  re: {activeConvo.item_title || 'Item'}
                </div>
                {activeConvo.isNew && (
                  <div style={{ fontSize: '0.65rem', color: 'rgba(232,119,34,0.6)', marginTop: '0.2rem', fontWeight: '600' }}>
                    Send a message to start the conversation
                  </div>
                )}
              </div>
            )}

            <div style={{
              flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}>
              {!activeConvo ? (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', fontWeight: '500',
                }}>Select a conversation to start</div>
              ) : loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{
                    width: '32px', height: '32px',
                    border: '3px solid rgba(255,255,255,0.08)',
                    borderTop: '3px solid #e87722',
                    borderRadius: '50%', margin: '0 auto',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                </div>
              ) : activeConvo.isNew ? (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', textAlign: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}>💬</div>
                    <p>Start your conversation with</p>
                    <p style={{ color: '#e87722', fontWeight: '700', marginTop: '0.25rem' }}>
                      {activeConvo.other_user_name}
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem',
                }}>No messages yet. Say hello!</div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === myId || msg.sender_id === myId
                  return (
                    <div key={msg.id || i} style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '65%', padding: '0.65rem 1rem',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe ? 'linear-gradient(135deg, #e87722, #f09030)' : 'rgba(255,255,255,0.08)',
                        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        color: isMe ? 'white' : 'rgba(255,255,255,0.85)',
                        fontSize: '0.88rem', fontWeight: '400', lineHeight: '1.5',
                        boxShadow: isMe ? '0 4px 15px rgba(232,119,34,0.25)' : 'none',
                      }}>
                        {msg.content}
                        <div style={{
                          fontSize: '0.62rem',
                          color: isMe ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                          marginTop: '0.3rem', textAlign: 'right',
                        }}>
                          {msg.createdAt || msg.created_at
                            ? new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {activeConvo && (
              <form onSubmit={handleSend} style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: '0.75rem', flexShrink: 0,
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={activeConvo.isNew ? `Message ${activeConvo.other_user_name}...` : 'Type a message...'}
                  style={{
                    flex: 1, padding: '0.65rem 1rem',
                    background: inputFocused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                    border: inputFocused ? '1px solid rgba(232,119,34,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px', color: 'white', fontSize: '0.88rem',
                    outline: 'none', transition: 'all 0.3s ease', fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: sending || !newMessage.trim()
                      ? 'rgba(255,255,255,0.06)'
                      : 'linear-gradient(135deg, #e87722, #f09030)',
                    color: sending || !newMessage.trim() ? 'rgba(255,255,255,0.25)' : 'white',
                    border: 'none', borderRadius: '10px',
                    cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem', fontWeight: '700', transition: 'all 0.3s ease',
                    boxShadow: !sending && newMessage.trim() ? '0 4px 15px rgba(232,119,34,0.25)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >{sending ? '...' : 'Send →'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages