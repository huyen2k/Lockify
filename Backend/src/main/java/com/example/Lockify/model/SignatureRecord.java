package com.example.Lockify.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "signatures")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SignatureRecord {
    @Id
    private String id;
    private String signerId;
    private String signature;
    @CreatedDate
    private Date createdAt;
}

