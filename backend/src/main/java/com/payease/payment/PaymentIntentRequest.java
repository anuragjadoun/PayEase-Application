package com.payease.payment;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record PaymentIntentRequest(@NotBlank @Size(max=100) String upiId,@Size(max=80) String payeeName,@NotNull @DecimalMin("1.00") @DecimalMax("100000.00") BigDecimal amount,@Size(max=50) String note) {}
