import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import axios from "axios";
import { useRouter } from "next/router";
import { clearAuthToken, getAuthToken } from "@/config";
import ReduxProvider from "@/store/provider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUserData, clearUserData, setUserData } from "@/store/slices/userDataSlice";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isFetched } = useAppSelector((state) => state.userData);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isLoginPage = router.pathname === "/login";

  // useEffect(() => {
  //   const interceptor = axios.interceptors.response.use(
  //     (response) => response,
  //     (error) => {
  //       if (error.response?.status === 401) {
  //         clearAuthToken();
  //         router.push("/login");
  //       }
  //       return Promise.reject(error);
  //     }
  //   );
  //   return () => axios.interceptors.response.eject(interceptor);
  // }, []);

  // App load thay tyare (refresh / direct visit) jo token che to loading permissions and user profile
  useEffect(() => {
    const token = getAuthToken?.();
    if (token) {
      if (!isLoginPage) {
        // 1. Try to load currentUser from localStorage to prevent SSR mismatch & API call on refresh
        const stored = localStorage.getItem("currentUser");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            dispatch(setUserData(parsed));
            return; // Found in storage, skip calling fetchUserData
          } catch (e) {
            console.error("Failed to parse stored user", e);
          }
        }

        // 2. If not found in localStorage and not fetched yet, call fetchUserData
        if (!isFetched) {
          dispatch(fetchUserData());
        }
      }
    } else {
      dispatch(clearUserData());
    }
  }, [isFetched, isLoginPage, dispatch]);

  return (
    <div className={poppins.className}>
      <div className="flex min-h-screen bg-white">
        {!isLoginPage && (
          <Sidebar
            isOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
        )}
        <div
          className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
            !isLoginPage ? (isSidebarOpen ? "md:ml-64" : "md:ml-20") : ""
          }`}
        >
          <main className="animate-in fade-in duration-300">
            {!isLoginPage ? (
              <Header toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
            ) : null}
            <div className={isLoginPage ? "p-0" : "p-4 md:p-6"}>
              <Component {...pageProps} />
            </div>
          </main>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default function App(props: AppProps) {
  return (
    <ReduxProvider>
      <AppContent {...props} />
    </ReduxProvider>
  );
}