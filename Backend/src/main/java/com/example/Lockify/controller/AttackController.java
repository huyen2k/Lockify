package com.example.Lockify.controller;

import com.example.Lockify.dto.request.AttackRequest;
import com.example.Lockify.dto.response.FermatResponse;
import com.example.Lockify.dto.response.QSResponse;
import com.example.Lockify.dto.response.TrialResponse;
import com.example.Lockify.service.AttackService;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/attack")
@NoArgsConstructor
@AllArgsConstructor
public class AttackController {

    @Autowired
    private AttackService attackService;

    @PostMapping("/trial")
    public TrialResponse getStepsTrial(@RequestBody AttackRequest req) {
        return AttackService.findPrivateKeyDTrialDivision(req);
    }

    @PostMapping("/fermat")
    public FermatResponse getStepsFermat(@RequestBody AttackRequest req) {
        return AttackService.findPrivateKeyDFermat(req);
    }

    @PostMapping("/sieve/{B}/{intervals}")
    public QSResponse getStepsSieve(@RequestBody AttackRequest req, @PathVariable String B, @PathVariable String intervals) {
        return AttackService.findPrivateKeyDQuadraticSieve(req, B, intervals);
    }

}
