import React from "react";
import { motion as Motion } from "framer-motion";
import "../styles/MessageBubble.css";

export function MessageBubble({ message, meId, senderId }) {
    const isMe = senderId && meId && String(senderId) === String(meId);
    const text = typeof message === "string" ? message : message?.text ?? "";
    const time = typeof message === "object" ? message?.time : undefined;

    return (
        <Motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className={`message-row ${isMe ? "row-me" : "row-them"}`}
            style={{ alignSelf: isMe ? "flex-end" : "flex-start" }}
        >
            <div className={`bubble ${isMe ? "me" : "them"}`}>
                <div className="bubble-text">{text}</div>
                {time ? (
                    <div className="bubble-time">{time}</div>
                ) : null}
            </div>
        </Motion.div>
    );
}


export default MessageBubble;