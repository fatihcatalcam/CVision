nssm install CVisionFrontend "C:\Program Files\nodejs\npm.cmd" run dev
nssm set CVisionFrontend AppDirectory "c:\Users\Administrator\Desktop\CVision\CVision\frontend"
nssm set CVisionFrontend Description "CVision Frontend Dev Server"
nssm set CVisionFrontend DisplayName "CVisionFrontend"
nssm set CVisionFrontend Start SERVICE_AUTO_START
nssm start CVisionFrontend
