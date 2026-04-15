---
name: Public Routes Architecture
description: Site is public by default; only admin and player routes require authentication
type: feature
---
- Public routes (no auth): /, /cursos, /entretenimento, /course/:id, /cinebusiness/:id, /series/:id
- Protected routes (auth required): /admin, /course/:id/player
- ProtectedRoute passes `location.pathname` as state to /login for redirect-back
- Login page reads `state.from` to redirect after successful auth
- MainHeader shows "Entrar" button for visitors, "Sair" for authenticated
- MobileTabBar shows "Entrar" label for visitors, "Perfil" for authenticated
