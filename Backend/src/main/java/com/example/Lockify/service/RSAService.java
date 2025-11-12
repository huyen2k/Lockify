package com.example.Lockify.service;

import com.example.Lockify.dto.request.DecryptRequest;
import com.example.Lockify.dto.request.EncryptRequest;
import com.example.Lockify.dto.request.GenKeyRequest;
import com.example.Lockify.dto.response.DecryptResponse;
import com.example.Lockify.dto.response.EncryptResponse;
import com.example.Lockify.dto.response.GenKeyResponse;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Service
@NoArgsConstructor
public class RSAService {

    public GenKeyResponse genKey(GenKeyRequest request) throws Exception{
        String algorithm = request.getAlgorithm();
        int bits = Integer.parseInt(request.getBits());

        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(algorithm);
        keyGen.initialize(bits);
        KeyPair keyPair = keyGen.generateKeyPair();

        byte[] pubKeyBytes = keyPair.getPublic().getEncoded();
        byte[] privKeyBytes = keyPair.getPrivate().getEncoded();

        String publicKeyBase64 = Base64.getEncoder().encodeToString(pubKeyBytes);
        String privateKeyBase64 = Base64.getEncoder().encodeToString(privKeyBytes);

        return GenKeyResponse.builder()
                .publicKey(publicKeyBase64)
                .privateKey(privateKeyBase64)
                .build();
    }

    public EncryptResponse encrypt(EncryptRequest request) throws Exception {

        if (request.getPublicKey() == null) throw new IllegalArgumentException("publicKey required");
        if (request.getMessage() == null) throw new IllegalArgumentException("message required");

        String publicKeyBase64 = request.getPublicKey();
        String algorithm = request.getAlgorithm();

        byte[] pubKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(pubKeyBytes);
        KeyFactory kf = KeyFactory.getInstance(algorithm);
        PublicKey publicKey = kf.generatePublic(keySpec);

        Cipher cipher = Cipher.getInstance(algorithm);
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);

        byte[] encryptedBytes = cipher.doFinal(request.getMessage().getBytes(StandardCharsets.UTF_8));
        String encriptText = Base64.getEncoder().encodeToString(encryptedBytes);
        return EncryptResponse.builder()
                .encryptedText(encriptText)
                .build();
    }

    public DecryptResponse decrypt(DecryptRequest request) throws Exception {
        if (request.getPrivateKey() == null) {
            throw new IllegalArgumentException("privateKey is required");
        }

        byte[] privKeyBytes = Base64.getDecoder().decode(request.getPrivateKey());
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privKeyBytes);
        KeyFactory kf = KeyFactory.getInstance(request.getAlgorithm());
        PrivateKey privateKey = kf.generatePrivate(keySpec);

        Cipher cipher = Cipher.getInstance(request.getAlgorithm());
        cipher.init(Cipher.DECRYPT_MODE, privateKey);

        byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(request.getEncryptedText()));
        String plaintext = new String(decryptedBytes, StandardCharsets.UTF_8);

        return DecryptResponse.builder()
                .decryptedText(plaintext)
                .build();
    }
}