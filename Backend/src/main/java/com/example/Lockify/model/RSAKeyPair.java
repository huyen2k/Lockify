package com.example.Lockify.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "keypairs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RSAKeyPair {
    @Id
    private String id;            // e.g. userId or keyId
    private String publicKey;    // Base64 PEM (or plain base64)
    private String privateKey;   // Base64 (NOTE: recommend encrypting)
    private String algorithm = "RSA";
    private int keySize = 2048;
}
