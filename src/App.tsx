import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Install from "./pages/Install";
import Premium from "./pages/Premium";
import PremiumLogin from "./pages/PremiumLogin";
import PremiumWatch from "./pages/PremiumWatch";
import CourseView from "./pages/CourseView";
import VodBrowse from "./pages/VodBrowse";
import VodMoviePlayer from "./pages/VodMoviePlayer";
import VodSeriesPlayer from "./pages/VodSeriesPlayer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas protegidas */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
            <Route path="/premium/watch/:id" element={<ProtectedRoute><PremiumWatch /></ProtectedRoute>} />
            <Route path="/course/:courseId" element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
            <Route path="/vod" element={<ProtectedRoute><VodBrowse /></ProtectedRoute>} />
            <Route path="/vod/movie/:id" element={<ProtectedRoute><VodMoviePlayer /></ProtectedRoute>} />
            <Route path="/vod/series/:id" element={<ProtectedRoute><VodSeriesPlayer /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            
            {/* Rotas públicas */}
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
