package com.example.Lockify.repository;

import com.example.Lockify.model.SignatureRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SignatureRepository extends MongoRepository<SignatureRecord, String> {}
