import json
from config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL
from database import Suggestion, Transaction
from sqlalchemy.orm import Session


def _complete(prompt: str) -> str:
    """Call Claude API and return the response text."""
    if not ANTHROPIC_API_KEY:
        return ""
    from anthropic import Anthropic
    response = Anthropic(api_key=ANTHROPIC_API_KEY).messages.create(
        model=ANTHROPIC_MODEL, 
        max_tokens=180, 
        temperature=0, 
        messages=[{"role": "user", "content": prompt}]
    )
    return "".join(getattr(block, "text", "") for block in response.content).strip()


def generate_suggestion(category: str, data_dict: dict) -> str:
    """Generate a plain-English suggestion for a category using Claude."""
    prompt = f"Write exactly one plain-English sentence for a small-business owner about {category}. State ONLY numbers present in this JSON; do not invent or calculate any other numbers. JSON: {json.dumps(data_dict, default=str)}"
    return _complete(prompt)


def generate_forecast_explanation(forecast_result: dict) -> str:
    """Generate a plain-English explanation of a forecast using Claude."""
    prompt = f"Write exactly one plain-English sentence explaining this forecast. State ONLY numbers present in this JSON; do not invent numbers. JSON: {json.dumps(forecast_result, default=str)}"
    return _complete(prompt)


def generate_and_save_suggestions(business_id: int, db: Session) -> list:
    """
    Generate AI suggestions for each transaction category and save them to the database.
    
    Args:
        business_id: The business ID to generate suggestions for
        db: SQLAlchemy database session
    
    Returns:
        List of created Suggestion objects
    """
    # Fetch all transactions for this business
    txs = db.query(Transaction).filter_by(business_id=business_id).all()
    
    if not txs:
        return []

    # Aggregate transactions by category
    by_category = {}
    for t in txs:
        by_category.setdefault(t.category, {"total": 0.0, "count": 0})
        by_category[t.category]["total"] += t.amount
        by_category[t.category]["count"] += 1

    created = []
    for category, data in by_category.items():
        # Skip categories with too few transactions for meaningful suggestions
        if data["count"] < 3:
            continue

        # Try to get an AI-generated suggestion
        text = generate_suggestion(category, data)
        
        # Fallback if AI fails or returns empty
        if not text:
            text = f"{category.replace('_', ' ').title()} totals ₹{data['total']:.2f} across {data['count']} transactions."

        # Create the suggestion record
        sug = Suggestion(
            business_id=business_id,
            category=category,
            text=text,
            confidence_badge="medium",
            referenced_numbers_json=json.dumps([round(data["total"], 2)]),
        )
        db.add(sug)
        created.append(sug)

    db.commit()
    return created