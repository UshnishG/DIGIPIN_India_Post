from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum
from datetime import datetime

Base = declarative_base()

# -------------------------------------------
# Enums for Verification & Quality
# -------------------------------------------
class VerificationStatus(enum.Enum):
    UNVERIFIED = "unverified"
    SELF_DECLARED = "self_declared"  # Confidence Score: 10-30
    PEER_VERIFIED = "peer_verified"  # Confidence Score: 40-60
    AGENCY_VERIFIED = "agency_verified" # Confidence Score: 100 (AAVA)

# -------------------------------------------
# 1. Users (The Identity Layer)
# -------------------------------------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String) # For Partners, this is their Service Name (e.g. "Amazon")
    hashed_password = Column(String)
    
    # CRITICAL UPDATE: Added 'role' to distinguish between Residents and Partners
    role = Column(String, default="resident") # 'resident' or 'partner'
    
    addresses = relationship("DigitalAddress", back_populates="owner")

# -------------------------------------------
# 2. Digital Address Layer
# -------------------------------------------
class DigitalAddress(Base):
    __tablename__ = "digital_addresses"

    id = Column(Integer, primary_key=True, index=True)
    # The "username@suffix" (e.g., ravi@home)
    alias = Column(String, unique=True, index=True) 
    
    # The Core DIGIPIN Data
    digipin = Column(String, index=True)
    lat = Column(Float)
    lon = Column(Float)
    raw_address_text = Column(String) # Encrypted in real prod

    # Verification Protocols
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.UNVERIFIED)
    confidence_score = Column(Integer, default=0) # 0 to 100
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="addresses")
    consents = relationship("Consent", back_populates="address")

# -------------------------------------------
# 3. Consent Layer
# -------------------------------------------
class Consent(Base):
    __tablename__ = "consents"

    id = Column(Integer, primary_key=True, index=True)
    address_id = Column(Integer, ForeignKey("digital_addresses.id"))
    
    # This matches User.full_name of the Partner (e.g., "Amazon")
    requesting_entity = Column(String) 
    
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)
    
    # Granular Control: What can they see?
    share_lat_lon = Column(Boolean, default=True)
    share_raw_address = Column(Boolean, default=True)

    address = relationship("DigitalAddress", back_populates="consents")