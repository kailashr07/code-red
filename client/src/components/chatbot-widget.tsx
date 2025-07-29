import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Send, X, Book, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! I'm your AI study assistant. I can help you find study resources, recommend materials, or answer questions about your courses. What would you like to know?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const { toast } = useToast();

  const askQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/ai/question", { question });
      return response.json();
    },
    onSuccess: (data) => {
      const botMessage: Message = {
        id: Date.now().toString(),
        content: data.answer,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I'm experiencing technical difficulties. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant.",
        variant: "destructive",
      });
    },
  });

  const getRecommendationsMutation = useMutation({
    mutationFn: async ({ subject, topic }: { subject: string; topic: string }) => {
      const response = await apiRequest("POST", "/api/ai/recommendations", {
        subject,
        topic,
        userLevel: "undergraduate",
      });
      return response.json();
    },
    onSuccess: (data) => {
      const recommendations = data.recommendations || [];
      let content = `Here are some study resources I found for you:\n\n`;
      
      recommendations.forEach((rec: any, index: number) => {
        content += `${index + 1}. **${rec.title}** (${rec.resourceType})\n`;
        content += `   ${rec.description}\n`;
        if (rec.url && !rec.url.startsWith("Search for:")) {
          content += `   Link: ${rec.url}\n`;
        } else if (rec.url) {
          content += `   ${rec.url}\n`;
        }
        content += `   Relevance: ${rec.relevanceScore}/10\n\n`;
      });

      const botMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    },
  });

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    askQuestionMutation.mutate(input);
    setInput("");
  };

  const handleQuickAction = (action: string) => {
    let message = "";
    
    switch (action) {
      case "data-structures":
        message = "Find study materials for Data Structures";
        getRecommendationsMutation.mutate({ subject: "Computer Science", topic: "Data Structures" });
        break;
      case "study-groups":
        message = "Suggest study group formation tips";
        askQuestionMutation.mutate("What are some effective tips for forming and managing study groups?");
        break;
      case "schedule":
        message = "Help with study schedule optimization";
        askQuestionMutation.mutate("How can I optimize my study schedule for better productivity?");
        break;
      default:
        return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg bg-accent hover:bg-accent/90 connection-badge"
      >
        <Bot className="w-6 h-6" />
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 chatbot-panel">
          <div className="p-4 border-b border-slate-200 gradient-accent rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-white/20 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-white">Study Assistant</h4>
                  <p className="text-orange-100 text-xs">Online • Ready to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-64 p-4">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 ${
                    message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarFallback className={message.sender === "bot" ? "bg-accent text-white" : "bg-primary text-white"}>
                      {message.sender === "bot" ? <Bot className="w-3 h-3" /> : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 text-sm max-w-[85%] ${
                      message.sender === "user"
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              
              {(askQuestionMutation.isPending || getRecommendationsMutation.isPending) && (
                <div className="flex items-start space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-accent text-white">
                      <Bot className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-100 rounded-lg p-3 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 1 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleQuickAction("data-structures")}
                    className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm transition-colors"
                  >
                    <Book className="w-4 h-4 mr-2 text-blue-600" />
                    Find study materials for Data Structures
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleQuickAction("study-groups")}
                    className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg text-sm transition-colors"
                  >
                    <Users className="w-4 h-4 mr-2 text-green-600" />
                    Suggest study group formation tips
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleQuickAction("schedule")}
                    className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition-colors"
                  >
                    <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                    Help with study schedule optimization
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-slate-200">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 text-sm"
                disabled={askQuestionMutation.isPending || getRecommendationsMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || askQuestionMutation.isPending || getRecommendationsMutation.isPending}
                className="bg-accent hover:bg-accent/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
