package com.example.Lockify.service;

import com.example.Lockify.dto.request.AttackRequest;
import com.example.Lockify.dto.response.FermatResponse;
import com.example.Lockify.dto.response.QSResponse;
import com.example.Lockify.dto.response.TrialResponse;
import com.example.Lockify.model.FermatStep;
import com.example.Lockify.model.QSStep;
import com.example.Lockify.model.TrialStep;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.logging.Log;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

@Service
@NoArgsConstructor
@Slf4j
public class AttackService {

    private static final BigInteger TWO = BigInteger.valueOf(2);

    /**
     * Tấn công RSA bằng phương pháp Trial Division để tìm khóa riêng d từ khóa công khai (e, n).
     * Phương pháp này chỉ khả thi với n nhỏ và yếu.
     *
     * @param  request yêu cầu tấn công chứa e và n dưới dạng chuỗi
     * @return khóa riêng d nếu tìm được, null nếu không thể tìm được
     */
    public static TrialResponse findPrivateKeyDTrialDivision(AttackRequest request) {
        BigInteger e = new BigInteger(request.getE());
        BigInteger n = new BigInteger(request.getN());

        // --- Trial Division để tìm p ---
        TrialResponse res = new TrialResponse();
        res.steps = new ArrayList<>();
        BigInteger p = null;

        TrialStep s2 = new TrialStep();
        s2.type = "test";
        s2.i = "2";
        s2.divisible = n.mod(TWO).equals(BigInteger.ZERO);
        res.steps.add(s2);

        if (s2.divisible) {
            p = TWO;
        } else {
            BigInteger i = BigInteger.valueOf(3);
            while (i.multiply(i).compareTo(n) <= 0) {
                TrialStep st = new TrialStep();
                st.type = "test";
                st.i = i.toString();
                st.divisible = n.mod(i).equals(BigInteger.ZERO);
                res.steps.add(st);

                if (st.divisible) {
                    p = i;
                    break;
                }
                i = i.add(TWO);
            }
        }

        if (p == null) {
            TrialStep done = new TrialStep();
            done.type = "done";
            done.d = "Không tìm được factor";
            res.steps.add(done);
            return res;
        }

        BigInteger q = n.divide(p);

        TrialStep found = new TrialStep();
        found.type = "found";
        found.p = p.toString();
        found.q = q.toString();
        res.steps.add(found);

        BigInteger phi = p.subtract(BigInteger.ONE).multiply(q.subtract(BigInteger.ONE));
        BigInteger d = e.modInverse(phi);

        TrialStep finish = new TrialStep();
        finish.type = "done";
        finish.d = d.toString();
        res.steps.add(finish);

        return res;
    }

