import { Bell, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">VIT StudyBuddy</h1>
                <p className="text-xs text-slate-500">Chennai Campus</p>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#dashboard" className="text-slate-700 hover:text-primary transition-colors font-medium">Dashboard</a>
            <a href="#find-buddies" className="text-slate-700 hover:text-primary transition-colors font-medium">Find Buddies</a>
            <a href="#notes" className="text-slate-700 hover:text-primary transition-colors font-medium">Notes</a>
            <a href="#timetable" className="text-slate-700 hover:text-primary transition-colors font-medium">Timetable</a>
            <a href="#chatbot" className="text-slate-700 hover:text-primary transition-colors font-medium">AI Helper</a>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="relative connection-badge">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
