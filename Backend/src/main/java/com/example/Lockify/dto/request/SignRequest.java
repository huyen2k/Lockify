package com.example.Lockify.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SignRequest {
    @NotBlank
    private String signerId;
    @NotBlank
    private String message;
    private String hashAlgorithm;
}
