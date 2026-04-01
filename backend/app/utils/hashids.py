from hashids import Hashids
from app.config import settings
from fastapi import HTTPException

# Create a singleton Hashids instance using the app's secret key
# We set a minimum length of 6 characters for aesthetic reasons
hasher = Hashids(salt=settings.SECRET_KEY, min_length=6)

def encode_id(db_id: int) -> str:
    """Encode a database integer ID into a safe hash string."""
    if db_id is None:
        return None
    return hasher.encode(db_id)

def decode_id(hash_str: str) -> int:
    """
    Decode a hash string back to the database integer ID.
    Raises an HTTPException (400) if the hash is invalid or tampered with.
    """
    if not hash_str:
        raise HTTPException(status_code=400, detail="Invalid ID format.")
    
    decoded = hasher.decode(hash_str)
    
    # Hashids decode returns a tuple, e.g. (142,)
    if not decoded or len(decoded) == 0:
        raise HTTPException(status_code=400, detail="Resource ID is invalid or corrupt.")
        
    return decoded[0]
