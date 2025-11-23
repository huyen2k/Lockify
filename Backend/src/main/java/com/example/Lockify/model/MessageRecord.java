package com.example.Lockify.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.Date;

@Document(collection = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageRecord {
    @Id
    private String id;
    private String fromId;
    private String toId;
    private String cipherBase64;
    private String signatureBase64;
    private String plaintext;
    @CreatedDate
    private Date createdAt;
}
