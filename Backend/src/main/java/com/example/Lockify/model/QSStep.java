package com.example.Lockify.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QSStep {
    public String type;          // "start","test","relation","gauss","found","done","error"
    public String message;
    // relation fields
    public String x;
    public String Qx;
    public int[] exponents;
    public String mask;         // binary mask for dependency/trans (optional)
    public String p;
    public String q;
    public String d;
    public Integer relationIndex;
}
