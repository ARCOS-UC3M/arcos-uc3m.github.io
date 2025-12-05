#!/usr/bin/env python3
"""
Combine multiple .bib files from a directory into a single JSON file.

- Normalizes entries to a custom JSON schema.
- Detects duplicates (by normalized title + year).
- Outputs:
    publications.json  -> unique entries
    duplicates.json    -> groups of duplicate entries
"""

import os
import re
import json
import argparse
from typing import List, Dict, Any, Tuple

try:
    import bibtexparser
except ImportError:
    raise SystemExit("Please install bibtexparser first: pip install bibtexparser")


# ---------- Mapping helpers ----------

TYPE_MAP = {
    "inproceedings": ("conference", "Conf"),
    "conference": ("conference", "Conf"),
    "proceedings": ("conference", "Conf"),
    "article": ("journal", "Jour"),
    "journal": ("journal", "Jour"),
    "phdthesis": ("phdthesis", "PhD"),
    "mastersthesis": ("masterthesis", "MSc"),
    "incollection": ("bookchapter", "Ch"),
    "book": ("book", "Book"),
    "misc": ("other", "Other"),
}


LATEX_ACCENTS = {
    r"\'a": "á", r"\'e": "é", r"\'i": "í", r"\'o": "ó", r"\'u": "ú",
    r"\'A": "Á", r"\'E": "É", r"\'I": "Í", r"\'O": "Ó", r"\'U": "Ú",

    r"\`a": "à", r"\`e": "è", r"\`i": "ì", r"\`o": "ò", r"\`u": "ù",
    r"\`A": "À", r"\`E": "È", r"\`I": "Ì", r"\`O": "Ò", r"\`U": "Ù",

    r"\^a": "â", r"\^e": "ê", r"\^i": "î", r"\^o": "ô", r"\^u": "û",
    r"\^A": "Â", r"\^E": "Ê", r"\^I": "Î", r"\^O": "Ô", r"\^U": "Û",

    r"\"a": "ä", r"\"e": "ë", r"\"i": "ï", r"\"o": "ö", r"\"u": "ü",
    r"\"A": "Ä", r"\"E": "Ë", r"\"I": "Ï", r"\"O": "Ö", r"\"U": "Ü",

    r"\~n": "ñ", r"\~N": "Ñ",

    r"\c c": "ç", r"\c C": "Ç",
}

def latex_to_unicode(text: str) -> str:
    if not text:
        return text

    # Remove enclosing braces around accents: {\'a} → \'a
    text = re.sub(r"\{\\([\'`\^\"~]..?)\}", r"\\\1", text)
    text = re.sub(r"\{\\([c] [cC])\}", r"\\\1", text)

    # Apply replacements
    for latex, uni in LATEX_ACCENTS.items():
        text = text.replace(latex, uni)

    # Remove leftover braces
    text = text.replace("{", "").replace("}", "")
    text = text.replace("\\", "")  # remove any remaining backslashes
    return text


def map_entry_type(entry_type: str) -> Tuple[str, str]:
    """Map BibTeX entry type to (type, badge) for JSON."""
    et = (entry_type or "").lower()
    if et in TYPE_MAP:
        return TYPE_MAP[et]
    # Fallback: use raw type and a short badge
    fallback_type = et if et else "other"
    badge = fallback_type[:4].capitalize() if fallback_type else "Other"
    return fallback_type, badge


# ---------- String cleaning ----------

def clean_braces(text: str) -> str:
    if not text:
        return ""
    text = text.strip()
    if text.startswith("{") and text.endswith("}"):
        text = text[1:-1].strip()
    text = re.sub(r"\s+", " ", text)
    text = latex_to_unicode(text) 
    
    return text


# ---------- Author parsing ----------

def parse_authors(authors_field: str) -> Tuple[str, str]:
    """
    Parse BibTeX 'author' field into:
      - authorsDisplay: "Surname, F. M., Surname2, F., & Surname3, F."
      - authorsData: "Surname, Surname2, Surname3"
    """
    if not authors_field:
        return "", ""

    # Split authors by ' and ' respecting typical BibTeX format
    raw_authors = [a.strip() for a in authors_field.split(" and ") if a.strip()]
    display_names = []
    surnames = []

    for author in raw_authors:
        # Formats:
        #  - "Last, First Middle"
        #  - "First Middle Last"
        if "," in author:
            last, firsts = [p.strip() for p in author.split(",", 1)]
        else:
            parts = author.split()
            if len(parts) == 1:
                last = parts[0]
                firsts = ""
            else:
                last = parts[-1]
                firsts = " ".join(parts[:-1])

        # Build initials: "First Middle" -> "F. M."
        initials = ""
        if firsts:
            tokens = [t for t in firsts.split() if t]
            initials = " ".join(f"{t[0]}." for t in tokens if t)

        if initials:
            display = f"{last}, {initials}"
        else:
            display = last

        display_names.append(display)
        surnames.append(last)

    # Build authorsDisplay with commas and final '&'
    if len(display_names) == 0:
        authors_display = ""
    elif len(display_names) == 1:
        authors_display = display_names[0]
    elif len(display_names) == 2:
        authors_display = f"{display_names[0]} & {display_names[1]}"
    else:
        authors_display = ", ".join(display_names[:-1]) + f", & {display_names[-1]}"

    authors_data = ", ".join(surnames)
    return authors_display, authors_data


