/**
 * Utility functions for detecting and redacting sensitive PII, credentials, and secrets.
 */

// A collection of regex patterns for common sensitive information.
const SENSITIVE_PATTERNS = [
  // Credit Cards (e.g., 1234-5678-9012-3456)
  { name: "Credit Card", regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})\b/g },
  // Social Security Numbers (SSN)
  { name: "SSN", regex: /\b(?!000|666|9\d{2})\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g },
  // API Keys & Tokens (e.g., sk-abcdefGHIJKL123456, Bearer tokens, GitHub tokens)
  { name: "OpenAI Key", regex: /\bsk-[a-zA-Z0-9]{16,}\b/g },
  { name: "Bearer Token", regex: /\bBearer\s+[A-Za-z0-9\-\._~\+\/]+={0,2}\b/g },
  { name: "GitHub Token", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b/g },
  { name: "Generic Secret Key", regex: /\b(?:secret|api_key|apikey|access_token|private_key|token)[\s:=]+["']?[a-zA-Z0-9\-\._~\+\/]{16,}["']?\b/gi },
  // Passwords (naive heuristic for explicit declaration)
  { name: "Password Pattern", regex: /\b(?:password|pass|pwd)[\s:=]+["']?[^"'\s]{6,}["']?\b/gi },
  // Private Keys (e.g., BEGIN RSA PRIVATE KEY)
  { name: "Private Key", regex: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  // Email Addresses
  { name: "Email", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },

  // US/International Phone Numbers (e.g., (123) 456-7890, +1 123-456-7890)
  { name: "Phone Number", regex: /\b(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?[2-9]\d{2}[-.\s]?\d{4}\b/g },
  // Bank Routing / Account numbers (heuristics: 9 digits for routing, 9-18 for account)
  { name: "Routing Number", regex: /\b(?:routing\s*number\s*is\s*)?(\d{9})\b/gi },
  { name: "Account Number", regex: /\b(?:account\s*number\s*is\s*)?(\d{9,18})\b/gi },
  // Passport Numbers (US: 9 alphanumeric)
  { name: "Passport", regex: /\b[A-Z0-9]{9}\b/g }, // Very generic, but combined with context usually
];

import { Filter } from 'bad-words';

export interface SafetyCheckResult {
  isSafe: boolean;
  redactedText: string;
}

const profanityFilter = new Filter();
// Add custom modern slang, gaming toxicity, political insults, and abbreviations
const modernSlang = [
  // Acronyms & Abbreviations
  "mf", "mfs", "stfu", "gtfo", "kys", "kms", "fu", "fku", "fuk", "lmao", "lmfao", "omfg",
  
  // General Insults & Intelligence Attacks
  "dumb", "dumbass", "idiot", "stupid", "moron", "retard", "retarded", "braindead", 
  "spaz", "sped", "schizo", "autistic", "mongoloid", "brainrot", "schizoid",
  
  // Modern Gaming / Gen Z Toxicity
  "dogwater", "trash", "bot", "npc", "mid", "bozo", "clown", "cope", "seethe", "mald", 
  "ratio", "skill issue", "gg ez", "touch grass", "noob", "n00b", "scrub",
  
  // Internet Subculture & Political Insults
  "cuck", "simp", "incel", "beta", "soyboy", "snowflake", "chud", "libtard", "woke",
  "groomer", "pedo", "pedophile", "nazi", "commie", "fascist", "bootlicker",
  
  // Severe Vulgarity, Slurs, and Harassment missed by older dictionaries
  "thot", "hoe", "skank", "slut", "whore", "pussy", "dickhead", "shithead", "fucktard",
  "twat", "wanker", "cunt", "fag", "faggot", "tranny", "nigga", "nigger", "kike", 
  "spic", "chink", "gook", "wetback", "raghead", "towelhead", "unalive", "rape", "rapist",
  "kill yourself", "jerk", "loser", "shut up", "crap", "bs", "af", "asshole", "bitch"
];
profanityFilter.addWords(...modernSlang);

/**
 * Scans text for vulgarity and insults.
 */
export function checkProfanity(text: string): SafetyCheckResult {
  if (profanityFilter.isProfane(text)) {
    return { isSafe: false, redactedText: profanityFilter.clean(text) };
  }
  return { isSafe: true, redactedText: text };
}

/**
 * Scans text for sensitive information. Returns whether the text is safe and a redacted version.
 */
export function checkAndRedactSensitiveInfo(text: string): SafetyCheckResult {
  let isSafe = true;
  let redactedText = text;

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.regex.test(redactedText)) {
      isSafe = false;
      // Redact all occurrences of this pattern
      redactedText = redactedText.replace(pattern.regex, '[REDACTED INFORMATION]');
    }
    // Reset regex index if it's stateful
    pattern.regex.lastIndex = 0;
  }

  return { isSafe, redactedText };
}
