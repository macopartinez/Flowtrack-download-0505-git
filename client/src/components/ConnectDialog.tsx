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

interface ConnectDialogProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function ConnectDialog({ isOpen: controlledOpen, setIsOpen: setControlledOpen }: ConnectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
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
          className="text-base px-6 py-5 rounded-full transition-all duration-300 bg-[#02c950]/20 backdrop-blur-md border border-white/20 hover:shadow-[0_0_20px_rgba(2,201,80,0.4)] hover:bg-[#02c950]/30"
        >
          Start Tracking Free <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border border-[#02c950]/30 shadow-[0_0_50px_rgba(2,201,80,0.1)] bg-black backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white">Login</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Enter your details to access your dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="platform" className="text-sm font-medium text-gray-300">Platform</Label>
            <Select 
              value={platform} 
              onValueChange={(v: "instagram" | "facebook") => setPlatform(v)}
            >
              <SelectTrigger className="w-full rounded-xl border-white/10 h-12 bg-white/5 text-white focus:ring-[#02c950]/20 focus:border-[#02c950]">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-[#0a0a0a] text-white shadow-2xl">
                <SelectItem value="instagram" className="focus:bg-[#02c950]/10 focus:text-[#02c950]">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" /> Instagram
                  </div>
                </SelectItem>
                <SelectItem value="facebook" className="focus:bg-[#02c950]/10 focus:text-[#02c950]">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-300">Username</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="pl-8 rounded-xl border-white/10 h-12 bg-white/5 text-white placeholder:text-gray-600 focus:ring-[#02c950]/20 focus:border-[#02c950] transition-all"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-base font-semibold bg-[#02c950] hover:bg-[#02c950]/90 text-black transition-all shadow-[0_0_20px_rgba(2,201,80,0.4)]"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
              </span>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-gray-500 mt-4">
          By logging in, you agree to our Terms of Service.
        </div>
      </DialogContent>
    </Dialog>
  );
}
