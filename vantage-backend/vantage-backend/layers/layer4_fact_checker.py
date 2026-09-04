import numpy as np


def validate_forecast(tournament_result: dict) -> dict:
    failed = []
    mapes = {k: v for k, v in tournament_result.get("model_mapes", {}).items() if np.isfinite(v)}
    winner = tournament_result.get("winner")
    if len(mapes) >= 2:
        ordered = sorted(mapes.values())
        if ordered[1] == 0 or (ordered[1] - ordered[0]) / max(ordered[1], 1e-9) < 0.10:
            failed.append("not decisive")
    low, high = tournament_result.get("historical_min", 0), tournament_result.get("historical_max", 0)
    span = max(abs(high - low), abs(high), abs(low), 1.0)
    for point in tournament_result.get("forecast", []):
        value = point["yhat"]
        if value < low - 3 * span or value > high + 3 * span:
            failed.append("sanity_bounds")
            break
    shifted = tournament_result.get("shifted_winner")
    if shifted is not None and winner != shifted:
        failed.append("stability")
    return {"validation_passed": not failed, "failed_checks": list(dict.fromkeys(failed))}
