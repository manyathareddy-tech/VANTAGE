import re

_NUMBER_RE = re.compile(r"(?<![A-Za-z])[-+]?\d+(?:,\d{3})*(?:\.\d+)?%?")


def validate_suggestion_numbers(generated_text: str, allowed_numbers: list[float]) -> tuple[bool, list[float]]:
    allowed = [float(x) for x in allowed_numbers]
    mismatched = []
    for token in _NUMBER_RE.findall(generated_text or ""):
        value = float(token.replace(",", "").replace("%", ""))
        if not any(abs(value - candidate) <= max(abs(candidate) * 0.01, 0.01) for candidate in allowed):
            mismatched.append(value)
    return not mismatched, mismatched
