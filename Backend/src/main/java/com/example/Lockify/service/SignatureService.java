package com.example.Lockify.service;

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

    public KeyResponse generateAndStoreKeyPair(String id, int keySize) throws NoSuchAlgorithmException {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(keySize);
        KeyPair kp = kpg.generateKeyPair();

        String pubB64 = Base64.encodeBase64String(kp.getPublic().getEncoded());
        String privB64 = Base64.encodeBase64String(kp.getPrivate().getEncoded());

        RSAKeyPair rsaKeyPair = new RSAKeyPair();
        rsaKeyPair.setId(id);
        rsaKeyPair.setPublicKey(pubB64);
        rsaKeyPair.setPrivateKey(privB64);
        keyPairRepository.save(rsaKeyPair);
        return new KeyResponse(rsaKeyPair.getId(), rsaKeyPair.getPublicKey());
    }

    public Optional<RSAKeyPair> findKeyPair(String id){
        return keyPairRepository.findById(id);
    }

    public SignatureRecord signDocument(String signerId, String documentBase64, String filename) throws Exception {
        // save document
        DocumentRecord doc = new DocumentRecord();
        doc.setOwnerId(signerId);
        doc.setFilename(filename);
        doc.setContentBase64(documentBase64);
        doc = documentRepository.save(doc);

        // get keypair
        RSAKeyPair keyPair = keyPairRepository.findById(signerId)
                .orElseThrow(() -> new IllegalArgumentException("Key pair not found for id: " + signerId));

        byte[] privBytes = Base64.decodeBase64(keyPair.getPrivateKey());
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        PrivateKey privateKey = kf.generatePrivate(keySpec);

        // signature
        java.security.Signature signature = java.security.Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        byte[] docBytes = Base64.decodeBase64(documentBase64);
        signature.update(docBytes);
        byte[] sigBytes = signature.sign();
        String sigB64 = Base64.encodeBase64String(sigBytes);

        SignatureRecord sr = new SignatureRecord();
        sr.setDocumentId(doc.getId());
        sr.setSignerId(signerId);
        sr.setSignatureBase64(sigB64);
        signatureRepository.save(sr);
        return sr;
    }

    public boolean verify(String publicKeyBase64, String documentBase64, String signatureBase64) throws Exception {
        byte[] pubBytes = Base64.decodeBase64(publicKeyBase64);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(pubBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        PublicKey pub = kf.generatePublic(spec);

        java.security.Signature signature = java.security.Signature.getInstance("SHA256withRSA");
        signature.initVerify(pub);
        byte[] docBytes = Base64.decodeBase64(documentBase64);
        signature.update(docBytes);
        byte[] sigBytes = Base64.decodeBase64(signatureBase64);
        return signature.verify(sigBytes);
    }
}

