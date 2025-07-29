import { Clock, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StudyBuddyRequest, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface StudyBuddyCardProps {
  request: StudyBuddyRequest & { user: User | null };
  onConnect: (requestId: string, userId: string) => void;
}

export default function StudyBuddyCard({ request, onConnect }: StudyBuddyCardProps) {
  const user = request.user;
  
  if (!user) return null;

  const getStatusColor = (lastSeen?: Date) => {
    if (!lastSeen) return "text-slate-500";
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = diff / (1000 * 60);
    
    if (minutes < 5) return "text-green-600";
    if (minutes < 30) return "text-amber-600";
    return "text-slate-500";
  };

  const getStatusText = (lastSeen?: Date) => {
    if (!lastSeen) return "Offline";
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = diff / (1000 * 60);
    
    if (minutes < 5) return "Online";
    if (minutes < 30) return "Away";
    return "Offline";
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer study-card-hover">
      <div className="flex items-start space-x-4">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
            {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-900">{user.fullName}</h4>
            <span className="text-xs text-slate-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatDistanceToNow(new Date(request.createdAt!), { addSuffix: true })}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-slate-600">{user.program} • {user.year} Year</span>
            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
            <span className={`text-sm flex items-center ${getStatusColor()}`}>
              <div className="w-2 h-2 bg-current rounded-full mr-1"></div>
              {getStatusText()}
            </span>
          </div>
          
          <p className="text-slate-700 text-sm mb-3">{request.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                {request.subject}
              </Badge>
              <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">
                {request.topic}
              </Badge>
              <div className="flex items-center text-slate-500 text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {request.location}
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => onConnect(request.id, user.id)}
              className="bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Connect
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
