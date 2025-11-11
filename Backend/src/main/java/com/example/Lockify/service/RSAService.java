package com.example.Lockify.service;

import com.example.Lockify.dto.request.DecryptRequest;
import com.example.Lockify.dto.request.EncryptRequest;
import com.example.Lockify.dto.response.DecryptResponse;
import com.example.Lockify.dto.response.EncryptResponse;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import java.security.*;
import java.util.Base64;

@Service
@NoArgsConstructor
@AllArgsConstructor
public class RSAService {

    public EncryptResponse encrypt(EncryptRequest request) throws Exception {
        Cipher cipher = Cipher.getInstance(request.getAlgorithm());
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(request.getAlgorithm());
        keyGen.initialize(Integer.parseInt(request.getBits()));
        KeyPair keyPair = keyGen.generateKeyPair();

        cipher.init(Cipher.ENCRYPT_MODE, keyPair.getPublic());
        byte[] encryptedBytes = cipher.doFinal(request.getMessage().getBytes());
        String encriptText = Base64.getEncoder().encodeToString(encryptedBytes);
        return EncryptResponse.builder()
                .privateKeg(String.valueOf(keyPair.getPrivate()))
                .publicKey(String.valueOf(keyPair.getPrivate()))
                .encryptedText(encriptText)
                .build();
    }

    public DecryptResponse decrypt(DecryptRequest request) throws Exception {
        Cipher cipher = Cipher.getInstance(request.getAlgorithm());
        Number privateKeg = Integer.parseInt(request.getPrivateKeg());
        cipher.init(Cipher.DECRYPT_MODE, (Key) privateKeg);
        byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(request.getEncryptedText()));
        return DecryptResponse.builder()
                .decryptedText(new String(decryptedBytes))
                .build();
    }
}