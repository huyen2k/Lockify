package com.example.Lockify.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyRequest {
    @NotBlank
    private String publicKey;
    @NotBlank
    private String message;
    @NotBlank
    private String signature;
    private String algorithm;
    private String hashAlgorithm;

}
