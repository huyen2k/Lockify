package com.example.Lockify.dto.request;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class DecryptRequest {
    private String privateKeg;
    private String algorithm;
    private String encryptedText;
}
