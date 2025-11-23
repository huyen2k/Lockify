import React from 'react';

export function Composer({ text, setText, onSend, onKeyDown }) {
    return (
        <div className="composer">
            <input
                className="composer-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Write a message..."
            />
            <button className="composer-send" onClick={onSend} aria-label="send">Send</button>
        </div>
    );
}