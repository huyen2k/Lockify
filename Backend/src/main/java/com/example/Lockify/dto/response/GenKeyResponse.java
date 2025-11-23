package com.example.Lockify.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class GenKeyResponse {
    private String val_p;
    private String val_q;
    private List<String> publicKey;
    private List<String> privateKey;
}
