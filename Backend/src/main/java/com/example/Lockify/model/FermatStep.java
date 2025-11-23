package com.example.Lockify.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FermatStep {
    public String type;       // start,test,found,done,error
    public String a;          // tested a (string)
    public String x2_minus_n; // a*a - n
    public Boolean isSquare;  // true nếu là square
    public String p;
    public String q;
    public String d;
    public String message;    // lỗi nếu có
}
