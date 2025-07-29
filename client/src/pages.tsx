import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Upload, Bot, Calendar, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import StudyBuddyCard from "@/components/study-buddy-card";
import NotesSection from "@/components/notes-section";
import TimetableSection from "@/components/timetable-section";
import ChatbotWidget from "@/components/chatbot-widget";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: studyBuddies = [], isLoading: studyBuddiesLoading } = useQuery({
    queryKey: ["/api/study-buddies", searchQuery, selectedSubject],
    enabled: !!user,
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/connections", user?.id],
    enabled: !!user?.id,
  });

  const connectMutation = useMutation({
    mutationFn: async ({ requesterId, receiverId }: { requesterId: string; receiverId: string }) => {
      return apiRequest("POST", "/api/connections", {
        requesterId,
        receiverId,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection Request Sent",
        description: "Your study buddy request has been sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (requestId: string, userId: string) => {
    if (user?.id) {
      connectMutation.mutate({ requesterId: user.id, receiverId: userId });
    }
  };

  const subjects = ["Data Structures", "Machine Learning", "Database Systems", "Web Development"];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="gradient-primary rounded-2xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-3xl font-bold mb-2">Welcome back, {user.fullName}!</h2>
                <p className="text-blue-100 text-lg">Ready to find your perfect study partner?</p>
                <div className="flex items-center space-x-4 mt-4">
                  <Badge className="bg-blue-500/50 text-white hover:bg-blue-500/60">{user.program}</Badge>
                  <Badge className="bg-blue-500/50 text-white hover:bg-blue-500/60">{user.year} Year</Badge>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/20 rounded-2xl p-6">
                  <div className="text-3xl font-bold">47</div>
                  <div className="text-blue-100">Study Hours This Week</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left group study-card-hover">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Search className="text-primary text-xl" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Find Study Buddy</h3>
              <p className="text-slate-600 text-sm">Discover students studying similar topics</p>
            </button>
            
            <button className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left group study-card-hover">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <Upload className="text-secondary text-xl" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Upload Notes</h3>
              <p className="text-slate-600 text-sm">Share your study materials</p>
            </button>
            
            <button className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left group study-card-hover">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Bot className="text-accent text-xl" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">AI Assistant</h3>
              <p className="text-slate-600 text-sm">Get study resources and help</p>
            </button>
            
            <button className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-left group study-card-hover">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Calendar className="text-purple-500 text-xl" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">My Timetable</h3>
              <p className="text-slate-600 text-sm">Manage your schedule</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Find Study Buddies */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Find Study Buddies</h3>
                <Button variant="ghost" className="text-primary hover:text-primary/80 font-medium text-sm">
                  View All
                </Button>
              </div>
              
              {/* Search and Filter Section */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search by subject or topic..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {subjects.map(subject => (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(selectedSubject === subject ? "" : subject)}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                        selectedSubject === subject
                          ? "bg-primary/20 text-primary"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Study Buddy Cards */}
              <div className="space-y-4">
                {studyBuddiesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border border-slate-200 rounded-xl p-4 animate-pulse">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-2/3 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-full mb-3"></div>
                            <div className="h-8 bg-slate-200 rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : studyBuddies.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No study buddies found</h3>
                    <p className="text-slate-600 mb-4">Be the first to post a study request!</p>
                    <Button className="bg-primary hover:bg-primary/90">
                      Create Study Request
                    </Button>
                  </div>
                ) : (
                  studyBuddies.map((buddy: any) => (
                    <StudyBuddyCard
                      key={buddy.id}
                      request={buddy}
                      onConnect={handleConnect}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Study Sessions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Active Study Sessions</h3>
              <div className="space-y-3">
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 text-sm">No active sessions</p>
                  <p className="text-slate-500 text-xs">Join a study group to see active sessions</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Study Connections</span>
                  <span className="font-semibold text-slate-900">{userStats?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Notes Shared</span>
                  <span className="font-semibold text-slate-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Study Sessions</span>
                  <span className="font-semibold text-slate-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Hours This Week</span>
                  <span className="font-semibold text-secondary">47</span>
                </div>
              </div>
            </div>

            {/* Recent Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Recent Notes</h3>
                <Button variant="ghost" className="text-primary hover:text-primary/80 font-medium text-sm">
                  View All
                </Button>
              </div>
              <div className="text-center py-8">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 text-sm">No notes uploaded yet</p>
                <p className="text-slate-500 text-xs">Upload your first study material</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="mt-8">
          <NotesSection />
        </div>

        {/* Timetable Section */}
        <div className="mt-8">
          <TimetableSection />
        </div>
      </div>

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
