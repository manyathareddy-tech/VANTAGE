# VANTAGE — Cash Flow That Explains Itself
**A cash crisis doesn't start on the day the bank balance hits zero — it starts weeks earlier, in a pattern nobody was watching. VANTAGE watches it.**

---

## The problem

Every small business owner checks their bank balance. Almost none of them can see it coming. Inventory sits in a register, spending sits in a bank statement, and revenue trends sit in nobody's head but the owner's — three data streams that never talk to each other, so a cash shortfall shows up only after it's already happened. Existing tools don't fix this: cash-runway calculators are built for VC-funded startups counting down to their next raise, and inventory forecasting tools are built for Shopify-style e-commerce brands. Neither serves the millions of bootstrapped MSMEs and self-funded startups who have no finance team and no single view of what's coming.

## What VANTAGE does

VANTAGE reads three things about a business continuously — **cash position** (what's coming in and going out), **inventory behavior** (what's selling, what's dying on the shelf), and **burn trajectory** (is the gap between spend and revenue widening) — and runs them through a validated forecasting pipeline instead of a single black-box model. A tournament of independent forecasters (Prophet, Linear Regression, Exponential Smoothing) competes on each business's own backtested accuracy, a fact-checking layer rejects any forecast that fails sanity or stability checks, and only then does an LLM turn the validated numbers into one plain sentence — never inventing a figure it wasn't given.

Every prediction carries a transparent **Confidence Score**, broken into the four signals that built it, so nothing is ever shown as more certain than the data actually supports. Every suggestion — reorder this SKU, expect a shortfall by this date — requires the owner to tap Approve before anything is logged as accepted. No autonomous action, no silent black box, no confident-sounding number with no math behind it.

**Note — this is a hackathon prototype.** Live bank/UPI and GSTN integration are not connected; the pipeline runs on uploaded CSV data or bundled demo data instead. The forecasting, validation, and confidence-scoring logic itself is real and runs live on whatever data is given to it — only the live banking connection is simulated for this demo.
