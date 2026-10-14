#!/usr/bin/env python3
"""Validates a configs/*.json file before it can reach any app.

Catches two things a compromised or mistaken commit could do:
  1. Point app_urls.* (opened in an in-app WebView with JavaScript on) at
     anything other than a plain https URL — http, javascript:, a local
     file, etc.
  2. Swap an AdMob ad unit ID for one that doesn't belong to this file's
     own AdMob account — the clearest sign of ad revenue being redirected
     elsewhere. Checked by requiring every ad unit id under
     ads_config.network_keys.admob.<platform>.* to share the same
     "ca-app-pub-<publisher id>" prefix as that platform's own app_id in
     the same file — no per-app allowlist to maintain, and it covers any
     app this repo serves, not just a hardcoded list.

Google's own AdMob test publisher (3940256099942544, documented at
https://developers.google.com/admob/android/test-ads) is always allowed
alongside the file's real publisher id, since test ad units are a normal,
intentional thing for a file to ship.

Usage: validate_config.py <file.json> [<file2.json> ...]
Exits non-zero (and prints every problem found) if any file fails.
"""
import json
import re
import sys
from urllib.parse import urlparse

GOOGLE_TEST_PUBLISHER = "3940256099942544"
AD_UNIT_RE = re.compile(r"^ca-app-pub-(\d+)/\d{9,10}$")
APP_ID_RE = re.compile(r"^ca-app-pub-(\d+)~\d+$")

# Keys (wherever they appear in the tree) whose string value must be a
# plain https URL. Covers every *_url / *_policy / *_service key across
# the files this repo currently serves (app_urls.privacy_policy,
# .terms_of_service, .share_app_android/ios, update_config.store_url_*).
URL_KEY_RE = re.compile(r"(_url|_policy|_service)$", re.IGNORECASE)


def require_https(value, path, errors):
    if not isinstance(value, str) or not value:
        return
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc:
        errors.append(f"{path}: {value!r} is not a plain https URL")


def walk_urls(node, path, errors):
    if isinstance(node, dict):
        for key, value in node.items():
            child_path = f"{path}.{key}" if path else key
            if URL_KEY_RE.search(key) and isinstance(value, str):
                require_https(value, child_path, errors)
            else:
                walk_urls(value, child_path, errors)
    elif isinstance(node, list):
        for i, item in enumerate(node):
            walk_urls(item, f"{path}[{i}]", errors)


def check_admob_platform(platform_cfg, path, errors):
    app_id = platform_cfg.get("app_id")
    if not isinstance(app_id, str):
        return
    m = APP_ID_RE.match(app_id)
    if not m:
        errors.append(f"{path}.app_id: {app_id!r} doesn't look like an AdMob App ID")
        return
    owner_publisher = m.group(1)
    allowed = {owner_publisher, GOOGLE_TEST_PUBLISHER}
    for key, value in platform_cfg.items():
        if key == "app_id" or not isinstance(value, str):
            continue
        unit_match = AD_UNIT_RE.match(value)
        if not unit_match:
            errors.append(f"{path}.{key}: {value!r} doesn't look like an AdMob ad unit id")
            continue
        if unit_match.group(1) not in allowed:
            errors.append(
                f"{path}.{key}: ad unit {value!r} belongs to publisher "
                f"{unit_match.group(1)}, not this file's own {owner_publisher} "
                f"(or Google's test publisher {GOOGLE_TEST_PUBLISHER})"
            )


def check_admob(doc, errors):
    admob = doc.get("ads_config", {}).get("network_keys", {}).get("admob", {})
    if not isinstance(admob, dict):
        return
    for platform in ("android", "ios"):
        platform_cfg = admob.get(platform)
        if isinstance(platform_cfg, dict):
            check_admob_platform(platform_cfg, f"ads_config.network_keys.admob.{platform}", errors)


def validate_file(path):
    errors = []
    try:
        with open(path, encoding="utf-8") as f:
            raw = f.read()
    except OSError as e:
        return [f"{path}: couldn't read file ({e})"]
    try:
        doc = json.loads(raw)
    except json.JSONDecodeError as e:
        return [f"{path}: invalid JSON ({e})"]
    if not isinstance(doc, dict):
        return [f"{path}: expected a JSON object at the top level"]
    walk_urls(doc, "", errors)
    check_admob(doc, errors)
    return [f"{path}: {e}" for e in errors]


def main(argv):
    if len(argv) < 2:
        print("usage: validate_config.py <file.json> [<file2.json> ...]", file=sys.stderr)
        return 2
    all_errors = []
    for path in argv[1:]:
        all_errors.extend(validate_file(path))
    if all_errors:
        print(f"{len(all_errors)} problem(s) found:\n")
        for e in all_errors:
            print(f"  - {e}")
        return 1
    print(f"OK: {len(argv) - 1} file(s) validated clean")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
