package com.example.Lockify.repository;

import com.example.Lockify.model.RSAKeyPair;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KeyPairRepository extends MongoRepository<RSAKeyPair, String> {
    Optional<RSAKeyPair> findById(String id);
}
