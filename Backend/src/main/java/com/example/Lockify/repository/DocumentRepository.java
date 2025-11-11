package com.example.Lockify.repository;

import com.example.Lockify.model.DocumentRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends MongoRepository<DocumentRecord, String> {}
