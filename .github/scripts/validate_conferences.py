#!/usr/bin/env python3
import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Path to the JSON configuration file
JSON_PATH = os.path.join(os.path.dirname(__file__), '../../data/conferences.json')

def validate_iso_date(date_str: str, field_name: str, conf_id: str) -> None:
    """Validates if a string is a strictly formatted ISO 8601 date."""
    try:
        # Replaces 'Z' with '+00:00' to allow strict parsing via standard library
        clean_str = date_str.replace('Z', '+00:00')
        datetime.fromisoformat(clean_str)
    except ValueError:
        print(f"::error::[{conf_id}] Invalid date format in '{field_name}': {date_str}. Expected ISO 8601 (e.g., YYYY-MM-DDTHH:MM:SSZ)")
        sys.exit(1)

def validate_conferences(data: Any) -> None:
    """Validates the structure and types of the conferences JSON array."""
    if not isinstance(data, list):
        print("::error::Root element of conferences.json must be a JSON array.")
        sys.exit(1)

    required_fields = {'id': str, 'year': int, 'title': str, 'url': str, 'deadline': str}
    optional_fields = {'description': str, 'cfpDeadline': str, 'theme': str, 'isSimple': bool}

    for index, conf in enumerate(data):
        if not isinstance(conf, dict):
            print(f"::error::Item at index {index} is not a valid JSON object.")
            sys.exit(1)
            
        conf_id = conf.get('id', f"Index-{index}")

        # Validate Required Fields & Types
        for field, expected_type in required_fields.items():
            if field not in conf:
                print(f"::error::[{conf_id}] Missing required field: '{field}'")
                sys.exit(1)
            if not isinstance(conf[field], expected_type):
                print(f"::error::[{conf_id}] Invalid type for '{field}'. Expected {expected_type.__name__}.")
                sys.exit(1)

        # Validate Optional Fields & Types
        for field, expected_type in optional_fields.items():
            if field in conf and not isinstance(conf[field], expected_type):
                print(f"::error::[{conf_id}] Invalid type for '{field}'. Expected {expected_type.__name__}.")
                sys.exit(1)

        # Validate Date Formats
        validate_iso_date(conf['deadline'], 'deadline', conf_id)
        if 'cfpDeadline' in conf:
            validate_iso_date(conf['cfpDeadline'], 'cfpDeadline', conf_id)

    print(f"Success: Validated {len(data)} conferences.")

def main():
    if not os.path.exists(JSON_PATH):
        print(f"::error::File not found at {JSON_PATH}")
        sys.exit(1)

    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"::error::Malformed JSON syntax in conferences.json: {e}")
        sys.exit(1)

    validate_conferences(data)
    sys.exit(0)

if __name__ == "__main__":
    main()