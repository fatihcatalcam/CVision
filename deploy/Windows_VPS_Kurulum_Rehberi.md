# CVision - Windows VPS Canlıya Alma Rehberi

Bu rehber, CVision projenizi uzak masaüstü (RDP) ile bağlandığınız Windows Server sunucunuza sıfırdan kurmanızı sağlar.

## Ortam Gereksinimleri
Sunucuya indirilip kurulması gereken temel yazılımlar:
1. **Python 3.10+**: Kurarken "Add Python to PATH" seçeneğini işaretlemeyi unutmayın!
2. **Node.js (LTS)**: Frontend'i derlemek için gerekli.
3. **NSSM (Non-Sucking Service Manager)**: API'nin arka plan servisi olarak çalışmasını sağlar. [Buradan indirin](http://nssm.cc/release/nssm-2.24.zip) ve `nssm.exe` dosyasını `deploy` klasörüne (veya `C:\Windows\System32` içine) atın.
4. **PostgreSQL**: Veritabanı için. Windows Installer ile kurabilirsiniz. (Kurulumda belirlediğiniz şifreyi unutmayın).
5. **IIS (Internet Information Services)** ve **URL Rewrite Modülü**:
   1. *Server Manager* > *Add Roles and Features* kısmından `Web Server (IIS)`i kurun.
   2. [URL Rewrite Eklentisini İndirip Kurun](https://www.iis.net/downloads/microsoft/url-rewrite).
   3. [ARR (Application Request Routing) Eklentisini İndirip Kurun](https://www.iis.net/downloads/microsoft/application-request-routing).

---

## Adım Adım Kurulum

### 1. Kodu Sunucuya Taşıma
Mevcut projenizi (`CVision` klasörü) tam haliyle VPS'te örneğin `C:\inetpub\wwwroot\CVision` veya `C:\CVision` dizinine kopyalayın.

### 2. Veritabanı ve Çevre Değişkenleri
`backend` klasöründe bulunan `.env.production.example` dosyasının adını **`.env.production`** yapın ve içindeki `DATABASE_URL` satırına kendi yüklediğiniz PostgreSQL şifrenizi yazın. Aynı şekilde `CORS_ORIGINS` kısmına sunucunuzun IP adresini ekleyin. (Frontend tarafına da gidip `.env.production` dosyasının adını kontrol edin).

### 3. Arka Plan Servisi (Python Backend Kurulumu)
1. VPS üzerinde `deploy` klasörünün içine girin.
2. `nssm.exe`'nin bu klasörde olduğundan emin olun.
3. Yönetici (Administrator) olarak cmd veya PowerShell açın, `deploy` klasörüne gidin ve şu komutu çalıştırın:
   ```cmd
   install_service.bat
   ```
Bu script otomatik olarak projenizdeki `.env.production`'ı kullanacak şekilde Uvicorn'u başlatacak ve arka planda kitleyecektir. Sistem yeniden başlasa bile artık API kendi kendine port 8000'de açılacaktır. (Hata durumunda loglar bu klasördeki `backend_output.log` a yazılacaktır).

### 4. React (Frontend) Derlemesi
1. Cmd/Powershell'de projenin ana klasöründeki `frontend` içine girin.
2. Bağımlılıkları indirin: `npm install`
3. Projeyi canlıya hazır şekilde derleyin: `npm run build`
4. Bu işlem bittiğinde `frontend` içerisinde `dist` (veya `build`) isminde bir klasör çıkacak. Uygulamanızın son hali bu klasördür.

### 5. IIS ve Web (Nginx-Vari Ters Vekil) Ayarları
1. Sunucuda **IIS Manager** uygulamasını açın.
2. Sol menüden *Sites* > *Default Web Site* (veya yeni bir site oluşturun) sağ tıklayıp **Explore** veya **Manage Website > Advanced Settings** yapın.
3. *Physical Path* (Fiziksel Yol) kısmını az önce elde ettiğiniz React `dist` klasörünün yolu olarak seçin. (Örn: `C:\CVision\frontend\dist`).
4. Projenizin ana dizinindeki **`deploy\web.config`** dosyasını alıp bu `dist` klasörünün de en tepesine **KOPYALAYIN**.

> **Not:** `web.config` doyasını IIS'e tanıttığınızda, IIS otomatik olarak o klasöre gelenleri React'a çeker, `/api/` diye başlayan tüm sorguları da arkaplandaki `127.0.0.1:8000` (FastAPI) sunucunuza iletir.

### 6. Test
Artık sunucunuzun IP adresine `http://<IP_ADRESINIZ>` (Örn: `http://192.168.1.50`) yazdığınızda direkt uygulamaya erişmeniz lazım! Kayıt olmayı ve işlemler yapmayı deneyin. 

**Tebrikler, SaaS Ürününüzün VPS Deploy işlemi tamamlandı!**
