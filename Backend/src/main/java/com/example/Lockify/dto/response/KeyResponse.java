package com.example.Lockify.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KeyResponse {
    private String id;
    private String publicKeyBase64;
}
