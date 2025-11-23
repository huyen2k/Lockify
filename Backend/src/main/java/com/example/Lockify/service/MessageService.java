package com.example.Lockify.service;

import com.example.Lockify.model.MessageRecord;
import com.example.Lockify.repository.MessageRepository;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@NoArgsConstructor
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    public MessageRecord create(MessageRecord msg) {
        msg.setCreatedAt(new Date());
        return messageRepository.save(msg);
    }
    public List<MessageRecord> inbox(String toId, String fromId) {
        List<MessageRecord> messages = messageRepository.findByToIdOrderByCreatedAtDesc(toId);
        if (fromId != null && !fromId.isEmpty()) {
            messages.removeIf(msg -> !msg.getFromId().equals(fromId));
        }
        return messages;
    }

    public void deletemessage(String toId, String fromId) {
        List<MessageRecord> messages = messageRepository.findByToIdOrderByCreatedAtDesc(toId);
        for (MessageRecord msg : messages) {
            if (msg.getFromId().equals(fromId)) {
                messageRepository.deleteById(msg.getId());
            }
        }
    }
}
