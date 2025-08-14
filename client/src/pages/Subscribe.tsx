import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ tier }: { tier: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/api/payment/success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: `Welcome to ${tier === 'premium' ? 'Premium' : 'Pro'}! Redirecting...`,
      });
      // Redirect will be handled by Stripe
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
        disabled={!stripe || isLoading}
      >
        {isLoading ? "Processing..." : `Subscribe to ${tier === 'premium' ? 'Premium' : 'Pro'}`}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("");

  // Get tier from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier') || 'premium';
    setSelectedTier(tier);

    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/create-subscription", { tier })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret)
      })
      .catch((error) => {
        console.error('Subscription creation error:', error);
      });
  }, []);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 text-white max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p>Setting up your subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierInfo = {
    premium: {
      name: "Premium",
      price: "$9.99",
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      features: ["25 battles per day", "Advanced AI opponents", "Premium voices", "Battle analysis", "No ads"]
    },
    pro: {
      name: "Pro", 
      price: "$19.99",
      icon: <Crown className="h-6 w-6 text-amber-500" />,
      features: ["Unlimited battles", "All AI opponents", "Custom voices", "Advanced analytics", "Priority support", "Tournament mode"]
    }
  };

  const currentTier = tierInfo[selectedTier as keyof typeof tierInfo] || tierInfo.premium;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Upgrade to {currentTier.name}
            </h1>
            <p className="text-gray-300">
              Unlock advanced features and unlimited battles
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Subscription Details */}
          <Card className="bg-slate-800 border-slate-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentTier.icon}
                {currentTier.name} Plan
              </CardTitle>
              <CardDescription className="text-gray-400">
                {currentTier.price}/month • Cancel anytime
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">What's included:</h4>
                <ul className="space-y-2">
                  {currentTier.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="text-green-400 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  <Badge className="bg-purple-900 text-purple-300">
                    30-day money-back guarantee
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="bg-slate-800 border-slate-700 text-white">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription className="text-gray-400">
                Secure payment powered by Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm tier={selectedTier} />
              </Elements>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            By subscribing, you agree to our terms of service and privacy policy.
            You can cancel your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
}