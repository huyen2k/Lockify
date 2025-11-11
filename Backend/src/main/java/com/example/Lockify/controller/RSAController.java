package com.example.Lockify.controller;

import com.example.Lockify.dto.request.DecryptRequest;
import com.example.Lockify.dto.request.EncryptRequest;
import com.example.Lockify.dto.response.DecryptResponse;
import com.example.Lockify.dto.response.EncryptResponse;
import com.example.Lockify.service.RSAService;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.KeyPairGenerator;

@RestController
@RequestMapping("/rsa")
@NoArgsConstructor
@AllArgsConstructor
public class RSAController {

    @Autowired
    private RSAService rsaService;

    @PostMapping("/encrypt")
    public EncryptResponse encrypt(@RequestBody EncryptRequest request) throws Exception {
        return rsaService.encrypt(request);
    }

    @PostMapping("/decrypt")
    public DecryptResponse decrypt(@RequestBody DecryptRequest request) throws Exception {
        return rsaService.decrypt(request);
    }
}
