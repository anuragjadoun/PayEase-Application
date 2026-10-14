
package com.payease.payment;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;

import jakarta.validation.Valid;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Validated
public class PaymentController {

    private static final Pattern UPI = Pattern.compile(
        "^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$"
    );

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "ok",
            "service", "PayEase backend"
        );
    }

    @PostMapping(
        value = "/payments/intent",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> create(
        @Valid @RequestBody PaymentIntentRequest req
    ) {
        if (
            req.amount() == null
                || req.amount().scale() > 2
                || req.amount().compareTo(BigDecimal.ONE) < 0
                || req.amount().compareTo(
                    new BigDecimal("100000.00")
                ) > 0
        ) {
            return ResponseEntity.badRequest().body(
                Map.of(
                    "message",
                    "Enter an amount between ₹1 and ₹1,00,000 "
                        + "with at most 2 decimal places."
                )
            );
        }

        String id = req.upiId().trim();

        if (!UPI.matcher(id).matches()) {
            return ResponseEntity.badRequest().body(
                Map.of(
                    "message",
                    "Enter a UPI ID in the format name@provider."
                )
            );
        }

        String name = req.payeeName() == null
            ? ""
            : req.payeeName().trim();

        String note = req.note() == null || req.note().isBlank()
            ? "Payment"
            : req.note().trim();

        BigDecimal amount = req.amount().setScale(
            2,
            java.math.RoundingMode.UNNECESSARY
        );

        String uri =
            "upi://pay?pa=" + enc(id)
                + "&am=" + amount.toPlainString()
                + "&cu=INR"
                + "&tn=" + enc(note)
                + (name.isBlank() ? "" : "&pn=" + enc(name));

        try {
            Map<EncodeHintType, Object> hints =
                new EnumMap<>(EncodeHintType.class);

            hints.put(EncodeHintType.MARGIN, 2);

            BitMatrix matrix = new MultiFormatWriter().encode(
                uri,
                BarcodeFormat.QR_CODE,
                360,
                360,
                hints
            );

            ByteArrayOutputStream out =
                new ByteArrayOutputStream();

            ImageIO.write(
                MatrixToImageWriter.toBufferedImage(matrix),
                "PNG",
                out
            );

            String image = "data:image/png;base64,"
                + Base64.getEncoder().encodeToString(
                    out.toByteArray()
                );

            return ResponseEntity.ok(
                new PaymentIntentResponse(
                    id,
                    name,
                    amount,
                    uri,
                    image,
                    "Request created only; payment is not "
                        + "processed or verified by this service."
                )
            );

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of(
                    "message",
                    "Could not generate QR code. Please try again."
                )
            );
        }
    }

    private static String enc(String value) {
        return URLEncoder.encode(
            value,
            StandardCharsets.UTF_8
        ).replace("+", "%20");
    }
}
