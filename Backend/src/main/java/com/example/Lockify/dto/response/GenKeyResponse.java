package com.example.Lockify.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GenKeyResponse {
    private String publicKey;
    private String privateKey;
}
