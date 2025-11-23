package com.example.Lockify.service;

import com.example.Lockify.dto.request.GenKeyRequest;
import com.example.Lockify.dto.request.KeyExchangeRequest;
import com.example.Lockify.dto.request.SignRequest;
import com.example.Lockify.dto.request.VerifyRequest;
import com.example.Lockify.dto.response.GenKeyResponse;
import com.example.Lockify.dto.response.KeyResponse;
import com.example.Lockify.model.RSAKeyPair;
import com.example.Lockify.model.SignatureRecord;
import com.example.Lockify.repository.KeyPairRepository;
import com.example.Lockify.repository.SignatureRepository;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.extern.java.Log;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base64;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.util.List;
import java.util.Optional;

@Service
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
public class SignatureService {

    @Autowired
    private KeyPairRepository keyPairRepository;
    @Autowired
    private SignatureRepository signatureRepository;
    @Autowired
    private RSAService rsaService;

    public KeyResponse generateAndStoreKeyPair(KeyExchangeRequest request) throws Exception {
        GenKeyRequest genKeyRequest = new GenKeyRequest();
        genKeyRequest.setBits(request.getBits());

        GenKeyResponse genKeyResponse =  rsaService.genKey(genKeyRequest);

        KeyResponse keyResponse = new KeyResponse();
        keyResponse.setId(request.getId());
        keyResponse.setPublicKey(genKeyResponse.getPublicKey());
        keyResponse.setPrivateKey(genKeyResponse.getPrivateKey());
        keyResponse.setVal_p(genKeyResponse.getVal_p());
        keyResponse.setVal_q(genKeyResponse.getVal_q());

        RSAKeyPair rsaKeyPair = new RSAKeyPair();
        rsaKeyPair.setId(keyResponse.getId());
        rsaKeyPair.setPublicKey(keyResponse.getPublicKey());
        rsaKeyPair.setPrivateKey(keyResponse.getPrivateKey());

        keyPairRepository.save(rsaKeyPair);
        return keyResponse;
    }

    public Optional<RSAKeyPair> findKeyPair(String id){
        return keyPairRepository.findById(id);
    }

    public SignatureRecord sign(SignRequest request) throws Exception {

        if (request == null) throw new IllegalArgumentException("SignRequest required");
        if (request.getSignerId() == null) throw new IllegalArgumentException("signerId required");

        Optional<RSAKeyPair> opt = keyPairRepository.findById(request.getSignerId());
        if (!opt.isPresent()) throw new IllegalArgumentException("No key pair for signerId=" + request.getSignerId());

        RSAKeyPair key = opt.get();

        List<String> publicKeys = opt.get().getPublicKey();
        List<String> privateKeys = opt.get().getPrivateKey();

        BigInteger n = new BigInteger(publicKeys.get(0));
        BigInteger e = new BigInteger(publicKeys.get(1));
        BigInteger d = new BigInteger(privateKeys.get(1));

        // compute hash -> BigInteger using same byte handling as RSAService (UTF-8)

        BigInteger h = messageHashToBigInt(request.getMessage(), request.getHashAlgorithm());
        log.info(request.getMessage() + "Hash BigInteger: " + h.toString(10));

        // ensure hash representative is < n by reducing modulo n
        BigInteger m = h.mod(n);

        // Signature S = m^d mod n
        BigInteger S = m.modPow(d, n);

        // Optionally persist signature record in DB if you want (not implemented here)
        // return decimal string of signature
        return SignatureRecord.builder()
                .signerId(request.getSignerId())
                .signature(S.toString(10))
                .build();


    }

    public boolean verify (VerifyRequest request) throws Exception {
        if (request == null) throw new IllegalArgumentException("VerifyRequest required");
        if (request.getSignature() == null) throw new IllegalArgumentException("signature required");

        List<String> publicKeys = request.getPublicKey();

        BigInteger n = new BigInteger(publicKeys.get(0));
        BigInteger e = new BigInteger(publicKeys.get(1));

        // parse signature decimal string to BigInteger
        BigInteger S;
        try {
            S = new BigInteger(request.getSignature());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Signature must be decimal string representing BigInteger", ex);
        }

        // compute h = HashToBigInt(message) mod n
        BigInteger h = messageHashToBigInt(request.getMessage(), request.getHashAlgorithm()).mod(n);
        log.info(request.getMessage() + "Hash BigInteger: " + h.toString(10));

        // recover m' = S^e mod n
        BigInteger mPrime = S.modPow(e, n);

        // valid if mPrime == h
        return mPrime.equals(h);
    }

    /**
     * Hash message to BigInteger.
     * Uses MessageDigest with algorithm (default SHA-256).
     * Returns positive BigInteger representing the digest bytes.
     *
     * This mirrors typical approach: take digest bytes (UTF-8 bytes digested),
     * then construct BigInteger(1, digest).
     */
    private BigInteger messageHashToBigInt (String message, String hashAlgorithm) throws Exception {
        if (message == null) message = "";
        String algo = (hashAlgorithm == null || hashAlgorithm.isEmpty()) ? "SHA-256" : hashAlgorithm;

        MessageDigest md = MessageDigest.getInstance(algo);
        byte[] msgBytes = message.getBytes(StandardCharsets.UTF_8);
        byte[] digest = md.digest(msgBytes);

        // convert to positive BigInteger
        BigInteger h = new BigInteger(1, digest);
        return h;
    }
}

