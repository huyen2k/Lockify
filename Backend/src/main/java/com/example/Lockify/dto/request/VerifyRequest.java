package com.example.Lockify.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyRequest {
    @NotBlank
    private String publicKeyBase64; // public key in base64/PEM
    @NotBlank
    private String documentBase64;
    @NotBlank
    private String signatureBase64;

}
