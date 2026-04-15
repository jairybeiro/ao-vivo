import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MobileTabBar from "@/components/MobileTabBar";
import { AnimatePresence, motion } from "framer-motion";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/Login";
import Install from "./pages/Install";
import CourseView from "./pages/CourseView";
import CourseDetail from "./pages/CourseDetail";
import Courses from "./pages/Courses";
import Entertainment from "./pages/Entertainment";
import CineBusinessDetail from "./pages/CineBusinessDetail";
import SeriesDetail from "./pages/SeriesDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="min-h-screen"
      >
        <Routes location={location}>
          {/* Main navigation */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/cursos" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/entretenimento" element={<ProtectedRoute><Entertainment /></ProtectedRoute>} />

          {/* Players */}
          <Route path="/course/:courseId" element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
          <Route path="/cinebusiness/:id" element={<ProtectedRoute><CineBusinessDetail /></ProtectedRoute>} />
          <Route path="/series/:id" element={<ProtectedRoute><SeriesDetail /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/install" element={<Install />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAUpdatePrompt />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
          <MobileTabBar />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
