package com.example.Lockify.controller;

import com.example.Lockify.model.MessageRecord;
import com.example.Lockify.service.MessageService;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
@NoArgsConstructor
@AllArgsConstructor
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping("/create")
    public ResponseEntity<MessageRecord> create(@RequestBody MessageRecord msg) {

        return new ResponseEntity<>(messageService.create(msg), HttpStatus.OK);
    }

    @GetMapping("/inbox/{toId}/{fromId}")
    public ResponseEntity<List<MessageRecord>> inbox(@PathVariable String toId, @PathVariable String fromId) {
        return new ResponseEntity<>(messageService.inbox(toId, fromId), HttpStatus.OK);
    }

    @PostMapping("/inbox/clear/{toId}/{fromId}")
    public void clearInbox(@PathVariable String toId, @PathVariable String fromId) {
        messageService.deletemessage(toId, fromId);
    }

}
