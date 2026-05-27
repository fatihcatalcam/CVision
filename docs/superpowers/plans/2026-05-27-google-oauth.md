# Google OAuth Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Google ile devam et" button to Login and Register pages using a frontend-first popup flow — Google credential is verified server-side, returning a CVision JWT.

**Architecture:** Frontend uses `@react-oauth/google` `<GoogleLogin>` component to obtain a Google ID token; this token is posted to `POST /auth/google`; backend verifies it with `google-auth` library, then finds/creates the user and returns a JWT. New users with no `full_name` trigger a second step where the frontend shows an inline name form.

**Tech Stack:** `@react-oauth/google` (frontend), `google-auth` (backend), existing FastAPI JWT flow

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `backend/app/config.py` | Add `GOOGLE_CLIENT_ID` setting |
| Modify | `backend/requirements.txt` | Add `google-auth>=2.0.0` |
| Modify | `backend/app/models/user.py` | Add `google_id` column, make `password_hash` nullable |
| Modify | `backend/app/main.py` | Add 2 schema patches |
| Modify | `backend/app/routers/auth.py` | Add `POST /auth/google` endpoint |
| Create | `frontend/src/components/auth/GoogleAuthButton.tsx` | Google button + name form component |
| Modify | `frontend/src/main.tsx` | Wrap app in `GoogleOAuthProvider` |
| Modify | `frontend/src/pages/auth/LoginPage.tsx` | Add divider + `<GoogleAuthButton />` |
| Modify | `frontend/src/pages/auth/RegisterPage.tsx` | Add divider + `<GoogleAuthButton />` |

---

## Task 1: Add GOOGLE_CLIENT_ID to config

**Files:**
- Modify: `backend/app/config.py`

- [ ] **Step 1: Add setting after STRIPE fields**

In `backend/app/config.py`, add after `STRIPE_WEBHOOK_SECRET`:

```python
    # ---- Google OAuth ----
    GOOGLE_CLIENT_ID: str = ""
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/config.py
git commit -m "feat: add GOOGLE_CLIENT_ID config setting"
```

---

## Task 2: Add google-auth dependency

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Add package**

In `backend/requirements.txt`, add after `hashids==1.3.1`:

```
google-auth>=2.0.0
```

- [ ] **Step 2: Install locally to verify**

```bash
cd backend
pip install google-auth>=2.0.0
```

Expected: Successfully installed google-auth (and cachetools, pyasn1-modules, rsa if not already present)

- [ ] **Step 3: Commit**

```bash
git add backend/requirements.txt
git commit -m "feat: add google-auth dependency for token verification"
```

---

## Task 3: Update User model — add google_id, make password_hash nullable

**Files:**
- Modify: `backend/app/models/user.py`

- [ ] **Step 1: Update password_hash and add google_id**

Replace the `password_hash` and `role` lines in `backend/app/models/user.py`:

```python
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
```

(google_id goes between password_hash and role)

- [ ] **Step 2: Commit**

```bash
git add backend/app/models/user.py
git commit -m "feat: add google_id column and make password_hash nullable"
```

---

## Task 4: Add schema patches to main.py

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: Add two patches to the _schema_patches list**

In `backend/app/main.py`, add these two entries at the end of the `_schema_patches` list (after the `snippets` patch):

```python
        # Added for Google OAuth
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)",
        "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL",
```

The full list tail should look like:
```python
        "ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS snippets JSON",
        # Added for Google OAuth
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)",
        "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL",
    ]
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/main.py
git commit -m "feat: add schema patches for google_id and nullable password_hash"
```

---

## Task 5: Add POST /auth/google endpoint

**Files:**
- Modify: `backend/app/routers/auth.py`

- [ ] **Step 1: Add the request model and endpoint at the end of auth.py**

At the very end of `backend/app/routers/auth.py`, append:

