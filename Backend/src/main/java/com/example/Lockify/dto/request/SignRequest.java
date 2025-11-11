package com.example.Lockify.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SignRequest {
    @NotBlank
    private String signerId; // id of keypair or user
    @NotBlank
    private String documentBase64; // document content in Base64
    @NotBlank
    private String filename;
}
