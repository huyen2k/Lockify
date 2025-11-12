package com.example.Lockify.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KeyExchangeRequest {
    private String bits;
    private String algorithm;
    private String id;
}


