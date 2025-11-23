package com.example.Lockify.controller;

import com.example.Lockify.dto.request.DecryptRequest;
import com.example.Lockify.dto.request.EncryptRequest;
import com.example.Lockify.dto.request.GenKeyRequest;
import com.example.Lockify.dto.response.DecryptResponse;
import com.example.Lockify.dto.response.EncryptResponse;
import com.example.Lockify.dto.response.GenKeyResponse;
import com.example.Lockify.service.RSAService;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.security.KeyPairGenerator;

@RestController
@RequestMapping("/rsa")
@NoArgsConstructor
@AllArgsConstructor
public class RSAController {

    @Autowired
    private RSAService rsaService;

    @PostMapping("/keygen")
    public GenKeyResponse keyGen(@RequestBody GenKeyRequest request) throws Exception {
        return rsaService.genKey(request);
    }

    @GetMapping("/checkPrime/{number}")
    public Boolean checkPrime(@PathVariable String number) {
        return rsaService.checkPrime(new BigInteger(number), Integer.parseInt("100"));
    }

    @GetMapping("/calculateE/{phi}")
    public String calculateE(@PathVariable String phi) {
        return rsaService.findPrimeE(new BigInteger(phi)).toString();
    }

    @GetMapping("/calculateD/{e}/{phi}")
    public String calculateD(@PathVariable String e, @PathVariable String phi) {
        return rsaService.findD(new BigInteger(e), new BigInteger(phi)).toString();
    }

    @PostMapping("/encrypt")
    public EncryptResponse encrypt(@RequestBody EncryptRequest request) throws Exception {
        return rsaService.encrypt(request);
    }

    @PostMapping("/decrypt")
    public DecryptResponse decrypt(@RequestBody DecryptRequest request) throws Exception {
        return rsaService.decrypt(request);
    }
}