```python

# ---- Google OAuth ----

class GoogleAuthRequest(BaseModel):
    credential: str
    full_name: str | None = None


@router.post("/google", summary="Sign in or register with Google")
def google_auth(body: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Frontend-first Google OAuth flow.
    1. Frontend sends Google ID token (credential).
    2. Backend verifies it, then finds/creates the user.
    3. If new user and no full_name provided, returns {status: needs_name}.
    4. Second call with full_name creates the account.
    """
    from google.oauth2 import id_token
    from google.auth.transport import requests as grequests
    from app.config import settings

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google login henüz yapılandırılmamış.")

    try:
        idinfo = id_token.verify_oauth2_token(
            body.credential,
            grequests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Geçersiz Google kimlik bilgisi.")

    email: str = idinfo.get("email", "")
    google_id: str = idinfo.get("sub", "")
    suggested_name: str = idinfo.get("name", "")

    if not email or not idinfo.get("email_verified"):
        raise HTTPException(status_code=400, detail="Google tarafından doğrulanmış bir email gereklidir.")

    user = db.query(User).filter(User.email == email).first()

    if user:
        if not user.google_id:
            # Existing email/password account
            raise HTTPException(
                status_code=409,
                detail="Bu email şifreyle kayıtlı. Lütfen şifrenizle giriş yapın.",
            )
        # Existing Google user — issue JWT
        token = create_access_token(data={"sub": str(user.id)})
        return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

    # Brand-new user
    if not body.full_name or not body.full_name.strip():
        # Step 1 of 2: ask the frontend to show the name form
        return {"status": "needs_name", "suggested_name": suggested_name}

    # Step 2 of 2: create account
    new_user = User(
        full_name=body.full_name.strip(),
        email=email,
        password_hash=None,
        google_id=google_id,
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(new_user))
```

- [ ] **Step 2: Verify the app starts without errors**

```bash
cd backend
uvicorn app.main:app --reload
```

Expected: `Application startup complete.` with no import errors. Check `http://localhost:8000/docs` — `POST /auth/google` should appear.

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/auth.py
git commit -m "feat: add POST /auth/google endpoint for Google OAuth login"
```

---

## Task 6: Frontend — install package and setup provider

**Files:**
- Modify: `frontend/package.json` (via npm)
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Install @react-oauth/google**

```bash
cd frontend
npm install @react-oauth/google
```

Expected: `added 1 package`

- [ ] **Step 2: Wrap app in GoogleOAuthProvider in main.tsx**

In `frontend/src/main.tsx`, add the import and wrap the app:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <App />
      <Analytics />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#111111',
            border: '1px solid #EAEAEA',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          },
          success: {
            iconTheme: { primary: '#346538', secondary: '#EDF3EC' },
          },
          error: {
            iconTheme: { primary: '#9F2F2D', secondary: '#FDEBEC' },
          },
        }}
      />
    </GoogleOAuthProvider>
  </StrictMode>,
)
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/main.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat: install @react-oauth/google and add GoogleOAuthProvider"
```

---

## Task 7: Create GoogleAuthButton component

**Files:**
- Create: `frontend/src/components/auth/GoogleAuthButton.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/auth/GoogleAuthButton.tsx`:

```tsx
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const inputCls =
  'w-full bg-white dark:bg-[#1c1c1a] border border-[#EAEAEA] dark:border-white/[0.07] rounded-xl h-12 px-4 text-[#111111] dark:text-[#e8e7e4] placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764] focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20 transition-all';

type Step = 'button' | 'name';

export function GoogleAuthButton() {
  const [step, setStep] = useState<Step>('button');
  const [pendingCredential, setPendingCredential] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', { credential });
      if (res.data.status === 'needs_name') {
        setPendingCredential(credential);
        setFullName(res.data.suggested_name ?? '');
        setStep('name');
      } else {
        login(res.data.access_token, res.data.user);
        toast.success('Hoş geldiniz!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Google ile giriş başarısız.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', {
        credential: pendingCredential,
        full_name: fullName.trim(),
      });
      login(res.data.access_token, res.data.user);
      toast.success('Hesabınız oluşturuldu!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Hesap oluşturulamadı.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'name') {
    return (
      <form onSubmit={handleNameSubmit} className="space-y-3">
        <p className="text-sm text-[#787774] dark:text-[#908d89]">
          Google hesabınızla devam etmek için adınızı girin.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#787774] dark:text-[#908d89] uppercase tracking-wider">
            Ad Soyad
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Adınız Soyadınız"
            required
            minLength={2}
            maxLength={150}
            className={inputCls}
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || fullName.trim().length < 2}
          className="w-full h-12 rounded-xl font-bold text-sm bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Devam Et →'}
        </button>
        <button
          type="button"
          onClick={() => { setStep('button'); setPendingCredential(''); }}
          className="w-full text-xs text-[#787774] dark:text-[#908d89] hover:text-[#111111] dark:hover:text-[#e8e7e4] transition-colors py-1"
        >
          ← Geri dön
        </button>
      </form>
    );
  }

  return (
    <div className={isLoading ? 'opacity-60 pointer-events-none' : ''}>
      <GoogleLogin
        onSuccess={(cr) => handleGoogleSuccess(cr.credential!)}
        onError={() => toast.error('Google ile giriş başarısız.')}
        theme="outline"
        size="large"
        width="360"
        text="continue_with"
        locale="tr"
        shape="rectangular"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/GoogleAuthButton.tsx
git commit -m "feat: add GoogleAuthButton component with two-step name flow"
```

