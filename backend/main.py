import json
from datetime import datetime, timedelta
from typing import Optional

import jwt
from ml_engine import process_student
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Failsafe API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "failsafe_super_secret_key_2026"
ALGORITHM = "HS256"


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Authorization header missing or invalid")

    token = authorization.replace("Bearer ", "", 1)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(models.User).filter(
        models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def format_for_react(assessment):
    status = assessment.risk_status.lower()
    level = "high" if "high" in status else "medium" if "medium" in status else "low"

    actions_data = json.loads(assessment.recommended_actions)
    interventions = [
        {"title": act, "description": "AI recommended intervention."} for act in actions_data]

    factors = json.loads(assessment.top_factors)
    top_factors = []
    for f in factors:
        impact = float(f.get("impact", f.get("delta", 0)))
        level_code = "HIGH" if impact > 0.15 else "MEDIUM" if impact > 0.05 else "LOW"
        top_factors.append({
            "label": f.get("label", "Unknown factor"),
            "description": f.get("description", "Contributing factor identified by the ML model."),
            "level": f.get("level", level_code),
            "delta": f.get("delta", round(impact * 100, 1)),
        })

    return {
        "id": str(assessment.id),
        "student_id_code": assessment.student_id_code,
        "risk_score": assessment.risk_score,
        "risk_level": level,
        "top_factors": top_factors,
        "interventions": interventions,
        "action_completed": assessment.action_completed,
        "created_at": datetime.now().isoformat()
    }


@app.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = pwd_context.hash(user.password)
    new_user = models.User(full_name=user.full_name, email=user.email,
                           department=user.department, role=user.role, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success"}


@app.post("/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        models.User.email == user.email).first()
    if not existing or not pwd_context.verify(user.password, existing.hashed_password):
        raise HTTPException(
            status_code=401, detail="Invalid email or password")

    access_token = create_access_token(
        data={"sub": existing.email, "role": existing.role})
    return {"access_token": access_token, "user": {"id": existing.id, "full_name": existing.full_name, "role": existing.role, "department": existing.department}}


@app.post("/predict")
def predict_student_risk(
    student: schemas.StudentData,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    results = process_student(student.dict())

    new_assessment = models.Assessment(
        student_id_code=results.get("student_id", "Unknown"),
        risk_score=results["risk_score"],
        risk_status=results["risk_status"],
        top_factors=json.dumps(results["top_factors"]),
        recommended_actions=json.dumps(results["recommended_actions"]),
        action_completed=False,
        professor_id=current_user.id,
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    return format_for_react(new_assessment)


@app.get("/assessments")
def get_assessments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    assessments = db.query(models.Assessment).filter(
        models.Assessment.professor_id == current_user.id
    ).all()
    return [format_for_react(a) for a in assessments]


@app.get("/assessments/{id}")
def get_single_assessment(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if id == "undefined":
        raise HTTPException(status_code=400, detail="Invalid ID")

    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == int(id),
        models.Assessment.professor_id == current_user.id,
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return format_for_react(assessment)


@app.put("/assessments/{id}/complete")
def complete_assessment(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == int(id),
        models.Assessment.professor_id == current_user.id,
    ).first()
    if assessment:
        assessment.action_completed = not assessment.action_completed
        db.commit()
    return {"status": "success"}


@app.delete("/assessments/{id}")
def delete_assessment(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == int(id),
        models.Assessment.professor_id == current_user.id,
    ).first()
    if assessment:
        db.delete(assessment)
        db.commit()
    return {"status": "deleted"}


@app.get("/dept/professors")
def list_dept_professors(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "hod":
        raise HTTPException(
            status_code=403, detail="Only HODs can access this endpoint")

    professors = db.query(models.User).filter(
        models.User.department == current_user.department,
        models.User.role == "professor",
    ).all()
    return [
        {
            "id": prof.id,
            "full_name": prof.full_name,
            "email": prof.email,
            "department": prof.department,
            "role": prof.role,
        }
        for prof in professors
    ]


@app.get("/professors/{professor_id}/analytics")
def get_professor_analytics(
    professor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "hod":
        raise HTTPException(
            status_code=403, detail="Only HODs can access this endpoint")

    professor = db.query(models.User).filter(
        models.User.id == professor_id,
        models.User.role == "professor",
    ).first()
    if not professor or professor.department != current_user.department:
        raise HTTPException(status_code=404, detail="Professor not found")

    assessments = db.query(models.Assessment).filter(
        models.Assessment.professor_id == professor_id
    ).all()

    low = 0
    medium = 0
    high = 0
    completed = 0

    for assessment in assessments:
        status = assessment.risk_status.lower()
        if "high" in status:
            high += 1
        elif "medium" in status:
            medium += 1
        else:
            low += 1
        if assessment.action_completed:
            completed += 1

    return {
        "total": len(assessments),
        "completed": completed,
        "low": low,
        "medium": medium,
        "high": high,
    }
