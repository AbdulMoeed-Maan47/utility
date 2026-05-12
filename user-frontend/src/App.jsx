import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
//   useLocation,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// import HomePage from "./HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

import CustomerLayout from "./components/CustomerLayout";
import CustomerDashboard from "./pages/CustomerDashboard";
import { CustomerProfilePage } from "./pages/CustomerProfilePage";
import { ActiveRequestsPage } from "./pages/ActiveRequestsPage";
import { PostRequestPage } from "./pages/PostRequestPage";
import ServiceHistoryPage from "./pages/ServiceHistoryPage";
import { CustomerAvailableOffers } from "./pages/CustomerAvailableOffers";
import CustomerMessages from "./pages/CustomerMessages";

import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import { BidsHistoryPage } from "./pages/BidsHistoryPage";
import { MyBidsPage } from "./pages/MyBidsPage";
import ProviderMessages from "./pages/ProviderMessages";

// import CustomerChatbot from "./pages/CustomerChatbot";
// import ProviderChatbot from "./pages/ProviderChatbot";

// function ChatbotController() {
//   const { pathname } = useLocation();
//   const isCustomer = pathname.startsWith("/customer");
//   const isProvider =
//     pathname.startsWith("/provider") || pathname.includes("bids");
//   return (
//     <>
//       {isCustomer && <CustomerChatbot />}
//       {isProvider && <ProviderChatbot />}
//     </>
//   );
// }

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        {/* <Route path="/" element={<HomePage />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        {/* Customer — nested under shared CustomerLayout */}
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute role="customer">
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerDashboard />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="my-requests" element={<ActiveRequestsPage />} />
          <Route path="post-request" element={<PostRequestPage />} />
          <Route path="history" element={<ServiceHistoryPage />} />
          <Route path="messages" element={<CustomerMessages />} />
        </Route>
        {/* Customer — standalone protected page */}
        <Route
          path="/customer-available-offers"
          element={
            <ProtectedRoute role="customer">
              <CustomerAvailableOffers />
            </ProtectedRoute>
          }
        />
        {/* Provider — each uses ProviderLayout internally */}
        <Route
          path="/provider-dashboard"
          element={
            <ProtectedRoute role="provider">
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider-profile"
          element={
            <ProtectedRoute role="provider">
              <ProviderProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bids-history"
          element={
            <ProtectedRoute role="provider">
              <BidsHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bids"
          element={
            <ProtectedRoute role="provider">
              <MyBidsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider-messages"
          element={
            <ProtectedRoute role="provider">
              <ProviderMessages />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />{" "}
      </Routes>
      {/* <ChatbotController /> */}
    </Router>
  );
}
