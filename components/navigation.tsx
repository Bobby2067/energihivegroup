"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  LogIn, 
  Home, 
  Battery, 
  ShoppingCart, 
  CreditCard, 
  Settings, 
  Sun, 
  Moon, 
  Search,
  BarChart3
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"

interface NavigationProps {
  className?: string
}

export function Navigation({ className }: NavigationProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  // Main navigation items
  const navigationItems = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      name: "Batteries",
      href: "/batteries",
      icon: <Battery className="h-4 w-4 mr-2" />,
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <BarChart3 className="h-4 w-4 mr-2" />,
      auth: true, // Only show for authenticated users
    },
    {
      name: "Orders",
      href: "/orders",
      icon: <ShoppingCart className="h-4 w-4 mr-2" />,
      auth: true, // Only show for authenticated users
    },
    {
      name: "Payments",
      href: "/payments",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
      auth: true, // Only show for authenticated users
    },
  ]

  // Filter navigation items based on authentication status
  const filteredNavigationItems = navigationItems.filter(item => 
    !item.auth || (item.auth && user)
  )

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-[hsl(var(--aus-green))] to-[hsl(var(--aus-gold))]">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-[hsl(var(--energy-primary))] to-transparent opacity-80"
                animate={{ 
                  opacity: [0.8, 0.4, 0.8],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <div className="absolute inset-1 rounded-full bg-background/80 flex items-center justify-center">
                <Battery className="h-4 w-4 text-[hsl(var(--energy-primary))]" />
              </div>
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">Energi Hive</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {filteredNavigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-1">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle theme">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="h-4 w-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Settings className="h-4 w-4 mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu or Auth Buttons */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full border border-muted"
                  aria-label="User menu"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center space-x-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[350px] pr-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <Link 
                    href="/" 
                    className="flex items-center space-x-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(var(--aus-green))] to-[hsl(var(--aus-gold))]"></div>
                    <span className="font-bold text-lg">Energi Hive</span>
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
                
                <nav className="flex flex-col space-y-1">
                  {filteredNavigationItems.map((item) => (
                    <SheetClose asChild key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                          pathname === item.href
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                
                <div className="mt-auto pt-4 border-t">
                  {user ? (
                    <div className="space-y-3 px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{user.email}</p>
                          <p className="text-xs text-muted-foreground">Account Settings</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          signOut();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2 px-4 py-3">
                      <Button asChild>
                        <Link 
                          href="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link 
                          href="/signup"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}
                  
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Theme</p>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setTheme("light")}
                          className={cn(
                            "rounded-md h-8 w-8",
                            theme === "light" && "bg-muted"
                          )}
                        >
                          <Sun className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setTheme("dark")}
                          className={cn(
                            "rounded-md h-8 w-8",
                            theme === "dark" && "bg-muted"
                          )}
                        >
                          <Moon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setTheme("system")}
                          className={cn(
                            "rounded-md h-8 w-8",
                            theme === "system" && "bg-muted"
                          )}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Expandable Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            className="border-b bg-background"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input 
                  className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Search batteries, products, and more..."
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
