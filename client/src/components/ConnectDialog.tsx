import { useState } from "react";
import { useConnectAccount } from "@/hooks/use-flowtrack";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Instagram, Facebook, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function ConnectDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "facebook">("instagram");
  const { mutate: connect, isPending } = useConnectAccount();
  const [, setLocation] = useLocation();

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    connect(
      { username, platform },
      {
        onSuccess: (user) => {
          setIsOpen(false);
          setLocation(`/dashboard/${user.id}`);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="text-base px-6 py-5 rounded-full transition-all duration-300 bg-white/20 backdrop-blur-md border border-white/40 hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:bg-white/30"
        >
          Start Tracking Free <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Connect Account</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Enter your details to start tracking unfollowers instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="platform" className="text-sm font-medium">Platform</Label>
            <Select 
              value={platform} 
              onValueChange={(v: "instagram" | "facebook") => setPlatform(v)}
            >
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-12 bg-gray-50/50">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                <SelectItem value="instagram">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" /> Instagram
                  </div>
                </SelectItem>
                <SelectItem value="facebook">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="pl-8 rounded-xl border-gray-200 h-12 bg-gray-50/50 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
              </span>
            ) : (
              "Connect Account"
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground mt-4">
          By connecting, you agree to our Terms of Service.
        </div>
      </DialogContent>
    </Dialog>
  );
}
