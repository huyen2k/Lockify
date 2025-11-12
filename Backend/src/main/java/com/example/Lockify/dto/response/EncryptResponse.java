package com.example.Lockify.dto.response;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@Builder
@Data
public class EncryptResponse {
    private String encryptedText;
}
