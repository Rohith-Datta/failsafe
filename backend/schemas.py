from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    department: str
    role: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    department: str
    role: str

    class Config:
        from_attributes = True


class StudentData(BaseModel):
    student_id_code: str = "Unknown"
    absences: int
    failures: int
    study_time: int
    freetime: int
    goout: int
    dalc: int
    walc: int
    health: int
    higher: bool
    internet: bool
    romantic: bool


class AssessmentResponse(BaseModel):
    id: str
    student_id_code: str
    risk_score: float
    risk_level: str
    top_factors: list[dict]
    interventions: list[dict]
    action_completed: bool
    created_at: str
