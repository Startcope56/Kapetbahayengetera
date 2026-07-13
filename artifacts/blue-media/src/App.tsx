import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CallProvider } from "@/context/CallContext";
import { Layout } from "@/components/layout";

import AuthPage from "@/pages/auth";
import FeedPage from "@/pages/feed";
import ProfilePage from "@/pages/profile";
import FriendsPage from "@/pages/friends";
import ChatListPage from "@/pages/chat-list";
import ChatRoomPage from "@/pages/chat-room";
import NotificationsPage from "@/pages/notifications";
import AdminPage from "@/pages/admin";
import SettingsPage from "@/pages/settings";
import LivePage from "@/pages/live";
import ExplorePage from "@/pages/explore";
import DashboardPage from "@/pages/dashboard";
import LeaderboardPage from "@/pages/leaderboard";
import MemoriesPage from "@/pages/memories";
import MarketplacePage from "@/pages/marketplace";
import EventsPage from "@/pages/events";
import BlueAIChatPage from "@/pages/blueai-chat";
import PollsPage from "@/pages/polls";
import GamesPage from "@/pages/games";
import MoodPage from "@/pages/mood";
import HighlightsPage from "@/pages/highlights";
import YoutubePage from "@/pages/youtube";
import RequestFollowersPage from "@/pages/request-followers";
import SavedPostsPage from "@/pages/saved-posts";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType<any>, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!user) return <Redirect to="/" />;
  if (adminOnly && !user.isAdmin) return <Redirect to="/feed" />;
  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <Switch>
      <Route path="/">{user ? <Redirect to="/feed" /> : <AuthPage />}</Route>
      <Route path="/feed"><Layout><ProtectedRoute component={FeedPage} /></Layout></Route>
      <Route path="/explore"><Layout><ProtectedRoute component={ExplorePage} /></Layout></Route>
      <Route path="/live"><Layout><ProtectedRoute component={LivePage} /></Layout></Route>
      <Route path="/dashboard"><Layout><ProtectedRoute component={DashboardPage} /></Layout></Route>
      <Route path="/leaderboard"><Layout><ProtectedRoute component={LeaderboardPage} /></Layout></Route>
      <Route path="/memories"><Layout><ProtectedRoute component={MemoriesPage} /></Layout></Route>
      <Route path="/marketplace"><Layout><ProtectedRoute component={MarketplacePage} /></Layout></Route>
      <Route path="/events"><Layout><ProtectedRoute component={EventsPage} /></Layout></Route>
      <Route path="/ai"><Layout><ProtectedRoute component={BlueAIChatPage} /></Layout></Route>
      <Route path="/polls"><Layout><ProtectedRoute component={PollsPage} /></Layout></Route>
      <Route path="/games"><Layout><ProtectedRoute component={GamesPage} /></Layout></Route>
      <Route path="/mood"><Layout><ProtectedRoute component={MoodPage} /></Layout></Route>
      <Route path="/highlights"><Layout><ProtectedRoute component={HighlightsPage} /></Layout></Route>
      <Route path="/videos"><Layout><ProtectedRoute component={YoutubePage} /></Layout></Route>
      <Route path="/request-followers"><Layout><ProtectedRoute component={RequestFollowersPage} /></Layout></Route>
      <Route path="/saved"><Layout><ProtectedRoute component={SavedPostsPage} /></Layout></Route>
      <Route path="/profile/:id"><Layout><ProtectedRoute component={ProfilePage} /></Layout></Route>
      <Route path="/friends"><Layout><ProtectedRoute component={FriendsPage} /></Layout></Route>
      <Route path="/chat"><Layout><ProtectedRoute component={ChatListPage} /></Layout></Route>
      <Route path="/chat/:id"><Layout><ProtectedRoute component={ChatRoomPage} /></Layout></Route>
      <Route path="/notifications"><Layout><ProtectedRoute component={NotificationsPage} /></Layout></Route>
      <Route path="/admin"><Layout><ProtectedRoute component={AdminPage} adminOnly={true} /></Layout></Route>
      <Route path="/settings"><Layout><ProtectedRoute component={SettingsPage} /></Layout></Route>
      <Route><Layout><NotFound /></Layout></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <CallProvider>
              <Router />
            </CallProvider>
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
