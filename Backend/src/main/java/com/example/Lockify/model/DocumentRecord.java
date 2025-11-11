package com.example.Lockify.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRecord {
    @Id
    private String id;
    private String ownerId;
    private String filename;
    private String contentBase64;
    @CreatedDate
    private Instant createdAt;
}
