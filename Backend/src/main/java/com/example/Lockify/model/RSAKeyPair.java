package com.example.Lockify.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "keypairs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RSAKeyPair {
    @Id
    private String id;
    private List<String> publicKey;
    private List<String> privateKey;
}
