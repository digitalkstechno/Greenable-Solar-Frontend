'use client';

import React from "react"
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  RefreshCw,
  ChevronDown,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Menu,
  CheckSquare,
  Flag,
  List,
  Package,
  PackagePlus,
  PackageMinus,
  Building2,
  X,
} from 'lucide-react';
import { useRouter } from "next/navigation";
import axios from "axios";
import { baseUrl, clearAuthToken, getAuthToken } from "@/config";
import Swal from 'sweetalert2';
import { CenterDialog } from "./Dialog";
import FormInput from "./ui/Input";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  children?: MenuItem[];
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [canViewLead, setCanViewLead] = useState(false);
  const [canViewTask, setCanViewTask] = useState(false);
  const [canViewStaff, setCanViewStaff] = useState(false);
  const [canViewRole, setCanViewRole] = useState(false);
  const [canViewLeadStatus, setCanViewLeadStatus] = useState(false);
  const [canViewLeadSource, setCanViewLeadSource] = useState(false);
  const [canViewLeadLabel, setCanViewLeadLabel] = useState(false);
  const [canViewCategory, setCanViewCategory] = useState(false);
  const [canViewProduct, setCanViewProduct] = useState(false);
  const [canViewStock, setCanViewStock] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const handleOpenProfileDialog = () => {
    if (currentUser) {
      setProfileName(currentUser.fullName || '');
      setProfileEmail(currentUser.email || '');
      setProfilePassword('');
      setProfileError('');
      setIsProfileDialogOpen(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setProfileError("Full name is required");
      return;
    }
    if (!profileEmail.trim()) {
      setProfileError("Email is required");
      return;
    }
    setIsSavingProfile(true);
    setProfileError('');
    try {
      const token = getAuthToken();
      const payload = new FormData();
      payload.append('fullName', profileName.trim());
      payload.append('email', profileEmail.trim());
      if (profilePassword.trim()) {
        payload.append('password', profilePassword.trim());
      }
      
      const res = await axios.put(`${baseUrl.userUpdate}/${currentUser._id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      if (res.data?.status === 'Success') {
        Swal.fire({
          title: 'Success!',
          text: 'Profile updated successfully',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        setCurrentUser(res.data.data);
        setIsProfileDialogOpen(false);
      } else {
        setProfileError(res.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };


  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    axios
      .get(baseUrl.currentStaff, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const role = res.data?.data?.role || {};
        const rawPerms = Array.isArray(role.permissions)
          ? role.permissions[0]
          : role.permissions || {};
        const leadPerms = rawPerms.lead || {};
        const taskPerms = rawPerms.task || {};
        const staffPerms = rawPerms.staff || {};
        const rolePerms = rawPerms.role || {};
        const leadStatusPerms = rawPerms.leadStatus || {};
        const leadSourcePerms = rawPerms.leadSource || {};
        const leadLabelPerms = rawPerms.leadLabel || {};
        const setupPerms = rawPerms.setup || {};
        const categoryPerms = rawPerms.category || {};
        const productPerms = rawPerms.product || {};
        const stockPerms = rawPerms.stock || {};

        setCanViewLead(!!(leadPerms.readOwn || leadPerms.readAll));
        setCanViewTask(!!(taskPerms.readOwn || taskPerms.readAll));
        setCanViewStaff(!!(staffPerms.readAll || setupPerms.readAll));
        setCanViewRole(!!(rolePerms.readAll || setupPerms.readAll));
        setCanViewLeadStatus(!!(leadStatusPerms.readAll || setupPerms.readAll));
        setCanViewLeadSource(!!(leadSourcePerms.readAll || setupPerms.readAll));
        setCanViewLeadLabel(!!(leadLabelPerms.readAll || setupPerms.readAll));
        setCanViewCategory(!!(categoryPerms.readAll || categoryPerms.readOwn || setupPerms.readAll));
        setCanViewProduct(!!(productPerms.readAll || productPerms.readOwn || setupPerms.readAll));
        setCanViewStock(!!(stockPerms.readAll || stockPerms.readOwn || setupPerms.readAll));
        setCurrentUser(res.data?.data);
      })
      .catch(() => {
        setCanViewLead(false);
        setCanViewTask(false);
        setCanViewStaff(false);
        setCanViewRole(false);
        setCanViewLeadStatus(false);
        setCanViewLeadSource(false);
        setCanViewLeadLabel(false);
        setCanViewCategory(false);
        setCanViewProduct(false);
        setCanViewStock(false);
      });
  }, []);

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  ];

  if (canViewLead) {
    menuItems.push({ icon: UserPlus, label: "Leads", path: "/leads" });
  }

  // if (canViewTask) {
  //   menuItems.push({ icon: CheckSquare, label: "Tasks", path: "/tasks" });
  // }

  if (canViewRole) menuItems.push({ icon: Building2, label: "Department Management", path: "/roles" });
  if (canViewStaff) menuItems.push({ icon: Users, label: "User", path: "/user-list" });
  if (canViewLeadStatus) menuItems.push({ icon: Flag, label: "Lead Status", path: "/lead-status" });
  if (canViewCategory) menuItems.push({ icon: List, label: "Category", path: "/category" });
  if (canViewProduct) menuItems.push({ icon: Package, label: "Product", path: "/product" });
  if (canViewStock) {
    menuItems.push({ icon: PackagePlus, label: "Stock In", path: "/stock-in" });
    menuItems.push({ icon: PackageMinus, label: "Stock Out", path: "/stock-out" });
  }

  const hasAnySetupPerm = true; // Still show Setup if needed for remaining items like Kanban Status

  // if (hasAnySetupPerm) {
  menuItems.push({
    icon: Settings,
    label: "Setup",
    path: "/setup",
  });
  // }

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      background: '#fff',
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Logging out...',
          text: 'Please wait',
          icon: 'info',
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Perform logout
        clearAuthToken();
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("auth");
        }

        // Show success message
        Swal.fire({
          title: 'Logged Out!',
          text: 'You have been successfully logged out',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          router.replace("/login");
        });
      }
    });
  };

  const handleNavigation = (path?: string) => {
    if (path) {
      router.push(path);
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
    }
  };

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-[#d87612] text-white shadow-2xl transition-all duration-300 ease-in-out ${isOpen
          ? 'w-64 translate-x-0'
          : 'w-64 -translate-x-full md:w-20 md:translate-x-0'
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Header with Logo */}
          <div className={`flex items-center h-20 px-4 border-b border-white/10 ${isOpen ? 'justify-between' : 'justify-center'}`}>
            <div className={`flex items-center gap-3 ${!isOpen && 'hidden md:flex'}`}>
              {isOpen && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#30cdb2] to-[#23abed] flex items-center justify-center font-bold text-white shadow-lg">
                  LF
                </div>
              )}
              {isOpen && <span className="text-lg font-semibold text-white tracking-wide">LeadFlow</span>}
            </div>

            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group ${!isOpen && 'md:block'}`}
              aria-label="Toggle sidebar"
            >
              {isOpen ? (
                <ChevronLeft className="h-5 w-5 text-white/70 group-hover:text-white transition-all" />
              ) : (
                <Menu className="h-6 w-6 text-white/70 group-hover:text-white transition-all" />
              )}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <ul className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = !!item.children;
                const expanded = expandedItems.has(item.label);
                const isItemActive = isActive(item.path);

                return (
                  <li key={item.label}>
                    {hasChildren ? (
                      <div>
                        <button
                          onClick={() => toggleExpand(item.label)}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group ${expanded
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${expanded ? 'text-white' : 'text-white/70'
                            }`} />
                          {isOpen && (
                            <>
                              <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                            </>
                          )}
                        </button>

                        {/* Submenu */}
                        {isOpen && expanded && (
                          <ul className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-3">
                            {item.children?.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildActive = isActive(child.path);

                              return (
                                <li key={child.label}>
                                  <button
                                    onClick={() => handleNavigation(child.path)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all duration-200 group ${isChildActive
                                      ? 'bg-gradient-to-r from-[#0f3c70]/20 to-[#0f2f5a]/20 text-white border border-white/10'
                                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                                      }`}
                                  >
                                    <ChildIcon className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isChildActive ? 'text-[#9f7cff]' : 'text-white/60'
                                      }`} />
                                    <span className="text-sm">{child.label}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleNavigation(item.path)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group ${isItemActive
                          ? 'bg-[#f4f7fb] text-green-600 shadow-md'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isItemActive ? 'text-green-600' : 'text-white/80'
                          }`} />
                        {isOpen && (
                          <span className="text-sm font-medium text-left flex-1 whitespace-nowrap truncate">{item.label}</span>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info */}
          {currentUser && (
            <div 
              onClick={handleOpenProfileDialog}
              className={`p-3 border-t border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors ${!isOpen && 'justify-center'}`}
            >
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {currentUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {isOpen && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{currentUser.fullName}</p>
                  <p className="text-xs text-white/60 truncate">{currentUser.email}</p>
                </div>
              )}
            </div>
          )}


        </div>
      </aside>

      {/* Profile Update Dialog */}
      {isProfileDialogOpen && (
        <CenterDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
        >
          <div className="flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-800">Update Profile</h3>
              <button
                type="button"
                onClick={() => setIsProfileDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form id="profile-update-form" onSubmit={handleUpdateProfile} className="space-y-4">
              {profileError && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {profileError}
                </div>
              )}
              
              <FormInput
                label="Full Name"
                name="profileName"
                type="text"
                value={profileName}
                onChange={(e: any) => setProfileName(e.target.value)}
                required
                placeholder="Enter full name"
              />
              
              <FormInput
                label="Email"
                name="profileEmail"
                type="email"
                value={profileEmail}
                onChange={(e: any) => setProfileEmail(e.target.value)}
                required
                placeholder="Enter email"
              />
              
              <FormInput
                label="New Password"
                name="profilePassword"
                type="password"
                value={profilePassword}
                onChange={(e: any) => setProfilePassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsProfileDialogOpen(false)}
                className="px-4 py-2 cursor-pointer rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-sm font-medium"
                disabled={isSavingProfile}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="profile-update-form"
                className="px-4 py-2 cursor-pointer rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </CenterDialog>
      )}
    </>
  );
}