import React from "react";
import { useState } from "react";
import axios from 'axios'
import { useEffect, useRef } from "react";

const WebSock = () => {
    const [messages, setMessages] = useState([])
    const [value, setValue] = useState('')
    const socket = useRef()
    const [connected, SetConnected] = useState(false)
    const [username, setUsername] = useState('')
    const [idvalue, setIDValue] = useState('')
    const [type, setType] = useState('')
    const [path, setPath] = useState('')

    const sendMessage = async () => {
        const message = {
            username,
            message: value,
            id: idvalue,
            event: 'message',
            type: type,
            path: path
        }
        socket.current.send(JSON.stringify(message))
        setValue('')
    }

    useEffect(() => {
    }, [])

    function connect() {
        socket.current = new WebSocket('ws://localhost:5000')
        socket.current.onopen = () => {
            SetConnected(true)
            const message = {
                event: type,
                username,
                id: idvalue,
                type: type,
                path: path
            }
            socket.current.send(JSON.stringify(message))
        }
        socket.current.onmessage = (event) => {
            const message = JSON.parse(event.data)
            setMessages(prev => [message, ...prev])
        }
        socket.current.onclose = () => {
            console.log("Socket closed")
        }
        socket.current.onerror = () => {
            console.log("Socket error")
        }
    }
    if (!connected) {
        return (
            <div>
                <div>
                <div>
                    <div> Текст </div>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}/>
                </div>
                <div>
                <div> ID</div>
                    <input type="text" value={idvalue} onChange={e => setIDValue(e.target.value)}/>
                </div>
                <div>
                    <div> Путь </div>
                    <input type="text" value={path} onChange={e => setPath(e.target.value)}/>
                </div> 
                <div>
                    <div> Тип сообщения</div>
                    <input type="text" value={type} onChange={e => setType(e.target.value)}/>
                </div>
                    <button onClick={connect}>Войти</button>
                </div>
                
            </div>
        )
    }
    return (
        <div>
            <div>
                <input type="text" value={value} onChange={e => setValue(e.target.value)}/>
                <button onClick={sendMessage}>Отправить</button>
            </div>
            <div>
                {messages.map(mess =>
                    <div>
                        {mess.event === 'connection'
                            ? <div>Пользоавтель {mess.username} подключился</div>
                            : (mess.event === 'message_bot' 
                            ? <div>Bot: {mess.message}</div>
                            : <div>{mess.username}. {mess.message}</div>)
                        }
                    </div>
                    )}
            </div>
        </div>
    )
}

export default WebSock