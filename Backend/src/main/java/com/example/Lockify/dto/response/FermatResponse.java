package com.example.Lockify.dto.response;

import com.example.Lockify.model.FermatStep;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FermatResponse {
    public List<FermatStep> steps;
}
