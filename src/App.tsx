import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Events from "./pages/Events.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import { DashboardLayout } from "./components/DashboardLayout";
import { RequireAuth } from "./components/RequireAuth";
import DashboardHome from "./pages/dashboard/DashboardHome";
import MyRegistrations from "./pages/dashboard/MyRegistrations";
import MyEvents from "./pages/dashboard/MyEvents";
import EventForm from "./pages/dashboard/EventForm";
import Attendees from "./pages/dashboard/Attendees";
import AdminEvents from "./pages/dashboard/AdminEvents";
import AdminUsers from "./pages/dashboard/AdminUsers";
import AdminAnalytics from "./pages/dashboard/AdminAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />

          <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
            <Route index element={<DashboardHome />} />
            <Route path="my-registrations" element={<RequireAuth roles={["visitor"]}><MyRegistrations /></RequireAuth>} />
            <Route path="my-events" element={<RequireAuth roles={["organizer"]}><MyEvents /></RequireAuth>} />
            <Route path="events/new" element={<RequireAuth roles={["organizer"]}><EventForm /></RequireAuth>} />
            <Route path="events/:id/edit" element={<RequireAuth roles={["organizer", "manager"]}><EventForm /></RequireAuth>} />
            <Route path="events/:id/attendees" element={<RequireAuth roles={["organizer", "manager"]}><Attendees /></RequireAuth>} />
            <Route path="admin/events" element={<RequireAuth roles={["manager"]}><AdminEvents /></RequireAuth>} />
            <Route path="admin/users" element={<RequireAuth roles={["manager"]}><AdminUsers /></RequireAuth>} />
            <Route path="admin/analytics" element={<RequireAuth roles={["manager"]}><AdminAnalytics /></RequireAuth>} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
