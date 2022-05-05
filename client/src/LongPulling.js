import React from "react";
import { useState } from "react";
import axios from 'axios'
import { useEffect } from "react";

const LongPulling = () => {
    const [messages, setMessages] = useState([])
    const [value, setValue] = useState('')

    const sendMessage = async () => {
        await axios.post('http://localhost:5000/new-messages', {
            message: value,
            id: Date.now()
        })
    }

    useEffect(() => {
        subscribe()
    }, [])

    const subscribe = async () => {
        try {
            const {data} = await axios.get('http://localhost:5000/get-messages')
            setMessages(prev => [data, ...prev])
            await subscribe()
        } catch(e) {
            setTimeout(() => {
                subscribe()
            }, 500)
        }
    }
    return (
        <div>
            <div>
                <input type="text" value={value} onChange={e => setValue(e.target.value)}/>
                <button onClick={sendMessage}>Отправить</button>
            </div>
            <div>
                {messages.map(mess =>
                    <div>{mess.message}</div>
                    )}
            </div>
        </div>
    )
}

export default LongPulling