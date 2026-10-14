package com.payease.payment;
import java.util.Map; 
import org.springframework.http.ResponseEntity; 
import org.springframework.http.converter.HttpMessageNotReadableException; 
import org.springframework.web.bind.MethodArgumentNotValidException; 
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice 
public class ApiExceptionHandler { 

    @ExceptionHandler(MethodArgumentNotValidException.class) 
    public ResponseEntity<Map<String,String>> validation(MethodArgumentNotValidException e)
    {
        
        return ResponseEntity.badRequest().body(Map.of("message","Please check the UPI ID, amount and field lengths."));

    } 
    @ExceptionHandler(HttpMessageNotReadableException.class) 
    public ResponseEntity<Map<String,String>> badJson(HttpMessageNotReadableException e){
        
        return ResponseEntity.badRequest().body(Map.of("message","Invalid request. Please check the amount and form fields."));
    } 
}
