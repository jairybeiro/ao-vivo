import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/Login";
import Install from "./pages/Install";
import Premium from "./pages/Premium";
import PremiumLogin from "./pages/PremiumLogin";
import PremiumWatch from "./pages/PremiumWatch";
import CourseView from "./pages/CourseView";
import Courses from "./pages/Courses";
import Entertainment from "./pages/Entertainment";
import VodBrowse from "./pages/VodBrowse";
import VodMoviePlayer from "./pages/VodMoviePlayer";
import VodSeriesPlayer from "./pages/VodSeriesPlayer";
import ContentDetail from "./pages/ContentDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAUpdatePrompt />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas protegidas com header */}
            <Route path="/" element={<ProtectedRoute><VodBrowse /></ProtectedRoute>} />
            <Route path="/cursos" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/entretenimento" element={<ProtectedRoute><Entertainment /></ProtectedRoute>} />
            <Route path="/channels" element={<ProtectedRoute><Index /></ProtectedRoute>} />

            {/* Players (sem header, fullscreen) */}
            <Route path="/course/:courseId" element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
            <Route path="/vod/movie/:id" element={<ProtectedRoute><VodMoviePlayer /></ProtectedRoute>} />
            <Route path="/vod/series/:id" element={<ProtectedRoute><VodSeriesPlayer /></ProtectedRoute>} />

            {/* Legacy/Admin */}
            <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
            <Route path="/premium/watch/:id" element={<ProtectedRoute><PremiumWatch /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/install" element={<Install />} />
            <Route path="/premium/login" element={<PremiumLogin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
