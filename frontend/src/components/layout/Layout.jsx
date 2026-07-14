import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import EmailVerificationBanner from "./EmailVerificationBanner.jsx";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <EmailVerificationBanner />

      <main className="w-full grow">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
