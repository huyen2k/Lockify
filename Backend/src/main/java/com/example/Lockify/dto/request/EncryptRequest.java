package com.example.Lockify.dto.request;


import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class EncryptRequest {
    private String bits;
    private String algorithm;
    private String message;
}
