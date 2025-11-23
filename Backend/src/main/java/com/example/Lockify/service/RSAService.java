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
import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service
@NoArgsConstructor
public class RSAService {

    private final SecureRandom random = new SecureRandom();

    public Boolean checkPrime(BigInteger number, int certainty) {
        return number.isProbablePrime(certainty);
    }

    /**
     * Sinh một số nguyên tố có đúng 'bitLength' bit (tức là highest bit = 1).
     * @param bitLength số bit mong muốn (ví dụ 1024, 2048)
     * @param certainty tham số cho isProbablePrime (khoảng 1..100):
     *                  giá trị càng lớn -> độ chắc chắn càng cao (kết quả là prime với xác suất rất lớn)
     * @return BigInteger là một số nguyên tố
     * @throws IllegalArgumentException nếu bitLength < 2
     */
    private BigInteger generatePrime(String bitLength, String certainty) throws IllegalArgumentException {
        int bits = Integer.parseInt(bitLength);
        int cert = Integer.parseInt(certainty);
        if (bits < 2) {
            throw new IllegalArgumentException("bitLength must be >= 2");
        }
        if (cert < 1) {
            cert = 1;
        }

        while (true) {
            // Sinh một BigInteger ngẫu nhiên có đúng bitLength bit:
            // new BigInteger(bitLength, random) có thể tạo số nhỏ hơn (leading bit = 0),
            // nên chúng ta đảm bảo đặt bit cao nhất (bitLength-1) = 1 để đảm bảo độ dài bit.
            BigInteger candidate = new BigInteger(bits, random)
                    .setBit(bits - 1)  // đảm bảo đúng độ dài bit
                    .setBit(0);             // đảm bảo số lẻ (odd)

            // Kiểm tra prime với Miller-Rabin
            if (candidate.isProbablePrime(cert)) {
                return candidate;
            }
        }
    }

    public BigInteger findPrimeE(BigInteger phi) {
        BigInteger e = BigInteger.valueOf(3);
        while (e.compareTo(phi) < 0) {
            if (e.isProbablePrime(50) && e.gcd(phi).equals(BigInteger.ONE))
                return e;
            e = e.nextProbablePrime();
        }
        throw new RuntimeException("Cannot find prime e");
    }

    public BigInteger findD(BigInteger e, BigInteger phi) {
        return e.modInverse(phi);
    }

    public GenKeyResponse genKey(GenKeyRequest request) throws Exception{
        BigInteger p = generatePrime(request.getBits(), "100");
        BigInteger q = generatePrime(request.getBits(), "100");
        BigInteger n = p.multiply(q);
        BigInteger phi = p.subtract(BigInteger.ONE).multiply(q.subtract(BigInteger.ONE));
        BigInteger e = findPrimeE(phi);
        BigInteger d = findD(e, phi);

        List<String> publicKey = Arrays.asList(n.toString(), e.toString());
        List<String> privateKey = Arrays.asList(n.toString(), d.toString());
        return GenKeyResponse.builder()
                .val_p(p.toString())
                .val_q(q.toString())
                .publicKey(publicKey)
                .privateKey(privateKey)
                .build();
    }

    public List<BigInteger> encodeBase256Blocks(String message, BigInteger n) {
        int bitLen = n.bitLength();
        int blockSize = (bitLen / 8) - 1; // số byte/block
        if (blockSize <= 0) {
            throw new IllegalArgumentException("Modulus n too small. Use larger key.");
        }

        byte[] allBytes = message.getBytes(StandardCharsets.UTF_8);
        List<BigInteger> result = new ArrayList<>();

        for (int offset = 0; offset < allBytes.length; offset += blockSize) {
            int len = Math.min(blockSize, allBytes.length - offset);

            byte[] chunk = new byte[len];
            System.arraycopy(allBytes, offset, chunk, 0, len);

            BigInteger m = new BigInteger(1, chunk);
            if (m.compareTo(n) >= 0) {
                throw new IllegalArgumentException("Block value >= n. Increase key size.");
            }

            result.add(m);
        }

        return result;
    }

    public String decodeBase256Blocks(List<BigInteger> blocks) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            for (BigInteger m : blocks) {
                byte[] raw = m.toByteArray();

                // remove leading sign byte
                if (raw.length > 0 && raw[0] == 0) {
                    raw = Arrays.copyOfRange(raw, 1, raw.length);
                }

                out.write(raw);
            }

            return new String(out.toByteArray(), StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new RuntimeException("Decode failed", e);
        }
    }

    public EncryptResponse encrypt(EncryptRequest request) throws Exception {

        if (request.getPublicKey() == null) throw new IllegalArgumentException("publicKey required");
        if (request.getMessage() == null) throw new IllegalArgumentException("message required");

        BigInteger n = new BigInteger(request.getPublicKey().get(0));
        BigInteger e = new BigInteger(request.getPublicKey().get(1));

        // dùng hàm encode tách riêng
        List<BigInteger> blocks = encodeBase256Blocks(request.getMessage(), n);

        List<BigInteger> cipherBlocks = new ArrayList<>();
        for (BigInteger m : blocks) {
            BigInteger c = m.modPow(e, n);
            cipherBlocks.add(c);
        }

        int nDecimalDigits = n.toString(10).length();
        StringBuilder joined = new StringBuilder();

        for (BigInteger c : cipherBlocks) {
            String s = c.toString(10);
            for (int k = s.length(); k < nDecimalDigits; k++) joined.append('0');
            joined.append(s);
        }

        return EncryptResponse.builder()
                .encryptedText(joined.toString())
                .build();
    }

    public DecryptResponse decrypt(DecryptRequest request) throws Exception {

        if (request.getPrivateKey() == null)
            throw new IllegalArgumentException("privateKey required");

        BigInteger n = new BigInteger(request.getPrivateKey().get(0));
        BigInteger d = new BigInteger(request.getPrivateKey().get(1));
        String encrypted = request.getEncryptedText();

        int nDecimalDigits = n.toString(10).length();
        if (encrypted.length() % nDecimalDigits != 0) {
            throw new IllegalArgumentException("Encrypted length not valid");
        }

        List<BigInteger> blocks = new ArrayList<>();

        for (int i = 0; i < encrypted.length(); i += nDecimalDigits) {
            String part = encrypted.substring(i, i + nDecimalDigits);
            BigInteger c = new BigInteger(part);
            BigInteger m = c.modPow(d, n);
            blocks.add(m);
        }

        // dùng hàm decode tách riêng
        String message = decodeBase256Blocks(blocks);

        return new DecryptResponse(message);
    }
}