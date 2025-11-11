package com.example.Lockify.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "signatures")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignatureRecord {
    @Id
    private String id;
    private String documentId;    // liên kết tới DocumentRecord.id
    private String signerId;      // userId/keyId
    private String signatureBase64;
    private String algorithm = "SHA256withRSA";
    private Instant createdAt = Instant.now();
}

