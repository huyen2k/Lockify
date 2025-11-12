package com.example.Lockify.controller;

import com.example.Lockify.dto.request.KeyExchangeRequest;
import com.example.Lockify.dto.request.SignRequest;
import com.example.Lockify.dto.request.VerifyRequest;
import com.example.Lockify.dto.response.KeyResponse;
import com.example.Lockify.model.SignatureRecord;
import com.example.Lockify.service.SignatureService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/signature")
@NoArgsConstructor
@AllArgsConstructor
public class SignatureController {

    @Autowired
    private SignatureService signatureService;

    // 1) Generate key pair for a given id (e.g. userId)
    @PostMapping("/keygen")
    public ResponseEntity<KeyResponse> generateKey(@RequestBody KeyExchangeRequest req) throws Exception {
        if (req.getId() == null || req.getId().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        KeyResponse resp = signatureService.generateAndStoreKeyPair(req);
        return ResponseEntity.ok(resp);
    }

    // 2) Fetch public key for id
    @GetMapping("/public/{id}")
    public ResponseEntity<KeyResponse> getPublicKey(@PathVariable String id) {
        return signatureService.findKeyPair(id)
                .map(kp -> ResponseEntity.ok(new KeyResponse(kp.getId(), kp.getPublicKey())))
                .orElse(ResponseEntity.notFound().build());
    }

    // 3) Sign document (server performs sign, stores doc+signature)
    @PostMapping("/sign")
    public ResponseEntity<?> signDocument(@Valid @RequestBody SignRequest req) {
        try {
            SignatureRecord sr = signatureService.signDocument(req);
            return ResponseEntity.ok(sr);
        } catch (IllegalArgumentException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.internalServerError().body("Error signing");
        }
    }

    // 4) Verify signature (stateless)
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@Valid @RequestBody VerifyRequest req) {
        try {
            boolean ok = signatureService.verify(req);
            return ResponseEntity.ok().body(java.util.Map.of("valid", ok));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.internalServerError().body("Error verifying");
        }
    }
}
