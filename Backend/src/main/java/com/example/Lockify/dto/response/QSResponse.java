package com.example.Lockify.dto.response;

import com.example.Lockify.model.QSStep;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QSResponse {
    public List<QSStep> steps;
}
