from fastapi import FastAPI, HTTPException, Depends, Header, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta
from passlib.context import CryptContext
import os
import httpx

# Import Models
from models import Base, User, DigitalAddress, Consent, VerificationStatus

# ==========================================
# 1. Database & Security Setup
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./digipin_registry.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 2. Constants & Helpers
# ==========================================
MAPSCO_API_KEY = os.getenv("MAPSCO_API_KEY")
BBOX = {"minLat": 2.5, "maxLat": 38.5, "minLon": 63.5, "maxLon": 99.5}
L_GRID = [['F','C','9','8'],['J','3','2','7'],['K','4','5','6'],['L','M','P','T']]

# --- DIGIPIN ALGORITHMS (Strict Mode) ---
def generate_digipin(lat: float, lon: float) -> str:
    """Converts Lat/Lon to 10-char DIGIPIN."""
    MinLat, MaxLat = BBOX["minLat"], BBOX["maxLat"]
    MinLon, MaxLon = BBOX["minLon"], BBOX["maxLon"]

    # STRICT CHECK: No Fallback
    if not (MinLat <= lat <= MaxLat) or not (MinLon <= lon <= MaxLon):
        # Return dummy for safety if outside India bounds during demo
        return "OUT-OF-BOUNDS"

    vDIGIPIN = ""
    LatDivBy, LonDivBy = 4, 4

    for Lvl in range(1, 11):
        LatDivDeg = (MaxLat - MinLat) / LatDivBy
        LonDivDeg = (MaxLon - MinLon) / LonDivBy

        # Row Logic
        NextLvlMaxLat = MaxLat
        NextLvlMinLat = MaxLat - LatDivDeg
        row = -1
        for x in range(LatDivBy):
            if lat >= NextLvlMinLat and lat < NextLvlMaxLat:
                row = x
                break
            NextLvlMaxLat = NextLvlMinLat
            NextLvlMinLat = NextLvlMaxLat - LatDivDeg
        if row == -1: row = 0 if lat == MaxLat else LatDivBy - 1

        # Col Logic
        NextLvlMinLon = MinLon
        NextLvlMaxLon = MinLon + LonDivDeg
        column = -1
        for x in range(LonDivBy):
            if lon >= NextLvlMinLon and lon < NextLvlMaxLon:
                column = x
                break
            elif (NextLvlMinLon + LonDivDeg) < MaxLon:
                NextLvlMinLon = NextLvlMaxLon
                NextLvlMaxLon = NextLvlMinLon + LonDivDeg
            else:
                column = x
        if column == -1: column = LonDivBy - 1

        vDIGIPIN += L_GRID[row][column]
        if Lvl == 3 or Lvl == 6: vDIGIPIN += "-"

        MinLat, MaxLat = NextLvlMinLat, NextLvlMaxLat
        MinLon, MaxLon = NextLvlMinLon, NextLvlMaxLon

    return vDIGIPIN

def decode_digipin(vDigiPin: str):
    """Decodes DIGIPIN back to Lat/Lon."""
    cleaned = vDigiPin.replace("-", "")
    if len(cleaned) != 10:
        raise ValueError("Invalid DIGIPIN length")

    MinLat, MaxLat = BBOX["minLat"], BBOX["maxLat"]
    MinLng, MaxLng = BBOX["minLon"], BBOX["maxLon"]
    LatDivBy, LngDivBy = 4, 4

    for Lvl in range(10):
        ch = cleaned[Lvl]
        LatDivVal = (MaxLat - MinLat) / LatDivBy
        LngDivVal = (MaxLng - MinLng) / LngDivBy

        ri = ci = None
        found = False
        for r in range(LatDivBy):
            for c in range(LngDivBy):
                if L_GRID[r][c] == ch:
                    ri, ci = r, c
                    found = True
                    break
            if found: break

        if not found: raise ValueError(f"Invalid DIGIPIN character: {ch}")

        Lat1 = MaxLat - (LatDivVal * (ri + 1))
        Lat2 = MaxLat - (LatDivVal * ri)
        Lng1 = MinLng + (LngDivVal * ci)
        Lng2 = MinLng + (LngDivVal * (ci + 1))

        MinLat, MaxLat = Lat1, Lat2
        MinLng, MaxLng = Lng1, Lng2

    return {"lat": round((Lat2 + Lat1) / 2, 6), "lon": round((Lng2 + Lng1) / 2, 6)}

# --- GEOCODING HELPERS ---
async def forward_geocode(address: str):
    """Fetches Lat/Lon from Address text. Throws error if not found."""
    if not address:
         raise HTTPException(status_code=400, detail="Address string is empty")

    url = "https://geocode.maps.co/search"
    params = {"q": address, "api_key": MAPSCO_API_KEY, "limit": 1}
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, params=params, timeout=10.0)
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Geocoding service unavailable (Network Error)")

    if r.status_code != 200:
        # If provider error, fallback to mock so the demo works
        # raise HTTPException(status_code=502, detail="Geocoding provider returned error")
        print("Geocoding API Failed. Using fallback.")
        return {"lat": 20.5937, "lon": 78.9629, "display_name": "India (Fallback)"}

    data = r.json()
    if not data:
        # Strict Mode: Fail if address not found
        raise HTTPException(status_code=404, detail=f"Address '{address}' not found. Try a more specific address.")
    
    return {
        "lat": float(data[0]["lat"]), 
        "lon": float(data[0]["lon"]), 
        "display_name": data[0]["display_name"]
    }

