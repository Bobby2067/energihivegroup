"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import {
  Menu,
  Search,
  Sun,
  Moon,
  ShoppingCart,
  User,
  Settings,
  LogOut,
  Bell,
  Home,
  Battery,
  BarChart3,
  CreditCard,
  HelpCircle,
  ChevronDown,
  X,
  BatteryCharging,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useOrderCount } from "@/lib/hooks/use-orders";

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { orderCount, isLoading: orderCountLoading } = useOrderCount();

  // Handle scroll events to change navigation appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation links based on authentication status
  const navLinks = isAuthenticated
    ? [
        { href: "/", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> },
        { href: "/products", label: "Products", icon: <Battery className="h-4 w-4 mr-2" /> },
        { href: "/dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4 mr-2" /> },
        { href: "/orders", label: "Orders", icon: <ShoppingCart className="h-4 w-4 mr-2" /> },
        { href: "/payments", label: "Payments", icon: <CreditCard className="h-4 w-4 mr-2" /> },
      ]
    : [
        { href: "/", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> },
        { href: "/products", label: "Products", icon: <Battery className="h-4 w-4 mr-2" /> },
        { href: "/pricing", label: "Pricing", icon: <CreditCard className="h-4 w-4 mr-2" /> },
        { href: "/about", label: "About", icon: <HelpCircle className="h-4 w-4 mr-2" /> },
      ];

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "EH";
    
    const name = user.user_metadata?.full_name || user.email || "";
    if (!name) return "EH";
    
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative h-8 w-8 overflow-hidden">
                <BatteryCharging className="h-8 w-8 text-[hsl(var(--energy-primary))]" />
                <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--aus-gold))]" />
              </div>
              <span className="hidden font-bold text-xl sm:inline-block">
                Energi<span className="text-[hsl(var(--energy-primary))]">Hive</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-[hsl(var(--energy-primary)/0.1)] text-[hsl(var(--energy-primary))]"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent"
                )}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-3 py-2 text-sm">
                    More <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/batteries" className="flex items-center cursor-pointer">
                      <BatteryCharging className="mr-2 h-4 w-4" />
                      <span>My Batteries</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/support" className="flex items-center cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Support</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Desktop Right Side Actions */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-[200px] pl-8 rounded-full bg-background border-muted"
              />
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--energy-primary))] text-[0.6rem] text-white">
                        3
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-[300px] overflow-y-auto">
                      {[1, 2, 3].map((i) => (
                        <DropdownMenuItem key={i} className="flex flex-col items-start py-2">
                          <div className="font-medium">Battery Update Available</div>
                          <div className="text-sm text-muted-foreground">
                            A new firmware update is available for your AlphaESS battery.
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date().toLocaleDateString()}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center text-[hsl(var(--energy-primary))]">
                      View all notifications
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Cart/Orders */}
                <Link href="/orders">
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <ShoppingCart className="h-5 w-5" />
                    {!orderCountLoading && orderCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--energy-primary))] text-[0.6rem] text-white">
                        {orderCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-[hsl(var(--energy-primary)/0.2)] text-[hsl(var(--energy-primary))]">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Account</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/settings" className="flex cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="text-red-500 focus:text-red-500 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="bg-[hsl(var(--energy-primary))] text-white hover:bg-[hsl(var(--energy-primary-dark))]">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Right Side Actions */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="rounded-full"
              aria-label="Search"
            >
              {isMobileSearchOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Cart/Orders (Mobile) */}
            {isAuthenticated && (
              <Link href="/orders">
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <ShoppingCart className="h-5 w-5" />
                  {!orderCountLoading && orderCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--energy-primary))] text-[0.6rem] text-white">
                      {orderCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <div className="flex flex-col h-full">
                  <div className="py-6">
                    <Link 
                      href="/" 
                      className="flex items-center space-x-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="relative h-8 w-8 overflow-hidden">
                        <BatteryCharging className="h-8 w-8 text-[hsl(var(--energy-primary))]" />
                        <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--aus-gold))]" />
                      </div>
                      <span className="font-bold text-xl">
                        Energi<span className="text-[hsl(var(--energy-primary))]">Hive</span>
                      </span>
                    </Link>
                  </div>

                  <div className="space-y-1 py-2 flex-1">
                    {isAuthenticated && (
                      <div className="mb-6 flex items-center space-x-3 px-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-[hsl(var(--energy-primary)/0.2)] text-[hsl(var(--energy-primary))]">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user?.user_metadata?.full_name || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user?.email}
                          </span>
                        </div>
                      </div>
                    )}

                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-md",
                          pathname === link.href
                            ? "bg-[hsl(var(--energy-primary)/0.1)] text-[hsl(var(--energy-primary))]"
                            : "text-foreground/70 hover:text-foreground hover:bg-accent"
                        )}
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    ))}

                    {isAuthenticated && (
                      <>
                        <Link
                          href="/batteries"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-md text-foreground/70 hover:text-foreground hover:bg-accent"
                        >
                          <BatteryCharging className="h-4 w-4 mr-2" />
                          My Batteries
                        </Link>
                        <Link
                          href="/account"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-md text-foreground/70 hover:text-foreground hover:bg-accent"
                        >
                          <User className="h-4 w-4 mr-2" />
                          My Account
                        </Link>
                        <Link
                          href="/account/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-md text-foreground/70 hover:text-foreground hover:bg-accent"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </>
                    )}

                    <Link
                      href="/support"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-md text-foreground/70 hover:text-foreground hover:bg-accent"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Support
                    </Link>
                  </div>

                  <div className="border-t py-4">
                    {isAuthenticated ? (
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-4 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    ) : (
                      <div className="flex flex-col space-y-2 px-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setMobileMenuOpen(false)}
                          asChild
                        >
                          <Link href="/login">Log in</Link>
                        </Button>
                        <Button
                          className="w-full bg-[hsl(var(--energy-primary))] text-white hover:bg-[hsl(var(--energy-primary-dark))]"
                          onClick={() => setMobileMenuOpen(false)}
                          asChild
                        >
                          <Link href="/signup">Sign up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar (Expandable) */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden pb-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products, batteries..."
                  className="w-full pl-10 pr-10"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
                  onClick={() => setIsMobileSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