---

## Task 8: Add button to LoginPage

**Files:**
- Modify: `frontend/src/pages/auth/LoginPage.tsx`

- [ ] **Step 1: Add import**

At the top of `frontend/src/pages/auth/LoginPage.tsx`, add after the existing imports:

```tsx
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
```

- [ ] **Step 2: Add divider and button after the form closing tag**

Find the closing `</form>` tag in LoginPage and add the divider + button immediately after it (before the `<p>` that links to Register):

```tsx
          </form>

          {/* Google OAuth */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.07]" />
              <span className="text-xs text-[#A09D9A] dark:text-[#6a6764] font-medium">veya</span>
              <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.07]" />
            </div>
            <GoogleAuthButton />
          </div>

          <p className="mt-8 text-center ...
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/auth/LoginPage.tsx
git commit -m "feat: add Google login button to LoginPage"
```

---

## Task 9: Add button to RegisterPage

**Files:**
- Modify: `frontend/src/pages/auth/RegisterPage.tsx`

- [ ] **Step 1: Add import**

At the top of `frontend/src/pages/auth/RegisterPage.tsx`, add after the existing imports:

```tsx
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
```

- [ ] **Step 2: Add divider and button after the form closing tag**

Find the closing `</form>` tag in RegisterPage and add the same divider + button after it:

```tsx
          </form>

          {/* Google OAuth */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.07]" />
              <span className="text-xs text-[#A09D9A] dark:text-[#6a6764] font-medium">veya</span>
              <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.07]" />
            </div>
            <GoogleAuthButton />
          </div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/auth/RegisterPage.tsx
git commit -m "feat: add Google login button to RegisterPage"
```

---

## Task 10: Set environment variables and push

**Files:** None (env var configuration + final push)

- [ ] **Step 1: Google Cloud Console — create OAuth credentials**

1. Go to https://console.cloud.google.com
2. Select your project (or create one)
3. Navigate to: APIs & Services → Credentials
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: **Web application**
6. Name: `CVision`
7. Authorized JavaScript origins — add ALL of these:
   - `https://<your-vercel-domain>.vercel.app`
   - `http://localhost:5173`
8. Click "Create" → copy the **Client ID** (looks like `123456789-abc.apps.googleusercontent.com`)

No Redirect URIs needed (popup flow).

- [ ] **Step 2: Add to Render (backend)**

In Render dashboard → your backend service → Environment:
- Key: `GOOGLE_CLIENT_ID`
- Value: `<the client ID from step 1>`

- [ ] **Step 3: Add to Vercel (frontend)**

In Vercel dashboard → your project → Settings → Environment Variables:
- Key: `VITE_GOOGLE_CLIENT_ID`
- Value: `<the same client ID>`
- Environments: Production, Preview, Development ✓

- [ ] **Step 4: Push everything and redeploy**

```bash
git push origin main
```

Both Render and Vercel will auto-deploy. After deploy:
- Open your login page
- The "veya" divider and Google button should appear
- Click "Google ile devam et" → Google popup opens
- Select an account → either logs in or shows name form

- [ ] **Step 5: Verify the full flow**

Test these three cases:
1. **New user** → Google popup → name form appears (pre-filled) → submit → dashboard ✓
2. **Returning Google user** → Google popup → direct to dashboard ✓  
3. **Existing email/password user** → Google popup → toast: "Bu email şifreyle kayıtlı" ✓
