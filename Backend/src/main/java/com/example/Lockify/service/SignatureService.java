package com.example.Lockify.service;

import com.example.Lockify.dto.request.KeyExchangeRequest;
import com.example.Lockify.dto.request.SignRequest;
import com.example.Lockify.dto.request.VerifyRequest;
import com.example.Lockify.dto.response.KeyResponse;
import com.example.Lockify.model.DocumentRecord;
import com.example.Lockify.model.RSAKeyPair;
import com.example.Lockify.model.SignatureRecord;
import com.example.Lockify.repository.DocumentRepository;
import com.example.Lockify.repository.KeyPairRepository;
import com.example.Lockify.repository.SignatureRepository;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.apache.commons.codec.binary.Base64;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.*;
import java.security.spec.*;
import java.util.Optional;

@Service
@NoArgsConstructor
@AllArgsConstructor
public class SignatureService {

    @Autowired
    private KeyPairRepository keyPairRepository;
    @Autowired
    private DocumentRepository documentRepository;
    @Autowired
    private SignatureRepository signatureRepository;

    public KeyResponse generateAndStoreKeyPair(KeyExchangeRequest request) throws NoSuchAlgorithmException {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance(request.getAlgorithm());
        kpg.initialize(Integer.parseInt(request.getBits()));
        KeyPair kp = kpg.generateKeyPair();

        String pubB64 = Base64.encodeBase64String(kp.getPublic().getEncoded());
        String privB64 = Base64.encodeBase64String(kp.getPrivate().getEncoded());

        RSAKeyPair rsaKeyPair = new RSAKeyPair();
        rsaKeyPair.setId(request.getId());
        rsaKeyPair.setPublicKey(pubB64);
        rsaKeyPair.setPrivateKey(privB64);
        rsaKeyPair.setAlgorithm(request.getAlgorithm());
        rsaKeyPair.setKeySize(Integer.parseInt(request.getBits()));
        keyPairRepository.save(rsaKeyPair);
        return new KeyResponse(rsaKeyPair.getId(), rsaKeyPair.getPublicKey());
    }

    public Optional<RSAKeyPair> findKeyPair(String id){
        return keyPairRepository.findById(id);
    }

    public SignatureRecord signDocument(SignRequest request) throws Exception {

        String hash = request.getHashAlgorithm();
        String normalizedHash = hash.replaceAll("-", "").toUpperCase();
        String algorithm = request.getAlgorithm().toUpperCase();
        String signingAlgorithm = normalizedHash + "with" + algorithm;


        // get keypair
        RSAKeyPair keyPair = keyPairRepository.findById(request.getSignerId())
                .orElseThrow(() -> new IllegalArgumentException("Key pair not found for id: " + request.getSignerId()));

        byte[] privBytes = Base64.decodeBase64(keyPair.getPrivateKey());
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privBytes);
        KeyFactory kf = KeyFactory.getInstance(request.getAlgorithm());
        PrivateKey privateKey = kf.generatePrivate(keySpec);

        // signature
        java.security.Signature signature = java.security.Signature.getInstance(signingAlgorithm);
        signature.initSign(privateKey);
        byte[] docBytes = request.getMessage().getBytes();
        signature.update(docBytes);
        byte[] sigBytes = signature.sign();
        String sigB64 = Base64.encodeBase64String(sigBytes);

        SignatureRecord sr = new SignatureRecord();
        sr.setSignerId(request.getSignerId());
        sr.setSignatureBase64(sigB64);
        sr.setAlgorithm(signingAlgorithm);
        signatureRepository.save(sr);
        return sr;
    }

    public boolean verify(VerifyRequest request) throws Exception {
        byte[] pubBytes = Base64.decodeBase64(request.getPublicKey());
        X509EncodedKeySpec spec = new X509EncodedKeySpec(pubBytes);
        KeyFactory kf = KeyFactory.getInstance(request.getAlgorithm());
        PublicKey pub = kf.generatePublic(spec);

        String hash = request.getHashAlgorithm();
        String normalizedHash = hash.replaceAll("-", "").toUpperCase();
        String algorithm = request.getAlgorithm().toUpperCase();
        String signingAlgorithm = normalizedHash + "with" + algorithm;

        java.security.Signature signature = java.security.Signature.getInstance(signingAlgorithm);
        signature.initVerify(pub);
        byte[] docBytes = request.getMessage().getBytes();
        signature.update(docBytes);
        byte[] sigBytes = Base64.decodeBase64(request.getSignature());
        return signature.verify(sigBytes);
    }
}

