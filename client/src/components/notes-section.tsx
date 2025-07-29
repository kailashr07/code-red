import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Download, Heart, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Note } from "@shared/schema";

const subjects = [
  "All Subjects", "Computer Science", "Mathematics", "Electronics", "Physics", 
  "Chemistry", "Data Structures", "Machine Learning", "Web Development", "Database Systems"
];

export default function NotesSection() {
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["/api/notes", selectedSubject === "All Subjects" ? "" : selectedSubject],
    enabled: !!user,
  });

  const uploadNoteMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setUploadModalOpen(false);
      toast({
        title: "Success",
        description: "Note uploaded successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/notes/${noteId}/download`);
      if (!response.ok) throw new Error("Download failed");
      return { response, noteId };
    },
    onSuccess: ({ response, noteId }) => {
      // Handle file download
      const note = notes.find((n: Note) => n.id === noteId);
      if (note) {
        response.blob().then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = note.fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const likeNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return apiRequest("POST", `/api/notes/${noteId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("uploadedBy", user?.id || "");
    uploadNoteMutation.mutate(formData);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="w-5 h-5 file-icon-pdf" />;
    if (fileType.includes("doc")) return <File className="w-5 h-5 file-icon-doc" />;
    if (fileType.includes("xls")) return <File className="w-5 h-5 file-icon-excel" />;
    return <File className="w-5 h-5 file-icon-image" />;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-slate-200 rounded-xl p-4">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">Study Notes & Resources</h3>
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/90">
              <Upload className="w-4 h-4 mr-2" />
              Upload Notes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Study Notes</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select name="subject" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.slice(1).map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="file">File</Label>
                <Input id="file" name="file" type="file" required accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" />
              </div>
              <Button type="submit" disabled={uploadNoteMutation.isPending}>
                {uploadNoteMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Subject Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`py-2 border-b-2 whitespace-nowrap ${
                selectedSubject === subject
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {subject}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No notes found</h3>
          <p className="text-slate-600 mb-4">Be the first to share study materials for this subject!</p>
          <Button onClick={() => setUploadModalOpen(true)} className="bg-secondary hover:bg-secondary/90">
            <Upload className="w-4 h-4 mr-2" />
            Upload First Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note: Note & { uploader?: { fullName: string; username: string } }) => (
            <div key={note.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer study-card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  {getFileIcon(note.fileType)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 flex items-center">
                    <Download className="w-3 h-3 mr-1" />
                    {note.downloads}
                  </span>
                  <button 
                    onClick={() => likeNoteMutation.mutate(note.id)}
                    className="text-xs text-slate-500 flex items-center hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    {note.likes}
                  </button>
                </div>
              </div>
              
              <h4 className="font-semibold text-slate-900 mb-2">{note.title}</h4>
              <p className="text-slate-600 text-sm mb-3 line-clamp-2">{note.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">
                    By {note.uploader?.fullName || "Unknown"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {note.fileType.toUpperCase().replace(".", "")}
                  </Badge>
                </div>
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadNoteMutation.mutate(note.id)}
                  disabled={downloadNoteMutation.isPending}
                  className="text-primary hover:text-primary/80"
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
