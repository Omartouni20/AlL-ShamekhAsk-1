import { useState } from "react";
import { CustomerPage } from "./components/CustomerPage";
import { EmployeeLogin } from "./components/EmployeeLogin";
import { AdminLogin } from "./components/AdminLogin";
import { EmployeeDashboard } from "./components/EmployeeDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import logoImage from "figma:asset/9dd806c39decc1e8553ad45cfbf0fe091377c9df.png";

type View =
  | "customer"
  | "employee-login"
  | "admin-login"
  | "employee-dashboard"
  | "admin-dashboard";

interface User {
  id: string;
  name: string;
  role: "employee" | "admin";
}

export default function App() {
  const [currentView, setCurrentView] =
    useState<View>("customer");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // إضافة console.log لتتبع القيمة الحالية للـ view و المستخدم
  console.log("Current View:", currentView);
  console.log("Current User:", currentUser);

  const handleLogout = () => {
    console.log("Logging out..."); // تتبع عملية تسجيل الخروج
    setCurrentUser(null);
    setCurrentView("customer");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src={logoImage}
                alt="إسألني"
                className="h-10 w-auto"
              />
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="font-bold text-lg text-[#1e3a8a]">
                نظام إدارة الطلبات
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {!currentUser && (
                <>
                  <button
                    onClick={() => {
                      console.log("Navigating to customer page");
                      setCurrentView("customer");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentView === "customer"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    طلب جديد
                  </button>
                  <button
                    onClick={() => {
                      console.log("Navigating to employee login");
                      setCurrentView("employee-login");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentView === "employee-login"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    الموظفين
                  </button>
                  <button
                    onClick={() => {
                      console.log("Navigating to admin login");
                      setCurrentView("admin-login");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentView === "admin-login"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    الإدارة
                  </button>
                </>
              )}

              {currentUser && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentUser.role === "admin"
                        ? "مدير"
                        : "موظف"}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    تسجيل خروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {currentView === "customer" && (
          <CustomerPage />
        )}
        {currentView === "employee-login" && (
          <EmployeeLogin
            onLogin={(user) => {
              console.log("Employee login successful:", user);
              setCurrentUser(user);
              setCurrentView("employee-dashboard");
            }}
          />
        )}
        {currentView === "admin-login" && (
          <AdminLogin
            onLogin={(user) => {
              console.log("Admin login successful:", user);
              setCurrentUser(user);
              setCurrentView("admin-dashboard");
            }}
          />
        )}
        {currentView === "employee-dashboard" && currentUser && (
          <EmployeeDashboard
            userId={currentUser.id}
            userName={currentUser.name}
          />
        )}
        {currentView === "admin-dashboard" && currentUser && (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}
