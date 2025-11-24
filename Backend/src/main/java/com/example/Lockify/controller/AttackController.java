package com.example.Lockify.controller;

import com.example.Lockify.dto.request.AttackRequest;
import com.example.Lockify.dto.response.FermatResponse;
import com.example.Lockify.dto.response.QSResponse;
import com.example.Lockify.dto.response.TrialResponse;
import com.example.Lockify.service.AttackService;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/attack")
@NoArgsConstructor
@AllArgsConstructor
public class AttackController {

    @Autowired
    private AttackService attackService;

    @PostMapping("/trial")
    public ResponseEntity<TrialResponse> getStepsTrial(@RequestBody AttackRequest req) {
        return new ResponseEntity<>(AttackService.findPrivateKeyDTrialDivision(req), HttpStatus.OK);
    }

    @PostMapping("/fermat")
    public ResponseEntity<FermatResponse> getStepsFermat(@RequestBody AttackRequest req) {
        return new ResponseEntity<>(AttackService.findPrivateKeyDFermat(req), HttpStatus.OK);
    }

    @PostMapping("/sieve/{B}/{intervals}")
    public ResponseEntity<QSResponse> getStepsSieve(@RequestBody AttackRequest req, @PathVariable String B, @PathVariable String intervals) {
        return new ResponseEntity<>(AttackService.findPrivateKeyDQuadraticSieve(req, B, intervals), HttpStatus.OK);
    }

}
