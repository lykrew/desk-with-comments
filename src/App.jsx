import './App.css'
import { useState, useEffect, useRef } from 'react'
import Board from './components/Board/Board'

function getBoardId() {
  const params = new URLSearchParams(window.location.search)
  const existing = params.get('board')
  if (existing) {
    return existing
  }
  const id = Math.random().toString(36).slice(2, 10)
  params.set('board', id)
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  return id
}

function createConnectionId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.hostname}:3001`
}

function pluralUsers(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod100 >= 11 && mod100 <= 14) return 'пользователей'
  if (mod10 === 1) return 'пользователь'
  if (mod10 >= 2 && mod10 <= 4) return 'пользователя'
  return 'пользователей'
}

function normalizeTasks(tasks) {
  return tasks.map((task) => ({
    ...task,
    comments: Array.isArray(task.comments) ? task.comments : [],
  }))
}

function App() {
  const [boardId] = useState(getBoardId)
  const storageKey = `kanban-tasks-${boardId}`
  const [taskList, setTaskList] = useState(() => {
    const savedTasks = localStorage.getItem(storageKey)
    return savedTasks ? normalizeTasks(JSON.parse(savedTasks)) : []
  })
  const [onlineUsers, setOnlineUsers] = useState(null)
  const socketRef = useRef(null)
  const remoteUpdateRef = useRef(false)
  const connectionIdRef = useRef(createConnectionId())

  useEffect(() => {
    let cancelled = false
    let reconnectTimer = null
    let ws = null

    const connect = () => {
      ws = new WebSocket(getWebSocketUrl())
      socketRef.current = ws

      const sendInit = () => {
        ws.send(JSON.stringify({
          type: 'init',
          boardId,
          clientId: connectionIdRef.current,
        }))
      }

      ws.onopen = () => {
        if (cancelled) {
          ws.close()
          return
        }
        sendInit()
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if ((data.type === 'update' || data.type === 'init') && Array.isArray(data.tasks)) {
          remoteUpdateRef.current = true
          setTaskList(normalizeTasks(data.tasks))
        }
        if (typeof data.onlineUsers === 'number' && (data.type === 'presence' || data.type === 'init')) {
          setOnlineUsers(data.onlineUsers)
        }
      }

      ws.onclose = () => {
        if (socketRef.current === ws) {
          socketRef.current = null
        }
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 1500)
        }
      }

    }

    connect()

    return () => {
      cancelled = true
      clearTimeout(reconnectTimer)
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close()
      }
      socketRef.current = null
    }
  }, [boardId])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(taskList))
    if (remoteUpdateRef.current) {
      remoteUpdateRef.current = false
      return
    }

    const ws = socketRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'update', boardId, tasks: taskList }))
    }
  }, [taskList, storageKey, boardId])

  const shareUrl = `${window.location.origin}${window.location.pathname}?board=${boardId}`

  return (
    <div className="appShell">
      <header className="pageHeader">
        <h1>Kanban Board</h1>
        <p>Управляй своими задачами вместе с друзьями.</p>
        <p className="boardMeta">
          ID доски: <code>{boardId}</code> — откройте <strong>ту же ссылку</strong> во втором браузере
        </p>
        <p>
          Ссылка на доску:{' '}
          <a href={shareUrl}>{shareUrl}</a>
        </p>
        <p className="onlineUsers">
          {onlineUsers === null ? (
            'Подключение к доске…'
          ) : (
            <>
              На доске сейчас: <strong>{onlineUsers}</strong> {pluralUsers(onlineUsers)}
            </>
          )}
        </p>
      </header>
      <Board taskList={taskList} setTaskList={setTaskList} />
    </div>
  )
}

export default App
