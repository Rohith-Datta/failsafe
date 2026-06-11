import joblib
import pandas as pd
import numpy as np

try:
    ai_package = joblib.load("failsafe_production_engine.pkl")
    model = ai_package["model"]
    explainer = ai_package["explainer"]
    features = ai_package["feature_names"]
except Exception as e:
    print("Warning: ML model not found.")
    model, explainer, features = None, None, []

INTERVENTION_MAP = {
    "absences": "Schedule a mandatory attendance review meeting.",
    "failures": "Enroll student in the peer-tutoring remedial program.",
    "studytime": "Provide the time-management and campus resources guide.",
    "goout": "Schedule a behavioral check-in regarding campus life balance.",
    "freetime": "Discuss extracurricular time management.",
    "Dalc": "Discreetly refer to the campus wellness and counseling center.",
    "Walc": "Discreetly refer to the campus wellness and counseling center.",
    "health": "Check in with the student regarding health accommodations."
}


def process_student(data: dict):
    """Process student data, predict risk, and generate interventions."""

    ml_input = {
        "absences": data["absences"],
        "failures": data["failures"],
        "studytime": data["study_time"],
        "freetime": data["freetime"],
        "goout": data["goout"],
        "Dalc": data["dalc"],
        "Walc": data["walc"],
        "health": data["health"],
        "higher_yes": 1 if data["higher"] else 0,
        "internet_yes": 1 if data["internet"] else 0,
        "romantic_yes": 1 if data["romantic"] else 0
    }

    df = pd.DataFrame([ml_input])[features]

    prob = float(model.predict_proba(df)[0][1]) * 100

    if prob < 40:
        status = "Low Risk"
    elif prob < 75:
        status = "Medium Risk"
    else:
        status = "High Risk"

    shap_values = explainer.shap_values(df)

    impacts = []
    for i, fname in enumerate(features):
        val = float(shap_values[0][i])
        if val > 0:
            impacts.append({"label": fname, "impact": val})

    impacts.sort(key=lambda x: x["impact"], reverse=True)
    top_3 = impacts[:3]

    actions = []
    for factor in top_3:
        feature_key = factor["label"]
        if feature_key in INTERVENTION_MAP:
            actions.append(INTERVENTION_MAP[feature_key])

    if not actions:
        actions.append("Schedule a general 1-on-1 academic check-in.")

    return {
        "student_id": data.get("student_id_code", "Unknown"),
        "risk_score": round(prob, 1),
        "risk_status": status,
        "top_factors": top_3,
        "recommended_actions": actions
    }
