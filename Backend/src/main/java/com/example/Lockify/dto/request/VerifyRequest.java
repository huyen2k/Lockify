package com.example.Lockify.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class VerifyRequest {
    @NotBlank
    private List<String> publicKey;
    @NotBlank
    private String message;
    @NotBlank
    private String signature;
    private String hashAlgorithm;

}