    /**
     * Trả về d (BigInteger) từ e,n sử dụng Fermat factorization.
     * Nếu không factor được hoặc e không có nghịch đảo mod phi, trả về null.
     */
    public static FermatResponse findPrivateKeyDFermat(AttackRequest request) {
        FermatResponse resp = new FermatResponse();
        resp.steps = new ArrayList<>();

        try {
            BigInteger e = new BigInteger(request.getE());
            BigInteger n = new BigInteger(request.getN());
            final BigInteger TWO = BigInteger.valueOf(2);

            // Safety checks
            final int MAX_BITS = 512;       // điều chỉnh nếu muốn (demo: 64/128)
            final long MAX_STEPS = 1_000_000L;

            if (n.bitLength() > MAX_BITS) {
                FermatStep err = new FermatStep();
                err.type = "error";
                err.message = "n is too large for demo (bitLength = " + n.bitLength() + "). Max supported = " + MAX_BITS + " bits.";
                resp.steps.add(err);
                return resp;
            }

            // start
            FermatStep start = new FermatStep();
            start.type = "start";
            start.message = "Fermat factorization started";
            resp.steps.add(start);

            // quick even check
            if (n.mod(TWO).equals(BigInteger.ZERO)) {
                BigInteger p = TWO;
                BigInteger q = n.divide(TWO);

                FermatStep found = new FermatStep();
                found.type = "found";
                found.p = p.toString();
                found.q = q.toString();
                resp.steps.add(found);

                BigInteger phi = (p.subtract(BigInteger.ONE)).multiply(q.subtract(BigInteger.ONE));
                if (!e.gcd(phi).equals(BigInteger.ONE)) {
                    FermatStep err = new FermatStep();
                    err.type = "error";
                    err.message = "gcd(e, phi) != 1; cannot compute d.";
                    resp.steps.add(err);
                    return resp;
                } else {
                    BigInteger d = e.modInverse(phi);
                    FermatStep done = new FermatStep();
                    done.type = "done";
                    done.d = d.toString();
                    resp.steps.add(done);
                    return resp;
                }
            }

            // a = ceil(sqrt(n))
            BigInteger a0 = sqrtCeil(n);
            BigInteger a = a0;
            long steps = 0L;

            while (steps < MAX_STEPS) {
                BigInteger x2_minus_n = a.multiply(a).subtract(n);
                boolean isSq = isPerfectSquare(x2_minus_n);

                FermatStep test = new FermatStep();
                test.type = "test";
                test.a = a.toString();
                test.x2_minus_n = x2_minus_n.toString();
                test.isSquare = isSq;
                resp.steps.add(test);

                if (isSq) {
                    BigInteger b = sqrtFloor(x2_minus_n); // exact sqrt
                    BigInteger p = a.subtract(b);
                    BigInteger q = a.add(b);

                    // validate
                    if (p.compareTo(BigInteger.ONE) <= 0 || q.compareTo(BigInteger.ONE) <= 0 || !p.multiply(q).equals(n)) {
                        FermatStep err = new FermatStep();
                        err.type = "error";
                        err.message = "Found square but invalid factors (p*q != n or <=1).";
                        resp.steps.add(err);
                        return resp;
                    }

                    FermatStep found = new FermatStep();
                    found.type = "found";
                    found.p = p.toString();
                    found.q = q.toString();
                    resp.steps.add(found);

                    BigInteger phi = (p.subtract(BigInteger.ONE)).multiply(q.subtract(BigInteger.ONE));
                    if (!e.gcd(phi).equals(BigInteger.ONE)) {
                        FermatStep err = new FermatStep();
                        err.type = "error";
                        err.message = "gcd(e, phi) != 1; cannot compute d.";
                        resp.steps.add(err);
                        return resp;
                    } else {
                        BigInteger d = e.modInverse(phi);
                        FermatStep done = new FermatStep();
                        done.type = "done";
                        done.d = d.toString();
                        resp.steps.add(done);
                        return resp;
                    }
                }

                // increment a
                a = a.add(BigInteger.ONE);
                steps++;

                // optional safety break: if a - a0 too large, fail early
                if (a.subtract(a0).compareTo(BigInteger.valueOf(1_000_000L)) > 0) {
                    FermatStep err = new FermatStep();
                    err.type = "error";
                    err.message = "Exceeded iteration limit relative to sqrt(n); aborting.";
                    resp.steps.add(err);
                    return resp;
                }
            }

            // reached MAX_STEPS
            FermatStep done = new FermatStep();
            done.type = "done";
            done.message = "Reached max steps without finding factor.";
            resp.steps.add(done);
            return resp;

        } catch (NumberFormatException nf) {
            FermatStep err = new FermatStep();
            err.type = "error";
            err.message = "Invalid e or n format: must be decimal strings.";
            resp.steps.add(err);
            return resp;
        } catch (Exception ex) {
            FermatStep err = new FermatStep();
            err.type = "error";
            err.message = "Exception: " + ex.getMessage();
            resp.steps.add(err);
            return resp;
        }
    }

    /* Utility functions (keep in same class/file) */

    // Kiểm tra perfect square bằng cách lấy sqrtFloor và bình phương lại
    private static boolean isPerfectSquare(BigInteger x) {
        if (x.signum() < 0) return false;
        BigInteger s = sqrtFloor(x);
        return s.multiply(s).equals(x);
    }

