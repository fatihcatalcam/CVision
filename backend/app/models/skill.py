"""
Skill model — master list of recognized skills.
Populated via seed data (skills_data.py).
Maps to FR11.
"""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "programming", "framework", "database", "tool", "soft_skill", "cloud", "other"

    # Relationships
    extracted_skills: Mapped[list["ExtractedSkill"]] = relationship(
        "ExtractedSkill", back_populates="skill"
    )

    def __repr__(self) -> str:
        return f"<Skill(id={self.id}, name='{self.name}', category='{self.category}')>"
