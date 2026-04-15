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
import MyCourses from "./pages/MyCourses";
import CourseCheckout from "./pages/CourseCheckout";
import CheckoutReturn from "./pages/CheckoutReturn";
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
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/cursos" element={<Courses />} />
          <Route path="/entretenimento" element={<Entertainment />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/cinebusiness/:id" element={<CineBusinessDetail />} />
          <Route path="/series/:id" element={<SeriesDetail />} />

          {/* Protected - requires auth */}
          <Route path="/course/:courseId/player" element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
          <Route path="/course/:courseId/checkout" element={<ProtectedRoute><CourseCheckout /></ProtectedRoute>} />
          <Route path="/meus-cursos" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
          <Route path="/checkout/return" element={<CheckoutReturn />} />
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
