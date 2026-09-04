from config import CONFIDENCE_WEIGHTS


def calculate_confidence(precision: float, mape: float | None, model_agreement: float, interval_tightness: float) -> dict:
    scores = {
        "precision": max(0.0, min(100.0, float(precision))),
        "forecast_accuracy": max(0.0, min(100.0, 100.0 - float(mape or 100.0))),
        "agreement": max(0.0, min(100.0, float(model_agreement))),
        "tightness": max(0.0, min(100.0, float(interval_tightness))),
    }
    score = sum(scores[k] * CONFIDENCE_WEIGHTS[k] for k in scores)
    return {"score": round(score, 2), "breakdown": {k: round(v, 2) for k, v in scores.items()}}
