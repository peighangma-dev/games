import { io } from 'socket.io-client'

let socket = null

export function connectSocket(token) {
  if (socket?.connected) return socket

  socket = io({
    auth: { token },
    transports: ['websocket', 'polling']
  })

  socket.on('connect', () => {
    console.log('Socket已连接')
  })

  socket.on('disconnect', () => {
    console.log('Socket已断开')
  })

  socket.on('connect_error', (err) => {
    console.error('Socket连接错误:', err.message)
  })

  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
