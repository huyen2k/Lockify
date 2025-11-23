package com.example.Lockify.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrialStep {
    public String type; // test, found, done
    public String i;
    public Boolean divisible;
    public String p;
    public String q;
    public String d;
}
