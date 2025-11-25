import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Library from "./pages/Library";
import NotFound from "./pages/NotFound";
import { useMusicPlayer } from "./hooks/useMusicPlayer";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { allSongs, addToQueue } = useMusicPlayer();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/library" element={<Library songs={allSongs} onAddToQueue={addToQueue} />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