    // floor(sqrt(n)) với BigInteger, dùng Newton (safe)
    private static BigInteger sqrtFloor(BigInteger n) {
        if (n.signum() < 0) throw new ArithmeticException("sqrt of negative");
        if (n.equals(BigInteger.ZERO) || n.equals(BigInteger.ONE)) return n;

        int bitLength = n.bitLength();
        BigInteger x = BigInteger.ONE.shiftLeft((bitLength + 1) / 2); // initial approx

        while (true) {
            BigInteger y = x.add(n.divide(x)).shiftRight(1); // y = (x + n/x)/2
            if (y.equals(x) || y.equals(x.subtract(BigInteger.ONE))) {
                if (x.multiply(x).compareTo(n) > 0) return x.subtract(BigInteger.ONE);
                else return x;
            }
            x = y;
        }
    }

    // ceil(sqrt(n)) = floor(sqrt(n)) or +1 nếu cần
    private static BigInteger sqrtCeil(BigInteger n) {
        BigInteger f = sqrtFloor(n);
        if (f.multiply(f).equals(n)) return f;
        return f.add(BigInteger.ONE);
    }

    public static QSResponse findPrivateKeyDQuadraticSieve(AttackRequest request, String B_str, String sieveInterval_str) {

        QSResponse resp = new QSResponse();
        resp.steps = new ArrayList<>();

        try {
            BigInteger e = new BigInteger(request.getE());
            BigInteger n = new BigInteger(request.getN());
            final BigInteger TWO = BigInteger.valueOf(2);

            final int MAX_BITS = 512;
            final long MAX_STEPS = 2_000_000L;

            // Helper to avoid repeated boilerplate
            Function<String, QSStep> info = msg -> step("info", msg);

            // Invalid n size
            if (n.bitLength() > MAX_BITS) {
                resp.steps.add(step("error",
                        "n too large (bitLength=" + n.bitLength() + "). Max=" + MAX_BITS));
                return resp;
            }

            // Start
            resp.steps.add(step("start", "Quadratic Sieve started"));

            // Even n → trivial
            if (n.mod(TWO).equals(BigInteger.ZERO)) {
                BigInteger p = TWO;
                BigInteger q = n.divide(TWO);

                QSStep found = new QSStep();
                found.type = "found";
                found.p = p.toString();
                found.q = q.toString();
                resp.steps.add(found);

                BigInteger phi = p.subtract(BigInteger.ONE).multiply(q.subtract(BigInteger.ONE));
                if (!e.gcd(phi).equals(BigInteger.ONE)) {
                    resp.steps.add(step("error","gcd(e,phi)!=1; cannot compute d."));
                    return resp;
                }

                QSStep done = new QSStep();
                done.type = "done";
                done.d = e.modInverse(phi).toString();
                resp.steps.add(done);

                return resp;
            }

            // QS params
            int bitlen = n.bitLength();
            //int B = Math.max(50, Math.min(2000, bitlen * 10));
            int B = Integer.parseInt(B_str);
            //int sieveInterval = Math.max(2000, bitlen * 40);
            int sieveInterval = Integer.parseInt(sieveInterval_str);
            int neededRelations = Math.max(100, B / 2 + 20);

            resp.steps.add(info.apply(
                    "params: B=" + B + ", sieveInterval=±" + sieveInterval + ", neededRelations=" + neededRelations));

            // Build factor base
            List<Integer> primes = primesUpTo(B);
            List<Integer> factorBase = new ArrayList<>();

            for (int p : primes) {
                if (p == 2) {
                    factorBase.add(2);
                } else if (legendreSymbol(n, p) == 1) {
                    factorBase.add(p);
                }
            }

            resp.steps.add(info.apply("factor base size = " + factorBase.size()));

            if (factorBase.isEmpty()) {
                resp.steps.add(step("error", "Empty factor base; increase B."));
                return resp;
            }

            // sqrt(n)
            BigInteger sqrtN = isqrt(n);
            resp.steps.add(info.apply("sqrt(n)=" + sqrtN));

            // Collect relations
            resp.steps.add(info.apply("Start collecting relations..."));

            class Relation {
                BigInteger X;
                BigInteger Qabs;
                int[] exps;
            }

            List<Relation> relations = new ArrayList<>();
            long stepCount = 0;
            int testIndex = 0;

            for (int offset = -sieveInterval;
                 offset <= sieveInterval && relations.size() < neededRelations; offset++) {

                if (stepCount++ > MAX_STEPS) {
                    resp.steps.add(step("error",
                            "Exceeded MAX_STEPS while collecting relations."));
                    return resp;
                }

                BigInteger X = sqrtN.add(BigInteger.valueOf(offset));
                BigInteger Q = X.multiply(X).subtract(n);
                BigInteger Qabs = Q.abs();
                if (Qabs.equals(BigInteger.ZERO)) continue;

                // test step
                QSStep test = new QSStep();
                test.type = "test";
                test.relationIndex = testIndex++;
                test.x = X.toString();
                test.Qx = Qabs.toString();
                resp.steps.add(test);

                // factor Q(x)
                BigInteger tmp = Qabs;
                int[] exps = new int[factorBase.size()];
                for (int i = 0; i < factorBase.size(); i++) {
                    BigInteger bp = BigInteger.valueOf(factorBase.get(i));
                    while (tmp.mod(bp).equals(BigInteger.ZERO)) {
                        tmp = tmp.divide(bp);
                        exps[i]++;
                    }
                }

                // smooth?
                if (tmp.equals(BigInteger.ONE)) {
                    Relation r = new Relation();
                    r.X = X.mod(n);
                    r.Qabs = Qabs;
                    r.exps = exps;
                    relations.add(r);

                    QSStep rel = new QSStep();
                    rel.type = "relation";
                    rel.relationIndex = relations.size()-1;
                    rel.x = r.X.toString();
                    rel.Qx = r.Qabs.toString();
                    rel.exponents = Arrays.copyOf(exps, exps.length);
                    resp.steps.add(rel);
                }
            }

            resp.steps.add(info.apply("Collected relations=" + relations.size()));

            if (relations.size() < factorBase.size() + 1) {
                resp.steps.add(step("error", "Insufficient relations."));
                return resp;
            }

            // Build parity matrix
            int R = relations.size();
            int FB = factorBase.size();

            BigInteger[] rowMasks = new BigInteger[R];
            BigInteger[] trans = new BigInteger[R];

            for (int i = 0; i < R; i++) {
                BigInteger mask = BigInteger.ZERO;
                for (int j = 0; j < FB; j++) {
                    if ((relations.get(i).exps[j] & 1) != 0) mask = mask.setBit(j);
                }
                rowMasks[i] = mask;
                trans[i] = BigInteger.ONE.shiftLeft(i);
            }

            resp.steps.add(step("gauss", "Start Gaussian elimination (mod 2)"));

            // Gaussian elimination
            int row = 0;
            for (int col = 0; col < FB && row < R; col++) {

                int sel = -1;
                for (int r = row; r < R; r++) {
                    if (rowMasks[r].testBit(col)) { sel = r; break; }
                }
                if (sel == -1) continue;

                // swap
                if (sel != row) {
                    BigInteger tmpMask = rowMasks[row];
                    rowMasks[row] = rowMasks[sel];
                    rowMasks[sel] = tmpMask;

                    BigInteger tmpTrans = trans[row];
                    trans[row] = trans[sel];
                    trans[sel] = tmpTrans;
                }

                // eliminate others
                for (int r = 0; r < R; r++) {
                    if (r != row && rowMasks[r].testBit(col)) {
                        rowMasks[r] = rowMasks[r].xor(rowMasks[row]);
                        trans[r] = trans[r].xor(trans[row]);
                    }
                }
                row++;
            }

            resp.steps.add(step("gauss", "Gaussian elimination finished"));

            // find dependencies
            for (int r = 0; r < R; r++) {
                if (rowMasks[r].equals(BigInteger.ZERO)) {

                    String maskStr = trans[r].toString(2);
                    if (maskStr.isEmpty()) maskStr="0";

                    QSStep dep = new QSStep();
                    dep.type = "dependency";
                    dep.relationIndex = r;
                    dep.mask = maskStr;
                    resp.steps.add(dep);

                    BigInteger depMask = trans[r];

                    // build Xprod and Yprod
                    BigInteger Xprod = BigInteger.ONE;
                    int[] totalExp = new int[FB];

                    for (int i = 0; i < R; i++) {
                        if (depMask.testBit(i)) {
                            Relation rel = relations.get(i);
                            Xprod = Xprod.multiply(rel.X).mod(n);
                            for (int j = 0; j < FB; j++) totalExp[j] += rel.exps[j];
                        }
                    }

                    BigInteger Yprod = BigInteger.ONE;
                    for (int j = 0; j < FB; j++) {
                        int half = totalExp[j] / 2;
                        if (half > 0) {
                            Yprod = Yprod.multiply(
                                    BigInteger.valueOf(factorBase.get(j))
                                            .modPow(BigInteger.valueOf(half), n)
                            ).mod(n);
                        }
                    }

                    QSStep comb = new QSStep();
                    comb.type = "combine";
                    comb.x = Xprod.toString();
                    comb.Qx = Yprod.toString();
                    comb.message = "Form X² ≡ Y² mod n";
                    resp.steps.add(comb);

                    // gcd(X - Y)
                    BigInteger g1 = Xprod.subtract(Yprod).abs().gcd(n);
                    resp.steps.add(info.apply("gcd(X-Y,n)=" + g1));

                    if (!g1.equals(BigInteger.ONE) && !g1.equals(n)) {
                        BigInteger p = g1;
                        BigInteger q = n.divide(p);
                        resp.steps.add(found(p, q));
                        return finishWithD(resp, p, q, e);
                    }

                    // gcd(X + Y)
                    BigInteger g2 = Xprod.add(Yprod).gcd(n);
                    resp.steps.add(info.apply("gcd(X+Y,n)=" + g2));

                    if (!g2.equals(BigInteger.ONE) && !g2.equals(n)) {
                        BigInteger p = g2;
                        BigInteger q = n.divide(p);
                        resp.steps.add(found(p, q));
                        return finishWithD(resp, p, q, e);
                    }
                }
            }

            // no factor found
            resp.steps.add(step("done",
                    "QS finished but no non-trivial factor found."));
            return resp;

        } catch (Exception ex) {
            resp.steps.add(step("error","Exception: " + ex.getMessage()));
            return resp;
        }
    }

