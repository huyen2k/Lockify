package com.example.Lockify.dto.request;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Data
public class DecryptRequest {
    private List<String> privateKey;
    private String encryptedText;
}