# ---------- Venue construction ----------

def build_venue(entry: Dict[str, Any]) -> str:
    """
    Build a textual 'venue' description from typical BibTeX fields.
    Best effort: uses booktitle/journal/etc. + pages, volume, etc.
    """
    fields = entry

    venue_main = (
        fields.get("booktitle")
        or fields.get("journal")
        or fields.get("school")
        or fields.get("institution")
        or fields.get("howpublished")
        or ""
    )
    venue_main = latex_to_unicode(clean_braces(venue_main))


    pieces = []

    if venue_main:
        pieces.append(venue_main)

    # Volume / number
    vol = fields.get("volume")
    num = fields.get("number")
    if vol and num:
        pieces.append(f"vol. {vol}({num})")
    elif vol:
        pieces.append(f"vol. {vol}")
    elif num:
        pieces.append(f"no. {num}")

    # Pages
    pages = fields.get("pages")
    if pages:
        # Normalize "--" for ranges
        pages = pages.replace("--", "–")  # en dash visually nicer, optional
        pieces.append(f"pp. {pages}")

    # Publisher or organization (optional)
    publisher = fields.get("publisher") or fields.get("organization")
    if publisher:
        pieces.append(clean_braces(latex_to_unicode(publisher)))


    # Join with comma and add trailing dot
    if not pieces:
        return ""
    txt = ", ".join(pieces)
    if not txt.endswith("."):
        txt += "."
    return txt


# ---------- Normalization to target JSON schema ----------

def normalize_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a BibTeX entry to the target JSON format:

    {
        "year": 2025,
        "type": "conference",
        "badge": "Conf",
        "title": "...",
        "authorsDisplay": "...",
        "authorsData": "...",
        "venue": "..."
    }
    """
    entry_type = entry.get("ENTRYTYPE", "")
    mapped_type, badge = map_entry_type(entry_type)

    # Year
    year_raw = (entry.get("year") or "").strip()
    try:
        year = int(re.findall(r"\d{4}", year_raw)[0]) if year_raw else None
    except (IndexError, ValueError):
        year = None

    title = clean_braces(entry.get("title", ""))
    authors_display, authors_data = parse_authors(
        latex_to_unicode(entry.get("author", ""))
    )
    venue = build_venue(entry)

    return {
        "year": year,
        "type": mapped_type,
        "badge": badge,
        "title": title,
        "authorsDisplay": authors_display,
        "authorsData": authors_data,
        "venue": venue,
    }


# ---------- Duplicate detection ----------

def make_duplicate_key(entry_json: Dict[str, Any]) -> str:
    """
    Create a key for detecting duplicates:
      (normalized title + year)
    """
    title = entry_json.get("title") or ""
    year = entry_json.get("year") or ""
    # Normalize title: lowercase, remove non-alphanumerics
    norm_title = re.sub(r"[^a-z0-9]+", "", title.lower())
    return f"{norm_title}_{year}"


# ---------- Main processing ----------

def read_bib_file(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        bib_database = bibtexparser.load(f)
    return bib_database.entries


def collect_entries_from_dir(directory: str) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    for fname in os.listdir(directory):
        if not fname.lower().endswith(".bib"):
            continue
        full_path = os.path.join(directory, fname)
        if not os.path.isfile(full_path):
            continue
        print(f"Reading {full_path}")
        try:
            file_entries = read_bib_file(full_path)
            entries.extend(file_entries)
        except Exception as e:
            print(f"  ! Error reading {full_path}: {e}")
    return entries


def main():
    parser = argparse.ArgumentParser(
        description="Merge .bib files in a directory into a single JSON list with duplicate detection."
    )
    parser.add_argument(
        "directory",
        help="Directory containing .bib files",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="publications.json",
        help="Output JSON file for unique entries (default: publications.json)",
    )
    parser.add_argument(
        "-d",
        "--duplicates",
        default="duplicates.json",
        help="Output JSON file listing duplicate groups (default: duplicates.json)",
    )

    args = parser.parse_args()
    directory = args.directory

    if not os.path.isdir(directory):
        raise SystemExit(f"Error: '{directory}' is not a directory")

    raw_entries = collect_entries_from_dir(directory)
    print(f"Total raw BibTeX entries: {len(raw_entries)}")

    norm_entries: List[Dict[str, Any]] = []
    dup_groups: Dict[str, List[Dict[str, Any]]] = {}
    seen: Dict[str, Dict[str, Any]] = {}

    for e in raw_entries:
        j = normalize_entry(e)
        key = make_duplicate_key(j)

        if key in seen:
            # First time we see a duplicate for this key: add both original and new
            if key not in dup_groups:
                dup_groups[key] = [seen[key]]
            dup_groups[key].append(j)
        else:
            seen[key] = j
            norm_entries.append(j)

    # Save unique entries
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(norm_entries, f, indent=2, ensure_ascii=False)

    # Save duplicates as a list of groups
    duplicate_groups_list = list(dup_groups.values())
    with open(args.duplicates, "w", encoding="utf-8") as f:
        json.dump(duplicate_groups_list, f, indent=2, ensure_ascii=False)

    print(f"Unique entries written to: {args.output}")
    print(f"Duplicate groups written to: {args.duplicates}")
    print(f"Unique entries: {len(norm_entries)}")
    print(f"Number of duplicate groups: {len(duplicate_groups_list)}")


if __name__ == "__main__":
    main()
