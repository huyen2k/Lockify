package com.example.Lockify.dto.response;

import com.example.Lockify.model.TrialStep;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrialResponse {
    public List<TrialStep> steps;
}
