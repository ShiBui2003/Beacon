"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Check, X } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  label = "Phone Number",
  placeholder = "Enter 10-digit mobile number",
  disabled = false,
  required = false
}: PhoneInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Indian mobile number validation
  const validateIndianPhone = (phone: string): { isValid: boolean; message: string } => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!cleanPhone) {
      return { isValid: true, message: "" }; // Empty is valid if not required
    }

    // Check if it's exactly 10 digits
    if (cleanPhone.length !== 10) {
      return { 
        isValid: false, 
        message: `Phone number must be exactly 10 digits (currently ${cleanPhone.length})` 
      };
    }

    // Check if it starts with valid Indian mobile prefixes
    const validPrefixes = ['6', '7', '8', '9'];
    if (!validPrefixes.includes(cleanPhone[0])) {
      return { 
        isValid: false, 
        message: "Indian mobile numbers must start with 6, 7, 8, or 9" 
      };
    }

    // Check for invalid patterns
    const invalidPatterns = [
      /^(\d)\1{9}$/, // All same digits (e.g., 1111111111)
      /^0{10}$/, // All zeros
      /^1{10}$/, // All ones
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(cleanPhone)) {
        return { 
          isValid: false, 
          message: "Please enter a valid mobile number" 
        };
      }
    }

    return { isValid: true, message: "" };
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedPhone = cleanPhone.slice(0, 10);
    
    // Format as XXX-XXX-XXXX for better readability
    if (limitedPhone.length >= 6) {
      return `${limitedPhone.slice(0, 5)}-${limitedPhone.slice(5)}`;
    } else if (limitedPhone.length >= 3) {
      return `${limitedPhone.slice(0, 5)}-${limitedPhone.slice(5)}`;
    }
    
    return limitedPhone;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove all non-digit characters for validation and storage
    const cleanValue = inputValue.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedValue = cleanValue.slice(0, 10);
    
    // Update the parent component with clean number
    onChange(limitedValue);
    
    // Validate
    const validation = validateIndianPhone(limitedValue);
    setIsValid(validation.isValid);
    setErrorMessage(validation.message);
  };

  // Format display value
  const displayValue = value ? formatPhoneNumber(value) : '';

  // Validation icon
  const getValidationIcon = () => {
    if (!value) return null;
    if (isValid === true) return <Check className="w-4 h-4 text-green-500" />;
    if (isValid === false) return <X className="w-4 h-4 text-red-500" />;
    return null;
  };

  // Validation color classes
  const getInputClasses = () => {
    if (!value) return "";
    if (isValid === true) return "border-green-500 focus-visible:border-green-500";
    if (isValid === false) return "border-red-500 focus-visible:border-red-500";
    return "";
  };

  useEffect(() => {
    if (value) {
      const validation = validateIndianPhone(value);
      setIsValid(validation.isValid);
      setErrorMessage(validation.message);
    } else {
      setIsValid(null);
      setErrorMessage("");
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="flex items-center gap-2">
        <Phone className="w-4 h-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <div className="absolute left-3 top-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">+91</span>
          <span className="text-gray-300">|</span>
        </div>
        
        <Input
          id="phone"
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-16 pr-10 ${getInputClasses()}`}
          maxLength={12} // Account for formatting characters
        />
        
        <div className="absolute right-3 top-3">
          {getValidationIcon()}
        </div>
      </div>

      {/* Validation Message */}
      {errorMessage && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X className="w-3 h-3" />
          {errorMessage}
        </p>
      )}

      {/* Success Message */}
      {isValid === true && value && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Valid Indian mobile number
        </p>
      )}

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Enter a 10-digit Indian mobile number (starting with 6, 7, 8, or 9)
      </p>
    </div>
  );
}
