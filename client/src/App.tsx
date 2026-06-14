import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Landing from "@/pages/Landing";
import Storytelling from "@/pages/Storytelling";
import Onboard from "@/pages/Onboard";
import Verification from "@/pages/Verification";
import Pricing from "@/pages/Pricing";
import Dashboard from "@/pages/Dashboard";
import HowItWorks from "@/pages/HowItWorks";
import Privacy from "@/pages/Privacy";
import PlanComparison from "@/pages/PlanComparison";
import UpgradeToPro from "@/pages/UpgradeToPro";
import { ClassificationDashboard } from "@/components/classification/ClassificationDashboard";
import ExtensionAuth from "@/pages/ExtensionAuth";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/story" component={Storytelling} />
      <Route path="/onboard" component={Onboard} />
      <Route path="/verification" component={Verification} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/plan-comparison" component={PlanComparison} />
      <Route path="/upgrade-to-pro" component={UpgradeToPro} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/dashboard/:userId" component={Dashboard} />
      <Route path="/classification" component={ClassificationDashboard} />
      <Route path="/extension-auth" component={ExtensionAuth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </SubscriptionProvider>
    </QueryClientProvider>
  );
}

export default App;
