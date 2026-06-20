from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig
from detect_secrets import SecretsCollection
from detect_secrets.settings import default_settings
import tempfile
import os

from presidio_analyzer.nlp_engine import NlpEngineProvider

app = FastAPI(title="Safety Scanner API")

# Initialize Presidio Analyzer and Anonymizer
try:
    # Force Presidio to use the lightweight en_core_web_sm model instead of defaulting to the massive en_core_web_lg model
    configuration = {
        "nlp_engine_name": "spacy",
        "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}]
    }
    provider = NlpEngineProvider(nlp_configuration=configuration)
    nlp_engine = provider.create_engine()
    
    analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
    anonymizer = AnonymizerEngine()
except Exception as e:
    print(f"Failed to initialize Presidio. Ensure the model is downloaded: python -m spacy download en_core_web_sm")
    analyzer = None
    anonymizer = None

class ScanRequest(BaseModel):
    text: str

class ScanResponse(BaseModel):
    allowed: bool
    redactedText: str
    detectedTypes: list[str]
    message: str

@app.post("/scan", response_model=ScanResponse)
def scan_text(request: ScanRequest):
    text = request.text
    allowed = True
    detected_types = []
    message = "Message is safe."

    # 1. Presidio PII Detection
    if analyzer and anonymizer:
        # Explicitly define which entities to scan for.
        # We purposely omit PERSON, LOCATION, GPE, ORG, NRP, and DATE_TIME so they are allowed.
        target_entities = [
            "CREDIT_CARD", "CRYPTO", "EMAIL_ADDRESS", "IBAN_CODE",
            "IP_ADDRESS", "PHONE_NUMBER", "US_BANK_NUMBER", 
            "US_DRIVER_LICENSE", "US_ITIN", "US_PASSPORT", "US_SSN", "UK_NHS"
        ]
        results = analyzer.analyze(text=text, entities=target_entities, language='en')
        if len(results) > 0:
            allowed = False
            for r in results:
                if r.entity_type not in detected_types:
                    detected_types.append(r.entity_type)
            
            operators = {"DEFAULT": OperatorConfig("replace", {"new_value": "[REDACTED MESSAGE]"})}
            anonymized_result = anonymizer.anonymize(text=text, analyzer_results=results, operators=operators)
            text = anonymized_result.text

    # 2. detect-secrets for API keys and credentials
    try:
        with tempfile.NamedTemporaryFile(delete=False, mode='w', suffix='.txt', encoding='utf-8') as temp_file:
            temp_file.write(text)
            temp_file_path = temp_file.name

        secrets = SecretsCollection()
        with default_settings():
            secrets.scan_file(temp_file_path)

        os.remove(temp_file_path)

        file_secrets = secrets.json()
        if temp_file_path in file_secrets and len(file_secrets[temp_file_path]) > 0:
            allowed = False
            detected_types.append("SECRET_KEY")
            text = "[REDACTED MESSAGE]"

    except Exception as e:
        print(f"Detect-secrets error: {e}")

    if not allowed:
        message = "Sensitive information detected. Request blocked."

    return ScanResponse(
        allowed=allowed,
        redactedText=text,
        detectedTypes=detected_types,
        message=message
    )

@app.get("/health")
def health_check():
    return {"status": "ok"}
