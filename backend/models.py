from sqlalchemy import Float, Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    department = Column(String)
    role = Column(String)  # "professor" or "hod"
    hashed_password = Column(String)

    assessments = relationship(
        "Assessment",
        back_populates="professor",
        cascade="all, delete-orphan",
    )


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    student_id_code = Column(String, index=True)
    risk_score = Column(Float)
    risk_status = Column(String)
    top_factors = Column(String)
    recommended_actions = Column(String)
    action_completed = Column(Boolean, default=False)
    professor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    professor = relationship("User", back_populates="assessments")
