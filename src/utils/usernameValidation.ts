export interface UsernameValidationResult {
  isValid: boolean;
  formatted: string;
  message: string;
}

export interface UsernameAvailabilityResult {
  available: boolean;
  formatted_username: string | null;
  message: string;
}

/**
 * Validates and formats a username according to the rules:
 * - Only lowercase letters, numbers, and hyphens
 * - Cannot start or end with hyphen
 * - Cannot have consecutive hyphens
 * - Minimum 3 characters, maximum 50 characters
 */
export function validateUsername(input: string): UsernameValidationResult {
  if (!input || input.trim() === '') {
    return {
      isValid: false,
      formatted: '',
      message: 'Username é obrigatório'
    };
  }

  // Convert to lowercase and trim
  let formatted = input.toLowerCase().trim();
  
  // Replace spaces and underscores with hyphens
  formatted = formatted.replace(/[_\s]+/g, '-');
  
  // Remove any character that is not a letter, number, or hyphen
  formatted = formatted.replace(/[^a-z0-9-]/g, '');
  
  // Remove leading and trailing hyphens
  formatted = formatted.replace(/^-+|-+$/g, '');
  
  // Replace multiple consecutive hyphens with single hyphen
  formatted = formatted.replace(/-+/g, '-');

  // Check minimum length
  if (formatted.length < 3) {
    return {
      isValid: false,
      formatted,
      message: 'Username deve ter pelo menos 3 caracteres'
    };
  }

  // Check maximum length
  if (formatted.length > 50) {
    formatted = formatted.substring(0, 50);
    // Remove trailing hyphen if truncation created one
    formatted = formatted.replace(/-+$/, '');
    
    if (formatted.length < 3) {
      return {
        isValid: false,
        formatted,
        message: 'Username muito longo e não pode ser formatado adequadamente'
      };
    }
  }

  // Final validation with regex
  const isValidFormat = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(formatted);
  
  if (!isValidFormat) {
    return {
      isValid: false,
      formatted,
      message: 'Username deve começar e terminar com letra ou número'
    };
  }

  return {
    isValid: true,
    formatted,
    message: 'Username válido'
  };
}

/**
 * Generates username suggestions based on clinic name
 */
export function generateUsernameSuggestions(clinicName: string): string[] {
  if (!clinicName) return [];

  const base = validateUsername(clinicName).formatted;
  if (!base) return [];

  const suggestions: string[] = [base];
  
  // Add numbered variations
  for (let i = 1; i <= 3; i++) {
    const numbered = `${base}${i}`;
    if (numbered.length <= 50) {
      suggestions.push(numbered);
    }
  }

  // Add variations with common suffixes
  const suffixes = ['clinic', 'estetica', 'beauty'];
  for (const suffix of suffixes) {
    const withSuffix = `${base}-${suffix}`;
    if (withSuffix.length <= 50) {
      suggestions.push(withSuffix);
    }
  }

  return suggestions.slice(0, 5); // Return max 5 suggestions
}

/**
 * Formats the display URL for the username
 */
export function formatUsernameUrl(username: string): string {
  return `bio.estettica.com/${username}`;
}

/**
 * Real-time validation for input field
 */
export function validateUsernameInput(input: string): {
  isValid: boolean;
  message: string;
  showError: boolean;
} {
  if (!input || input.trim() === '') {
    return {
      isValid: false,
      message: '',
      showError: false
    };
  }

  const validation = validateUsername(input);
  
  return {
    isValid: validation.isValid,
    message: validation.message,
    showError: !validation.isValid
  };
}