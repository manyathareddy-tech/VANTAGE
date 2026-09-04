from datetime import timedelta
import warnings
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from database import Transaction

warnings.filterwarnings("ignore")


def _mape(actual, predicted):
    a, p = np.asarray(actual, dtype=float), np.asarray(predicted, dtype=float)
    denom = np.maximum(np.abs(a), 1e-6)
    return float(np.mean(np.abs((a - p) / denom)) * 100)


def _series(business_id, sku_id, db):
    txs = db.query(Transaction).filter_by(business_id=business_id).order_by(Transaction.date).all()
    if sku_id is not None:
        txs = [t for t in txs if t.sku_id == sku_id and t.type == "revenue"]
    if not txs:
        return pd.Series(dtype=float)
    dates = pd.date_range(min(t.date for t in txs), max(t.date for t in txs), freq="D")
    vals = {}
    for t in txs:
        vals[t.date] = vals.get(t.date, 0.0) + (t.amount if sku_id is None and t.type == "revenue" else (-t.amount if sku_id is None else 1.0)) if sku_id is not None or t.type in {"revenue", "expense"} else 0
    if sku_id is None:
        vals = {t.date: vals.get(t.date, 0.0) + (t.amount if t.type == "revenue" else -t.amount) for t in txs}
    return pd.Series([vals.get(d.date(), 0.0) for d in dates], index=dates, dtype=float)


def _predict(name, train, horizon):
    n = len(train)
    x = np.arange(n).reshape(-1, 1)
    future = np.arange(n, n + horizon).reshape(-1, 1)
    if name == "LinearRegression":
        model = LinearRegression().fit(x, train.values)
        return model.predict(future)
    if name == "Holt-Winters":
        model = ExponentialSmoothing(train.values, trend="add", damped_trend=True, initialization_method="estimated").fit(optimized=True)
        return np.asarray(model.forecast(horizon))
    try:
        from prophet import Prophet
        frame = pd.DataFrame({"ds": train.index, "y": train.values})
        model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
        model.fit(frame)
        fc = model.predict(pd.DataFrame({"ds": pd.date_range(train.index[-1] + timedelta(days=1), periods=horizon)}))
        return fc["yhat"].to_numpy()
    except Exception:
        model = LinearRegression().fit(x, train.values)
        return model.predict(future)


def run_forecast(business_id: int, sku_id: int | None, periods: int, db: Session) -> dict:
    series = _series(business_id, sku_id, db)
    periods = max(1, min(int(periods), 365))
    if len(series) < 14:
        avg = float(series.mean()) if len(series) else 0.0
        future_dates = pd.date_range((series.index[-1] if len(series) else pd.Timestamp.today()) + timedelta(days=1), periods=periods)
        forecast = [{"date": d.date().isoformat(), "yhat": avg, "yhat_lower": avg * 0.7, "yhat_upper": avg * 1.3} for d in future_dates]
        return {"historical": [{"date": d.date().isoformat(), "value": float(v)} for d, v in series.items()], "forecast": forecast, "model_used": "flat-average-baseline", "mape": None, "model_mapes": {}, "winner": "flat-average-baseline", "is_cold_start": True, "historical_min": float(series.min()) if len(series) else 0.0, "historical_max": float(series.max()) if len(series) else 0.0}
    split = max(7, int(len(series) * 0.8))
    train, test = series.iloc[:split], series.iloc[split:]
    mapes = {}
    for name in ["Prophet", "LinearRegression", "Holt-Winters"]:
        try:
            mapes[name] = _mape(test.values, _predict(name, train, len(test)))
        except Exception:
            mapes[name] = float("inf")
    winner = min(mapes, key=mapes.get)
    values = _predict(winner, series, periods)
    spread = max(float(series.std() or 0), abs(float(series.mean())) * 0.1, 1.0)
    dates = pd.date_range(series.index[-1] + timedelta(days=1), periods=periods)
    forecast = [{"date": d.date().isoformat(), "yhat": max(0.0, float(v)), "yhat_lower": max(0.0, float(v - spread)), "yhat_upper": max(0.0, float(v + spread))} for d, v in zip(dates, values)]
    return {"historical": [{"date": d.date().isoformat(), "value": float(v)} for d, v in series.items()], "forecast": forecast, "model_used": winner, "mape": mapes[winner], "model_mapes": mapes, "winner": winner, "is_cold_start": False, "historical_min": float(series.min()), "historical_max": float(series.max())}