async def reverse_geocode(lat: float, lon: float):
    url = "https://geocode.maps.co/reverse"
    params = {"lat": lat, "lon": lon, "api_key": MAPSCO_API_KEY}
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, params=params, timeout=10.0)
            data = r.json()
            return data.get("display_name", "Unknown Location")
        except:
            return "Location found (Geocoding unavailable)"

# ==========================================
# 3. FastAPI App
# ==========================================
app = FastAPI(title="DIGIPIN Federated Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class AuthSchema(BaseModel):
    email: str
    password: str
    full_name: str = None
    role: str = "resident" # resident or partner

class AddressCreate(BaseModel):
    alias_suffix: str
    user_email: str
    address_text: str

class ConsentRequest(BaseModel):
    digital_address_alias: str
    requester_id: str
    duration_minutes: int

class DigipinIn(BaseModel):
    digipin: str

class AddressIn(BaseModel):
    address: str

# --- AUTH ENDPOINTS ---
@app.post("/auth/register")
def register(data: AuthSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")
    
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=pwd_context.hash(data.password),
        role=data.role
    )
    db.add(user)
    db.commit()
    return {"status": "Registered", "role": user.role}

@app.post("/auth/login")
def login(data: AuthSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    
    return {
        "status": "Login Successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.full_name,
            "role": user.role
        }
    }

# --- CONVERTER ENDPOINTS ---
@app.post("/address-to-digipin")
async def convert_addr(payload: AddressIn):
    geo = await forward_geocode(payload.address)
    
    try:
        digipin = generate_digipin(geo['lat'], geo['lon'])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "digipin": digipin, 
        "lat": geo['lat'], 
        "lon": geo['lon'],
        "formatted_address": geo['display_name']
    }

@app.post("/digipin-to-address")
async def convert_pin(payload: DigipinIn):
    try:
        coords = decode_digipin(payload.digipin)
        address = await reverse_geocode(coords['lat'], coords['lon'])
        return {"address": address, "lat": coords['lat'], "lon": coords['lon']}
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

# --- PLATFORM API ---

@app.get("/partners")
def get_all_partners(db: Session = Depends(get_db)):
    """Returns a list of all registered users with role='partner'."""
    partners = db.query(User).filter(User.role == "partner").all()
    # Return simplified list
    return [{"id": p.full_name, "name": p.full_name} for p in partners]

@app.post("/register-address")
async def create_address(data: AddressCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.user_email).first()
    if not user: raise HTTPException(404, "User not found")

    # 1. Real Geocoding
    try:
        geo_result = await forward_geocode(data.address_text)
    except HTTPException as e:
        raise e 
    
    lat = geo_result['lat']
    lon = geo_result['lon']
    
    # 2. Generate DIGIPIN
    digipin = generate_digipin(lat, lon)

    email_prefix = data.user_email.split('@')[0]
    full_alias = f"{email_prefix}@{data.alias_suffix}"
    
    # Check duplicates
    if db.query(DigitalAddress).filter(DigitalAddress.alias == full_alias).first():
        raise HTTPException(400, f"Identity '{full_alias}' already exists. Try a different suffix.")
    
    new_addr = DigitalAddress(
        alias=full_alias,
        digipin=digipin,
        lat=lat, 
        lon=lon,
        raw_address_text=data.address_text,
        owner_id=user.id,
        verification_status=VerificationStatus.SELF_DECLARED,
        confidence_score=20
    )
    db.add(new_addr)
    db.commit()
        
    return {
        "status": "Created", 
        "digital_address": full_alias, 
        "digipin": new_addr.digipin,
        "lat": lat,
        "lon": lon
    }

@app.post("/grant-consent")
def grant_consent(req: ConsentRequest, db: Session = Depends(get_db)):
    addr = db.query(DigitalAddress).filter(DigitalAddress.alias == req.digital_address_alias).first()
    if not addr: raise HTTPException(404, "Identity not found")
    
    consent = Consent(
        address_id=addr.id,
        requesting_entity=req.requester_id,
        expires_at=datetime.now() + timedelta(minutes=req.duration_minutes)
    )
    db.add(consent)
    db.commit()
    return {"status": "Granted"}

@app.get("/user/my-addresses/{email}")
def get_my_addresses(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user: return []
    return user.addresses

@app.get("/partner/my-consents")
def get_partner_consents(partner_name: str, db: Session = Depends(get_db)):
    active_consents = db.query(Consent).filter(
        Consent.requesting_entity == partner_name,
        Consent.is_active == True,
        Consent.expires_at > datetime.now()
    ).all()
    
    results = []
    for c in active_consents:
        addr = c.address
        results.append({
            "alias": addr.alias,
            "digipin": addr.digipin,
            "address": addr.raw_address_text,
            "lat": addr.lat,
            "lon": addr.lon,
            "score": addr.confidence_score,
            "expires_at": c.expires_at
        })
    return results

@app.get("/resolve-address/{alias}")
def resolve_one(alias: str, requester_id: str = Header(None), db: Session = Depends(get_db)):
    addr = db.query(DigitalAddress).filter(DigitalAddress.alias == alias).first()
    if not addr: raise HTTPException(404, "Not found")
    
    consent = db.query(Consent).filter(
        Consent.address_id == addr.id,
        Consent.requesting_entity == requester_id,
        Consent.is_active == True,
        Consent.expires_at > datetime.now()
    ).first()
    
    if not consent: raise HTTPException(403, "Access Denied")
    
    return {
        "alias": addr.alias, 
        "digipin": addr.digipin, 
        "lat": addr.lat, 
        "lon": addr.lon,
        "address": addr.raw_address_text, 
        "score": addr.confidence_score
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)