    private static QSStep step(String type, String msg) {
        QSStep s = new QSStep();
        s.type = type;
        s.message = msg;
        return s;
    }

    private static QSStep found(BigInteger p, BigInteger q) {
        QSStep s = new QSStep();
        s.type = "found";
        s.p = p.toString();
        s.q = q.toString();
        return s;
    }

    private static QSResponse finishWithD(QSResponse resp, BigInteger p, BigInteger q, BigInteger e) {
        BigInteger phi = p.subtract(BigInteger.ONE).multiply(q.subtract(BigInteger.ONE));
        if (!e.gcd(phi).equals(BigInteger.ONE)) {
            resp.steps.add(step("error","gcd(e,phi) != 1; cannot compute d."));
            return resp;
        }
        QSStep done = new QSStep();
        done.type = "done";
        done.d = e.modInverse(phi).toString();
        resp.steps.add(done);
        return resp;
    }

    private static BigInteger isqrt(BigInteger n) {
        if (n.signum() < 0) throw new ArithmeticException("sqrt of negative");
        if (n.equals(BigInteger.ZERO) || n.equals(BigInteger.ONE)) return n;
        BigInteger x = BigInteger.ONE.shiftLeft((n.bitLength() + 1) / 2);
        while (true) {
            BigInteger y = x.add(n.divide(x)).shiftRight(1);
            if (y.equals(x) || y.equals(x.subtract(BigInteger.ONE))) {
                if (x.multiply(x).compareTo(n) > 0) return x.subtract(BigInteger.ONE);
                return x;
            }
            x = y;
        }
    }

    private static int legendreSymbol(BigInteger a, int p) {
        if (p == 2) return 0;
        BigInteger bp = BigInteger.valueOf(p);
        BigInteger res = a.mod(bp).modPow(bp.subtract(BigInteger.ONE).divide(BigInteger.valueOf(2)), bp);
        if (res.equals(BigInteger.ZERO)) return 0;
        return res.equals(BigInteger.ONE) ? 1 : -1;
    }

    private static List<Integer> primesUpTo(int limit) {
        boolean[] comp = new boolean[limit + 1];
        List<Integer> out = new ArrayList<>();
        for (int i = 2; i <= limit; i++) {
            if (!comp[i]) {
                out.add(i);
                if ((long)i * i <= limit) for (int j = i * i; j <= limit; j += i) comp[j] = true;
            }
        }
        return out;
    }
}
