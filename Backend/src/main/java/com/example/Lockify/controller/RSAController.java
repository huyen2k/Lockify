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
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<GenKeyResponse> keyGen(@RequestBody GenKeyRequest request) throws Exception {
        return new ResponseEntity<>(rsaService.genKey(request), HttpStatus.OK) ;
    }

    @GetMapping("/checkPrime/{number}")
    public ResponseEntity<Boolean> checkPrime(@PathVariable String number) {
        return new ResponseEntity<>(rsaService.checkPrime(new BigInteger(number), Integer.parseInt("100")), HttpStatus.OK) ;
    }

    @GetMapping("/calculateE/{phi}")
    public ResponseEntity<String> calculateE(@PathVariable String phi) {
        return new ResponseEntity<>(rsaService.findPrimeE(new BigInteger(phi)).toString(), HttpStatus.OK) ;
    }

    @GetMapping("/calculateD/{e}/{phi}")
    public ResponseEntity<String> calculateD(@PathVariable String e, @PathVariable String phi) {
        return new ResponseEntity<>(rsaService.findD(new BigInteger(e), new BigInteger(phi)).toString(), HttpStatus.OK) ;
    }

    @PostMapping("/encrypt")
    public ResponseEntity<EncryptResponse> encrypt(@RequestBody EncryptRequest request) throws Exception {
        return new ResponseEntity<>(rsaService.encrypt(request), HttpStatus.OK) ;
    }

    @PostMapping("/decrypt")
    public ResponseEntity<DecryptResponse> decrypt(@RequestBody DecryptRequest request) throws Exception {
        return new ResponseEntity<>(rsaService.decrypt(request), HttpStatus.OK) ;
    }
}
