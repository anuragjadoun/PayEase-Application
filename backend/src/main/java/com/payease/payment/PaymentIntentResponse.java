package com.payease.payment;
import java.math.BigDecimal;
public record PaymentIntentResponse(String upiId,String payeeName,BigDecimal amount,String upiUri,String qrCodeDataUrl,String statusMessage) {}
