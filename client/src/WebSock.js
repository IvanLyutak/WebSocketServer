import React from "react";
import { useState } from "react";
import axios from 'axios'
import { useEffect, useRef } from "react";

const WebSock = () => {
    const [messages, setMessages] = useState([])
    const [value, setValue] = useState('')
    const socket = useRef()
    const [connected, SetConnected] = useState(false)
    const [requested, SetRequested] = useState(false)
    const [username, setUsername] = useState('')
    const [idvalue, setIDValue] = useState('')
    const [type, setType] = useState('')
    const [path, setPath] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

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

    const f1 = async () => {
            SetRequested(true)
            const message = {
                event: type,
                username,
                id: idvalue,
                type: type,
                path: path
            }
            socket.current.send(JSON.stringify(message))
    }

    const register = async () => {
        socket.current = new WebSocket('ws://localhost:5000')
        socket.current.onopen = () => {
            SetConnected(true)
            let data = {
                email: "lyutakivan802@gmail.com",
                account_balance: 0,
                time_reservation: "",
                time_arrive: "",
                time_exit: "",
                arrive: "",
                exit: "",
                meta_user_info: {
                    name: "Ivan",
                    car_brand: "",
                    phone_number: ""
                },
                number_auto: "A926ME142"
            }
            const message = {
                email: email,
                password: password,
                data: data,
                path: path,
                event: 'createUser'
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

    function auth() {
        socket.current = new WebSocket('ws://localhost:5000')
        socket.current.onopen = () => {
            const message = {
                email: email,
                password: password,
                event: "authUser"
            }
            socket.current.send(JSON.stringify(message))
        }
        socket.current.onmessage = (event) => {
            const auth = JSON.parse(event.data)
            if (auth.message !== null) {
                SetConnected(true)
            }
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
        return(
            <div>
                <div>
                    <div> Email </div>
                    <input type="text" value={email} onChange={e => setEmail(e.target.value)}/>
                </div>
                <div>
                    <div> Пароль </div>
                    <input type="text" value={password} onChange={e => setPassword(e.target.value)}/>
                </div>
                <div>
                    <div> Ссылка на сохранение данные о пользователе </div>
                    <input type="text" value={path} onChange={e => setPath(e.target.value)}/>
                </div>
                <div>
                    <button onClick={register}>Регистрация</button>
                </div>
                <div>
                    <button onClick={auth}>Авторизация</button>
                </div>
            </div>
        )
    }
    if (!requested) {
        return(
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
            <button onClick={f1}>Сделать</button>
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